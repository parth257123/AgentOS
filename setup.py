from setuptools import setup, find_packages

setup(
    name="agentos",
    version="1.0.0",
    description="AgentOS — The Operating System for Autonomous AI Agents",
    author="AgentOS Team",
    packages=find_packages(),
    install_requires=[
        "typer>=0.9.0",
        "rich>=13.0.0",
        "litellm",
        "pyyaml",
    ],
    entry_points={
        "console_scripts": [
            "agentos=core.agentos.cli:app_entry",
        ],
    },
    python_requires=">=3.10",
)
