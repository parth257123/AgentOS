"""
AgentOS — Auto-Parallelization DAG Analyzer
=============================================
Takes a workflow graph (nodes + edges) and automatically determines:
1. Which tasks can be run in PARALLEL (no dependencies between them).
2. Which tasks MUST be sequential (dependency chain).
3. The CRITICAL PATH (longest execution path).
4. Bottleneck nodes (nodes that block the most downstream work).
5. Optimal execution layers for maximum parallelism.

This replaces naive sequential execution with intelligent, dependency-aware
parallel scheduling — something no other agent framework does automatically.
"""

import asyncio
import time
import json
from typing import List, Dict, Any, Optional, Set, Tuple
from collections import defaultdict, deque


class DAGNode:
    """Represents a single node in the workflow DAG."""
    
    def __init__(self, node_id: str, node_type: str = "task", name: str = "", 
                 estimated_duration: float = 1.0, metadata: Dict[str, Any] = None):
        self.id = node_id
        self.type = node_type  # "trigger", "agent", "task"
        self.name = name or node_id
        self.estimated_duration = estimated_duration
        self.metadata = metadata or {}
        self.result = None
        self.status = "pending"  # pending, running, completed, failed
    
    def __repr__(self):
        return f"DAGNode({self.id}, type={self.type}, dur={self.estimated_duration}s)"


