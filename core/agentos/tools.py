import abc

class BaseTool(abc.ABC):
    name: str
    description: str
    requires_approval: bool = False

    @abc.abstractmethod
    def execute(self, **kwargs) -> str:
        """Executes the tool and returns a string observation."""
        pass
        
    def to_json(self):
        return {
            "name": self.name,
            "description": self.description,
            "requires_approval": self.requires_approval
        }

class CalculatorTool(BaseTool):
    name = "Calculator"
    description = "Evaluates a mathematical expression. Argument must be exactly: {'expression': 'math string'}. Example: {'expression': '10 * 5'}"
    requires_approval = False

    def execute(self, expression: str = "", **kwargs) -> str:
        try:
            # Naive safe-ish eval for math
            allowed_names = {"__builtins__": {}}
            result = eval(expression, allowed_names, {})
            return str(result)
        except Exception as e:
            return f"Error evaluating math: {str(e)}"
            
from duckduckgo_search import DDGS

class WebSearchTool(BaseTool):
    name = "WebSearch"
    description = "Searches the live web for real-time information. Argument must be exactly: {'query': 'search string'}. Example: {'query': 'AI trends'}"
    requires_approval = True
    
    def execute(self, query: str = "", **kwargs) -> str:
        try:
            results = DDGS().text(query, max_results=3)
            formatted_results = ""
            for idx, res in enumerate(results):
                formatted_results += f"{idx+1}. {res.get('title')}: {res.get('body')}\n"
            return formatted_results if formatted_results else "No results found."
        except Exception as e:
            return f"Error executing live web search: {str(e)}"
