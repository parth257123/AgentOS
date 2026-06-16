from setuptools import setup, find_packages

setup(
    name="agentos",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "litellm>=1.0.0",
        "python-dotenv>=1.0.0"
    ],
    description="Deterministic, cost-efficient framework for AI agents.",
)
