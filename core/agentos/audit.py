import os
import json
import datetime
from typing import Dict, Any

class AuditLogger:
    """
    Enhanced Audit Log System.
    Writes strictly formatted NDJSON logs to provide an immutable record of 
    every critical action taken by Users, Agents, or the System.
    """
    def __init__(self, tenant_id: str = "default_tenant", db_dir: str = ".agentos_audit"):
        self.tenant_id = tenant_id
        # Define path at root of AgentOs
        self.db_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), "../../", db_dir)
        os.makedirs(self.db_dir, exist_ok=True)
        self.log_file = os.path.join(self.db_dir, f"{self.tenant_id}.log")

    def log_action(self, actor: str, action: str, resource: str, details: Dict[str, Any] = None):
        """
        Appends an event to the NDJSON audit log.
        :param actor: 'User', 'Agent', or 'System'
        :param action: Action verb (e.g. 'AGENT_DEPLOYED', 'TOOL_EXECUTED')
        :param resource: The target entity identifier
        :param details: Detailed JSON payload
        """
        if details is None:
            details = {}
            
        entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "tenant_id": self.tenant_id,
            "actor": actor,
            "action": action,
            "resource": resource,
            "details": details
        }
        
        try:
            with open(self.log_file, "a") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as e:
            print(f"[AuditLogger] Failed to write audit log: {e}")
