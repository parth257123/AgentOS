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
    tenant_id = config.get("tenant_id", "default_tenant")

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
    agents_py = "from agentos.agent import Agent\n\n\ndef create_agents():\n    return {\n"
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
            name="{data.get('name', safe_id)}",
            tenant_id="{tenant_id}",
            role="{role}",
            goal="{goal}",
            backstory="{backstory}",
            model="{model}",
            tools={tools_code}
        ),
'''
    agents_py += "    }\n"

    # 4. Generate tasks.py
    tasks_py = "def create_tasks():\n    return [\n"
    
    for t in tasks:
        data = t.get("data", {})
        desc = data.get("description", "").replace('"', '\\"')
        exp_out = data.get("expectedOutput", "").replace('"', '\\"')
        agent_id = find_agent_for_task(t["id"])
        
        safe_id = t["id"].replace("-", "_")
        tasks_py += f'''        {{
            "id": "{safe_id}",
            "description": "{desc}",
            "expected_output": "{exp_out}",
            "agent_id": "{agent_id}"
        }},
'''
    tasks_py += "    ]\n"

    # 5. Generate crew.py (AgentOS Runner)
    crew_py = f"""import json
from agents import create_agents
from tasks import create_tasks

def run_crew():
    print("Initializing AgentOS framework...")
    agents_dict = create_agents()
    tasks_list = create_tasks()

    print("Starting AgentOS execution...")
    results = {{}}
    
    for task in tasks_list:
        agent_id = task["agent_id"]
        agent = agents_dict.get(agent_id)
        if not agent:
            print(f"Skipping task '{{task['id']}}': No assigned agent.")
            continue
            
        print(f"\\n######################")
        print(f"Running Task: {{task['description'][:50]}}...")
        print(f"Agent: {{agent.name}} (Role: {{agent.role}})")
        print(f"######################\\n")
        
        # We append context from previous results if needed (naive sequential context)
        context = json.dumps(results) if results else ""
        result = agent.execute_task(task["description"], context)
        results[task["id"]] = result
        
        print(f"\\nResult: {{result}}\\n")

    print("######################")
    print("FINAL RESULT")
    print("######################")
    if tasks_list:
        print(results.get(tasks_list[-1]["id"], "No result"))

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
            "requirements.txt": "agentos\nlitellm\n"
        }
    }

    print(json.dumps(output))


if __name__ == "__main__":
    generate_crew_code()

