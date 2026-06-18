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
    """Fallback custom rule for simple dynamic conditions."""
    def __init__(self, condition: str, error_msg: str):
        self.condition = condition
        self.error_msg = error_msg
        
    def verify(self, output: str) -> bool:
        if "must contain " in self.condition:
            word = self.condition.replace("must contain ", "").strip()
            return word in output.lower()
        return True
        
    def get_error_message(self) -> str:
        return f"Verification Failed: {self.error_msg}"

import re
import ast

class RegexMatchRule(VerificationRule):
    """Verifies that the output contains a match for a given regex pattern."""
    def __init__(self, pattern: str, error_msg: str = None):
        self.pattern = pattern
        self.error_msg = error_msg or f"Output must match regex pattern: {pattern}"

    def verify(self, output: str) -> bool:
        return bool(re.search(self.pattern, output))

    def get_error_message(self) -> str:
        return f"Verification Failed: {self.error_msg}"

class MarkdownCodeBlockRule(VerificationRule):
    """Verifies that the output contains a markdown code block of a specific language."""
    def __init__(self, language: str = ""):
        self.language = language
        self.pattern = rf"```{self.language}[\s\S]*?```"

    def verify(self, output: str) -> bool:
        return bool(re.search(self.pattern, output))

    def get_error_message(self) -> str:
        lang_str = f" for '{self.language}'" if self.language else ""
        return f"Verification Failed: Output must contain a valid markdown code block{lang_str}."

class RequiredWordsRule(VerificationRule):
    """Verifies that ALL specified required words are present in the output."""
    def __init__(self, required_words: list[str]):
        self.required_words = [w.lower() for w in required_words]

    def verify(self, output: str) -> bool:
        out_lower = output.lower()
        for word in self.required_words:
            if word not in out_lower:
                return False
        return True

    def get_error_message(self) -> str:
        return f"Verification Failed: Output is missing required keywords: {', '.join(self.required_words)}"

class ForbiddenWordsRule(VerificationRule):
    """Verifies that NONE of the specified forbidden words are present in the output."""
    def __init__(self, forbidden_words: list[str]):
        self.forbidden_words = [w.lower() for w in forbidden_words]
        self.found_word = ""

    def verify(self, output: str) -> bool:
        out_lower = output.lower()
        for word in self.forbidden_words:
            if word in out_lower:
                self.found_word = word
                return False
        return True

    def get_error_message(self) -> str:
        return f"Verification Failed: Output contains strictly forbidden keyword: '{self.found_word}'. Please rewrite without using this term."

class ValidPythonCodeRule(VerificationRule):
    """Parses Python code blocks and ensures they compile without syntax errors."""
    def __init__(self):
        self.error_details = ""

    def verify(self, output: str) -> bool:
        # Extract python code blocks
        blocks = re.findall(r"```python\n([\s\S]*?)```", output, re.IGNORECASE)
        if not blocks:
            # If no code block is found, we might want to either pass or fail.
            # Assuming the rule implies "IF there is python code, it must be valid".
            # Or if it's meant to ensure python code exists, use MarkdownCodeBlockRule in tandem.
            return True 

        for block in blocks:
            try:
                ast.parse(block)
            except SyntaxError as e:
                self.error_details = f"Line {e.lineno}: {e.msg}\n{e.text}"
                return False
        return True

    def get_error_message(self) -> str:
        return f"Verification Failed: Generated Python code contains a Syntax Error and will crash. Details:\n{self.error_details}\nPlease fix the syntax error."

class NoPIIRule(VerificationRule):
    """Scans for SSN, Email, and basic Credit Card patterns and blocks if found."""
    def __init__(self):
        self.found_type = ""
        self.patterns = {
            "Social Security Number": r"\b\d{3}-\d{2}-\d{4}\b",
            "Email Address": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b",
            "Credit Card Number": r"\b(?:\d[ -]*?){13,16}\b"
        }

    def verify(self, output: str) -> bool:
        for pii_type, pattern in self.patterns.items():
            if re.search(pattern, output):
                self.found_type = pii_type
                return False
        return True

    def get_error_message(self) -> str:
        return f"CRITICAL SAFETY VIOLATION: Output contains detected Personally Identifiable Information ({self.found_type}). You must redact or remove this information immediately before finalizing."

