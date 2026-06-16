import sys
import json
import os
from dotenv import load_dotenv
import litellm

load_dotenv()

def generate_use_cases(prompt: str):
    if not os.getenv("GEMINI_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        # Return fallback mock if no key is present to prevent breaking the UI
        print(json.dumps([
            {"title": "Fallback: Automated Lead Enrichment", "impact": "High", "effort": "Low", "description": f"Analyzed: {prompt[:50]}... (Please add API Key to .env for real AI generation)"},
            {"title": "Fallback: Support Triaging", "impact": "High", "effort": "Medium", "description": "Agent categorizes inbound tickets automatically."},
            {"title": "Fallback: Pricing Tracker", "impact": "Medium", "effort": "Low", "description": "Agent scrapes competitor sites."}
        ]))
        return

    system_prompt = """
You are the AgentOS Discovery Engine.
Your goal is to read the user's business context or problem, and recommend exactly 3 highly valuable AI agent automation use cases.
You must return the result as a strict JSON array of objects. Do not include markdown code blocks or any other text.
Format each object exactly like this:
{
    "title": "Short catchy title",
    "impact": "High or Medium",
    "effort": "Low, Medium, or High",
    "description": "A 1-2 sentence description of what the agent will do."
}
"""

    try:
        response = litellm.completion(
            model="gemini/gemini-2.5-flash",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        
        content = response.choices[0].message.content.strip()
        # Clean up potential markdown formatting from LLM
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
            
        print(content.strip())
        
    except Exception as e:
        print(json.dumps([
            {"title": "Error Generating Use Cases", "impact": "High", "effort": "High", "description": str(e)}
        ]))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        prompt = "We spend too much time copying data from emails to Jira."
    else:
        prompt = sys.argv[1]
        
    generate_use_cases(prompt)
