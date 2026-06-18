import os
import json
import time
from typing import Dict, Any, List

class PromptRegistry:
    def __init__(self, tenant_id: str = "default_tenant", registry_dir: str = ".agentos_prompts"):
        # Defaulting to root workspace directory, namespaced by tenant
        self.tenant_id = tenant_id
        self.registry_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), "../../", registry_dir, self.tenant_id)
        os.makedirs(self.registry_dir, exist_ok=True)

    def _get_prompt_path(self, name: str) -> str:
        return os.path.join(self.registry_dir, f"{name}.json")

    def save_prompt(self, name: str, role: str, goal: str, backstory: str) -> str:
        """Saves a prompt as a new version."""
        path = self._get_prompt_path(name)
        data = {"name": name, "versions": []}
        
        if os.path.exists(path):
            with open(path, "r") as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    pass
                    
        version_num = len(data.get("versions", [])) + 1
        version_tag = f"v{version_num}"
        
        new_version = {
            "version": version_tag,
            "role": role,
            "goal": goal,
            "backstory": backstory,
            "updated_at": time.time()
        }
        
        data["versions"].append(new_version)
        data["latest_version"] = version_tag
        
        with open(path, "w") as f:
            json.dump(data, f, indent=4)
            
        from .audit import AuditLogger
        AuditLogger(tenant_id=self.tenant_id).log_action(
            "User", 
            "PROMPT_UPDATED", 
            name, 
            {"version": version_tag, "role": role}
        )
            
        print(f"[PromptRegistry] Saved '{name}' as {version_tag}")
        return version_tag

    def get_prompt(self, name: str, version: str = "latest") -> Dict[str, str]:
        """Retrieves a specific version of a prompt. Defaults to the latest."""
        path = self._get_prompt_path(name)
        if not os.path.exists(path):
            raise ValueError(f"Prompt '{name}' not found in registry.")
            
        with open(path, "r") as f:
            data = json.load(f)
            
        if not data.get("versions"):
            raise ValueError(f"Prompt '{name}' has no versions.")
            
        if version == "latest":
            version = data.get("latest_version", data["versions"][-1]["version"])
            
        for v in data["versions"]:
            if v["version"] == version:
                return {
                    "role": v["role"],
                    "goal": v["goal"],
                    "backstory": v["backstory"]
                }
                
        raise ValueError(f"Version '{version}' not found for prompt '{name}'.")

    def list_prompts(self) -> List[Dict[str, Any]]:
        """Lists all registered prompts and their versions."""
        prompts = []
        for filename in os.listdir(self.registry_dir):
            if filename.endswith(".json"):
                path = os.path.join(self.registry_dir, filename)
                with open(path, "r") as f:
                    try:
                        data = json.load(f)
                        prompts.append({
                            "name": data["name"],
                            "latest_version": data.get("latest_version"),
                            "total_versions": len(data.get("versions", []))
                        })
                    except Exception:
                        pass
        return prompts
