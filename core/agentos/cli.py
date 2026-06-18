"""
AgentOS CLI — Next-Gen Terminal Interface
==========================================
A premium CLI experience that makes CrewAI look like a toy.
Uses Typer for command routing and Rich for stunning terminal visuals.
"""

import typer
import os
import sys
import json
import time
import subprocess
from typing import Optional
from pathlib import Path

# Rich imports for premium terminal UI
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.markdown import Markdown
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.prompt import Prompt, Confirm
from rich.tree import Tree
from rich import box
from rich.layout import Layout
from rich.live import Live
from rich.align import Align

console = Console()
app = typer.Typer(
    name="agentos",
    help="🤖 AgentOS — The Operating System for Autonomous AI Agents",
    no_args_is_help=True,
    rich_markup_mode="rich",
)

# ─────────────────────────────────────────────
# Brand Banner
# ─────────────────────────────────────────────
BANNER = """[bold cyan]
   ╔═══════════════════════════════════════════════════╗
   ║              🤖  A G E N T  O S  🤖              ║
   ║     The Operating System for Autonomous AI        ║
   ╚═══════════════════════════════════════════════════╝[/bold cyan]"""

VERSION = "1.0.0"


def _print_banner():
    console.print(BANNER)
    console.print(f"   [dim]v{VERSION} • typer + rich • Next-Gen CLI[/dim]\n")


# ─────────────────────────────────────────────
# agentos version
# ─────────────────────────────────────────────
@app.command()
def version():
    """Show the AgentOS version and system info."""
    _print_banner()
    info_table = Table(show_header=False, box=box.ROUNDED, border_style="cyan")
    info_table.add_column("Key", style="bold white")
    info_table.add_column("Value", style="green")
    info_table.add_row("Version", VERSION)
    info_table.add_row("Python", sys.version.split()[0])
    info_table.add_row("Platform", sys.platform)
    
    # Check for installed components
    core_path = Path(__file__).parent
    info_table.add_row("Core Engine", f"[green]✓[/green] {core_path}")
    
    server_path = core_path.parent.parent / "server" / "index.js"
    if server_path.exists():
        info_table.add_row("API Server", "[green]✓[/green] server/index.js")
    else:
        info_table.add_row("API Server", "[red]✗[/red] Not found")
    
    console.print(info_table)


