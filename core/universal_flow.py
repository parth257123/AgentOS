import sys
import json
import os
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Import the fully integrated AgentOS core engines
from agentos import Agent, Task, Mesh, CustomRule, BaseTool

load_dotenv()

def run_custom_flow():
    try:
        config_data = sys.stdin.read()
        config = json.loads(config_data)
    except Exception as e:
        print("\n===JSON_START===")
        print(json.dumps([{"agent": "System", "event": "ERROR", "timestamp": datetime.now().isoformat(), "prompt_preview": "", "response_preview": f"Failed to parse input config: {str(e)}"}]))
        print("===JSON_END===")
        return

    nodes = config.get("nodes", [])
    edges = config.get("edges", [])

    agent_instances = {}
    
    # Extract tasks to use as the prompt
    task_nodes = [n for n in nodes if n["type"] == "task"]
    initial_prompt = ""
    if task_nodes:
        initial_prompt = "Execute the following tasks:\n"
        for t in task_nodes:
            initial_prompt += f"- {t['data'].get('name', 'Task')}: {t['data'].get('description', '')}\n"
    else:
        initial_prompt = config.get("prompt", "Analyze the system and report your findings.")

    # Process Agents
    for node in nodes:
        if node["type"] == "agent":
            data = node["data"]
            
            # Setup Verification Rules if specified in UI
            rules = []
            if data.get("verification_rules"):
                for r in data["verification_rules"]:
                    rules.append(CustomRule(condition=r.get("condition"), error_msg=r.get("error_msg")))
            
            # Create Agent with all engines fully integrated
            agent = Agent(
                name=data.get("name", "Unnamed Agent"),
                role=data.get("role", "Assistant"),
                goal=data.get("goal", "Help the user"),
                backstory=data.get("backstory", "You are an AI assistant."),
                model="gemini/gemini-2.5-flash",
                enable_reflection=True, # Enforced by default for dashboard
                verification_rules=rules,
                max_budget=1.00 # Default $1 budget
            )
            agent_instances[node["id"]] = agent

    if not agent_instances:
        print("\n===JSON_START===")
        print(json.dumps([{"agent": "System", "event": "ERROR", "timestamp": datetime.now().isoformat(), "prompt_preview": "", "response_preview": "No agents defined in the flow."}]))
        print("===JSON_END===")
        return

    # Build Mesh Chart from Edges
    # Find the root agent (one with no incoming edges from other agents)
    agent_targets = {}
    incoming_counts = {aid: 0 for aid in agent_instances.keys()}
    
    for edge in edges:
        src = edge["source"]
        tgt = edge["target"]
        if src in agent_instances and tgt in agent_instances:
            if src not in agent_targets:
                agent_targets[src] = []
            agent_targets[src].append(tgt)
            incoming_counts[tgt] += 1
            
    # Determine entry point
    entry_point_id = None
    for aid, count in incoming_counts.items():
        if count == 0:
            entry_point_id = aid
            break
            
    if not entry_point_id:
        entry_point_id = list(agent_instances.keys())[0] # Fallback
        
    chart = [agent_instances[entry_point_id]]
    for src, targets in agent_targets.items():
        for tgt in targets:
            chart.append([agent_instances[src], agent_instances[tgt]])

    # Instantiate the Hierarchical Orchestrator
    mesh = Mesh(chart=chart, model="gemini/gemini-2.5-flash")
    
    # --- EXECUTION ---
    try:
        final_result = mesh.run(initial_prompt=initial_prompt, max_steps=20)
    except Exception as e:
        final_result = f"Mesh Execution Error: {str(e)}"
        
    # Combine traces from all agents for the dashboard UI
    all_traces = []
    total_tokens_across_agents = 0
    total_cost_usd = 0.0
    
    for agent in agent_instances.values():
        all_traces.extend(agent.logger.traces)
        if hasattr(agent, 'context_manager'):
            total_tokens_across_agents += getattr(agent.context_manager, 'current_tokens', 0)
        if hasattr(agent, 'cost_engine'):
            total_cost_usd += getattr(agent.cost_engine, 'total_cost', 0.0)
        
    all_traces.sort(key=lambda x: x.get("timestamp", ""))
    
    # Add context health summary
    primary_agent = agent_instances[entry_point_id]
    if primary_agent and hasattr(primary_agent, 'context_manager'):
        status = primary_agent.context_manager.get_health_status(total_tokens_across_agents)
        all_traces.append({
            "agent": "System (Mesh)",
            "event": "CONTEXT_HEALTH",
            "timestamp": datetime.now().isoformat(),
            "status": status,
            "current_tokens": total_tokens_across_agents,
            "cost_usd": total_cost_usd,
            "prompt_preview": "Context Health Update",
            "response_preview": f"Total context tokens: ~{total_tokens_across_agents}. Status: {status}\nFinal Output:\n{final_result[:500]}..."
        })

    print("\n===JSON_START===")
    print(json.dumps(all_traces))
    print("===JSON_END===")

if __name__ == "__main__":
    run_custom_flow()
