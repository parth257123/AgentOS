const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = require('./database');

// Middleware to mock a logged-in user
app.use((req, res, next) => {
  req.user = db.getUser('usr_123');
  next();
});

// Wallet Endpoint
app.get('/api/wallet', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ balance: req.user.walletBalance });
});

// In-memory database
let agents = [
  { id: 'agt-1', name: 'ResearchBot Alpha', owner: 'Alice Smith', status: 'idle', tasks: 142, uptime: '99.9%' },
  { id: 'agt-2', name: 'ReportGen-Beta', owner: 'Bob Jones', status: 'idle', tasks: 843, uptime: '99.5%' },
];

let metrics = {
  tasksCompleted24h: 1284,
  avgResponseTime: '1.2s',
  systemStatus: 'Optimal'
};

let projects = [
  { id: 'proj-1', name: 'Real Estate Comp', tag: 'LIVE V3', runs: 53, days: 7, nodes: [], edges: [] },
  { id: 'proj-2', name: 'Topic Research', tag: '', runs: 0, days: 9, nodes: [], edges: [] }
];

// --- API Endpoints ---

app.get('/api/projects', (req, res) => {
  res.json({ projects });
});

app.post('/api/projects', (req, res) => {
  const { id, name, nodes, edges } = req.body;
  const existingIndex = projects.findIndex(p => p.id === id);
  
  if (existingIndex >= 0) {
    projects[existingIndex] = { ...projects[existingIndex], name, nodes, edges, days: 0 };
    res.json(projects[existingIndex]);
  } else {
    const newProject = {
      id: `proj-${Date.now()}`,
      name: name || 'Untitled Project',
      tag: '',
      runs: 0,
      days: 0,
      nodes: nodes || [],
      edges: edges || []
    };
    projects.push(newProject);
    res.status(201).json(newProject);
  }
});

app.get('/api/agents', (req, res) => {
  const activeCount = agents.filter(a => a.status === 'active').length;
  const status = activeCount > 0 ? 'Optimal' : agents.length === 0 ? 'No Agents' : 'Idle';
  res.json({ agents, metrics: { ...metrics, totalActive: activeCount, systemStatus: status } });
});

app.post('/api/agents', (req, res) => {
  const newAgent = {
    ...req.body,
    id: `agt-${Date.now()}`,
    status: 'idle',
    tasks: 0,
    uptime: '100%'
  };
  agents.push(newAgent);
  res.status(201).json(newAgent);
});

app.delete('/api/agents/:id', (req, res) => {
  const { id } = req.params;
  agents = agents.filter(a => a.id !== id);
  res.json({ success: true });
});

app.put('/api/agents/:id/toggle', (req, res) => {
  const { id } = req.params;
  agents = agents.map(a => {
    if (a.id === id) {
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
      const match = outputData.match(/===JSON_START===\n([\s\S]*?)\n===JSON_END===/);
      if (match && match[1]) {
        parsedTraces = JSON.parse(match[1]);
      }
    } catch (err) {
      console.error("Failed to parse traces", err);
    }
    
    // Increment tasks for fun
    agents = agents.map(a => ({ ...a, tasks: a.tasks + 1 }));
    metrics.tasksCompleted24h += 2;

    res.json({ success: true, logs: outputData, traces: parsedTraces });
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
    current_graph: { nodes: nodes || [], edges: edges || [] }
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
  const config = req.body;
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
  
  const pythonProcess = spawn('python', ['universal_flow.py'], { cwd: corePath });

  // Pass config to python via stdin
  pythonProcess.stdin.write(JSON.stringify(config));
  pythonProcess.stdin.end();

  let outputData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
    console.error(`Universal Flow Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: 'Flow execution failed', details: errorData });
    }
    
    // Parse JSON block
    let parsedTraces = [];
    let totalCostUsd = 0;
    try {
      const match = outputData.match(/===JSON_START===\n([\s\S]*?)\n===JSON_END===/);
      if (match && match[1]) {
        parsedTraces = JSON.parse(match[1]);
        
        // Calculate total cost of this workflow
        parsedTraces.forEach(trace => {
          if (trace.cost_usd) totalCostUsd += trace.cost_usd;
        });
        
        // Deduct from wallet!
        if (req.user && totalCostUsd > 0) {
          const success = db.deductCredits(req.user.id, totalCostUsd);
          if (!success) {
            console.error("User hit $0.00 wallet limit!");
            // In a real app we would halt the flow, but since we deduce after, we just log it
          }
        }
      }
    } catch (err) {
      console.error("Failed to parse universal traces", err);
    }

    res.json({ success: true, logs: outputData, traces: parsedTraces, walletBalance: req.user ? req.user.walletBalance : null });
  });
});

app.listen(PORT, () => {
  console.log(`AgentOS Server running on http://localhost:${PORT}`);
});