# ─────────────────────────────────────────────
# agentos init — Interactive Project Wizard
# ─────────────────────────────────────────────
@app.command()
def init(
    directory: str = typer.Argument(".", help="Directory to initialize the AgentOS project in."),
):
    """🚀 Initialize a new AgentOS workspace with an interactive wizard."""
    _print_banner()
    console.print("[bold yellow]⚡ Project Initialization Wizard[/bold yellow]\n")
    
    # Step 1: Project Name
    project_name = Prompt.ask(
        "[bold cyan]?[/bold cyan] What is your project name",
        default="my-agent-project"
    )
    
    # Step 2: Select a starter template
    console.print("\n[bold cyan]?[/bold cyan] Choose a starter template:\n")
    templates = [
        ("1", "Blank Canvas", "Empty workspace, build from scratch", "Free"),
        ("2", "Financial Analyst Mesh", "Multi-agent: Scraper + Analyst + Writer", "Free"),
        ("3", "Customer Support Automaton", "Single agent with Zendesk MCP", "$5.00"),
        ("4", "Code Review Specialist", "GitHub MCP for PR reviews", "Premium"),
    ]
    
    template_table = Table(box=box.SIMPLE_HEAVY, border_style="dim")
    template_table.add_column("#", style="cyan bold", width=3)
    template_table.add_column("Template", style="bold white")
    template_table.add_column("Description", style="dim")
    template_table.add_column("Price", style="green")
    for t in templates:
        template_table.add_row(*t)
    console.print(template_table)
    
    choice = Prompt.ask(
        "\n[bold cyan]?[/bold cyan] Enter template number",
        choices=["1", "2", "3", "4"],
        default="1"
    )
    selected = templates[int(choice) - 1]
    
    # Step 3: Select default model
    console.print("\n[bold cyan]?[/bold cyan] Choose default LLM model:\n")
    models = [
        ("1", "gemini/gemini-2.5-flash", "Fast & cheap", "$0.075/MTok"),
        ("2", "gemini/gemini-2.5-pro", "Most capable", "$3.50/MTok"),
        ("3", "gpt-4o", "OpenAI flagship", "$5.00/MTok"),
        ("4", "ollama/llama3", "Local / Free", "$0.00"),
    ]
    
    model_table = Table(box=box.SIMPLE_HEAVY, border_style="dim")
    model_table.add_column("#", style="cyan bold", width=3)
    model_table.add_column("Model", style="bold white")
    model_table.add_column("Description", style="dim")
    model_table.add_column("Pricing", style="green")
    for m in models:
        model_table.add_row(*m)
    console.print(model_table)
    
    model_choice = Prompt.ask(
        "\n[bold cyan]?[/bold cyan] Enter model number",
        choices=["1", "2", "3", "4"],
        default="1"
    )
    selected_model = models[int(model_choice) - 1]
    
    # Step 4: Budget
    budget = Prompt.ask(
        "\n[bold cyan]?[/bold cyan] Set a per-agent budget (USD)",
        default="1.00"
    )
    
    # Now scaffold the project
    console.print()
    target_dir = Path(directory).resolve()
    
    with Progress(
        SpinnerColumn(style="cyan"),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(bar_width=30, complete_style="cyan"),
        transient=True,
    ) as progress:
        task = progress.add_task("Scaffolding workspace...", total=5)
        
        # Create directory structure
        agentos_dir = target_dir / ".agentos"
        agentos_dir.mkdir(parents=True, exist_ok=True)
        progress.update(task, advance=1, description="Created .agentos/ directory")
        time.sleep(0.3)
        
        # Create agent.yaml config
        agent_config = {
            "project": project_name,
            "version": VERSION,
            "template": selected[1],
            "default_model": selected_model[1],
            "budget_usd": float(budget),
            "tenant_id": "default_tenant",
            "agents": [
                {
                    "name": f"{project_name}-agent",
                    "role": "General Assistant",
                    "goal": "Help the user accomplish their tasks.",
                    "model": selected_model[1],
                    "tools": [],
                }
            ]
        }
        
        config_path = agentos_dir / "agent.yaml"
        import yaml
        with open(config_path, "w") as f:
            yaml.dump(agent_config, f, default_flow_style=False, sort_keys=False)
        progress.update(task, advance=1, description="Generated agent.yaml")
        time.sleep(0.3)
        
        # Create .env template
        env_path = target_dir / ".env"
        if not env_path.exists():
            env_path.write_text(
                "# AgentOS Environment Variables\n"
                "GEMINI_API_KEY=your_key_here\n"
                "OPENAI_API_KEY=your_key_here\n"
            )
        progress.update(task, advance=1, description="Generated .env file")
        time.sleep(0.3)
        
        # Create audit and memory dirs
        (target_dir / ".agentos_audit").mkdir(exist_ok=True)
        (target_dir / ".agent_memory").mkdir(exist_ok=True)
        progress.update(task, advance=1, description="Created data directories")
        time.sleep(0.3)
        
        progress.update(task, advance=1, description="[bold green]Done![/bold green]")
        time.sleep(0.2)
    
    # Print success tree
    tree = Tree(f"📁 [bold cyan]{project_name}[/bold cyan]")
    tree.add("📁 .agentos/").add("📄 agent.yaml")
    tree.add("📁 .agentos_audit/")
    tree.add("📁 .agent_memory/")
    tree.add("📄 .env")
    
    console.print(Panel(
        tree,
        title="[bold green]✅ Project Initialized[/bold green]",
        border_style="green",
        padding=(1, 2),
    ))
    
    console.print(f"\n  [dim]Template:[/dim]  [bold]{selected[1]}[/bold]")
    console.print(f"  [dim]Model:[/dim]     [bold]{selected_model[1]}[/bold]")
    console.print(f"  [dim]Budget:[/dim]    [bold green]${budget}[/bold green]")
    console.print(f"\n  [dim]Next steps:[/dim]")
    console.print(f"    [cyan]$ agentos run {project_name}-agent --prompt \"Hello!\"[/cyan]")
    console.print(f"    [cyan]$ agentos serve[/cyan]\n")