class DAGAnalyzer:
    """
    Analyzes a workflow DAG to extract parallelization opportunities,
    critical paths, and bottleneck nodes.
    """
    
    def __init__(self):
        self.nodes: Dict[str, DAGNode] = {}
        self.edges: List[Tuple[str, str]] = []
        self.adjacency: Dict[str, List[str]] = defaultdict(list)
        self.reverse_adj: Dict[str, List[str]] = defaultdict(list)
        self.in_degree: Dict[str, int] = defaultdict(int)
    
    def add_node(self, node: DAGNode):
        """Add a node to the DAG."""
        self.nodes[node.id] = node
        if node.id not in self.in_degree:
            self.in_degree[node.id] = 0
    
    def add_edge(self, source_id: str, target_id: str):
        """Add a directed edge (dependency) from source to target."""
        self.edges.append((source_id, target_id))
        self.adjacency[source_id].append(target_id)
        self.reverse_adj[target_id].append(source_id)
        self.in_degree[target_id] += 1
        # Ensure source has an in_degree entry
        if source_id not in self.in_degree:
            self.in_degree[source_id] = 0
    
    def from_react_flow(self, nodes_data: List[Dict], edges_data: List[Dict]):
        """
        Import a workflow from ReactFlow format (used by Studio Canvas).
        This is the bridge between the frontend and the analyzer.
        """
        # Parse duration estimates from node type
        type_durations = {"trigger": 0.1, "agent": 2.0, "task": 3.0}
        
        for node in nodes_data:
            n = DAGNode(
                node_id=node["id"],
                node_type=node.get("type", "task"),
                name=node.get("data", {}).get("name", node["id"]),
                estimated_duration=type_durations.get(node.get("type", "task"), 1.0),
                metadata=node.get("data", {}),
            )
            self.add_node(n)
        
        for edge in edges_data:
            self.add_edge(edge["source"], edge["target"])
        
        return self
    
    # ─────────────────────────────────────────
    # Core Algorithm: Cycle Detection
    # ─────────────────────────────────────────
    def detect_cycles(self) -> List[List[str]]:
        """Detect cycles using DFS coloring (WHITE/GRAY/BLACK)."""
        WHITE, GRAY, BLACK = 0, 1, 2
        color = {nid: WHITE for nid in self.nodes}
        cycles = []
        parent = {}
        
        def dfs(u, path):
            color[u] = GRAY
            path.append(u)
            for v in self.adjacency.get(u, []):
                if v not in color:
                    continue
                if color[v] == GRAY:
                    # Found a cycle — extract it
                    cycle_start = path.index(v)
                    cycles.append(path[cycle_start:] + [v])
                elif color[v] == WHITE:
                    parent[v] = u
                    dfs(v, path)
            path.pop()
            color[u] = BLACK
        
        for nid in self.nodes:
            if color[nid] == WHITE:
                dfs(nid, [])
        
        return cycles
    
    # ─────────────────────────────────────────
    # Core Algorithm: Topological Sort (Kahn's)
    # ─────────────────────────────────────────
    def topological_sort(self) -> List[str]:
        """Kahn's algorithm for topological ordering."""
        in_deg = dict(self.in_degree)
        queue = deque([nid for nid in self.nodes if in_deg.get(nid, 0) == 0])
        order = []
        
        while queue:
            node = queue.popleft()
            order.append(node)
            for neighbor in self.adjacency.get(node, []):
                in_deg[neighbor] -= 1
                if in_deg[neighbor] == 0:
                    queue.append(neighbor)
        
        if len(order) != len(self.nodes):
            raise ValueError("DAG contains a cycle! Cannot topologically sort.")
        
        return order
    
    # ─────────────────────────────────────────
    # Core Algorithm: Auto-Parallelization
    # ─────────────────────────────────────────
    def compute_execution_layers(self) -> List[List[str]]:
        """
        THE KEY ALGORITHM: Compute execution layers.
        
        Nodes in the same layer have NO dependencies on each other 
        and can be executed in parallel. Each layer must wait for 
        the previous layer to complete before starting.
        
        Returns a list of layers, where each layer is a list of node IDs 
        that can run concurrently.
        """
        in_deg = dict(self.in_degree)
        # Start with all nodes that have no incoming edges
        current_layer = [nid for nid in self.nodes if in_deg.get(nid, 0) == 0]
        layers = []
        
        while current_layer:
            layers.append(current_layer)
            next_layer = []
            for node in current_layer:
                for neighbor in self.adjacency.get(node, []):
                    in_deg[neighbor] -= 1
                    if in_deg[neighbor] == 0:
                        next_layer.append(neighbor)
            current_layer = next_layer
        
        return layers
    
    # ─────────────────────────────────────────
    # Core Algorithm: Critical Path Analysis
    # ─────────────────────────────────────────
    def critical_path(self) -> Dict[str, Any]:
        """
        Compute the critical path — the longest path through the DAG 
        by summing estimated durations. This determines the minimum 
        possible execution time even with infinite parallelism.
        """
        topo = self.topological_sort()
        
        # Longest path from any source to each node
        dist = {nid: 0.0 for nid in self.nodes}
        predecessor = {nid: None for nid in self.nodes}
        
        # Initialize source nodes with their own duration
        for nid in topo:
            if self.in_degree.get(nid, 0) == 0:
                dist[nid] = self.nodes[nid].estimated_duration
        
        for u in topo:
            for v in self.adjacency.get(u, []):
                new_dist = dist[u] + self.nodes[v].estimated_duration
                if new_dist > dist[v]:
                    dist[v] = new_dist
                    predecessor[v] = u
        
        # Find the endpoint with the maximum distance
        end_node = max(dist, key=dist.get)
        max_duration = dist[end_node]
        
        # Reconstruct the critical path
        path = []
        current = end_node
        while current is not None:
            path.append(current)
            current = predecessor[current]
        path.reverse()
        
        return {
            "path": path,
            "path_names": [self.nodes[nid].name for nid in path],
            "total_duration": round(max_duration, 2),
            "bottleneck_node": max(path, key=lambda nid: self.nodes[nid].estimated_duration),
        }
    
    # ─────────────────────────────────────────
    # Bottleneck Detection
    # ─────────────────────────────────────────
    def find_bottlenecks(self) -> List[Dict[str, Any]]:
        """
        Identify bottleneck nodes — nodes that block the most downstream work.
        Computed as the number of transitive descendants (reachable nodes).
        """
        bottlenecks = []
        
        for nid in self.nodes:
            # BFS to count all reachable downstream nodes
            visited = set()
            queue = deque(self.adjacency.get(nid, []))
            while queue:
                v = queue.popleft()
                if v not in visited:
                    visited.add(v)
                    queue.extend(self.adjacency.get(v, []))
            
            bottlenecks.append({
                "node_id": nid,
                "name": self.nodes[nid].name,
                "type": self.nodes[nid].type,
                "downstream_count": len(visited),
                "estimated_duration": self.nodes[nid].estimated_duration,
                "impact_score": round(len(visited) * self.nodes[nid].estimated_duration, 2),
            })
        
        # Sort by impact score descending
        bottlenecks.sort(key=lambda x: x["impact_score"], reverse=True)
        return bottlenecks
    
    # ─────────────────────────────────────────
    # Speedup Estimation
    # ─────────────────────────────────────────
    def estimate_speedup(self) -> Dict[str, Any]:
        """
        Compare sequential vs parallel execution time.
        Sequential = sum of ALL durations.
        Parallel = sum of max-duration per layer (critical path).
        """
        sequential_time = sum(n.estimated_duration for n in self.nodes.values())
        
        layers = self.compute_execution_layers()
        parallel_time = 0.0
        for layer in layers:
            # The layer takes as long as its slowest node
            layer_time = max(self.nodes[nid].estimated_duration for nid in layer)
            parallel_time += layer_time
        
        speedup = sequential_time / parallel_time if parallel_time > 0 else 1.0
        
        return {
            "sequential_time": round(sequential_time, 2),
            "parallel_time": round(parallel_time, 2),
            "speedup_factor": round(speedup, 2),
            "time_saved": round(sequential_time - parallel_time, 2),
            "efficiency": round((speedup / len(self.nodes)) * 100, 1) if len(self.nodes) > 0 else 0,
        }
    
    # ─────────────────────────────────────────
    # Full Analysis Report
    # ─────────────────────────────────────────
    def analyze(self) -> Dict[str, Any]:
        """
        Run the complete DAG analysis pipeline and return a comprehensive report.
        """
        cycles = self.detect_cycles()
        if cycles:
            return {
                "status": "ERROR",
                "error": "Cycle detected in workflow DAG",
                "cycles": cycles,
            }
        
        layers = self.compute_execution_layers()
        cp = self.critical_path()
        bottlenecks = self.find_bottlenecks()
        speedup = self.estimate_speedup()
        
        # Build layer details with node names
        layer_details = []
        for i, layer in enumerate(layers):
            layer_details.append({
                "layer": i,
                "parallelism": len(layer),
                "nodes": [{"id": nid, "name": self.nodes[nid].name, "type": self.nodes[nid].type} for nid in layer],
                "can_parallelize": len(layer) > 1,
                "layer_duration": round(max(self.nodes[nid].estimated_duration for nid in layer), 2),
            })
        
        return {
            "status": "OK",
            "summary": {
                "total_nodes": len(self.nodes),
                "total_edges": len(self.edges),
                "total_layers": len(layers),
                "max_parallelism": max(len(layer) for layer in layers) if layers else 0,
                "parallelizable_layers": sum(1 for l in layer_details if l["can_parallelize"]),
            },
            "execution_layers": layer_details,
            "critical_path": cp,
            "bottlenecks": bottlenecks[:5],  # Top 5 bottlenecks
            "speedup": speedup,
            "topological_order": self.topological_sort(),
        }


