import abc

class VerificationRule(abc.ABC):
    """Base class for verification rules."""
    
    @abc.abstractmethod
    def verify(self, output: str) -> bool:
        """Returns True if the output passes the rule, False otherwise."""
        pass
        
    @abc.abstractmethod
    def get_error_message(self) -> str:
        """Returns the error message to feed back to the LLM if verification fails."""
        pass

class MaxLengthRule(VerificationRule):
    """Verifies that the output does not exceed a maximum length."""
    def __init__(self, max_length: int):
        self.max_length = max_length
        
    def verify(self, output: str) -> bool:
        return len(output) <= self.max_length
        
    def get_error_message(self) -> str:
        return f"Verification Failed: Output exceeded maximum length of {self.max_length} characters. Please shorten your response."

class JSONFormatRule(VerificationRule):
    """Verifies that the output is valid JSON."""
    def verify(self, output: str) -> bool:
        import json
        try:
            json.loads(output)
            return True
        except json.JSONDecodeError:
            return False
            
    def get_error_message(self) -> str:
        return "Verification Failed: Output must be valid JSON format. Do not wrap it in markdown block quotes, just output the raw JSON."

class CustomRule(VerificationRule):
    """Verifies output based on a dynamic condition string."""
    def __init__(self, condition: str, error_msg: str):
        self.condition = condition
        self.error_msg = error_msg
        
    def verify(self, output: str) -> bool:
        # A simple string check for demonstration
        # E.g. "must contain X"
        if "must contain " in self.condition:
            word = self.condition.replace("must contain ", "").strip()
            return word in output.lower()
        return True
        
    def get_error_message(self) -> str:
        return f"Verification Failed: {self.error_msg}"
