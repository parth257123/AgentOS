from core.agentos.agent import Agent

def run_test():
    print("Initializing Context Health Monitor Test...\n")
    
    manager = Agent(
        name="ProjectManager",
        role="Manager",
        goal="Test context limits.",
        backstory="You manage context sizes.",
        model="gpt-4o-mini",
        max_budget=10.0 # Enough budget to test
    )
    
    # Force an artificially low context window limit for testing purposes
    manager.context_manager.model_limits["gpt-4o-mini"] = 500
    
    print("--- 1. Sending Small Prompt (Should be HEALTHY) ---")
    res1 = manager.execute("Hello, what is 2+2?")
    print(f"Result: {res1}\n")
    
    print("--- 2. Sending Massive Prompt (Should hit CRITICAL and trigger Auto-Compression) ---")
    massive_prompt = "Here is a massive block of text to trigger the health monitor. " * 50
    massive_prompt += "Can you summarize what I just said?"
    res2 = manager.execute(massive_prompt)
    print(f"Result: {res2}\n")

if __name__ == "__main__":
    run_test()
