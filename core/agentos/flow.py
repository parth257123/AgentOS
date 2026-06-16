import asyncio
from typing import List, Dict, Any
from .task import Task

class Flow:
    """
    Flow represents a deterministic sequence of tasks.
    Unlike 'Crews' which let LLMs decide the execution path and can lead to infinite loops,
    Flows strictly define the state transitions and execution order.
    """
    def __init__(self, name: str, tasks: List[Task], max_iterations: int = 10):
        self.name = name
        self.tasks = tasks
        self.context = ""
        self.history = []
        self.max_iterations = max_iterations # Problem 5: Agent Loops

    async def run_async(self) -> str:
        """Problem 9: Slow Execution - Run agents in parallel where possible."""
        print(f"Starting Async Flow: {self.name}")
        import time
        start_time = time.time()
        
        # Currently a naive implementation: we run them all concurrently
        # In a real DAG, we'd build a dependency graph.
        tasks_coros = []
        for index, task in enumerate(self.tasks):
            # Wrapper to execute sync task asynchronously
            async def run_task(t=task, idx=index):
                print(f"Async Executing Task {idx+1}: {t.description[:20]}...")
                # Run the blocking execute in a thread pool
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None, t.execute, self.context)
                return idx, result
                
            tasks_coros.append(run_task())
            
        results = await asyncio.gather(*tasks_coros)
        
        for idx, res in sorted(results, key=lambda x: x[0]):
            self.context += f"\nResult from Task {idx + 1}: {res}\n"
            
        execution_time = time.time() - start_time
        print(f"\nAsync Flow '{self.name}' completed in {execution_time:.2f} seconds.")
        return self.context

    def run(self) -> str:
        print(f"Starting Flow: {self.name}")
        import time
        start_time = time.time()
        
        from .context_manager import ContextManager
        from .vector_store import VectorStore
        from .graph_store import GraphStore
        
        compressor = ContextManager(model="ollama/glm-5.2")
        vector_store = VectorStore()
        graph_store = GraphStore(model_name="ollama/glm-5.2")
        
        working_memory = [] # Multi-Tier: Short term memory
        
        iterations = 0
        for index, task in enumerate(self.tasks):
            if iterations >= self.max_iterations:
                print(f"Loop detected: Max iterations ({self.max_iterations}) reached. Halting flow.")
                break
                
            print(f"\n--- Executing Task {index + 1}/{len(self.tasks)} ---")
            print(f"Agent: {task.agent.name if task.agent else 'None'}")
            
            agent_role = task.agent.role if task.agent else "General"
            agent_goal = task.agent.goal if task.agent else "Complete task"
            
            filtered_context = compressor.compress_for_agent(
                vector_store=vector_store, 
                graph_store=graph_store, 
                working_memory=working_memory, 
                agent_role=agent_role, 
                agent_goal=agent_goal
            )
            
            result = task.execute(context=filtered_context)
            
            # --- Update Memories ---
            # 1. Update Short-Term Working Memory
            working_memory.append(f"Task: {task.description[:50]} | Result: {result[:200]}...")
            if len(working_memory) > 5:
                working_memory.pop(0) # Keep only the last 5 tasks in working memory
                
            # 2. Update Archival Memory
            self.history.append({
                "task": task.description[:50],
                "task_index": index,
                "agent": task.agent.name if task.agent else "Unknown",
                "result": result
            })
            vector_store.insert(f"Task: {task.description} | Result: {result}", metadata={
                "task": task.description[:50],
                "task_index": index,
                "agent": task.agent.name if task.agent else "Unknown",
                "result": result
            })
            
            # 3. Update Knowledge Graph
            graph_store.extract_and_insert(result)
            
            iterations += 1
            
        execution_time = time.time() - start_time
        print(f"\nFlow '{self.name}' completed in {execution_time:.2f} seconds.")
        
        self.context = "\n".join([f"Task {h['task_index'] + 1} ({h['agent']}): {h['result']}" for h in self.history])
        return self.context
