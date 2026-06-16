from core.agentos.vector_store import VectorStore

def run_test():
    print("Initializing VectorStore with nomic-embed-text...")
    vs = VectorStore()
    
    print("Inserting past tasks into VectorStore...")
    vs.insert("Task: Create Marketing Copy | Result: We should use neon green and aggressive slogans.", {"task_index": 1, "agent": "Marketer"})
    vs.insert("Task: Optimize Database | Result: The users table needs to be indexed on email to speed up auth.", {"task_index": 2, "agent": "DBA"})
    vs.insert("Task: Design UI Layout | Result: The login button should be centered and rounded.", {"task_index": 3, "agent": "Designer"})
    
    query = "Role: Database Engineer | Goal: Improve authentication performance"
    print(f"\nSearching for Context using Agent Profile:\n{query}")
    
    results = vs.search(query, top_k=1)
    
    print("\n--- Search Results ---")
    if results:
        print(f"Top Match Metadata: {results[0]}")
        if results[0]["task_index"] == 2:
            print("SUCCESS! The mathematical vector correctly retrieved the Database context instead of UI or Marketing.")
        else:
            print("FAILED. Retrieved the wrong context.")
    else:
        print("FAILED. No results returned.")

if __name__ == "__main__":
    run_test()
