from core.agentos.agent import Agent
from core.agentos.mesh import Mesh
import os

# Ensure litellm knows we want to test with a fast, cheap model if needed, 
# but we will use glm-5.2 to stick to local execution if available.
os.environ["LITELLM_LOG"] = "INFO"

def run_test():
    print("Initializing Agency Mesh Architecture...")
    
    ceo = Agent(
        name="CEO",
        role="Chief Executive Officer",
        goal="Break down large problems and delegate them to your engineering team. Synthesize their answers into a final product.",
        backstory="You are an expert manager. You do not write code yourself. You delegate.",
        model="ollama/glm-5.2"
    )
    
    dev = Agent(
        name="Developer",
        role="Python Engineer",
        goal="Write python code based on the instructions.",
        backstory="You write clean Python code.",
        model="ollama/glm-5.2"
    )
    
    tester = Agent(
        name="QA",
        role="Quality Assurance Engineer",
        goal="Review python code and return 'PASS' or 'FAIL' with reasons.",
        backstory="You are a strict code reviewer.",
        model="ollama/glm-5.2"
    )
    
    # Define connections
    # CEO can talk to Dev and QA
    # Dev can ONLY talk to QA
    # QA cannot talk to anyone (must complete)
    my_agency = Mesh([
        ceo,
        [ceo, dev],
        [ceo, tester],
        [dev, tester]
    ])
    
    final_result = my_agency.run("I need a python script that prints 'Hello World'.", max_steps=6)
    
    print("\n\n================ FINAL SWARM RESULT ================")
    print(final_result)
    print("====================================================")

if __name__ == "__main__":
    run_test()
