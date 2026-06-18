import os
import json
import random
import time
from typing import Dict, Any, List

class ABExperiment:
    def __init__(self, tenant_id: str = "default_tenant", db_dir: str = ".agentos_experiments"):
        self.tenant_id = tenant_id
        self.db_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), "../../", db_dir, self.tenant_id)
        os.makedirs(self.db_dir, exist_ok=True)

    def _get_exp_path(self, name: str) -> str:
        return os.path.join(self.db_dir, f"{name}.json")

    def get_variation(self, experiment_name: str, variants: List[str]) -> str:
        """Randomly selects a variation for the experiment."""
        if not variants:
            raise ValueError("Variants list cannot be empty.")
        variant = random.choice(variants)
        print(f"[ABExperiment] '{experiment_name}' routed to variant '{variant}'")
        return variant

    def log_result(self, experiment_name: str, variant: str, latency: float, cost: float, success: bool):
        """Logs the execution telemetry for a specific variant."""
        path = self._get_exp_path(experiment_name)
        data = {"name": experiment_name, "logs": []}
        
        if os.path.exists(path):
            with open(path, "r") as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    pass
                    
        log_entry = {
            "timestamp": time.time(),
            "variant": variant,
            "latency": latency,
            "cost": cost,
            "success": success
        }
        
        data["logs"].append(log_entry)
        
        with open(path, "w") as f:
            json.dump(data, f, indent=4)

    def get_experiment_stats(self, experiment_name: str) -> Dict[str, Any]:
        """Aggregates telemetry to calculate average latency, cost, and success rate per variant."""
        path = self._get_exp_path(experiment_name)
        if not os.path.exists(path):
            return {}
            
        with open(path, "r") as f:
            data = json.load(f)
            
        stats = {}
        for log in data.get("logs", []):
            variant = log["variant"]
            if variant not in stats:
                stats[variant] = {
                    "count": 0,
                    "successes": 0,
                    "total_latency": 0.0,
                    "total_cost": 0.0
                }
            
            stats[variant]["count"] += 1
            if log["success"]:
                stats[variant]["successes"] += 1
            stats[variant]["total_latency"] += log["latency"]
            stats[variant]["total_cost"] += log["cost"]
            
        # Compute averages
        for variant, metrics in stats.items():
            count = metrics["count"]
            metrics["success_rate"] = metrics["successes"] / count if count > 0 else 0
            metrics["avg_latency"] = metrics["total_latency"] / count if count > 0 else 0
            metrics["avg_cost"] = metrics["total_cost"] / count if count > 0 else 0
            
        return stats
