import os
from dotenv import load_dotenv
from agentos import Agent, Task, Flow

# Load API keys from .env file
load_dotenv()

# Define Agents (using default gemini/gemini-2.5-flash model)
researcher = Agent(
    name="ResearchBot Alpha",
    role="Senior Data Analyst",
    goal="Gather precise data on market trends",
    backstory="You are an expert analyst with 10 years of experience in market research. You always provide concise, accurate, and bulleted data."
)

writer = Agent(
    name="ReportGen-Beta",
    role="Technical Writer",
    goal="Synthesize research into readable reports",
    backstory="You are a skilled writer who takes complex data and makes it accessible. You always format your output in well-structured paragraphs."
)

# Define Tasks
task1 = Task(
    description="Research the latest trends in AI autonomous agents for enterprise use.",
    expected_output="A bulleted list of 3 key trends.",
    agent=researcher
)

task2 = Task(
    description="Write a short summary report based on the research findings.",
    expected_output="A 2-paragraph summary report.",
    agent=writer
)

# Create a deterministic Flow
research_flow = Flow(
    name="AI Agent Research Flow",
    tasks=[task1, task2]
)

import json

# Execute
if __name__ == "__main__":
    if not os.getenv("GEMINI_API_KEY") and not os.getenv("OPENAI_API_KEY"):
         pass # suppress warnings for clean json
         
    final_output = research_flow.run()
    
    # Combine traces
    all_traces = researcher.logger.traces + writer.logger.traces
    
    print("\n===JSON_START===")
    print(json.dumps(all_traces))
    print("===JSON_END===")
