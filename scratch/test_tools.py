from core.agentos.agent import Agent
from core.agentos.tools import CalculatorTool, WebSearchTool
import os

os.environ["LITELLM_LOG"] = "INFO"

def run_test():
    print("Initializing Agent with Tools...")
    
    # Initialize the Agent with the new Tools list
    math_agent = Agent(
        name="MathBot",
        role="Mathematician",
        goal="Solve math problems accurately.",
        backstory="You are a precise calculator.",
        model="ollama/glm-5.2",
        tools=[CalculatorTool(), WebSearchTool()]
    )
    
    # Run a prompt that explicitly requires math
    prompt = "What is 10 multiplied by 5?"
    
    print(f"\nUser: {prompt}\n")
    final_result = math_agent.execute(prompt)
    
    print("\n================ FINAL AGENT RESULT ================")
    print(final_result)
    print("====================================================")

if __name__ == "__main__":
    run_test()
