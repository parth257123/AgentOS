from core.agentos.agent import Agent
from core.agentos.mesh import Mesh
import os

os.environ["LITELLM_LOG"] = "INFO"

def run_test():
    print("Initializing Agents...")
    
    manager = Agent(
        name="ProjectManager",
        role="Manager",
        goal="Delegate tasks to the researcher.",
        backstory="You manage projects."
    )
    
    researcher = Agent(
        name="Researcher",
        role="Researcher",
        goal="Research topics and delegate to the writer.",
        backstory="You find information."
    )
    
    writer = Agent(
        name="Writer",
        role="Writer",
        goal="Write the final article.",
        backstory="You write well."
    )
    
    # Notice we pass a flat list, NO explicit connections!
    print("\nInitializing Mesh with Flat List (AutoMeshRouter)...")
    mesh = Mesh([manager, researcher, writer])
    
    print("\nVerifying Connections:")
    for src, tgts in mesh.connections.items():
        print(f"  {src} -> {tgts}")

if __name__ == "__main__":
    run_test()
