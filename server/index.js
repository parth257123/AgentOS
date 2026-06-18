const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = require('./database');
const readline = require('readline');

// Middleware to mock a logged-in user and extract tenant ID
app.use((req, res, next) => {
  req.user = db.getUser('usr_123');
  req.tenantId = req.headers['x-tenant-id'] || 'default_tenant';
  next();
});

// Wallet Endpoint
app.get('/api/wallet', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ balance: req.user.walletBalance });
});

// In-memory database
let agents = [
  { id: 'agt-1', name: 'ResearchBot Alpha', owner: 'Alice Smith', status: 'idle', tasks: 142, uptime: '99.9%', tenant: 'tenant_A' },
  { id: 'agt-2', name: 'ReportGen-Beta', owner: 'Bob Jones', status: 'idle', tasks: 843, uptime: '99.5%', tenant: 'tenant_A' },
];

let metrics = {
  tasksCompleted24h: 1284,
  avgResponseTime: '1.2s',
  systemStatus: 'Optimal'
};

let projects = [
  { id: 'proj-1', name: 'Real Estate Comp', tag: 'LIVE V3', runs: 53, days: 7, nodes: [], edges: [], tenant: 'tenant_A' },
  { id: 'proj-2', name: 'Topic Research', tag: '', runs: 0, days: 9, nodes: [], edges: [], tenant: 'tenant_A' }
];

let marketplaceTemplates = [
  {
    id: 'tpl-fin-1',
    title: 'Financial Analyst Mesh',
    description: 'A multi-agent setup featuring a Data Scraper, Quant Analyst, and Report Writer.',
    category: 'Finance',
    author: 'AgentOS Official',
    rating: 4.9,
    downloads: 12450,
    price: 'Free',
    config: {
      role: 'Financial Analyst',
      goal: 'Analyze market trends and generate investment reports.',
      tools: ['WebScraper', 'DataSync']
    }
  },
  {
    id: 'tpl-sup-1',
    title: 'Customer Support Automaton',
    description: 'Empathetic single-agent integrated with Zendesk tools for automated L1 support.',
    category: 'Support',
    author: 'Community',
    rating: 4.7,
    downloads: 8320,
    price: '$5.00',
    config: {
      role: 'Support Specialist',
      goal: 'Resolve customer tickets quickly with high CSAT.',
      tools: ['ZendeskMCP']
    }
  },
  {
    id: 'tpl-eng-1',
    title: 'Code Review Specialist',
    description: 'Performs static analysis and PR reviews via GitHub MCP integration.',
    category: 'Engineering',
    author: 'AgentOS Official',
    rating: 4.8,
    downloads: 21000,
    price: 'Premium',
    config: {
      role: 'Staff Engineer',
      goal: 'Review PRs for security, performance, and best practices.',
      tools: ['GitHubMCP', 'Linter']
    }
  }
];

// --- API Endpoints ---

app.get('/api/projects', (req, res) => {
  const tenantProjects = projects.filter(p => p.tenant === req.tenantId);
  res.json({ projects: tenantProjects });
});

// --- Marketplace Endpoints ---
app.get('/api/marketplace/templates', (req, res) => {
  res.json({ templates: marketplaceTemplates });
});

app.post('/api/marketplace/install/:id', (req, res) => {
  const { id } = req.params;
  const template = marketplaceTemplates.find(t => t.id === id);
  
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  // Simulate installing the template by creating a new Agent in the user's workspace
  const newAgent = {
    id: `agt-${Date.now()}`,
    name: `${template.title} (Clone)`,
    owner: req.user ? req.user.name : 'System',
    status: 'idle',
    tasks: 0,
    uptime: '100%',
    config: template.config
  };
  
  agents.push(newAgent);
  
  // Simulate delay
  setTimeout(() => {
    res.status(201).json({ success: true, installedAgent: newAgent });
  }, 800);
});

// --- Audit Logs Endpoint ---
app.get('/api/audit/logs', async (req, res) => {
  const tenantId = req.tenantId;
  const auditDir = path.join(__dirname, '../.agentos_audit');
  let logFile = path.join(auditDir, `${tenantId}.log`);
  
  // Create an empty audit log if it doesn't exist
  if (!fs.existsSync(logFile)) {
    if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
    fs.writeFileSync(logFile, '');
  }
  if (!fs.existsSync(logFile)) {
      return res.json({ logs: [] });
  }

  const logs = [];
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        logs.push(JSON.parse(line));
      } catch (e) {
        console.error("Error parsing audit line:", e);
      }
    }
  }

  // Reverse to show newest first
  res.json({ logs: logs.reverse() });
});

