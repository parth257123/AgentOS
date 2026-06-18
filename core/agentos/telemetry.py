import json
import datetime
import time
import uuid

class TelemetryLogger:
    """
    Flight Recorder implementation: Tracks granular metrics for all LLM calls.
    Addresses Problem 3: Difficult Debugging and Problem 11: Performance Metrics.
    """
    def __init__(self, tenant_id: str = "default_tenant"):
        self.tenant_id = tenant_id
        self.traces = []
        self._active_calls = {}

    def trace_call(self, agent_name: str, prompt: str, node_id: str = None):
        call_id = str(uuid.uuid4())
        self._active_calls[agent_name] = {
            "id": call_id,
            "start_time": time.time(),
        }
        
        # In a real environment, we would securely log or mask sensitive PII here
        trace_data = {
            "id": call_id,
            "tenant_id": self.tenant_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "event": "LLM_CALL_START",
            "agent": agent_name,
            "node_id": node_id,
            "prompt_full": prompt, # Log full prompt for flight recorder
            "prompt_preview": prompt[:100] + "..." if len(prompt) > 100 else prompt
        }
        self.traces.append(trace_data)
        print(f"===STREAM_EVENT==={json.dumps(trace_data)}", flush=True)

    def trace_response(self, agent_name: str, response: str, model_used: str = "unknown", prompt_tokens: int = 0, completion_tokens: int = 0, total_tokens: int = 0, node_id: str = None):
        if agent_name in self._active_calls:
            call_data = self._active_calls.pop(agent_name)
            latency = time.time() - call_data["start_time"]
            call_id = call_data["id"]
        else:
            latency = 0
            call_id = str(uuid.uuid4())
            
        cost_rates = {
            "gemini/gemini-2.5-flash": {"prompt": 0.000000075, "completion": 0.0000003},
            "gemini/gemini-2.5-pro": {"prompt": 0.0000035, "completion": 0.0000105},
            "gpt-4o": {"prompt": 0.000005, "completion": 0.000015},
            "claude-3.5-sonnet": {"prompt": 0.000003, "completion": 0.000015},
            "deepseek/deepseek-chat": {"prompt": 0.00000014, "completion": 0.00000028},
            "deepseek/deepseek-coder": {"prompt": 0.00000014, "completion": 0.00000028},
            "groq/llama3-8b-8192": {"prompt": 0.00000005, "completion": 0.00000008},
            "groq/mixtral-8x7b-32768": {"prompt": 0.00000024, "completion": 0.00000024},
            "ollama/llama3": {"prompt": 0.0, "completion": 0.0},
            "ollama/mistral": {"prompt": 0.0, "completion": 0.0},
            "ollama/glm-5.2": {"prompt": 0.0, "completion": 0.0}
        }
        
        rate = cost_rates.get(model_used, {"prompt": 0.000001, "completion": 0.000002})
        estimated_cost = (prompt_tokens * rate["prompt"]) + (completion_tokens * rate["completion"])
        
        # Fallback if litellm didn't return tokens
        if total_tokens == 0:
            prompt_words = len(str(self._active_calls.get("prompt", "")).split())
            response_words = len(response.split())
            prompt_tokens_est = int(prompt_words * 1.3)
            completion_tokens_est = int(response_words * 1.3)
            estimated_cost = (prompt_tokens_est * rate["prompt"]) + (completion_tokens_est * rate["completion"])
        
        # SAAS MARKUP: Platform owner charges 3x the base cost
        platform_fee = estimated_cost * 3.0

        trace_data = {
            "id": call_id,
            "tenant_id": self.tenant_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "event": "LLM_CALL_END",
            "agent": agent_name,
            "node_id": node_id,
            "model": model_used,
            "latency_seconds": round(latency, 3),
            "tokens": total_tokens,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "cost_base": round(estimated_cost, 6),
            "cost_usd": round(platform_fee, 6), # We rename this to keep UI compatibility if UI expects cost_usd
            "response_full": response,
            "response_preview": response[:100] + "..." if len(response) > 100 else response
        }
        self.traces.append(trace_data)
        print(f"===STREAM_EVENT==={json.dumps(trace_data)}", flush=True)
        
    def trace_tool(self, agent_name: str, tool_name: str, arguments: dict):
        self.traces.append({
            "id": str(uuid.uuid4()),
            "tenant_id": self.tenant_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "event": "TOOL_CALL",
            "agent": agent_name,
            "tool": tool_name,
            "arguments": arguments
        })

    def dump_traces(self):
        return json.dumps(self.traces, indent=2)
