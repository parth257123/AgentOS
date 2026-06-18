import os
import json
import threading
import requests
from typing import Dict, Any, List

class WebhookDispatcher:
    """
    Asynchronously dispatches webhook events to registered URLs.
    Supports tenant isolation.
    """
    def __init__(self, tenant_id: str = "default_tenant", db_dir: str = ".agentos_webhooks"):
        self.tenant_id = tenant_id
        self.db_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), "../../", db_dir)
        os.makedirs(self.db_dir, exist_ok=True)
        self.config_path = os.path.join(self.db_dir, f"{self.tenant_id}.json")
        self.subscriptions = self._load_subscriptions()

    def _load_subscriptions(self) -> Dict[str, List[str]]:
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def _save_subscriptions(self):
        with open(self.config_path, "w") as f:
            json.dump(self.subscriptions, f, indent=4)

    def register_webhook(self, event_type: str, url: str):
        """Registers a URL to listen for a specific event_type (or '*' for all)."""
        if event_type not in self.subscriptions:
            self.subscriptions[event_type] = []
        if url not in self.subscriptions[event_type]:
            self.subscriptions[event_type].append(url)
            self._save_subscriptions()
            print(f"[WebhookDispatcher] Registered {url} for event '{event_type}' on tenant '{self.tenant_id}'")

    def _post_async(self, url: str, payload: dict):
        try:
            # Fire-and-forget for V1
            response = requests.post(url, json=payload, timeout=5)
            if response.status_code >= 400:
                print(f"[WebhookDispatcher] Warning: Webhook delivered to {url} but returned status {response.status_code}")
        except Exception as e:
            print(f"[WebhookDispatcher] Warning: Failed to deliver webhook to {url}. Error: {e}")

    def dispatch(self, event_type: str, payload: dict):
        """
        Asynchronously fires matching webhooks for the given event_type.
        Includes wildcard '*' subscriptions.
        """
        payload["event_type"] = event_type
        payload["tenant_id"] = self.tenant_id

        urls_to_notify = set()
        
        # Add exact matches
        if event_type in self.subscriptions:
            urls_to_notify.update(self.subscriptions[event_type])
            
        # Add wildcard matches
        if "*" in self.subscriptions:
            urls_to_notify.update(self.subscriptions["*"])

        for url in urls_to_notify:
            thread = threading.Thread(target=self._post_async, args=(url, payload))
            thread.daemon = True
            thread.start()
