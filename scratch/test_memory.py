from core.agentos.vector_store import VectorStore
from core.agentos.graph_store import GraphStore
from core.agentos.context_manager import ContextManager
import chromadb
import shutil
import os

def run_test():
    # Clear old test data if exists
    if os.path.exists("./.agent_memory"):
        shutil.rmtree("./.agent_memory")
        
    print("Initializing State-of-the-Art Memory Components...")
    vector_store = VectorStore(path="./.agent_memory")
    graph_store = GraphStore(model_name="gemini/gemini-2.5-flash") # Use gemini for faster mock testing of the graph extraction
    compressor = ContextManager(model="ollama/glm-5.2")
    
    working_memory = [
        "Task: Read User Input | Result: The user asked to build a login screen.",
        "Task: Choose Framework | Result: We decided to use React for the frontend."
    ]
    
    print("\n[1/3] Simulating Archival Memory (Inserting to ChromaDB)...")
    vector_store.insert("Task: Setup Database | Result: The database uses Postgres and stores user passwords securely.", {"task_index": 1, "agent": "DBA"})
    vector_store.insert("Task: Design Logo | Result: The logo is blue and round.", {"task_index": 2, "agent": "Designer"})
    
    print("\n[2/3] Simulating Knowledge Graph Extraction (GraphRAG)...")
    # This simulates what flow.py does after a task finishes
    mock_result = "The Authentication Service depends on the Postgres Database to verify passwords."
    graph_store.extract_and_insert(mock_result)
    
    print("\n[3/3] Retrieving Combined Context for a new Agent...")
    agent_role = "Backend Security Engineer"
    agent_goal = "Implement the login endpoint and connect it to the database."
    
    final_context = compressor.compress_for_agent(
        vector_store=vector_store,
        graph_store=graph_store,
        working_memory=working_memory,
        agent_role=agent_role,
        agent_goal=agent_goal
    )
    
    print("\n================ FINAL INJECTED CONTEXT ================\n")
    print(final_context)
    print("========================================================\n")
    
    if "SHORT TERM WORKING MEMORY" in final_context and "ARCHIVAL MEMORY" in final_context and "KNOWLEDGE GRAPH INSIGHTS" in final_context:
        print("SUCCESS! All three memory tiers successfully integrated and retrieved.")
    else:
        print("FAILED to integrate all memory tiers.")

if __name__ == "__main__":
    run_test()
