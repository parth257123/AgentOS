import litellm
from typing import List, Dict, Any

class BudgetExceededError(Exception):
    pass

class CostEngine:
    def __init__(self, tenant_id: str = "default_tenant", budget: float = 1.00):
        import os
        self.tenant_id = tenant_id
        self.budget = budget
        self.db_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), "../../", ".agentos_costs")
        os.makedirs(self.db_dir, exist_ok=True)
        self.cost_file = os.path.join(self.db_dir, f"{self.tenant_id}.json")
        self.total_cost = self._load_total_cost()

        # Pricing per 1M input / output tokens (USD)
        self.pricing = {
            "ollama/glm-5.2": {"input": 0.00, "output": 0.00},
            "gemini/gemini-2.5-flash": {"input": 0.075, "output": 0.30},
            "gemini/gemini-2.5-pro": {"input": 3.50, "output": 10.50},
            "gpt-4o": {"input": 5.00, "output": 15.00},
            "gpt-4o-mini": {"input": 0.150, "output": 0.60},
            "claude-3.5-sonnet": {"input": 3.00, "output": 15.00},
        }

    def _load_total_cost(self) -> float:
        import json, os
        if os.path.exists(self.cost_file):
            try:
                with open(self.cost_file, "r") as f:
                    data = json.load(f)
                    return data.get("total_cost", 0.0)
            except Exception:
                return 0.0
        return 0.0

    def _save_total_cost(self):
        import json
        with open(self.cost_file, "w") as f:
            json.dump({"total_cost": self.total_cost}, f)

    def _get_token_count(self, model: str, messages: List[Dict[str, Any]]) -> int:
        """Accurately calculates tokens using litellm."""
        try:
            return litellm.token_counter(model=model, messages=messages)
        except Exception:
            # Fallback heuristic if tokenizer fails or model unknown (approx 4 chars per token)
            text = "".join(str(m.get("content", "")) for m in messages)
            return len(text) // 4

    def _get_output_token_count(self, model: str, text: str) -> int:
        try:
            return litellm.token_counter(model=model, text=text)
        except Exception:
            return len(text) // 4

    def estimate_input_cost(self, model: str, messages: List[Dict[str, Any]]) -> float:
        """Predicts cost before execution."""
        tokens = self._get_token_count(model, messages)
        rates = self.pricing.get(model, {"input": 0.00, "output": 0.00})
        return (tokens / 1_000_000.0) * rates["input"]
        
    def add_cost(self, model: str, input_messages: List[Dict[str, Any]], output_text: str):
        """Calculates actual cost post-execution and adds to total session cost."""
        in_tokens = self._get_token_count(model, input_messages)
        out_tokens = self._get_output_token_count(model, output_text)
        
        rates = self.pricing.get(model, {"input": 0.00, "output": 0.00})
        cost = ((in_tokens / 1_000_000.0) * rates["input"]) + ((out_tokens / 1_000_000.0) * rates["output"])
        self.total_cost += cost
        self._save_total_cost()

    def enforce_budget(self, model: str, upcoming_messages: List[Dict[str, Any]]):
        """Halts execution if the estimated cost of the next prompt exceeds the remaining budget."""
        est_cost = self.estimate_input_cost(model, upcoming_messages)
        if self.total_cost + est_cost > self.budget:
            from .audit import AuditLogger
            audit_logger = AuditLogger(tenant_id=self.tenant_id)
            audit_logger.log_action("System", "BUDGET_EXCEEDED", "CostEngine", {"total_cost": self.total_cost, "est_cost": est_cost, "budget": self.budget})
            raise BudgetExceededError(f"Budget Exceeded! Total spent: ${self.total_cost:.4f}, Upcoming cost: ${est_cost:.4f}, Budget: ${self.budget:.4f}")
