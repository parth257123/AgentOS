import datetime
import json

class SecurityManager:
    """
    Handles Problem 8 & 18: Lack of Governance, RBAC, and Audit Logging.
    """
    def __init__(self):
        self.roles = {
            "admin": ["read", "write", "deploy", "delete", "manage_secrets"],
            "operator": ["read", "deploy"],
            "viewer": ["read"]
        }
        self.audit_log = []

    def check_permission(self, user_role: str, action: str) -> bool:
        allowed_actions = self.roles.get(user_role, [])
        if action not in allowed_actions:
            self._log_audit(user_role, action, "DENIED")
            return False
            
        self._log_audit(user_role, action, "GRANTED")
        return True

    def _log_audit(self, user: str, action: str, status: str):
        self.audit_log.append({
            "timestamp": datetime.datetime.now().isoformat(),
            "user": user,
            "action": action,
            "status": status
        })
        
    def export_audit_logs(self):
        return json.dumps(self.audit_log, indent=2)

class SecretManager:
    """
    Handles Problem 18: Secret Management.
    In production, this would interface with AWS KMS or HashiCorp Vault.
    """
    def __init__(self):
        self._encrypted_vault = {}
        
    def store_secret(self, key: str, value: str):
        # Mock encryption
        self._encrypted_vault[key] = f"ENC::{value}::ENC"
        
    def retrieve_secret(self, key: str) -> str:
        # Mock decryption
        val = self._encrypted_vault.get(key, "")
        return val.replace("ENC::", "").replace("::ENC", "")
