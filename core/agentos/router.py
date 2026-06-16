import litellm
import json
from .telemetry import TelemetryLogger

class RouterBrain:
    """
    Intelligent Model Router that dynamically evaluates cognitive load 
    and selects the optimal LLM for the task.
    Solves Problem 2: High Costs
    """
    def __init__(self, logger: TelemetryLogger):
        self.router_model = "gemini/gemini-2.5-flash" # Fastest, cheapest model for routing
        self.logger = logger
        self.available_models = {
            "gemini/gemini-2.5-flash": "Fast, cheap. Good for summarization, simple data extraction, and general chat.",
            "gemini/gemini-2.5-pro": "Powerful, complex reasoning. Good for heavy coding, complex logic, deep research, and math.",
            "gpt-4o": "Very powerful, general purpose. Expensive. Use only if requested or if task is extremely complex.",
            "gpt-4o-mini": "Fast, cheap alternative to GPT-4o."
        }

    def evaluate(self, task_description: str, expected_output: str, default_model: str) -> str:
        prompt = f"""
You are an Enterprise AI Model Router. Your job is to select the absolute CHEAPEST model capable of successfully completing the given task, without sacrificing quality.

Task Description:
{task_description}

Expected Output:
{expected_output}

Available Models:
{json.dumps(self.available_models, indent=2)}

Original Default Model: {default_model}

Evaluate the cognitive load of this task (e.g., does it require complex coding, math, or deep reasoning, or is it a simple text transformation?).
Output ONLY a valid JSON object with exactly two keys:
1. "model": The exact string key from the Available Models list that you have chosen.
2. "reason": A brief 1-sentence explanation of why you chose this model and why it saves money.

JSON Output:
"""
        try:
            response = litellm.completion(
                model=self.router_model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            result_str = response.choices[0].message.content
            
            # Record router cost/tokens
            prompt_tokens = response.usage.prompt_tokens if hasattr(response, 'usage') and response.usage else 0
            completion_tokens = response.usage.completion_tokens if hasattr(response, 'usage') and response.usage else 0
            
            self.logger.trace_response("🧠 RouterBrain", result_str, model_used=self.router_model, prompt_tokens=prompt_tokens, completion_tokens=completion_tokens, total_tokens=prompt_tokens+completion_tokens)
            
            # Parse JSON
            try:
                parsed = json.loads(result_str)
                selected_model = parsed.get("model", default_model)
                reason = parsed.get("reason", "Parsed correctly")
                
                # Trace the decision explicitly so the Flight Recorder can show it
                self.logger.traces.append({
                    "agent": "🧠 RouterBrain",
                    "event": "ROUTER_EVALUATION",
                    "timestamp": __import__("datetime").datetime.now().isoformat(),
                    "prompt_preview": f"Evaluating Task: {task_description[:50]}...",
                    "response_preview": f"Selected: {selected_model}\nReason: {reason}",
                    "model": self.router_model
                })
                
                return selected_model
            except json.JSONDecodeError:
                return default_model

        except Exception as e:
            # Fallback to default if router fails
            self.logger.traces.append({
                "agent": "🧠 RouterBrain",
                "event": "ROUTER_EVALUATION",
                "timestamp": __import__("datetime").datetime.now().isoformat(),
                "prompt_preview": "Router Error",
                "response_preview": f"Failed to route: {str(e)}\nFalling back to {default_model}"
            })
            return default_model
