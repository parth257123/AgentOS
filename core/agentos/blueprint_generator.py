import sys
import json
import os
from dotenv import load_dotenv
import litellm

load_dotenv()

def generate_blueprint():
    try:
        config_data = sys.stdin.read()
        config = json.loads(config_data)
        prompt = config.get("prompt", "")
        current_graph = config.get("current_graph", {"nodes": [], "edges": []})
    except Exception as e:
        print("\n===JSON_START===")
        print(json.dumps({"error": f"Failed to parse input config: {str(e)}"}))
        print("===JSON_END===")
        return

    # Parse current graph back into CrewAI format to feed to the LLM
    current_agents = []
    current_tasks = []
    for node in current_graph.get("nodes", []):
        if node["type"] == "agent":
            current_agents.append({"id": node["id"], **node["data"]})
        elif node["type"] == "task":
            # Find assigned agent
            agent_id = None
            for edge in current_graph.get("edges", []):
                if edge["target"] == node["id"] and edge["source"].startswith("a"):
                    agent_id = edge["source"]
                    break
            current_tasks.append({"id": node["id"], "agent_id": agent_id, **node["data"]})

    context_str = ""
    if current_agents or current_tasks:
        context_str = f"""
CURRENT WORKFLOW STATE:
Agents: {json.dumps(current_agents, indent=2)}
Tasks: {json.dumps(current_tasks, indent=2)}

INSTRUCTIONS: The user wants to MODIFY the current workflow. Apply their changes (e.g. adding, deleting, or updating agents/tasks) and return the FULL, updated list of ALL agents and tasks. Maintain existing IDs where possible.
"""
    else:
        context_str = "\nINSTRUCTIONS: Create a completely new workflow based on the prompt."

    if not os.getenv("GEMINI_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        # Smart fallback: parse the prompt with keyword matching to create realistic agents
        import re
        prompt_lower = prompt.lower()
        
        # If modifying existing graph, handle that
        if current_agents:
            # Try to understand what the user wants to modify
            new_agents = list(current_agents)
            new_tasks = list(current_tasks)
            
            # Check for "add" intent
            if any(w in prompt_lower for w in ["add", "create", "include", "new", "another"]):
                idx = len(new_agents) + 1
                # Extract a name if possible
                name_match = re.search(r'(?:called|named|agent)\s+["\']?([A-Z][a-zA-Z\s]+)', prompt)
                agent_name = name_match.group(1).strip() if name_match else f"Agent {idx}"
                
                new_agents.append({
                    "id": f"agent-{idx}",
                    "name": agent_name,
                    "role": agent_name.split()[-1] if len(agent_name.split()) > 1 else "Specialist",
                    "goal": prompt[:100],
                    "backstory": f"A specialized agent created to handle: {prompt[:80]}",
                    "tools": ["web_search"] if "search" in prompt_lower or "research" in prompt_lower else []
                })
                new_tasks.append({
                    "id": f"task-{idx}",
                    "name": f"{agent_name} Task",
                    "description": prompt[:150],
                    "expectedOutput": "Detailed report with findings and recommendations.",
                    "agent_id": f"agent-{idx}"
                })
            
            # Check for "change/update" intent
            if any(w in prompt_lower for w in ["change", "update", "modify", "set", "switch", "use"]):
                for ag in new_agents:
                    if ag.get("name", "").lower() in prompt_lower:
                        if "gpt-4o" in prompt_lower:
                            ag["model"] = "gpt-4o"
                        if "claude" in prompt_lower:
                            ag["model"] = "claude-3.5-sonnet"
                        if "web_search" in prompt_lower or "search" in prompt_lower:
                            ag.setdefault("tools", [])
                            if "web_search" not in ag["tools"]:
                                ag["tools"].append("web_search")
                        if "code_interpreter" in prompt_lower:
                            ag.setdefault("tools", [])
                            if "code_interpreter" not in ag["tools"]:
                                ag["tools"].append("code_interpreter")
            
            print("\n===JSON_START===")
            print(json.dumps({
                "title": prompt[:30].strip().title() + " Project",
                "agents": new_agents,
                "tasks": new_tasks
            }))
            print("===JSON_END===")
            sys.exit(0)
        
        # --- FRESH GENERATION: Build smart agents from keywords ---
        agent_templates = []
        task_templates = []
        
        # Financial / Analysis keywords
        if any(w in prompt_lower for w in ["financial", "revenue", "earnings", "investment", "stock", "finance", "due diligence", "acquisition"]):
            agent_templates.append({"name": "Financial Analyst", "role": "Senior Financial Analyst", "goal": "Analyze financial statements, revenue trends, burn rate, and unit economics", "backstory": "A seasoned financial analyst with 15 years of experience in corporate finance and M&A valuations.", "tools": ["web_search", "calculator"]})
            task_templates.append({"name": "Financial Analysis Report", "description": f"Conduct a thorough financial analysis based on the objective: {prompt[:100]}", "expectedOutput": "Detailed financial report with revenue analysis, profitability metrics, and valuation models."})
        
        # Legal keywords
        if any(w in prompt_lower for w in ["legal", "compliance", "regulation", "litigation", "ip", "patent", "contract"]):
            agent_templates.append({"name": "Legal Compliance Officer", "role": "Legal & Compliance Specialist", "goal": "Review legal risks, IP ownership, regulatory compliance, and pending litigation", "backstory": "An experienced corporate attorney specializing in tech M&A and regulatory compliance.", "tools": []})
            task_templates.append({"name": "Legal Risk Assessment", "description": f"Evaluate all legal and compliance aspects related to: {prompt[:100]}", "expectedOutput": "Risk matrix covering IP, litigation, regulatory, and contractual obligations."})
        
        # Technical / Code keywords
        if any(w in prompt_lower for w in ["technical", "code", "architect", "tech debt", "scalability", "codebase", "software", "engineering"]):
            agent_templates.append({"name": "Technical Architect", "role": "Principal Technical Architect", "goal": "Audit codebase quality, tech debt, infrastructure scalability, and architecture patterns", "backstory": "A principal engineer with deep expertise in distributed systems and code quality assessment.", "tools": ["code_interpreter"]})
            task_templates.append({"name": "Technical Audit Report", "description": f"Perform a comprehensive technical assessment for: {prompt[:100]}", "expectedOutput": "Technical audit report covering architecture, code quality, scalability, and tech debt assessment."})
        
        # Market / Research / Reputation keywords  
        if any(w in prompt_lower for w in ["reputation", "news", "sentiment", "monitor"]):
            agent_templates = [
                {"name": "News Reputation Researcher", "role": "News Monitor", "goal": "Monitor and gather recent news articles", "backstory": "An expert in media monitoring.", "tools": ["web_search"]},
                {"name": "Social Media Reputation Researcher", "role": "Social Analyst", "goal": "Search for and analyze social media mentions and discussions", "backstory": "A specialist in tracking social sentiment.", "tools": ["web_search", "scraper"]},
                {"name": "Reputation Analyst", "role": "Senior Analyst", "goal": "Synthesize findings from news and social media research to assess overall reputation", "backstory": "A seasoned data synthesis expert.", "tools": []}
            ]
            task_templates = [
                {"id": "task-1", "name": "Monitor News Coverage", "description": "Search for and analyze all news articles.", "expectedOutput": "News summary.", "agent_id": "agent-1"},
                {"id": "task-2", "name": "Monitor Social Media Sentiment", "description": "Search for social media mentions.", "expectedOutput": "Sentiment report.", "agent_id": "agent-2", "asyncExecution": True},
                {"id": "task-3", "name": "Generate Reputation Assessment Report", "description": "Analyze and synthesize findings from both news monitoring and social media sentiment.", "expectedOutput": "Comprehensive reputation report.", "agent_id": "agent-3", "context": ["task-1", "task-2"]}
            ]
        elif any(w in prompt_lower for w in ["market", "competitive", "research", "trend", "customer", "churn", "landscape", "tam"]):
            agent_templates.append({"name": "Market Intelligence Analyst", "role": "Market Research Lead", "goal": "Analyze competitive landscape, market size (TAM/SAM/SOM), customer trends, and industry positioning", "backstory": "A market research specialist with expertise in competitive intelligence and trend forecasting.", "tools": ["web_search"]})
            task_templates.append({"id": f"task-{len(task_templates)+1}", "name": "Market Analysis Report", "description": f"Research and analyze market dynamics related to: {prompt[:100]}", "expectedOutput": "Comprehensive market report with competitive analysis, TAM/SAM/SOM sizing, and trend insights.", "agent_id": f"agent-{len(agent_templates)}"})
        
        # Content / Writing keywords
        if any(w in prompt_lower for w in ["write", "content", "blog", "article", "copy", "report", "summary", "presentation"]):
            agent_templates.append({"name": "Content Strategist", "role": "Senior Content Writer", "goal": "Create compelling, well-structured written deliverables from research and data", "backstory": "An expert content strategist with experience writing executive-level reports and presentations.", "tools": []})
            task_templates.append({"id": f"task-{len(task_templates)+1}", "name": "Content Creation", "description": f"Write the final deliverable based on all gathered information for: {prompt[:100]}", "expectedOutput": "Polished, executive-ready document or presentation.", "agent_id": f"agent-{len(agent_templates)}"})
        
        # Social Media keywords (generic)
        if not task_templates and any(w in prompt_lower for w in ["social media", "twitter", "linkedin", "social"]):
            agent_templates.append({"name": "Social Media Analyst", "role": "Social Media Intelligence Specialist", "goal": "Monitor and analyze social media mentions, sentiment, and engagement trends", "backstory": "A social media analyst skilled in sentiment analysis and digital reputation monitoring.", "tools": ["web_search", "scraper"]})
            task_templates.append({"id": f"task-{len(task_templates)+1}", "name": "Social Media Sentiment Report", "description": f"Analyze social media sentiment and trends for: {prompt[:100]}", "expectedOutput": "Sentiment analysis report with key mentions, engagement metrics, and trend graphs.", "agent_id": f"agent-{len(agent_templates)}"})
        
        # Support / Customer keywords
        if any(w in prompt_lower for w in ["support", "ticket", "customer service", "triage", "issue", "github"]):
            agent_templates.append({"name": "Support Triage Specialist", "role": "Customer Support Lead", "goal": "Classify, prioritize, and route incoming support tickets or issues efficiently", "backstory": "An experienced support operations manager with expertise in ticket classification and SLA management.", "tools": []})
            task_templates.append({"id": f"task-{len(task_templates)+1}", "name": "Ticket Triage & Classification", "description": f"Process and categorize items based on: {prompt[:100]}", "expectedOutput": "Prioritized list with severity levels, categories, and recommended actions.", "agent_id": f"agent-{len(agent_templates)}"})
        
        # Sales / Lead keywords
        if any(w in prompt_lower for w in ["lead", "sales", "score", "pipeline", "prospect", "outreach"]):
            agent_templates.append({"name": "Sales Intelligence Agent", "role": "Sales Ops Analyst", "goal": "Score and qualify leads based on engagement signals and firmographic data", "backstory": "A data-driven sales operations analyst with expertise in lead scoring and pipeline optimization.", "tools": ["web_search", "calculator"]})
            task_templates.append({"id": f"task-{len(task_templates)+1}", "name": "Lead Scoring & Qualification", "description": f"Analyze and score leads/prospects for: {prompt[:100]}", "expectedOutput": "Scored lead list with qualification tiers and recommended next actions.", "agent_id": f"agent-{len(agent_templates)}"})
        
        # Fallback: if no keywords matched, create 2 generic but well-named agents
        if not agent_templates:
            words = [w for w in prompt.split() if len(w) > 3 and w[0].isupper()]
            topic = " ".join(words[:3]) if words else prompt[:30]
            agent_templates = [
                {"name": f"{topic} Researcher", "role": "Lead Researcher", "goal": f"Research and gather comprehensive data about: {prompt[:80]}", "backstory": "An expert researcher with deep domain knowledge.", "tools": ["web_search"]},
                {"name": f"{topic} Analyst", "role": "Senior Analyst", "goal": f"Analyze findings and create actionable insights for: {prompt[:80]}", "backstory": "A seasoned analyst skilled at turning raw data into strategic recommendations.", "tools": ["calculator"]}
            ]
            task_templates = [
                {"id": "task-1", "name": "Research & Data Gathering", "description": f"Thoroughly research: {prompt[:120]}", "expectedOutput": "Comprehensive research document with key findings and data points.", "agent_id": "agent-1"},
                {"id": "task-2", "name": "Analysis & Recommendations", "description": f"Analyze all research findings and produce a final report for: {prompt[:100]}", "expectedOutput": "Executive summary with actionable recommendations and supporting data.", "agent_id": "agent-2", "context": ["task-1"]}
            ]
        
        # Build final output
        out_agents = []
        for i, at in enumerate(agent_templates):
            # If agent_templates were manually built with specific IDs above, preserve them, else assign.
            agent_id = at.get("id", f"agent-{i+1}")
            at.pop("id", None)
            out_agents.append({"id": agent_id, **at})
            
        out_tasks = task_templates
        
        title_words = prompt.split()[:5]
        title = " ".join(w.capitalize() for w in title_words)
        
        print("\n===JSON_START===")
        print(json.dumps({
            "title": f"{title} Crew",
            "agents": out_agents,
            "tasks": out_tasks
        }))
        print("===JSON_END===")
        sys.exit(0)

    system_prompt = f"""
You are an expert AI Systems Architect designing autonomous agent workflows (similar to CrewAI).
The user will provide an objective, request, or modification.

{context_str}

You must return the result as a strict JSON object. Do not include markdown code blocks (no ```json). Output raw valid JSON only.

The JSON schema must be exactly:
{{
    "title": "Short catchy name for this project",
    "agents": [
        {{
            "id": "agent-1", // Must be unique strings
            "name": "E.g. Lead Researcher",
            "role": "Short role title",
            "goal": "What does this agent aim to achieve?",
            "backstory": "A 1-sentence persona for this agent.",
            "tools": ["web_search", "calculator"] // Pick from available tools if needed
        }}
    ],
    "tasks": [
        {{
            "id": "task-1", // Must be unique strings
            "name": "E.g. Scrape the web",
            "description": "Detailed instruction of what to do.",
            "expectedOutput": "What is the final deliverable?",
            "agent_id": "agent-1" // Must map to an id in the agents array
        }}
    ]
}}
"""

    try:
        response = None
        models_to_try = ["openai/glm5.2", "glm5.2", "gemini/gemini-3.5-flash", "gemini/gemini-2.5-pro", "gemini/gemini-2.5-flash"]
        errors = []
        for model_name in models_to_try:
            try:
                response = litellm.completion(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ]
                )
                break # Success!
            except Exception as e:
                errors.append(f"{model_name}: {str(e)}")
                continue
                
        if not response:
            raise Exception("All models failed. Details: " + " | ".join(errors))
        
        content = response.choices[0].message.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
            
        print("\n===JSON_START===")
        print(content.strip())
        print("\n===JSON_END===")
        sys.stdout.flush()
        sys.exit(0)
        
    except Exception as e:
        print("\n===JSON_START===")
        print(json.dumps({
            "error": str(e),
            "agents": [],
            "tasks": []
        }))
        print("===JSON_END===")
        sys.stdout.flush()
        sys.exit(0)

if __name__ == "__main__":
    generate_blueprint()
