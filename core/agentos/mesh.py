class Mesh:
    def __init__(self, chart: list, model: str = "ollama/glm-5.2"):
        """
        Initializes the Mesh with explicit connections or auto-generated ones.
        `chart` is a list where:
        - The first element is the entry_point agent.
        - Subsequent elements are lists of [source_agent, target_agent] representing allowed connections.
        """
        self.agents = {}
        self.connections = {}
        self.entry_point = None
        self.model = model
        
        if not chart:
            return
            
        # Detect if it's a flat list of agents [Agent1, Agent2, Agent3]
        is_flat_list = all(not isinstance(item, list) for item in chart)
        
        if is_flat_list:
            self.entry_point = chart[0]
            for a in chart:
                self.agents[a.name] = a
            self._auto_generate_connections(chart)
        else:
            # Parse explicit chart
            if not isinstance(chart[0], list):
                self.entry_point = chart[0]
                self.agents[self.entry_point.name] = self.entry_point
                
            for conn in chart[1:]:
                # expect [source, target]
                src = conn[0]
                tgt = conn[1]
                
                self.agents[src.name] = src
                self.agents[tgt.name] = tgt
                
                if src.name not in self.connections:
                    self.connections[src.name] = []
                if tgt.name not in self.connections[src.name]:
                    self.connections[src.name].append(tgt.name)

    def _auto_generate_connections(self, agents: list):
        print("[Mesh] AutoMeshRouter activated. Calculating optimal hierarchy...")
        if "glm-5.2" in self.model or "glm5.2" in self.model:
            print("[Mesh] AutoMeshRouter offline fallback triggered: GLM-5.2 Demo Mode")
            for i in range(len(agents)-1):
                src_name = agents[i].name
                tgt_name = agents[i+1].name
                if src_name not in self.connections:
                    self.connections[src_name] = []
                self.connections[src_name].append(tgt_name)
            print(f"[Mesh] Fallback Connections established: {self.connections}")
            return

        import litellm
        import json
        
        prompt = "Analyze the following AI Agents and their roles. Output a JSON object representing a strict hierarchical directed graph of who can delegate to whom. Do not allow reverse connections that break hierarchy. The root agent is " + agents[0].name + ".\n\nAgents:\n"
        for a in agents:
            prompt += f"- Name: {a.name}, Role: {a.role}, Goal: {a.goal}\n"
            
        prompt += '''\nOutput ONLY valid JSON in this exact format, with no markdown formatting:
        {
          "connections": [
            {"source": "AgentA", "target": "AgentB"}
          ]
        }'''
        
        try:
            resp = litellm.completion(model=self.model, messages=[{"role": "user", "content": prompt}])
            content = resp.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            
            parsed = json.loads(content.strip())
            
            for conn in parsed.get("connections", []):
                src_name = conn.get("source")
                tgt_name = conn.get("target")
                if src_name in self.agents and tgt_name in self.agents:
                    if src_name not in self.connections:
                        self.connections[src_name] = []
                    if tgt_name not in self.connections[src_name]:
                        self.connections[src_name].append(tgt_name)
            print(f"[Mesh] Auto-Connections established: {self.connections}")
        except Exception as e:
            print(f"[Mesh] AutoMeshRouter offline fallback triggered: {str(e)}")
            for i in range(len(agents)-1):
                src_name = agents[i].name
                tgt_name = agents[i+1].name
                if src_name not in self.connections:
                    self.connections[src_name] = []
                self.connections[src_name].append(tgt_name)
            print(f"[Mesh] Fallback Connections established: {self.connections}")
            
    def run(self, initial_prompt: str, max_steps=20):
        current_agent = self.entry_point
        prompt = initial_prompt
        
        print(f"\n[SWARM] Starting Mesh Execution. Entry Point: {current_agent.name}\n")
        
        step_count = 0
        call_stack = [] # Tracks who delegated to whom to bubble results back up
        history = [] # Tracks execution trace for loop detection
        
        while step_count < max_steps:
            allowed_targets = self.connections.get(current_agent.name, [])
            
            print(f"[{current_agent.name}] Thinking...")
            response = current_agent.execute_mesh_step(prompt, allowed_targets)
            
            action = response.get("action", "complete")
            target_name = response.get("target") if action == "delegate" else None
            
            history.append((current_agent.name, action, target_name))
            
            # --- Enhanced Global Cycle Detection ---
            cycle_detected = False
            hist_len = len(history)
            # Look for repeating sub-sequences of length 1 to N
            for seq_len in range(1, hist_len // 2 + 1):
                seq1 = history[hist_len - seq_len : hist_len]
                seq2 = history[hist_len - 2 * seq_len : hist_len - seq_len]
                
                # Check if sequences match exactly AND they involve delegation
                if seq1 == seq2 and any(x[1] == "delegate" for x in seq1):
                    cycle_detected = True
                    break
                    
            if cycle_detected:
                print(f"[MESH ERROR] Infinite Routing Cycle Detected! Breaking loop at {current_agent.name}.")
                prompt = "SYSTEM CRITICAL WARNING: You are caught in an infinite delegation loop. You MUST STOP delegating the exact same tasks. Analyze the previous results, formulate a final answer, and return a 'complete' action IMMEDIATELY."
                step_count += 1
                # Remove the cyclic addition so we don't trip it continuously on the retry
                history.pop() 
                continue
            # ---------------------------------------
            
            if action == "delegate":
                target_name = response.get("target")
                task_prompt = response.get("task", "")
                
                # ENFORCEMENT: Prevent infinite loops by blocking illegal connections
                if target_name not in allowed_targets:
                    print(f"[MESH ERROR] {current_agent.name} attempted to delegate to {target_name}, which is NOT ALLOWED.")
                    prompt = f"SYSTEM ERROR: You do not have permission to communicate with {target_name}. Allowed connections: {allowed_targets}. Please delegate to an allowed connection or complete the task."
                    step_count += 1
                    continue
                    
                import time
                import sys
                print(f"\n[Mesh] Task completed by {current_agent.name}.")
                sys.stdout.write(f"[Mesh] Routing: {current_agent.name} ")
                for _ in range(4):
                    sys.stdout.write("⟷ ")
                    sys.stdout.flush()
                    time.sleep(0.3)
                print(f"{target_name}\n[Mesh] Connection Established. Switching context...\n")
                call_stack.append(current_agent)
                current_agent = self.agents[target_name]
                prompt = f"You have been assigned a task by {call_stack[-1].name}:\n{task_prompt}"
                
            elif action == "complete":
                result = response.get("result", "")
                print(f"[{current_agent.name}] Completed Task.")
                
                if len(call_stack) == 0:
                    # The entry point agent finished
                    print("\n[SWARM] Execution Finished successfully.")
                    return result
                else:
                    # Return the result back up the hierarchy
                    caller = call_stack.pop()
                    prompt = f"Target Agent ({current_agent.name}) finished the delegated task with this result:\n{result}\nWhat is your next action?"
                    current_agent = caller
                    
            step_count += 1
            
        return "SWARM EXECUTION HALTED: Reached maximum steps to prevent infinite loop."
