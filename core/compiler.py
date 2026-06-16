import sys
import json

def generate_crew_code():
    try:
        config_data = sys.stdin.read()
        config = json.loads(config_data)
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse input config: {str(e)}"}))
        return

    nodes = config.get("nodes", [])
    edges = config.get("edges", [])
    process_type = config.get("processType", "sequential")

    agents = [n for n in nodes if n.get("type") == "agent"]
    tasks = [n for n in nodes if n.get("type") == "task"]

    # Helper: find assigned agent for a task
    def find_agent_for_task(task_id):
        for edge in edges:
            if edge.get("target") == task_id:
                src = edge.get("source", "")
                if src in [a["id"] for a in agents]:
                    return src
        return None

    # Helper: find task dependencies (context)
    def find_context_for_task(task_id):
        ctx = []
        for edge in edges:
            if edge.get("target") == task_id:
                src = edge.get("source", "")
                if src in [t["id"] for t in tasks]:
                    ctx.append(src.replace("-", "_"))
        return ctx

    # 1. Generate agents.yaml (CrewAI native format)
    agents_yaml = ""
    for a in agents:
        data = a.get("data", {})
        safe_id = a["id"].replace("-", "_")
        model = data.get("model", "gemini/gemini-2.5-flash")
        agents_yaml += f"""{safe_id}:
  role: "{data.get('role', '')}"
  goal: "{data.get('goal', '')}"
  backstory: "{data.get('backstory', '')}"
  llm: "{model}"
  verbose: {str(data.get('verbose', True)).lower()}
  memory: {str(data.get('memory', False)).lower()}
  allow_delegation: {str(data.get('allowDelegation', False)).lower()}
  tools:
"""
        for tool in data.get("tools", []):
            agents_yaml += f"    - {tool}\n"
        if not data.get("tools"):
            agents_yaml += "    []\n"
        agents_yaml += "\n"

    # 2. Generate tasks.yaml
    tasks_yaml = ""
    for t in tasks:
        data = t.get("data", {})
        safe_id = t["id"].replace("-", "_")
        agent_id = find_agent_for_task(t["id"])
        safe_agent = agent_id.replace("-", "_") if agent_id else "none"
        ctx = find_context_for_task(t["id"])
        
        tasks_yaml += f"""{safe_id}:
  description: "{data.get('description', '')}"
  expected_output: "{data.get('expectedOutput', '')}"
  agent: {safe_agent}
"""
        if ctx:
            tasks_yaml += f"  context: {json.dumps(ctx)}\n"
        if data.get("outputFile"):
            tasks_yaml += f'  output_file: "{data["outputFile"]}"\n'
        if data.get("asyncExecution"):
            tasks_yaml += f"  async_execution: true\n"
        tasks_yaml += "\n"

    # 3. Generate agents.py
    agents_py = "from crewai import Agent\n\n\ndef create_agents():\n    return {\n"
    for a in agents:
        data = a.get("data", {})
        role = data.get("role", "").replace('"', '\\"')
        goal = data.get("goal", "").replace('"', '\\"')
        backstory = data.get("backstory", "").replace('"', '\\"')
        model = data.get("model", "gemini/gemini-2.5-flash")
        tools_list = data.get("tools", [])
        tools_code = "[]"
        if tools_list:
            tools_code = repr(tools_list) + "  # Replace with actual tool instances"

        agents_py += f'''        "{a['id']}": Agent(
            role="{role}",
            goal="{goal}",
            backstory="{backstory}",
            llm="{model}",
            verbose={data.get('verbose', True)},
            memory={data.get('memory', False)},
            allow_delegation={data.get('allowDelegation', False)},
            tools={tools_code}
        ),
'''
    agents_py += "    }\n"

    # 4. Generate tasks.py
    tasks_py = "from crewai import Task\n\n\ndef create_tasks(agents):\n"
    
    # We must generate tasks in order or build a dict so they can reference each other.
    # In CrewAI, context=[task1, task2]. Easiest way is to define a dict of tasks.
    tasks_py += "    tasks_dict = {}\n\n"
    
    for t in tasks:
        data = t.get("data", {})
        desc = data.get("description", "").replace('"', '\\"')
        exp_out = data.get("expectedOutput", "").replace('"', '\\"')
        agent_id = find_agent_for_task(t["id"])
        agent_ref = f'agents["{agent_id}"]' if agent_id else "None"
        
        ctx = find_context_for_task(t["id"])
        ctx_list = []
        for c in ctx:
            # We assume referenced tasks were already created in the loop, or we just reference the dict
            ctx_list.append(f'tasks_dict["{c}"]')
        
        context_line = ""
        if ctx_list:
            context_line = f',\n            context=[{", ".join(ctx_list)}]'
            
        output_file_line = ""
        if data.get("outputFile"):
            output_file_line = f',\n            output_file="{data["outputFile"]}"'
            
        async_line = ""
        if data.get("asyncExecution"):
            async_line = ",\n            async_execution=True"

        safe_id = t["id"].replace("-", "_")
        tasks_py += f'''    tasks_dict["{safe_id}"] = Task(
        description="{desc}",
        expected_output="{exp_out}",
        agent={agent_ref}{context_line}{output_file_line}{async_line}
    )
'''
    tasks_py += "\n    return list(tasks_dict.values())\n"

    # 5. Generate crew.py
    process_import = "Process.sequential" if process_type == "sequential" else "Process.hierarchical"
    crew_py = f"""from crewai import Crew, Process
from agents import create_agents
from tasks import create_tasks


def run_crew():
    print("Initializing agents and tasks...")
    agents_dict = create_agents()
    tasks_list = create_tasks(agents_dict)

    agent_instances = list(agents_dict.values())

    crew = Crew(
        agents=agent_instances,
        tasks=tasks_list,
        process={process_import},
        verbose=True
    )

    print("Starting Crew execution...")
    result = crew.kickoff()
    print("######################")
    print("FINAL RESULT")
    print("######################")
    print(result)


if __name__ == "__main__":
    run_crew()
"""

    output = {
        "files": {
            "crew.py": crew_py,
            "agents.py": agents_py,
            "tasks.py": tasks_py,
            "agents.yaml": agents_yaml,
            "tasks.yaml": tasks_yaml,
            "requirements.txt": "crewai\nduckduckgo-search\nlitellm\n"
        }
    }

    print(json.dumps(output))


if __name__ == "__main__":
    generate_crew_code()

