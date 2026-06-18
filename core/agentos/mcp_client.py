import asyncio
from typing import List, Dict, Any, Optional

try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
except ImportError:
    ClientSession = None
    stdio_client = None

import threading
import concurrent.futures

from .tools import BaseTool

class MCPWrappedTool(BaseTool):
    """Wraps an MCP tool as a native AgentOS BaseTool."""
    def __init__(self, mcp_client, server_name: str, tool_data: Any):
        self.mcp_client = mcp_client
        self.server_name = server_name
        self.name = tool_data.name
        self.description = tool_data.description or f"MCP Tool: {tool_data.name}"
        self.requires_approval = False # MCP tools typically handle their own auth/security but we default to False

    def execute(self, **kwargs) -> str:
        """Executes the tool synchronously by passing the coroutine to the background event loop."""
        try:
            future = asyncio.run_coroutine_threadsafe(
                self.mcp_client.call_tool(self.server_name, self.name, kwargs),
                self.mcp_client.loop
            )
            return future.result(timeout=30)
        except Exception as e:
            raise RuntimeError(f"MCP Tool Execution Error: {str(e)}")

class AgentOSMCPClient:
    def __init__(self):
        self.sessions = {}
        self.exit_stacks = {}
        self.discovered_tools = []
        
        # Start a persistent background event loop
        self.loop = asyncio.new_event_loop()
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()

    def _run_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_forever()

    async def connect_stdio_server(self, server_name: str, command: str, args: List[str], env: Optional[Dict[str, str]] = None):
        """Connects to a local MCP server via Stdio."""
        if not stdio_client:
            print("[MCP Client] Error: 'mcp' SDK is not installed. Please run `pip install mcp`.")
            return

        from contextlib import AsyncExitStack
        
        server_params = StdioServerParameters(
            command=command,
            args=args,
            env=env
        )

        exit_stack = AsyncExitStack()
        self.exit_stacks[server_name] = exit_stack

        stdio_transport = await exit_stack.enter_async_context(stdio_client(server_params))
        read, write = stdio_transport

        session = await exit_stack.enter_async_context(ClientSession(read, write))
        await session.initialize()
        
        self.sessions[server_name] = session
        print(f"[MCP Client] Connected to MCP Server: {server_name}")

        # Auto-discover tools
        response = await session.list_tools()
        for tool in response.tools:
            wrapped_tool = MCPWrappedTool(self, server_name, tool)
            self.discovered_tools.append(wrapped_tool)
            print(f"[MCP Client] Discovered Tool: {wrapped_tool.name} from {server_name}")

    async def call_tool(self, server_name: str, tool_name: str, arguments: dict) -> str:
        """Calls a tool on a specific connected MCP server."""
        if server_name not in self.sessions:
            raise ValueError(f"MCP server '{server_name}' is not connected.")
        
        session = self.sessions[server_name]
        try:
            result = await session.call_tool(tool_name, arguments)
            if hasattr(result, 'content') and result.content:
                # Format the text content blocks
                text_results = []
                for content in result.content:
                    if content.type == 'text':
                        text_results.append(content.text)
                return "\n".join(text_results)
            return str(result)
        except Exception as e:
            return f"Error executing MCP Tool: {str(e)}"

    async def cleanup(self):
        """Clean up all connections."""
        for server_name, stack in self.exit_stacks.items():
            try:
                await stack.aclose()
            except Exception as e:
                print(f"[MCP Client] Error closing connection for {server_name}: {e}")
        self.sessions.clear()
        self.exit_stacks.clear()
        self.discovered_tools.clear()

    def connect_all_sync(self, server_configs: List[Dict[str, Any]]):
        async def connect_all():
            for config in server_configs:
                try:
                    await self.connect_stdio_server(
                        server_name=config.get("name"),
                        command=config.get("command"),
                        args=config.get("args", []),
                        env=config.get("env")
                    )
                except Exception as e:
                    print(f"[MCP Error] Failed to connect to {config.get('name')}: {e}")
                    
        future = asyncio.run_coroutine_threadsafe(connect_all(), self.loop)
        future.result()  # wait for completion

# Singleton helper for synchronous loading
def load_mcp_servers_sync(server_configs: List[Dict[str, Any]]) -> List[BaseTool]:
    """
    Takes a list of configs, connects to them synchronously, and returns the list of wrapped MCP tools.
    Format: [{"name": "math_server", "command": "python", "args": ["math_server.py"]}]
    """
    client = AgentOSMCPClient()
    client.connect_all_sync(server_configs)
    return client.discovered_tools