# ─────────────────────────────────────────────
# agentos run — Visual Execution with Tracing
# ─────────────────────────────────────────────
@app.command()
def run(
    agent_name: str = typer.Argument(help="Name of the agent to execute."),
    prompt: str = typer.Option(..., "--prompt", "-p", help="The prompt to send to the agent."),
    model: str = typer.Option("ollama/glm-5.2", "--model", "-m", help="LLM model to use."),
    tenant: str = typer.Option("default_tenant", "--tenant", "-t", help="Tenant ID for isolation."),
    budget: float = typer.Option(1.0, "--budget", "-b", help="Max budget in USD."),
):
    """🏃 Execute an agent with beautiful visual tracing."""
    _print_banner()
    
    console.print(Panel(
        f"[bold]Agent:[/bold]  {agent_name}\n"
        f"[bold]Model:[/bold]  {model}\n"
        f"[bold]Tenant:[/bold] {tenant}\n"
        f"[bold]Budget:[/bold] ${budget:.2f}",
        title="[bold cyan]⚡ Execution Config[/bold cyan]",
        border_style="cyan",
    ))
    
    start_time = time.time()
    
    # Import and configure agent
    try:
        # Add project root to path
        project_root = Path(__file__).parent.parent.parent
        if str(project_root) not in sys.path:
            sys.path.insert(0, str(project_root))
        
        from core.agentos.agent import Agent
        
        with console.status("[bold cyan]Deploying agent...[/bold cyan]", spinner="dots"):
            agent = Agent(
                name=agent_name,
                tenant_id=tenant,
                model=model,
                budget=budget,
            )
            time.sleep(0.5)
        
        console.print("  [green]✓[/green] Agent deployed successfully\n")
        
        # Execute with visual feedback
        console.print(f"  [bold yellow]🧠 Thinking...[/bold yellow]")
        console.print(f"  [dim]Prompt: \"{prompt}\"[/dim]\n")
        
        with console.status("[bold cyan]Agent is reasoning...[/bold cyan]", spinner="dots12"):
            result = agent.execute(prompt)
        
        elapsed = time.time() - start_time
        
        # Format result beautifully
        console.print(Panel(
            Markdown(result) if len(result) > 50 else Text(result),
            title="[bold green]✅ Agent Response[/bold green]",
            border_style="green",
            padding=(1, 2),
        ))
        
        # Print cost receipt
        receipt = Table(title="💰 Execution Receipt", box=box.ROUNDED, border_style="yellow")
        receipt.add_column("Metric", style="bold")
        receipt.add_column("Value", style="green")
        receipt.add_row("Latency", f"{elapsed:.2f}s")
        receipt.add_row("Model", model)
        receipt.add_row("Total Cost", f"${agent.cost_engine.total_cost:.6f}")
        receipt.add_row("Budget Remaining", f"${budget - agent.cost_engine.total_cost:.6f}")
        console.print(receipt)
        
    except Exception as e:
        console.print(Panel(
            f"[bold red]Error:[/bold red] {str(e)}",
            title="[red]❌ Execution Failed[/red]",
            border_style="red",
        ))
        raise typer.Exit(code=1)


