from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.agentos.agent import Agent
from core.agentos.mesh import Mesh

app = FastAPI(title="AgentOS Web Dashboard")

# Mount static files
app.mount("/static", StaticFiles(directory="web/static"), name="static")

# Global variables to simulate long-running Mesh state for the dashboard
# In production, we'd use a DB, but for this local dashboard we'll keep them in memory
global_manager = Agent(
    name="ProjectManager",
    role="Manager",
    goal="Coordinate the Mesh",
    backstory="You are the entry point for all tasks.",
    model="gpt-4o-mini", # Default fast model
    max_budget=10.0
)
global_developer = Agent(
    name="Developer",
    role="Developer",
    goal="Write code",
    backstory="You write excellent python code.",
    model="gpt-4o-mini"
)
global_mesh = Mesh(chart=[
    global_manager,
    [global_manager, global_developer]
], model="gpt-4o-mini")

@app.get("/")
async def read_index():
    with open("web/static/index.html", "r") as f:
        html = f.read()
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html)

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    prompt = data.get("prompt", "")
    
    if not prompt:
        return JSONResponse({"error": "Empty prompt"})
        
    try:
        # For the dashboard, we run the mesh.
        # Since mesh execution handles its own context and cost tracking via its agents:
        result = global_mesh.run(prompt, max_steps=10)
        
        # Aggregate telemetry
        total_spent = global_manager.cost_engine.total_cost + global_developer.cost_engine.total_cost
        
        # Get health from the entry point agent
        manager_tokens = global_manager.cost_engine._get_token_count(global_manager.model, global_manager.memory_store)
        health_ratio = global_manager.context_manager.get_usage_ratio(manager_tokens)
        health_status = global_manager.context_manager.get_health_status(manager_tokens)
        
        return JSONResponse({
            "result": result,
            "telemetry": {
                "total_cost": total_spent,
                "health_percent": int(health_ratio * 100),
                "health_status": health_status,
                "manager_tokens": manager_tokens
            }
        })
    except Exception as e:
        import traceback
        return JSONResponse({"error": str(e), "traceback": traceback.format_exc()})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