// --- DAG Analysis Endpoint ---
app.post('/api/dag/analyze', (req, res) => {
  const { nodes, edges } = req.body;
  
  if (!nodes || !edges) {
    return res.status(400).json({ error: 'nodes and edges are required' });
  }

  // Build adjacency and in-degree maps
  const adjacency = {};
  const reverseAdj = {};
  const inDegree = {};
  const typeDurations = { trigger: 0.1, agent: 2.0, task: 3.0 };
  
  const nodeMap = {};
  nodes.forEach(n => {
    nodeMap[n.id] = {
      id: n.id,
      type: n.type || 'task',
      name: (n.data && n.data.name) || n.id,
      estimated_duration: typeDurations[n.type] || 1.0,
    };
    adjacency[n.id] = [];
    reverseAdj[n.id] = [];
    inDegree[n.id] = 0;
  });
  
  edges.forEach(e => {
    adjacency[e.source].push(e.target);
    reverseAdj[e.target].push(e.source);
    inDegree[e.target] = (inDegree[e.target] || 0) + 1;
  });

  // Kahn's Topological Sort
  const queue = Object.keys(nodeMap).filter(id => inDegree[id] === 0);
  const topoOrder = [];
  const inDegCopy = { ...inDegree };
  const q = [...queue];
  
  while (q.length > 0) {
    const node = q.shift();
    topoOrder.push(node);
    (adjacency[node] || []).forEach(neighbor => {
      inDegCopy[neighbor]--;
      if (inDegCopy[neighbor] === 0) q.push(neighbor);
    });
  }
  
  if (topoOrder.length !== nodes.length) {
    return res.json({ status: 'ERROR', error: 'Cycle detected in workflow DAG' });
  }

  // Compute Execution Layers (auto-parallelization)
  const inDegLayers = { ...inDegree };
  let currentLayer = Object.keys(nodeMap).filter(id => inDegLayers[id] === 0);
  const layers = [];
  
  while (currentLayer.length > 0) {
    layers.push(currentLayer);
    const nextLayer = [];
    currentLayer.forEach(node => {
      (adjacency[node] || []).forEach(neighbor => {
        inDegLayers[neighbor]--;
        if (inDegLayers[neighbor] === 0) nextLayer.push(neighbor);
      });
    });
    currentLayer = nextLayer;
  }

  // Critical Path (longest path by duration)
  const dist = {};
  const predecessor = {};
  Object.keys(nodeMap).forEach(id => { dist[id] = 0; predecessor[id] = null; });
  Object.keys(nodeMap).filter(id => inDegree[id] === 0).forEach(id => {
    dist[id] = nodeMap[id].estimated_duration;
  });
  
  topoOrder.forEach(u => {
    (adjacency[u] || []).forEach(v => {
      const newDist = dist[u] + nodeMap[v].estimated_duration;
      if (newDist > dist[v]) {
        dist[v] = newDist;
        predecessor[v] = u;
      }
    });
  });
  
  let endNode = topoOrder.length > 0 ? topoOrder[0] : null;
  topoOrder.forEach(id => { if (dist[id] > (endNode ? dist[endNode] : -1)) endNode = id; });
  
  const critPath = [];
  let cur = endNode;
  while (cur !== null && cur !== undefined) { 
    critPath.unshift(cur); 
    cur = predecessor[cur]; 
  }

  // Bottleneck Detection (transitive downstream count)
  const bottlenecks = Object.keys(nodeMap).map(nid => {
    const visited = new Set();
    const bfsQ = [...(adjacency[nid] || [])];
    while (bfsQ.length > 0) {
      const v = bfsQ.shift();
      if (!visited.has(v)) { visited.add(v); bfsQ.push(...(adjacency[v] || [])); }
    }
    return {
      node_id: nid, name: nodeMap[nid].name, type: nodeMap[nid].type,
      downstream_count: visited.size,
      estimated_duration: nodeMap[nid].estimated_duration,
      impact_score: +(visited.size * nodeMap[nid].estimated_duration).toFixed(2),
    };
  }).sort((a, b) => b.impact_score - a.impact_score);

  // Speedup Estimation
  const seqTime = Object.values(nodeMap).reduce((s, n) => s + n.estimated_duration, 0);
  const parTime = layers.reduce((s, layer) => s + Math.max(...layer.map(id => nodeMap[id].estimated_duration)), 0);
  const speedup = parTime > 0 ? +(seqTime / parTime).toFixed(2) : 1;

  // Build layer details
  const layerDetails = layers.map((layer, i) => ({
    layer: i,
    parallelism: layer.length,
    nodes: layer.map(id => ({ id, name: nodeMap[id].name, type: nodeMap[id].type })),
    can_parallelize: layer.length > 1,
    layer_duration: +Math.max(...layer.map(id => nodeMap[id].estimated_duration)).toFixed(2),
  }));

  res.json({
    status: 'OK',
    summary: {
      total_nodes: nodes.length,
      total_edges: edges.length,
      total_layers: layers.length,
      max_parallelism: layers.length > 0 ? Math.max(...layers.map(l => l.length)) : 0,
      parallelizable_layers: layerDetails.filter(l => l.can_parallelize).length,
    },
    execution_layers: layerDetails,
    critical_path: {
      path: critPath,
      path_names: critPath.map(id => nodeMap[id].name),
      total_duration: endNode && dist[endNode] !== undefined ? +dist[endNode].toFixed(2) : 0,
      bottleneck_node: critPath.length > 0 ? critPath.reduce((a, b) => nodeMap[a].estimated_duration >= nodeMap[b].estimated_duration ? a : b) : null,
    },
    bottlenecks: bottlenecks.slice(0, 5),
    speedup: {
      sequential_time: +seqTime.toFixed(2),
      parallel_time: +parTime.toFixed(2),
      speedup_factor: speedup,
      time_saved: +(seqTime - parTime).toFixed(2),
    },
    topological_order: topoOrder,
  });
});

