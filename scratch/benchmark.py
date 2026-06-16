import time
import litellm
import os
from dotenv import load_dotenv

load_dotenv("/Users/parthlodaya/Downloads/AgentOs/.env")

# We enable fallback to mock if no API key or local model is found
litellm.drop_params = True

MODELS = ["gemini/gemini-2.5-flash", "ollama/qwen2.5:0.5b"]

SCENARIOS = {
    "Simple Summarization": "Summarize the theory of relativity in exactly 3 sentences.",
    "Code Generation": "Write a Python function to implement a binary search tree insertion and explain its time complexity.",
    "Context Compression (Agentic)": "Extract only the database schema details from the following text: 'We need to build a web app. The marketing copy should be edgy. The database needs a Users table with id, email, and password_hash. The UI will use React.'"
}

def run_benchmark():
    results = []
    print("Starting Model Benchmark...\n")
    
    for model in MODELS:
        print(f"=== Testing Model: {model} ===")
        for scenario_name, prompt in SCENARIOS.items():
            print(f"  Running Scenario: {scenario_name}")
            start_time = time.time()
            try:
                response = litellm.completion(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    # Small timeout so we don't hang if ollama is missing
                    timeout=10 
                )
                latency = time.time() - start_time
                content = response.choices[0].message.content
                
                # Try to get usage, but local models might not return it reliably in all litellm versions
                prompt_tokens = response.usage.prompt_tokens if hasattr(response, 'usage') and response.usage else len(prompt.split()) * 1.3
                completion_tokens = response.usage.completion_tokens if hasattr(response, 'usage') and response.usage else len(content.split()) * 1.3
                
                results.append({
                    "model": model,
                    "scenario": scenario_name,
                    "latency": f"{latency:.2f}s",
                    "status": "Success",
                    "output_preview": content[:100].replace('\n', ' ') + "..."
                })
                print(f"    -> Success! Latency: {latency:.2f}s")
            except Exception as e:
                latency = time.time() - start_time
                results.append({
                    "model": model,
                    "scenario": scenario_name,
                    "latency": f"{latency:.2f}s",
                    "status": f"Failed: {str(e)[:50]}...",
                    "output_preview": "N/A"
                })
                print(f"    -> Failed: {str(e)[:50]}...")
        print("")

    print("\n=== BENCHMARK SUMMARY ===")
    print(f"{'Model':<25} | {'Scenario':<30} | {'Latency':<10} | {'Status'}")
    print("-" * 85)
    for res in results:
        print(f"{res['model']:<25} | {res['scenario']:<30} | {res['latency']:<10} | {res['status']}")

if __name__ == "__main__":
    run_benchmark()
