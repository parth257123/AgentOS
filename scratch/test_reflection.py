from core.agentos.agent import Agent
import os

os.environ["LITELLM_LOG"] = "INFO"

def run_test():
    print("Initializing Agent with Reflection Enabled...")
    
    # Initialize without tools so it hits the pure text reflection path
    agent = Agent(
        name="CopywriterBot",
        role="Senior Copywriter",
        goal="Write a short poem about AI. It must be exactly 4 lines long.",
        backstory="You are a very precise poet.",
        model="ollama/glm-5.2",
        tools=[],
        enable_reflection=True
    )
    
    prompt = "Write a 4-line poem about artificial intelligence."
    
    print(f"\nUser: {prompt}\n")
    
    import unittest.mock as mock
    
    # Mock LLM to test the Reflection Loop architecture
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
        
        if "CRITIQUE THIS ANSWER" in prompt_content:
            if os.environ.get("MOCK_REFLECTION_FAIL") == "1":
                os.environ["MOCK_REFLECTION_FAIL"] = "0"
                return MockResponse("FAIL: You only wrote 3 lines instead of 4.")
            return MockResponse("PASS")
            
        call_count["count"] += 1
        if call_count["count"] == 1:
            return MockResponse("Here is my poem:\nLine 1\nLine 2\nLine 3")
        else:
            return MockResponse("Here is my poem:\nLine 1\nLine 2\nLine 3\nLine 4")
            
    with mock.patch("core.agentos.agent.litellm.completion", side_effect=mock_completion):
        os.environ["MOCK_REFLECTION_FAIL"] = "1"
        final_result = agent.execute(prompt)
    
    print("\n================ FINAL AGENT RESULT ================")
    print(final_result)
    print("====================================================")

if __name__ == "__main__":
    run_test()
