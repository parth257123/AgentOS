from core.agentos.agent import Agent
from core.agentos.tools import CalculatorTool, WebSearchTool
import os

os.environ["LITELLM_LOG"] = "INFO"

def run_test():
    print("Initializing Agent with Dangerous Tools...")
    
    agent = Agent(
        name="SearchBot",
        role="Researcher",
        goal="Search the web for information when asked. If denied permission to search, apologize to the user and say you cannot answer.",
        backstory="You are an honest researcher.",
        model="ollama/glm-5.2",
        tools=[WebSearchTool(), CalculatorTool()] # WebSearch is flagged True for HITL
    )
    
    prompt = "Search the web for 'AI trends' and summarize the results."
    
    # Test 1: Simulating Human Approval
    print("\n--- TEST 1: HUMAN APPROVES ---")
    os.environ["AUTO_APPROVE_HITL"] = "1"
    res1 = agent.execute(prompt)
    print(f"\nFinal Result (Approved):\n{res1}\n")
    
    # Test 2: Simulating Human Denial
    print("\n--- TEST 2: HUMAN DENIES ---")
    os.environ["AUTO_APPROVE_HITL"] = "0"
    
    # Reset memory to start fresh
    agent.memory_store = []
    res2 = agent.execute(prompt)
    print(f"\nFinal Result (Denied):\n{res2}\n")

if __name__ == "__main__":
    run_test()
