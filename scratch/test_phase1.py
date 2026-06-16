from core.agentos.agent import Agent
from core.agentos.mesh import Mesh
from core.agentos.verification import MaxLengthRule, JSONFormatRule
import os

os.environ["LITELLM_LOG"] = "INFO"

def run_test():
    print("Initializing Expansion Phase 1 Test...\n")
    
    # 1. Verification Rule Templates
    strict_rules = [
        MaxLengthRule(50) # The agent must respond in under 50 chars
    ]
    
    manager = Agent(
        name="ProjectManager",
        role="Manager",
        goal="Delegate tasks to the researcher.",
        backstory="You manage projects.",
        model="gpt-4o" # Test cost prediction for premium model
    )
    
    researcher = Agent(
        name="Researcher",
        role="Researcher",
        goal="Provide a concise answer under 50 characters.",
        backstory="You are very concise.",
        model="gpt-4o",
        verification_rules=strict_rules
    )
    
    mesh = Mesh([manager, researcher])
    
    # Force the mock execution to fail the length rule on the first try to test the retry loop
    # We will patch the mock so it first outputs a long string, then a short one
    import unittest.mock as mock
    
    call_count = {"count": 0}
    def mock_completion(*args, **kwargs):
        class MockMessage:
            def __init__(self, content):
                self.content = content
                
        class MockChoice:
            def __init__(self, content):
                self.message = MockMessage(content)
                
        class MockResponse:
            def __init__(self, content):
                self.choices = [MockChoice(content)]
                
        messages = kwargs.get("messages", [])
        prompt_content = messages[-1]["content"]
        
        # Test 2: Node Animation Delegation
        if "Delegate" in prompt_content:
            return MockResponse('{"action": "delegate", "target": "Researcher", "task": "Answer the question"}')
            
        # Test 3: Verification Engine
        if "SYSTEM VERIFICATION FAILED" in prompt_content:
            return MockResponse('{"action": "complete", "result": "Short answer."}')
            
        call_count["count"] += 1
        if call_count["count"] == 1:
            return MockResponse('{"action": "delegate", "target": "Researcher", "task": "Answer the question"}')
        else:
            return MockResponse('{"action": "complete", "result": "This is a very long answer that will definitely exceed the fifty character limit we set in the verification rule."}')

    print("\n--- Running Test ---")
    with mock.patch("core.agentos.agent.litellm.completion", side_effect=mock_completion):
        mesh.run("Delegate to the researcher to answer the question.")
            
if __name__ == "__main__":
    run_test()