app.post('/api/projects', (req, res) => {
  const { id, name, nodes, edges } = req.body;
  const existingIndex = projects.findIndex(p => p.id === id);
  
  if (existingIndex >= 0) {
    projects[existingIndex] = { ...projects[existingIndex], name, nodes, edges, days: 0 };
    dispatchWebhook(req.tenantId, 'project_saved', { project_id: id, name });
    res.json(projects[existingIndex]);
  } else {
    const newProject = {
      id: `proj-${Date.now()}`,
      name: name || 'Untitled Project',
      tag: '',
      runs: 0,
      days: 0,
      nodes: nodes || [],
      edges: edges || [],
      tenant: req.tenantId
    };
    projects.push(newProject);
    dispatchWebhook(req.tenantId, 'project_saved', { project_id: newProject.id, name: newProject.name });
    res.status(201).json(newProject);
  }
});

app.get('/api/agents', (req, res) => {
  const tenantAgents = agents.filter(a => a.tenant === req.tenantId);
  res.json({ agents: tenantAgents });
});

app.post('/api/agents', (req, res) => {
  const { name, role, goal, backstory, model, tools } = req.body;
  const newAgent = {
    id: `agt-${Date.now()}`,
    name: name || 'Unnamed Agent',
    role: role || '',
    goal: goal || '',
    backstory: backstory || '',
    model: model || 'openai/glm5.2',
    tools: tools || [],
    owner: req.user ? req.user.name : 'System',
    status: 'idle',
    tasks: 0,
    uptime: '100%',
    tenant: req.tenantId
  };
  agents.push(newAgent);
  dispatchWebhook(req.tenantId, 'agent_created', { agent_id: newAgent.id, name: newAgent.name });
  res.status(201).json(newAgent);
});

