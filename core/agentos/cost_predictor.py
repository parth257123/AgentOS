class CostPredictor:
    """
    Estimates workflow cost BEFORE execution.
    Analyzes task descriptions, expected outputs, and model selection.
    """
    
    def __init__(self):
        self.cost_rates = {
            "gemini/gemini-2.5-flash": {"prompt": 0.000000075, "completion": 0.0000003},
            "gemini/gemini-2.5-pro": {"prompt": 0.0000035, "completion": 0.0000105},
            "gpt-4o": {"prompt": 0.000005, "completion": 0.000015},
            "gpt-4o-mini": {"prompt": 0.00000015, "completion": 0.0000006},
            "claude-3.5-sonnet": {"prompt": 0.000003, "completion": 0.000015},
        }

    def predict_task_cost(self, task_description: str, expected_output: str, 
                          model: str, smart_routing: bool = False) -> dict:
        """Returns estimated tokens, cost, and confidence level."""
        # Estimate input tokens from description length (~1.3 tokens per word)
        desc_words = len(str(task_description).split())
        est_input_tokens = int(desc_words * 1.3) + 200 # +200 for system prompt overhead
        
        # Estimate output tokens from expected_output length
        out_words = len(str(expected_output).split())
        # The expected output description is usually short, but the actual output will be longer.
        # Let's assume a 5x multiplier for output vs description, or minimum 150 tokens.
        est_output_tokens = max(150, int(out_words * 5 * 1.3))
        
        predicted_model = model
        if smart_routing:
            # We simulate routing. In a real system, we'd look at complexity.
            # Here we just assume simple tasks go to flash, complex to pro.
            if len(task_description) > 300 or "complex" in task_description.lower():
                predicted_model = "gemini/gemini-2.5-pro"
            else:
                predicted_model = "gemini/gemini-2.5-flash"
                
        rates = self.cost_rates.get(predicted_model, self.cost_rates["gemini/gemini-2.5-flash"])
        cost = (est_input_tokens * rates["prompt"]) + (est_output_tokens * rates["completion"])
        
        # Include 3x SaaS platform markup if we want the user to see the charged cost
        final_cost = cost * 3.0
        
        return {
            "estimated_input_tokens": est_input_tokens,
            "estimated_output_tokens": est_output_tokens,
            "estimated_cost_usd": final_cost,
            "model": predicted_model,
            "confidence": "high"
        }
    
    def predict_flow_cost(self, tasks: list, config: dict) -> dict:
        """Estimates total flow cost including router overhead."""
        total_cost = 0.0
        breakdown = []
        smart_routing = config.get("smartRouting", False)
        
        cost_without_routing = 0.0
        
        # Router overhead (costs 1 flash call per task)
        router_cost = 0
        if smart_routing:
            router_rates = self.cost_rates["gemini/gemini-2.5-flash"]
            # Router typically uses ~150 prompt tokens and ~20 completion tokens
            router_cost = ((150 * router_rates["prompt"]) + (20 * router_rates["completion"])) * len(tasks) * 3.0
            total_cost += router_cost
            
        for i, task in enumerate(tasks):
            data = task.get("data", {})
            desc = data.get("description", "")
            exp_out = data.get("expectedOutput", "")
            
            # Find agent model
            # For this simple prediction, we'll default to the standard model if we can't find it easily
            # Real implementation would trace edges to find the agent.
            model = "gpt-4o" # Assume baseline without routing is expensive
            
            pred = self.predict_task_cost(desc, exp_out, model, smart_routing=smart_routing)
            
            # Prediction without routing
            pred_no_route = self.predict_task_cost(desc, exp_out, model, smart_routing=False)
            cost_without_routing += pred_no_route["estimated_cost_usd"]
            
            total_cost += pred["estimated_cost_usd"]
            breakdown.append({
                "task": data.get("name", f"Task {i+1}"),
                "model": pred["model"],
                "cost": pred["estimated_cost_usd"]
            })
            
        savings = max(0, cost_without_routing - total_cost) if smart_routing else 0.0
        
        return {
            "total_estimated_cost": total_cost,
            "per_task_breakdown": breakdown,
            "router_overhead": router_cost,
            "savings_with_routing": savings,
            "confidence": "medium"
        }

if __name__ == "__main__":
    import sys
    import json
    try:
        config_data = sys.stdin.read()
        config = json.loads(config_data)
        tasks = [n for n in config.get("nodes", []) if n.get("type") == "task"]
        predictor = CostPredictor()
        res = predictor.predict_flow_cost(tasks, config)
        print("\n===JSON_START===")
        print(json.dumps(res))
        print("===JSON_END===")
    except Exception as e:
        print("\n===JSON_START===")
        print(json.dumps({"error": str(e)}))
        print("===JSON_END===")