# ─────────────────────────────────────────────
# agentos logs — Pretty-Printed Audit Logs
# ─────────────────────────────────────────────
@app.command()
def logs(
    tenant: str = typer.Option("default_tenant", "--tenant", "-t", help="Tenant ID to read logs for."),
    lines: int = typer.Option(25, "--lines", "-n", help="Number of recent log entries to show."),
    follow: bool = typer.Option(False, "--follow", "-f", help="Continuously watch for new logs."),
):
    """📋 View immutable audit logs with color-coded formatting."""
    _print_banner()
    
    project_root = Path(__file__).parent.parent.parent
    audit_dir = project_root / ".agentos_audit"
    log_file = audit_dir / f"{tenant}.log"
    
    # Fallback: try to find any .log file
    if not log_file.exists():
        log_files = list(audit_dir.glob("*.log")) if audit_dir.exists() else []
        if log_files:
            log_file = log_files[0]
            tenant = log_file.stem
            console.print(f"  [dim]No logs for '{tenant}', using: {log_file.name}[/dim]\n")
        else:
            console.print(Panel(
                "[yellow]No audit logs found.[/yellow]\n\n"
                "Run an agent first to generate logs:\n"
                "  [cyan]$ agentos run my-agent -p \"Hello\"[/cyan]",
                title="[yellow]⚠ No Logs[/yellow]",
                border_style="yellow",
            ))
            raise typer.Exit()
    
    # Parse NDJSON
    entries = []
    with open(log_file, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    
    # Show the most recent N entries
    entries = entries[-lines:]
    
    # Color mapping
    actor_styles = {
        "User": ("bold green", "👤"),
        "Agent": ("bold cyan", "🤖"),
        "System": ("bold red", "⚙️"),
    }
    
    table = Table(
        title=f"🔒 Audit Logs — [cyan]{tenant}[/cyan] ({len(entries)} entries)",
        box=box.ROUNDED,
        border_style="cyan",
        show_lines=True,
    )
    table.add_column("Time", style="dim", width=20)
    table.add_column("Actor", width=10)
    table.add_column("Action", style="bold", width=20)
    table.add_column("Resource", style="white", width=18)
    table.add_column("Details", style="dim", max_width=40)
    
    for entry in entries:
        ts = entry.get("timestamp", "?")
        # Format timestamp nicely
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(ts)
            ts_formatted = dt.strftime("%Y-%m-%d %H:%M:%S")
        except:
            ts_formatted = ts[:19]
        
        actor = entry.get("actor", "Unknown")
        style, icon = actor_styles.get(actor, ("white", "❓"))
        actor_text = Text(f"{icon} {actor}", style=style)
        
        action = entry.get("action", "?")
        resource = entry.get("resource", "?")
        details = json.dumps(entry.get("details", {}), indent=None)
        if len(details) > 40:
            details = details[:37] + "..."
        
        table.add_row(ts_formatted, actor_text, action, resource, details)
    
    console.print(table)
    
    if follow:
        console.print("\n  [dim]Watching for new events... (Ctrl+C to stop)[/dim]")
        try:
            last_size = os.path.getsize(log_file)
            while True:
                time.sleep(1)
                new_size = os.path.getsize(log_file)
                if new_size > last_size:
                    with open(log_file, "r") as f:
                        f.seek(last_size)
                        for line in f:
                            line = line.strip()
                            if line:
                                try:
                                    entry = json.loads(line)
                                    actor = entry.get("actor", "?")
                                    style, icon = actor_styles.get(actor, ("white", "❓"))
                                    console.print(f"  {icon} [{style}]{actor}[/{style}] → [bold]{entry.get('action', '?')}[/bold] on [cyan]{entry.get('resource', '?')}[/cyan]")
                                except:
                                    pass
                    last_size = new_size
        except KeyboardInterrupt:
            console.print("\n  [dim]Stopped watching.[/dim]")


# ─────────────────────────────────────────────
# agentos top — Live TUI Dashboard (htop-style)
# ─────────────────────────────────────────────
@app.command()
def top(
    tenant: str = typer.Option("default_tenant", "--tenant", "-t", help="Tenant ID."),
):
    """📊 Live terminal dashboard — like htop for your AI agents."""
    project_root = Path(__file__).parent.parent.parent
    
    def _build_layout():
        layout = Layout()
        layout.split_column(
            Layout(name="header", size=5),
            Layout(name="body"),
            Layout(name="footer", size=3),
        )
        layout["body"].split_row(
            Layout(name="agents", ratio=1),
            Layout(name="logs", ratio=1),
        )
        return layout
    
    def _render_header():
        grid = Table.grid(expand=True)
        grid.add_column(justify="center", ratio=1)
        grid.add_row(
            "[bold cyan]🤖 AgentOS Top — Live System Monitor[/bold cyan]"
        )
        grid.add_row(
            f"[dim]Tenant: {tenant} • Press Ctrl+C to exit[/dim]"
        )
        return Panel(grid, style="cyan", padding=(0, 2))
    
    def _render_agents():
        table = Table(box=box.SIMPLE, expand=True, show_edge=False)
        table.add_column("Agent", style="bold cyan")
        table.add_column("Status", style="bold")
        table.add_column("Model")
        table.add_column("Cost", style="yellow")
        
        # Try to read cost data
        costs_dir = project_root / ".agentos_costs" / tenant
        if costs_dir.exists():
            for cost_file in costs_dir.glob("*.json"):
                try:
                    with open(cost_file) as f:
                        data = json.load(f)
                    name = cost_file.stem
                    total = data.get("total_cost", 0)
                    model = data.get("model", "unknown")
                    status = "[green]● idle[/green]"
                    table.add_row(name, status, model, f"${total:.4f}")
                except:
                    pass
        
        if table.row_count == 0:
            table.add_row("[dim]No agents found[/dim]", "", "", "")
        
        return Panel(table, title="[bold]🤖 Active Agents[/bold]", border_style="cyan")
    
    def _render_logs():
        table = Table(box=box.SIMPLE, expand=True, show_edge=False)
        table.add_column("Time", style="dim", width=10)
        table.add_column("Actor", width=8)
        table.add_column("Action", style="bold")
        table.add_column("Resource", style="dim")
        
        audit_dir = project_root / ".agentos_audit"
        log_file = audit_dir / f"{tenant}.log"
        
        if not log_file.exists():
            log_files = list(audit_dir.glob("*.log")) if audit_dir.exists() else []
            if log_files:
                log_file = log_files[0]
        
        entries = []
        if log_file.exists():
            with open(log_file) as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            entries.append(json.loads(line))
                        except:
                            pass
        
        actor_colors = {"User": "green", "Agent": "cyan", "System": "red"}
        for entry in entries[-8:]:
            ts = entry.get("timestamp", "?")
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(ts)
                ts_short = dt.strftime("%H:%M:%S")
            except:
                ts_short = ts[:8]
            
            actor = entry.get("actor", "?")
            color = actor_colors.get(actor, "white")
            table.add_row(ts_short, f"[{color}]{actor}[/{color}]", entry.get("action", "?"), entry.get("resource", "?"))
        
        if table.row_count == 0:
            table.add_row("[dim]No events[/dim]", "", "", "")
        
        return Panel(table, title="[bold]📋 Recent Audit Events[/bold]", border_style="yellow")
    
    def _render_footer():
        return Panel(
            Align.center(Text(f"AgentOS v{VERSION} • {time.strftime('%H:%M:%S')} • Ctrl+C to exit", style="dim")),
            style="dim",
        )
    
    try:
        with Live(refresh_per_second=1, screen=True) as live:
            while True:
                layout = _build_layout()
                layout["header"].update(_render_header())
                layout["agents"].update(_render_agents())
                layout["logs"].update(_render_logs())
                layout["footer"].update(_render_footer())
                live.update(layout)
                time.sleep(1)
    except KeyboardInterrupt:
        console.print("\n[dim]AgentOS Top exited.[/dim]")


# ─────────────────────────────────────────────
# agentos search — Marketplace Discovery
# ─────────────────────────────────────────────
@app.command()
def search(
    keyword: str = typer.Argument("", help="Search keyword for marketplace templates."),
):
    """🔍 Search the AgentOS Template Marketplace."""
    _print_banner()
    
    # Built-in template catalog (mirrors server/index.js data)
    catalog = [
        {
            "id": "tpl-fin-1",
            "title": "Financial Analyst Mesh",
            "description": "Multi-agent: Data Scraper + Quant Analyst + Report Writer",
            "category": "Finance",
            "author": "AgentOS Official",
            "rating": 4.9,
            "downloads": 12450,
            "price": "Free",
        },
        {
            "id": "tpl-sup-1",
            "title": "Customer Support Automaton",
            "description": "Empathetic L1 support agent with Zendesk MCP",
            "category": "Support",
            "author": "Community",
            "rating": 4.7,
            "downloads": 8320,
            "price": "$5.00",
        },
        {
            "id": "tpl-eng-1",
            "title": "Code Review Specialist",
            "description": "Static analysis and PR review via GitHub MCP",
            "category": "Engineering",
            "author": "AgentOS Official",
            "rating": 4.8,
            "downloads": 21000,
            "price": "Premium",
        },
    ]
    
    # Filter by keyword
    if keyword:
        keyword_lower = keyword.lower()
        results = [t for t in catalog if keyword_lower in t["title"].lower() or keyword_lower in t["category"].lower() or keyword_lower in t["description"].lower()]
    else:
        results = catalog
    
    if not results:
        console.print(Panel(
            f"[yellow]No templates found matching '[bold]{keyword}[/bold]'.[/yellow]",
            border_style="yellow",
        ))
        raise typer.Exit()
    
    table = Table(
        title=f"🛒 Marketplace Results ({len(results)} templates)",
        box=box.ROUNDED,
        border_style="cyan",
    )
    table.add_column("ID", style="dim")
    table.add_column("Template", style="bold white")
    table.add_column("Category", style="cyan")
    table.add_column("Author", style="dim")
    table.add_column("Rating", style="yellow")
    table.add_column("Downloads", style="green")
    table.add_column("Price", style="bold")
    
    for t in results:
        stars = "⭐" * int(t["rating"])
        dl = f"{t['downloads'] / 1000:.1f}k"
        price_style = "green" if t["price"] == "Free" else "yellow"
        table.add_row(
            t["id"],
            t["title"],
            t["category"],
            t["author"],
            f"{t['rating']} {stars}",
            dl,
            f"[{price_style}]{t['price']}[/{price_style}]",
        )
    
    console.print(table)
    console.print(f"\n  [dim]Install a template:[/dim] [cyan]$ agentos init --template <id>[/cyan]\n")


# ─────────────────────────────────────────────
# agentos serve — Dev Environment Launcher
# ─────────────────────────────────────────────
@app.command()
def serve():
    """🌐 Start the full AgentOS development environment (backend + frontend)."""
    _print_banner()
    
    project_root = Path(__file__).parent.parent.parent
    server_script = project_root / "server" / "index.js"
    
    if not server_script.exists():
        console.print(Panel(
            "[red]server/index.js not found.[/red]\n"
            "Make sure you're in an AgentOS project directory.",
            title="[red]❌ Error[/red]",
            border_style="red",
        ))
        raise typer.Exit(code=1)
    
    console.print("  [bold cyan]Starting services...[/bold cyan]\n")
    
    try:
        # Start backend
        console.print("  [green]✓[/green] Backend API  → [cyan]http://localhost:3001[/cyan]")
        backend = subprocess.Popen(
            ["node", str(server_script)],
            cwd=str(project_root),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        
        # Start frontend
        console.print("  [green]✓[/green] Frontend App → [cyan]http://localhost:5173[/cyan]")
        frontend = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=str(project_root),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        
        console.print(Panel(
            "[bold green]Both services are running![/bold green]\n\n"
            "  🌐 Dashboard:   [cyan]http://localhost:5173/dashboard[/cyan]\n"
            "  📡 API Server:  [cyan]http://localhost:3001[/cyan]\n\n"
            "  [dim]Press Ctrl+C to stop all services.[/dim]",
            title="[bold green]✅ AgentOS Dev Server[/bold green]",
            border_style="green",
            padding=(1, 2),
        ))
        
        # Wait for Ctrl+C
        backend.wait()
        
    except KeyboardInterrupt:
        console.print("\n  [yellow]Shutting down...[/yellow]")
        backend.terminate()
        frontend.terminate()
        console.print("  [green]✓[/green] All services stopped.\n")
    except Exception as e:
        console.print(f"  [red]Error: {e}[/red]")
        raise typer.Exit(code=1)


# ─────────────────────────────────────────────
# agentos status — Quick Health Check
# ─────────────────────────────────────────────
@app.command()
def status():
    """🩺 Quick health check of the AgentOS installation."""
    _print_banner()
    
    project_root = Path(__file__).parent.parent.parent
    
    checks = []
    
    # Check core engine
    try:
        from core.agentos.agent import Agent
        checks.append(("Core Engine", True, "Agent class importable"))
    except Exception as e:
        checks.append(("Core Engine", False, str(e)))
    
    # Check audit logs
    audit_dir = project_root / ".agentos_audit"
    if audit_dir.exists():
        log_count = len(list(audit_dir.glob("*.log")))
        checks.append(("Audit System", True, f"{log_count} log file(s)"))
    else:
        checks.append(("Audit System", False, "No .agentos_audit/ directory"))
    
    # Check prompt registry
    prompt_dir = project_root / ".agentos_prompts"
    if prompt_dir.exists():
        checks.append(("Prompt Registry", True, "Directory found"))
    else:
        checks.append(("Prompt Registry", False, "No .agentos_prompts/ directory"))
    
    # Check webhooks
    webhook_dir = project_root / ".agentos_webhooks"
    if webhook_dir.exists():
        checks.append(("Webhook System", True, "Directory found"))
    else:
        checks.append(("Webhook System", False, "Not configured"))
    
    # Check server
    server_path = project_root / "server" / "index.js"
    checks.append(("API Server", server_path.exists(), "server/index.js" if server_path.exists() else "Not found"))
    
    # Check .env
    env_path = project_root / ".env"
    checks.append((".env File", env_path.exists(), "Found" if env_path.exists() else "Not found"))
    
    table = Table(title="🩺 System Health Check", box=box.ROUNDED, border_style="cyan")
    table.add_column("Component", style="bold white")
    table.add_column("Status", width=10)
    table.add_column("Details", style="dim")
    
    for name, ok, detail in checks:
        status_text = "[green]✓ OK[/green]" if ok else "[red]✗ FAIL[/red]"
        table.add_row(name, status_text, detail)
    
    console.print(table)
    
    all_ok = all(ok for _, ok, _ in checks)
    if all_ok:
        console.print("\n  [bold green]All systems operational! 🚀[/bold green]\n")
    else:
        console.print("\n  [bold yellow]Some components need attention.[/bold yellow]\n")

# ─────────────────────────────────────────────
# agentos dag — Auto-Parallelization DAG Analysis
# ─────────────────────────────────────────────
@app.command()
def dag():
    """🔀 Analyze the current workflow DAG for auto-parallelization opportunities."""
    _print_banner()
    
    project_root = Path(__file__).parent.parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
    
    from core.agentos.dag_analyzer import DAGAnalyzer, DAGNode
    
    # Build a demo DAG representing a multi-agent workflow
    analyzer = DAGAnalyzer()
    
    nodes = [
        DAGNode("trigger-1", "trigger", "API Trigger", 0.1),
        DAGNode("agent-scraper", "agent", "Web Scraper", 2.0),
        DAGNode("agent-analyst", "agent", "Quant Analyst", 3.5),
        DAGNode("agent-writer", "agent", "Report Writer", 2.5),
        DAGNode("task-research", "task", "Research Task", 4.0),
        DAGNode("task-summarize", "task", "Summarize Task", 1.5),
        DAGNode("task-format", "task", "Format Output", 1.0),
    ]
    for n in nodes:
        analyzer.add_node(n)
    
    # Dependencies: trigger -> scraper & analyst (parallel), both -> research, research -> writer & summarize (parallel), both -> format
    analyzer.add_edge("trigger-1", "agent-scraper")
    analyzer.add_edge("trigger-1", "agent-analyst")
    analyzer.add_edge("agent-scraper", "task-research")
    analyzer.add_edge("agent-analyst", "task-research")
    analyzer.add_edge("task-research", "agent-writer")
    analyzer.add_edge("task-research", "task-summarize")
    analyzer.add_edge("agent-writer", "task-format")
    analyzer.add_edge("task-summarize", "task-format")
    
    with console.status("[bold cyan]Analyzing DAG...[/bold cyan]", spinner="dots"):
        report = analyzer.analyze()
        time.sleep(0.5)
    
    if report["status"] != "OK":
        console.print(Panel(f"[red]{report.get('error', 'Unknown error')}[/red]", title="[red]Error[/red]", border_style="red"))
        raise typer.Exit(1)
    
    sp = report["speedup"]
    cp = report["critical_path"]
    speed_color = "green" if sp["speedup_factor"] >= 2 else "yellow" if sp["speedup_factor"] >= 1.3 else "red"
    
    # Speedup hero
    console.print(Panel(
        f"[bold {speed_color}]{sp['speedup_factor']}x[/bold {speed_color}] Parallelization Speedup\n\n"
        f"  Sequential: [bold]{sp['sequential_time']}s[/bold]\n"
        f"  Parallel:   [bold {speed_color}]{sp['parallel_time']}s[/bold {speed_color}]\n"
        f"  Saved:      [bold green]{sp['time_saved']}s[/bold green]",
        title="[bold cyan]⚡ Auto-Parallelization Report[/bold cyan]",
        border_style="cyan",
        padding=(1, 2),
    ))
    
    # Execution Layers
    layers_table = Table(title="Execution Layers", box=box.ROUNDED, border_style="cyan")
    layers_table.add_column("Layer", style="bold cyan", width=7)
    layers_table.add_column("Mode", width=10)
    layers_table.add_column("Nodes", style="white")
    layers_table.add_column("Duration", style="yellow", justify="right")
    
    for layer in report["execution_layers"]:
        mode = "[green]∥ PARALLEL[/green]" if layer["can_parallelize"] else "[dim]→ SERIAL[/dim]"
        node_names = ", ".join(n["name"] for n in layer["nodes"])
        layers_table.add_row(f"L{layer['layer']}", mode, node_names, f"{layer['layer_duration']}s")
    
    console.print(layers_table)
    
    # Critical Path
    path_str = " → ".join(f"[bold red]{n}[/bold red]" for n in cp["path_names"])
    console.print(Panel(
        f"{path_str}\n\n  Total Duration: [bold]{cp['total_duration']}s[/bold]",
        title="[bold red]🔥 Critical Path[/bold red]",
        border_style="red",
    ))
    
    # Bottlenecks
    bn_table = Table(title="🚧 Top Bottlenecks", box=box.ROUNDED, border_style="yellow")
    bn_table.add_column("Node", style="bold white")
    bn_table.add_column("Type", style="cyan")
    bn_table.add_column("Downstream", justify="right")
    bn_table.add_column("Impact Score", style="bold", justify="right")
    
    for b in report["bottlenecks"]:
        impact_style = "red" if b["impact_score"] > 4 else "yellow" if b["impact_score"] > 2 else "green"
        bn_table.add_row(b["name"], b["type"], str(b["downstream_count"]), f"[{impact_style}]{b['impact_score']}[/{impact_style}]")
    
    console.print(bn_table)


# ─────────────────────────────────────────────
# Entry point (used by setup.py)
# ─────────────────────────────────────────────
def app_entry():
    app()


if __name__ == "__main__":
    app()