app.delete('/api/agents/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = agents.length;
  agents = agents.filter(a => !(a.id === id && a.tenant === req.tenantId));
  if (agents.length < initialLength) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

app.put('/api/agents/:id/toggle', (req, res) => {
  const { id } = req.params;
  const agent = agents.find(a => a.id === id && a.tenant === req.tenantId);
  agents = agents.map(a => {
    if (a.id === id && a.tenant === req.tenantId) {
      return { ...a, status: a.status === 'active' ? 'idle' : 'active' };
    }
    return a;
  });
  res.json({ success: true });
});

// Trigger Python Flow
app.post('/api/flows/run', (req, res) => {
  const corePath = path.resolve(__dirname, '../core');
  
  // Spawn the python process
  const pythonProcess = spawn('python', ['example_flow.py'], { cwd: corePath });

  let outputData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: 'Flow execution failed', details: errorData });
    }
    
    // Parse JSON block
    let parsedTraces = [];
    try {
      const match = outputData.match(/===JSON_START===([\s\S]*?)===JSON_END===/);
      if (match && match[1]) {
        parsedTraces = JSON.parse(match[1].trim());
      }
    } catch (err) {
      console.error("Failed to parse traces", err);
    }
    
    // Increment tasks for fun
    agents = agents.map(a => ({ ...a, tasks: a.tasks + 1 }));
    metrics.tasksCompleted24h += 2;

    const cleanLogs = outputData.replace(/===JSON_START===[\s\S]*?===JSON_END===/g, '').trim();
    res.json({ success: true, logs: cleanLogs, traces: parsedTraces });
  });
});

// Trigger Discovery Engine
app.post('/api/discovery', (req, res) => {
  const { prompt } = req.body;
  const corePath = path.resolve(__dirname, '../core');
  
  const pythonProcess = spawn('python', ['discovery_engine.py', prompt || ''], { cwd: corePath });

  let outputData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Discovery Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    try {
      const results = JSON.parse(outputData);
      res.json({ success: true, results });
    } catch (err) {
      console.error("Failed to parse discovery output:", err, outputData);
      res.status(500).json({ error: 'Failed to generate use cases' });
    }
  });
});

// Python Integration for True Generation
app.post('/api/blueprint/generate', (req, res) => {
  const { prompt, nodes, edges } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const corePath = path.resolve(__dirname, '../core/agentos');
  const pythonProcess = spawn('python', ['blueprint_generator.py'], { cwd: corePath });

  const inputConfig = {
    prompt,
    current_graph: { nodes: nodes || [], edges: edges || [] },
    tenant_id: req.tenantId
  };

  pythonProcess.stdin.write(JSON.stringify(inputConfig));
  pythonProcess.stdin.end();

  let outputData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Blueprint Gen Error: ${errorData}`);
      return res.status(500).json({ error: errorData.trim() || 'Generation failed with non-zero exit code' });
    }
    
    try {
      const parts = outputData.split('===JSON_START===\n');
      if (parts.length < 2) throw new Error('Invalid output format. Output was: ' + outputData);
      const jsonStr = parts[1].split('\n===JSON_END===')[0];
      const blueprint = JSON.parse(jsonStr);
      res.json(blueprint);
    } catch (err) {
      console.error('Parse Error:', err.message);
      res.status(500).json({ error: `Failed to parse generated blueprint: ${err.message}` });
    }
  });
});

// Code Compiler Exporter
app.post('/api/blueprint/export', (req, res) => {
  const config = { ...req.body, tenant_id: req.tenantId };
  const corePath = path.resolve(__dirname, '../core');
  
  const pythonProcess = spawn('python', ['compiler.py'], { cwd: corePath });

  pythonProcess.stdin.write(JSON.stringify(config));
  pythonProcess.stdin.end();

  let outputData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Compiler Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0 && !outputData) {
      return res.status(500).json({ error: 'Compiler execution failed' });
    }
    try {
      const results = JSON.parse(outputData);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: 'Failed to parse compiler output', raw: outputData });
    }
  });
});

// Trigger Custom Universal Flow
app.post('/api/flows/custom', (req, res) => {
  const config = req.body;
  const corePath = path.resolve(__dirname, '../core');
  
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const pythonProcess = spawn('python', ['-u', 'universal_flow.py'], { cwd: corePath });

  // Pass config to python via stdin
  pythonProcess.stdin.write(JSON.stringify(config));
  pythonProcess.stdin.end();

  let outputData = '';
  let errorData = '';
  let buffer = '';

  pythonProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep partial line
    
    for (const line of lines) {
      if (line.startsWith('===STREAM_EVENT===')) {
        try {
          const eventJson = JSON.parse(line.substring('===STREAM_EVENT==='.length));
          res.write(JSON.stringify({ type: 'trace', data: eventJson }) + '\n');
        } catch (e) {
          console.error("Failed to parse streamed event JSON:", e, line);
        }
      } else {
        outputData += line + '\n';
      }
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
    console.error(`Universal Flow Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    // Process final buffer line
    if (buffer) {
      if (buffer.startsWith('===STREAM_EVENT===')) {
        try {
          const eventJson = JSON.parse(buffer.substring('===STREAM_EVENT==='.length));
          res.write(JSON.stringify({ type: 'trace', data: eventJson }) + '\n');
        } catch (e) {}
      } else {
        outputData += buffer + '\n';
      }
    }

    if (code !== 0) {
      res.write(JSON.stringify({ type: 'error', error: 'Flow execution failed', details: errorData }) + '\n');
      res.end();
      return;
    }
    
    // Parse JSON block
    let parsedTraces = [];
    let totalCostUsd = 0;
    try {
      const match = outputData.match(/===JSON_START===([\s\S]*?)===JSON_END===/);
      if (match && match[1]) {
        parsedTraces = JSON.parse(match[1].trim());
        
        // Calculate total cost of this workflow
        parsedTraces.forEach(trace => {
          if (trace.cost_usd) totalCostUsd += trace.cost_usd;
        });
        
        // Deduct from wallet!
        if (req.user && totalCostUsd > 0) {
          const success = db.deductCredits(req.user.id, totalCostUsd);
          if (!success) {
            console.error("User hit $0.00 wallet limit!");
          }
        }
      }
    } catch (err) {
      console.error("Failed to parse universal traces", err);
    }

    const cleanLogs = outputData.replace(/===JSON_START===[\s\S]*?===JSON_END===/g, '').trim();
    res.write(JSON.stringify({ success: true, type: 'final', logs: cleanLogs, traces: parsedTraces, walletBalance: req.user ? req.user.walletBalance : null }) + '\n');
    res.end();
  });
});
// Prompts API
app.get('/api/prompts', (req, res) => {
  const promptsDir = path.join(__dirname, '../.agentos_prompts');
  if (!fs.existsSync(promptsDir)) {
    return res.json([]);
  }
  const prompts = [];
  const files = fs.readdirSync(promptsDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const data = JSON.parse(fs.readFileSync(path.join(promptsDir, file)));
      prompts.push({
        name: data.name,
        latest_version: data.latest_version,
        versions: data.versions || []
      });
    }
  }
  res.json(prompts);
});

