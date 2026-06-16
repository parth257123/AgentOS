import litellm
import json

class ManagerBrain:
    def __init__(self, logger, model="ollama/glm-5.2"):
        self.logger = logger
        self.model = model

    def orchestrate(self, agents, tasks):
        from datetime import datetime
        self.logger.traces.append({
            "agent": "ManagerBrain",
            "event": "ROUTER_EVALUATION",
            "timestamp": datetime.now().isoformat(),
            "prompt_preview": f"Initiating Hierarchical Process",
            "response_preview": f"Manager taking control of {len(tasks)} tasks and {len(agents)} agents."
        })

        agent_descriptions = "\n".join([f"- {a.name} (Role: {a.role})" for a in agents.values()])
        task_descriptions = "\n".join([f"- {t['data'].get('name')}: {t['data'].get('description')}" for t in tasks])

        prompt = f"""
        You are the ManagerBrain. Your job is to analyze the following tasks and agents, and return a JSON execution plan.
        
        AVAILABLE AGENTS:
        {agent_descriptions}

        TASKS TO COMPLETE:
        {task_descriptions}

        Plan out the execution. For each task, decide which agent is best suited. Output JSON ONLY.
        {{
            "plan": [
                {{"task_name": "Task 1", "assigned_agent": "Agent Name", "reasoning": "Why this agent?"}}
            ]
        }}
        """

        try:
            response = litellm.completion(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"): content = content[7:-3].strip()
            
            plan = json.loads(content)
            
            self.logger.traces.append({
                "agent": "ManagerBrain",
                "event": "ROUTER_EVALUATION",
                "timestamp": datetime.now().isoformat(),
                "prompt_preview": "Generated Execution Plan",
                "response_preview": json.dumps(plan, indent=2)
            })
            
            # Execute tasks based on manager plan
            # (In a real implementation, the manager would iterate and call each agent. For now, we simulate the orchestration.)
            results = {}
            for item in plan.get("plan", []):
                # find agent
                agent = next((a for a in agents.values() if a.name == item["assigned_agent"]), None)
                if not agent:
                    agent = list(agents.values())[0] # fallback
                
                # simulate task execution
                res = agent.execute(f"The Manager has assigned you this task: {item['task_name']}. Please complete it.")
                results[item['task_name']] = res
            
            return results

        except Exception as e:
            self.logger.traces.append({
                "agent": "ManagerBrain",
                "event": "ERROR",
                "timestamp": datetime.now().isoformat(),
                "prompt_preview": "Error Orchestrating",
                "response_preview": str(e)
            })
            return {"error": "Manager failed to orchestrate"}
