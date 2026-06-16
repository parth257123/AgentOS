from core.agentos.agent import Agent
from core.agentos.cost_engine import BudgetExceededError

def run_test():
    print("Initializing Advanced Cost Prediction Engine Test...\n")
    
    # Intentionally set an impossibly small budget to trigger a BudgetExceededError
    manager = Agent(
        name="ProjectManager",
        role="Manager",
        goal="Test the budget.",
        backstory="You manage projects.",
        model="gpt-4o", # Premium model
        max_budget=0.0001 # $0.0001 budget
    )
    
    # We don't even need to mock litellm because the cost engine should throw
    # the BudgetExceededError BEFORE litellm is ever called!
    print("--- Executing Test Prompt ---")
    result = manager.execute("This is a very long prompt that will definitely cost more than 0.0001 dollars to execute on GPT-4o because it charges 5 dollars per 1 million tokens, and this is quite long.")
    
    print(f"\nFinal Result:\n{result}")

if __name__ == "__main__":
    run_test()