app.post('/api/prompts', express.json(), (req, res) => {
  const { name, role, goal, backstory } = req.body;
  const promptsDir = path.join(__dirname, '../.agentos_prompts');
  if (!fs.existsSync(promptsDir)) fs.mkdirSync(promptsDir);
  
  const filePath = path.join(promptsDir, `${name}.json`);
  let data = { name, versions: [] };
  
  if (fs.existsSync(filePath)) {
    try {
      data = JSON.parse(fs.readFileSync(filePath));
    } catch(e) {}
  }
  
  const versionNum = (data.versions ? data.versions.length : 0) + 1;
  const versionTag = `v${versionNum}`;
  
  const newVersion = {
    version: versionTag,
    role,
    goal,
    backstory,
    updated_at: Date.now() / 1000
  };
  
  if (!data.versions) data.versions = [];
  data.versions.push(newVersion);
  data.latest_version = versionTag;
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
  res.json({ success: true, version: versionTag });
});

// Mock Analytics for Cost Dashboard
app.get('/api/analytics/cost', (req, res) => {
  const analytics = {
    totalSavings30d: 452.80,
    smartRoutingImpact: '34% Cost Reduction',
    tokenUsage: [
      { day: 'Mon', input: 1.2, output: 0.8 },
      { day: 'Tue', input: 1.5, output: 1.1 },
      { day: 'Wed', input: 0.9, output: 0.5 },
      { day: 'Thu', input: 2.1, output: 1.4 },
      { day: 'Fri', input: 1.8, output: 0.9 },
      { day: 'Sat', input: 0.5, output: 0.3 },
      { day: 'Sun', input: 0.7, output: 0.4 }
    ],
    agentCosts: [
      { name: 'ResearchBot Alpha', cost: 12.50, runs: 142 },
      { name: 'ReportGen-Beta', cost: 45.20, runs: 843 },
      { name: 'DataScraper-X', cost: 8.90, runs: 56 }
    ]
  };
  res.json(analytics);
});