class ParallelDAGExecutor:
    """
    Executes a workflow DAG with automatic parallelization.
    Tasks within the same execution layer run concurrently via asyncio.
    """
    
    def __init__(self, analyzer: DAGAnalyzer, task_registry: Dict[str, Any] = None):
        self.analyzer = analyzer
        self.task_registry = task_registry or {}
        self.results: Dict[str, Any] = {}
        self.execution_log: List[Dict[str, Any]] = []
    
    async def _execute_node(self, node: DAGNode) -> Any:
        """Execute a single node (simulated or via task_registry)."""
        node.status = "running"
        start = time.time()
        
        self.execution_log.append({
            "event": "NODE_START",
            "node_id": node.id,
            "name": node.name,
            "timestamp": time.time(),
        })
        
        # If a real executor is registered, use it
        if node.id in self.task_registry:
            executor = self.task_registry[node.id]
            # Gather upstream results as context
            upstream_results = {
                parent: self.results.get(parent, "")
                for parent in self.analyzer.reverse_adj.get(node.id, [])
            }
            result = await asyncio.get_event_loop().run_in_executor(
                None, executor, upstream_results
            )
        else:
            # Simulate execution with estimated duration
            await asyncio.sleep(node.estimated_duration * 0.1)  # Scaled down for demo
            result = f"[Simulated] {node.name} completed"
        
        elapsed = time.time() - start
        node.status = "completed"
        node.result = result
        self.results[node.id] = result
        
        self.execution_log.append({
            "event": "NODE_COMPLETE",
            "node_id": node.id,
            "name": node.name,
            "duration": round(elapsed, 3),
            "timestamp": time.time(),
        })
        
        return result
    
    async def execute(self) -> Dict[str, Any]:
        """
        Execute the DAG with automatic parallelization.
        Tasks in the same layer run concurrently.
        """
        layers = self.analyzer.compute_execution_layers()
        total_start = time.time()
        
        for layer_idx, layer in enumerate(layers):
            layer_start = time.time()
            
            # Run all nodes in this layer concurrently
            tasks = [
                self._execute_node(self.analyzer.nodes[nid])
                for nid in layer
            ]
            await asyncio.gather(*tasks)
            
            layer_elapsed = time.time() - layer_start
            self.execution_log.append({
                "event": "LAYER_COMPLETE",
                "layer": layer_idx,
                "nodes": layer,
                "parallelism": len(layer),
                "duration": round(layer_elapsed, 3),
            })
        
        total_elapsed = time.time() - total_start
        
        return {
            "status": "completed",
            "total_duration": round(total_elapsed, 3),
            "results": self.results,
            "execution_log": self.execution_log,
        }
