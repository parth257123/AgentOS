from typing import Optional
from .agent import Agent

class Task:
    def __init__(self, description: str, expected_output: str, agent: Optional[Agent] = None, complexity: str = "low", validation_rules: list = None):
        self.description = description
        self.expected_output = expected_output
        self.agent = agent
        self.complexity = complexity
        self.validation_rules = validation_rules or []
        self.result = None

    def execute(self, context: str = "", smart_routing: bool = False) -> str:
        """Executes the task using the assigned agent, with verification and smart routing."""
        if not self.agent:
            raise ValueError("Task must have an assigned agent to execute.")
        
        original_model = self.agent.model
        if smart_routing:
            from .router import RouterBrain
            router = RouterBrain(self.agent.logger)
            self.agent.model = router.evaluate(self.description, self.expected_output, original_model)
        else:
            # Fallback legacy complexity routing if smart routing is off
            if self.complexity == "high":
                self.agent.model = "ollama/glm-5.2"
            elif self.complexity == "low":
                self.agent.model = "ollama/glm-5.2"
            
        full_prompt = f"Task: {self.description}\nExpected Output: {self.expected_output}"
        
        max_retries = 3
        for attempt in range(max_retries):
            self.result = self.agent.execute(full_prompt, context=context)
            
            # Problem 1 & 4: Verification Engine and Hallucination Prevention
            if self.validation_rules:
                verification_prompt = f"You are a strict judge. Evaluate the following text against these rules: {self.validation_rules}\n\nText: {self.result}\n\nRespond with 'PASS' if it meets all rules, or 'FAIL: [reason]' if it does not."
                
                # Use a dedicated fast verifier
                import litellm
                verifier_response = litellm.completion(
                    model="ollama/glm-5.2",
                    messages=[{"role": "user", "content": verification_prompt}]
                ).choices[0].message.content
                
                if "FAIL" in verifier_response.upper():
                    print(f"Verification failed on attempt {attempt+1}: {verifier_response}")
                    full_prompt += f"\n\nPrevious attempt failed verification: {verifier_response}. Please fix the output to adhere strictly to the rules."
                    continue
                else:
                    print("Output verified successfully.")
                    break
            else:
                break # No rules, just accept the result

        # Restore original model
        self.agent.model = original_model
        return self.result