// Mock Analytics for Agent Performance Dashboard
app.get('/api/analytics/performance', (req, res) => {
  const performance = {
    kpis: {
      avgLatency: '1.42s',
      latencyTrend: '-0.2s',
      successRate: '98.5%',
      successTrend: '+1.2%',
      loopMitigations: 142
    },
    abTests: [
      {
        experimentName: 'Sales Persona V1 vs V2',
        variants: [
          { name: 'v1 (Friendly)', successRate: 88.5, avgLatency: 1.85, avgCost: 0.0012, executions: 1240 },
          { name: 'v2 (Aggressive)', successRate: 94.2, avgLatency: 1.55, avgCost: 0.0009, executions: 1285, isWinner: true }
        ]
      },
      {
        experimentName: 'JSON Output Fix vs Legacy',
        variants: [
          { name: 'Legacy', successRate: 76.0, avgLatency: 3.12, avgCost: 0.0045, executions: 850 },
          { name: 'Auto-Repair', successRate: 99.1, avgLatency: 1.20, avgCost: 0.0015, executions: 920, isWinner: true }
        ]
      }
    ],
    liveTelemetry: [
      { id: 'tx-991', agent: 'SalesAgent', status: 'Success', latency: '1.2s', time: 'Just now' },
      { id: 'tx-990', agent: 'ResearchBot', status: 'Recovered', latency: '2.4s', time: '1m ago' },
      { id: 'tx-989', agent: 'DataSync', status: 'Success', latency: '0.8s', time: '3m ago' },
      { id: 'tx-988', agent: 'SalesAgent', status: 'Success', latency: '1.1s', time: '5m ago' },
      { id: 'tx-987', agent: 'ReportGen', status: 'Failed (Loop)', latency: '5.5s', time: '12m ago' }
    ]
  };
  res.json(performance);
});

// --- Node.js Event Dispatcher ---
const dispatchWebhook = async (tenantId, eventType, payload) => {
  const webhookFile = path.join(__dirname, `../.agentos_webhooks/${tenantId}.json`);
  if (!fs.existsSync(webhookFile)) return;
  try {
    const data = JSON.parse(fs.readFileSync(webhookFile));
    const urls = new Set([
      ...(data[eventType] || []),
      ...(data['*'] || [])
    ]);
    
    const body = JSON.stringify({ event_type: eventType, tenant_id: tenantId, ...payload });
    urls.forEach(url => {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
        .catch(err => console.error(`[Node Dispatcher] Failed to deliver webhook to ${url}:`, err));
    });
  } catch (e) {
    console.error("Error reading webhook file:", e);
  }
};

// --- Webhooks Management Endpoints ---
app.get('/api/webhooks', (req, res) => {
  const tenantId = req.tenantId;
  const webhookDir = path.join(__dirname, '../.agentos_webhooks');
  const logFile = path.join(webhookDir, `${tenantId}.json`);
  if (!fs.existsSync(logFile)) return res.json({ subscriptions: {} });
  try {
    const data = JSON.parse(fs.readFileSync(logFile));
    res.json({ subscriptions: data });
  } catch (e) {
    res.json({ subscriptions: {} });
  }
});

app.post('/api/webhooks', (req, res) => {
  const tenantId = req.tenantId;
  const { event_type, url } = req.body;
  const webhookDir = path.join(__dirname, '../.agentos_webhooks');
  if (!fs.existsSync(webhookDir)) fs.mkdirSync(webhookDir, { recursive: true });
  
  const logFile = path.join(webhookDir, `${tenantId}.json`);
  let data = {};
  if (fs.existsSync(logFile)) {
    try { data = JSON.parse(fs.readFileSync(logFile)); } catch (e) {}
  }
  
  if (!data[event_type]) data[event_type] = [];
  if (!data[event_type].includes(url)) data[event_type].push(url);
  
  fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
  res.json({ success: true, subscriptions: data });
});

app.delete('/api/webhooks', (req, res) => {
  const tenantId = req.tenantId;
  const { event_type, url } = req.body;
  const logFile = path.join(__dirname, `../.agentos_webhooks/${tenantId}.json`);
  
  if (!fs.existsSync(logFile)) return res.json({ success: true });
  try {
    let data = JSON.parse(fs.readFileSync(logFile));
    if (data[event_type]) {
      data[event_type] = data[event_type].filter(u => u !== url);
      if (data[event_type].length === 0) delete data[event_type];
      fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
    }
    res.json({ success: true, subscriptions: data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update webhooks' });
  }
});

app.listen(PORT, () => {
  console.log(`AgentOS Server running on http://localhost:${PORT}`);
});
