import React, { useState, useCallback, useEffect } from 'react';
import { marked } from 'marked';
import dagre from 'dagre';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Plus, BookTemplate, Save, Sparkles, Search, Mic, ArrowRight, Activity, Clock, BarChart2, X, ChevronDown, ChevronRight, Cpu, Wrench, Download, PanelLeftClose, PanelLeftOpen, Sun, Moon, GitBranch } from 'lucide-react';
import { AgentNode, TaskNode, TriggerNode } from '../components/CustomNodes';
import { useAgents } from '../context/AgentContext';
import { useTenant } from '../context/TenantContext';

const nodeTypes = {
  agent: AgentNode,
  task: TaskNode,
  trigger: TriggerNode,
};

const initialNodes = [
  { id: 'trigger-1', type: 'trigger', position: { x: 50, y: 150 }, data: { theme: 'dark' } },
  { id: 'agent-1', type: 'agent', position: { x: 300, y: 100 }, data: { name: 'Researcher', role: 'Data Analyst', goal: 'Find trends', backstory: '10 years exp', allowDelegation: false, verbose: true, memory: true, tools: ['web_search'], theme: 'dark' } },
  { id: 'task-1', type: 'task', position: { x: 650, y: 100 }, data: { name: 'Task', description: 'Research AI trends in 2026', expectedOutput: 'Bullet list', asyncExecution: false, outputFile: '', theme: 'dark' } },
];

const initialEdges = [
  { id: 'e-t1-a1', source: 'trigger-1', target: 'agent-1', animated: true, style: { stroke: '#a855f7' } },
  { id: 'e1-2', source: 'agent-1', target: 'task-1', animated: true, style: { stroke: 'var(--accent-primary)' } }
];

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 300, height: 200 }); // Estimate node size
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 300 / 2,
        y: nodeWithPosition.y - 200 / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

export default function Studio() {
  const { tenantId } = useTenant();
  const { runCustomFlow, flowTraces, flowLogs, projects, saveProject, nodeStates } = useAgents();
  const [viewMode, setViewMode] = useState('home'); 
  const [projectId, setProjectId] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [processType, setProcessType] = useState('sequential');

  // Auto-layout when processType changes
  useEffect(() => {
    if (nodes.length > 0) {
      const direction = processType === 'hierarchical' ? 'TB' : 'LR';
      const layouted = getLayoutedElements(nodes, edges, direction);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    }
  }, [processType]); // Only trigger when processType changes
  const [nlPrompt, setNlPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [generationThoughts, setGenerationThoughts] = useState([]);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportedCode, setExportedCode] = useState(null);
  const [activeExportTab, setActiveExportTab] = useState('crew.py');
  const [projectTitle, setProjectTitle] = useState('Untitled Project');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFlightRecorderOpen, setIsFlightRecorderOpen] = useState(false);
  const [smartRouting, setSmartRouting] = useState(false);
  const [dagAnalysis, setDagAnalysis] = useState(null);
  const [isDagModalOpen, setIsDagModalOpen] = useState(false);

  const [walletBalance, setWalletBalance] = useState(null);

  React.useEffect(() => {
    // When nodeStates updates, we look through all active node IDs
    const activeNodes = Object.entries(nodeStates || {})
      .filter(([_, status]) => status === 'running')
      .map(([id]) => id);

    setEdges(eds => eds.map(edge => {
      const isSourceActive = activeNodes.includes(edge.source);
      const isTargetActive = activeNodes.includes(edge.target);
      const isActive = isSourceActive || isTargetActive;
      
      if (isActive) {
        const activeNodeId = isSourceActive ? edge.source : edge.target;
        let strokeColor = 'var(--accent-primary)';
        if (activeNodeId.includes('agent')) {
          strokeColor = '#818cf8';
        } else if (activeNodeId.includes('task')) {
          strokeColor = '#10b981';
        } else if (activeNodeId.includes('trigger')) {
          strokeColor = '#a855f7';
        }

        return {
          ...edge,
          animated: true,
          style: {
            ...edge.style,
            stroke: strokeColor,
            strokeWidth: 3,
            filter: `drop-shadow(0 0 6px ${strokeColor})`,
            transition: 'all 0.3s ease'
          }
        };
      } else {
        return {
          ...edge,
          animated: false,
          style: {
            ...edge.style,
            stroke: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.15)',
            strokeWidth: 1.5,
            filter: 'none',
            transition: 'all 0.3s ease'
          }
        };
      }
    }));
  }, [nodeStates, isDarkMode, setEdges]);

  React.useEffect(() => {
    fetch('http://localhost:3001/api/wallet', { headers: { 'X-Tenant-Id': tenantId } })
      .then(res => res.json())
      .then(data => setWalletBalance(data.balance))
      .catch(err => console.error("Failed to fetch wallet:", err));
  }, [tenantId]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, theme: newTheme ? 'dark' : 'light' }
    })));
  };

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'var(--accent-primary)' } }, eds)), [setEdges]);

  const onNodeClick = (e, node) => setSelectedNode(node);

  const handleRun = async () => {
    setIsRunning(true);
    setIsFlightRecorderOpen(true);
    const result = await runCustomFlow({ nodes, edges, smartRouting, processType });
    if (result && result.walletBalance !== undefined && result.walletBalance !== null) {
      setWalletBalance(result.walletBalance);
    }
    setIsRunning(false);
  };

  const addAgent = () => {
    const newNode = {
      id: `agent-${Date.now()}`,
      type: 'agent',
      position: { x: 100, y: Math.random() * 200 + 100 },
      data: { name: 'New Agent', role: '', goal: '', backstory: '', allowDelegation: false, verbose: true, memory: false, tools: [], theme: isDarkMode ? 'dark' : 'light' }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addTask = () => {
    const newNode = {
      id: `task-${Date.now()}`,
      type: 'task',
      position: { x: 450, y: Math.random() * 200 + 100 },
      data: { name: 'New Task', description: '', expectedOutput: '', asyncExecution: false, outputFile: '', theme: isDarkMode ? 'dark' : 'light' }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addTrigger = () => {
    const newNode = {
      id: `trigger-${Date.now()}`,
      type: 'trigger',
      position: { x: 50, y: Math.random() * 200 + 100 },
      data: { theme: isDarkMode ? 'dark' : 'light' }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const updateNodeData = (key, value) => {
    if (!selectedNode) return;
    setNodes((nds) => nds.map(n => {
      if (n.id === selectedNode.id) {
        n.data = { ...n.data, [key]: value };
        return { ...n };
      }
      return n;
    }));
    setSelectedNode(prev => ({...prev, data: { ...prev.data, [key]: value }}));
  };

  const loadTemplate = () => {
    setNodes([
      { id: 'a1', type: 'agent', position: { x: 100, y: 100 }, data: { name: 'Content Strategist', role: 'Planner', goal: 'Plan blog post', backstory: 'Expert marketer', tools: [], theme: isDarkMode ? 'dark' : 'light' } },
      { id: 't1', type: 'task', position: { x: 400, y: 100 }, data: { description: 'Outline blog about AgentOS', expectedOutput: 'Outline', theme: isDarkMode ? 'dark' : 'light' } },
      { id: 'a2', type: 'agent', position: { x: 100, y: 300 }, data: { name: 'Copywriter', role: 'Writer', goal: 'Write post', backstory: 'Creative writer', tools: [], theme: isDarkMode ? 'dark' : 'light' } },
      { id: 't2', type: 'task', position: { x: 400, y: 300 }, data: { description: 'Draft post from outline', expectedOutput: 'Full blog post', theme: isDarkMode ? 'dark' : 'light' } }
    ]);
    setEdges([
      { id: 'e1', source: 'a1', target: 't1', animated: true },
      { id: 'e2', source: 'a2', target: 't2', animated: true },
      { id: 'e3', source: 't1', target: 't2', animated: true, style: { stroke: '#ff0072' } }
    ]);
  };

  const handleSave = async () => {
    try {
      const saved = await saveProject({
        id: projectId,
        name: generationPrompt.replace(/^\[.*?\]\s*/, '') || 'Untitled Project',
        nodes,
        edges
      });
      setProjectId(saved.id);
      alert('Project saved successfully!');
    } catch (err) {
      alert('Failed to save project.');
    }
  };

  const loadProject = (p) => {
    setProjectId(p.id);
    setProjectTitle(p.name);
    setGenerationPrompt(p.name);
    // Enforce current theme on loaded project
    setNodes((p.nodes || []).map(n => ({ ...n, data: { ...n.data, theme: isDarkMode ? 'dark' : 'light' } })));
    setEdges(p.edges || []);
    setViewMode('editor');
    setGenerationThoughts([]);
  };

  const generateBlueprintFromText = async (customPrompt = null) => {
    const promptText = typeof customPrompt === 'string' ? customPrompt : nlPrompt;
    if (!promptText) return;
    
    setIsGenerating(true);
    setGenerationPrompt(promptText);
    setViewMode('editor');
    
    const isFollowUp = nodes.length > 0;
    if (!isFollowUp) {
      setNodes([]);
      setEdges([]);
    }
    setGenerationThoughts(prev => isFollowUp 
      ? [...prev, { type: 'loading', text: 'Thinking...' }]
      : [{ type: 'loading', text: 'Thinking...' }]
    );
    
    try {
      // 1. Call Backend API — pass current graph for context-aware editing
      const res = await fetch('http://localhost:3001/api/blueprint/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': tenantId },
        body: JSON.stringify({ 
          prompt: promptText,
          nodes: isFollowUp ? nodes : [],
          edges: isFollowUp ? edges : []
        })
      });
      
      if (!res.ok) {
        let errMsg = 'API request failed';
        try {
          const errData = await res.json();
          errMsg = errData.error || errData.details || errMsg;
        } catch(e) {}
        throw new Error(errMsg);
      }
      const blueprint = await res.json();
      
      if (blueprint.error) throw new Error(blueprint.error);

      if (blueprint.type === 'chat') {
        setGenerationThoughts(prev => [
          ...prev.filter(t => t.type !== 'loading'),
          { type: 'chat', text: blueprint.message }
        ]);
        setIsGenerating(false);
        return;
      }

      // 2. Clear loading state and set initial thought
      setGenerationThoughts(prev => [
        ...prev.filter(t => t.type !== 'loading'),
        { type: 'thought', text: `Designing architecture for: ${blueprint.title || 'New Workflow'}` }
      ]);
      
      // Delay slightly for effect
      await new Promise(r => setTimeout(r, 600));

      setProjectTitle(blueprint.title || 'Untitled Project');

      // 3. Process Agents sequentially with typing effect
      let currentY = 100;
      const newNodes = isFollowUp ? [...nodes] : [];
      const newEdges = isFollowUp ? [...edges] : [];

      let currentNodes = [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 50, y: 350 },
          data: { theme: isDarkMode ? 'dark' : 'light' }
        }
      ];
      let currentEdges = [];

      // 3. Process Agents sequentially
      for (let i = 0; i < (blueprint.agents || []).length; i++) {
        const a = blueprint.agents[i];
        setGenerationThoughts(prev => [...prev, { type: 'step', text: `Creating Agent: ${a.name}` }]);
        
        const col = i % 4;
        const row = Math.floor(i / 4);
        
        const agentNode = {
          id: a.id,
          type: 'agent',
          position: { x: 300 + (col * 350), y: 100 + (row * 600) },
          data: {
            name: a.name,
            role: a.role,
            goal: a.goal,
            backstory: a.backstory,
            tools: a.tools || [],
            model: a.model || 'gemini/gemini-2.5-flash',
            memory: a.memory || false,
            allowDelegation: a.allowDelegation || false,
            verbose: a.verbose !== false,
            theme: isDarkMode ? 'dark' : 'light'
          }
        };
        currentNodes.push(agentNode);
        setNodes([...currentNodes]); // Force re-render
        await new Promise(r => setTimeout(r, 800)); // Animation delay
      }

      setGenerationThoughts(prev => [...prev, { type: 'thought', text: "Now I'll create the tasks for each agent:" }]);
      await new Promise(r => setTimeout(r, 500));

      // 4. Process Tasks sequentially
      for (let i = 0; i < (blueprint.tasks || []).length; i++) {
        const t = blueprint.tasks[i];
        setGenerationThoughts(prev => [...prev, { type: 'step', text: `Creating Task: ${t.name}` }]);
        
        const col = i % 4;
        const row = Math.floor(i / 4);
        
        const taskNode = {
          id: t.id,
          type: 'task',
          position: { x: 300 + (col * 350), y: 350 + (row * 600) },
          data: {
            name: t.name,
            description: t.description,
            expectedOutput: t.expectedOutput,
            asyncExecution: t.asyncExecution || false,
            theme: isDarkMode ? 'dark' : 'light'
          }
        };
        currentNodes.push(taskNode);
        
        // Find matching agent edge
        if (t.agent_id) {
          currentEdges.push({
            id: `e-${t.agent_id}-${t.id}`,
            source: t.agent_id,
            target: t.id,
            animated: true,
            style: { stroke: 'var(--accent-primary)' }
          });
        }

        // Add DAG task context connections
        if (t.context && t.context.length > 0) {
          t.context.forEach(ctxId => {
            currentEdges.push({
              id: `e-${ctxId}-${t.id}`,
              source: ctxId,
              target: t.id,
              animated: true,
              style: { stroke: 'var(--success)' }
            });
          });
        } else if (i === 0 || !t.context) {
          // If it has no context dependencies, connect it to the Trigger node!
          currentEdges.push({
            id: `e-trigger-${t.id}`,
            source: 'trigger-1',
            target: t.id,
            animated: true,
            style: { stroke: '#a855f7' }
          });
        }
        
        setNodes([...currentNodes]);
        setEdges([...currentEdges]);
        await new Promise(r => setTimeout(r, 800)); // Animation delay
      }
      
      setGenerationThoughts(prev => [...prev, { type: 'thought', text: "Perfect! Now let me suggest a project name and review what we've built:" }, { type: 'step', text: `Renaming project to ${blueprint.title}` }]);
      
      // Store the title
      setProjectTitle(blueprint.title || promptText.substring(0, 40));
      setGenerationPrompt(`[${blueprint.title}] ${promptText}`);

    } catch (err) {
      console.error(err);
      setGenerationThoughts(prev => [...prev.filter(t => t.type !== 'loading'), { type: 'step', text: `Error generating blueprint: ${err.message}` }]);
    }
    
    if (!customPrompt) setNlPrompt('');
    setIsGenerating(false);
  };

  const handleExportCode = async () => {
    try {
      setGenerationThoughts(prev => [...prev, { type: 'loading', text: 'Compiling python code...' }]);
      const res = await fetch('http://localhost:3001/api/blueprint/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': tenantId },
        body: JSON.stringify({ nodes, edges, processType })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setExportedCode(data.files);
      setIsExportModalOpen(true);
      setGenerationThoughts(prev => [...prev.filter(t => t.type !== 'loading'), { type: 'step', text: 'Code compiled successfully!' }]);
    } catch (err) {
      console.error(err);
      setGenerationThoughts(prev => [...prev.filter(t => t.type !== 'loading'), { type: 'step', text: `Error compiling code: ${err.message}` }]);
    }
  };

  if (viewMode === 'home') {
    return (
      <div className="animate-fade-in" style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Top Section - Generation */}
        <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Build AI Powered Automations</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Describe what you want to automate and watch AI create intelligent workflows for you</p>
          
          <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--accent-primary)', borderRadius: '12px', padding: '1rem', textAlign: 'left', minHeight: '120px' }}>
            <textarea 
              value={nlPrompt}
              onChange={e => setNlPrompt(e.target.value)}
              placeholder="Please create a simple reputation awareness crew for a specified company. It should gather recent sentiment in news and social media..."
              style={{ width: '100%', height: '80px', background: 'transparent', border: 'none', color: 'white', outline: 'none', resize: 'none', fontSize: '1rem', lineHeight: '1.5' }}
            />
            <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Mic size={16} />
              </button>
              <button 
                onClick={generateBlueprintFromText}
                disabled={isGenerating || !nlPrompt}
                style={{ background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {isGenerating ? <Activity size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '999px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setNlPrompt("Summarize customer support tickets")}>Summarize customer support tickets</span>
            <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '999px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setNlPrompt("Triage GitHub issues")}>Triage GitHub issues</span>
            <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '999px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setNlPrompt("Score inbound leads")}>Score inbound leads</span>
          </div>
        </div>

        {/* Bottom Section - Recent Projects */}
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Recent Projects</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 1rem 0' }}>Pick up where you left off or start something new</p>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type="text" placeholder="Search projects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '0.2rem', border: '1px solid var(--border-color)' }}>
                <button style={{ background: 'var(--bg-dark)', color: 'white', border: 'none', padding: '0.25rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>All</button>
                <button style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', padding: '0.25rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Mine</button>
                <button style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', padding: '0.25rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Shared with me</button>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {/* Create New Card */}
            <div 
              className="glass-panel" 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', minHeight: '220px', cursor: 'pointer', border: '2px dashed var(--border-color)', background: 'rgba(255,255,255,0.02)' }}
              onClick={() => { setProjectId(null); setGenerationPrompt(''); setNodes([]); setEdges([]); setViewMode('editor'); }}
            >
              <Plus size={32} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
              <div style={{ fontWeight: 500 }}>Create New</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Start fresh project</div>
            </div>
            
            {/* Project Cards */}
            {projects.map((p, i) => (
              <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '220px', cursor: 'pointer', transition: 'border 0.2s' }} onClick={() => loadProject(p)} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  {p.name}
                </div>
                {p.tag && <span style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, width: 'max-content', marginBottom: '1rem' }}>+ {p.tag}</span>}
                {!p.tag && <div style={{ height: '1.5rem', marginBottom: '1rem' }}></div>}
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>{p.runs} runs</span>
                    <span>{p.days} days</span>
                  </div>
                  {p.runs > 0 && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '30px' }}>
                      {[4, 12, 18, 6, 14, 8, 20].map((h, idx) => (
                        <div key={idx} style={{ width: '12px', height: `${h}px`, background: 'var(--accent-primary)', borderRadius: '2px 2px 0 0', opacity: 0.8 }}></div>
                      ))}
                    </div>
                  )}
                  {p.runs === 0 && (
                     <div style={{ height: '30px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>- - - -</div>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Modified {p.days} days</span>
                  <span style={{ color: 'var(--accent-primary)' }}>Edit &gt;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* Top Bar (Editor Mode) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-color)', zIndex: 10 }}>
        <div style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'inline-block', marginRight: '0.5rem' }}>Studio Canvas</h2>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Visual drag-and-drop workflow builder.</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, margin: '0 1.5rem' }}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem', borderRadius: '4px' }}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {walletBalance !== null && (
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, marginRight: '0.5rem' }} title="Your API Credit Balance">
              Wallet: ${walletBalance.toFixed(5)}
            </div>
          )}
          <button onClick={toggleTheme} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', marginRight: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Toggle Theme">
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setViewMode('home')}>Back to Projects</button>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={handleSave}><Save size={14} /> Save</button>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={loadTemplate}><BookTemplate size={14} /> Templates</button>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={handleExportCode}><Download size={14} /> Export</button>
          <select 
            value={processType}
            onChange={e => setProcessType(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '9999px', padding: '0.3rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}
          >
            <option value="sequential" style={{ background: '#1a1a2e' }}>Sequential</option>
            <option value="hierarchical" style={{ background: '#1a1a2e' }}>Hierarchical</option>
          </select>
          <button onClick={() => setSmartRouting(!smartRouting)} style={{ background: smartRouting ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${smartRouting ? 'var(--success)' : 'var(--border-color)'}`, color: smartRouting ? 'var(--success)' : 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: '8px', marginRight: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }} title="Smart Routing (Cost Optimizer)">
            <Activity size={14} style={{ marginRight: '0.25rem' }} /> {smartRouting ? 'Smart Routing: ON' : 'Smart Routing: OFF'}
          </button>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={addTrigger}><Plus size={14} /> Trigger</button>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={addAgent}><Plus size={14} /> Agent</button>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={addTask}><Plus size={14} /> Task</button>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderColor: '#a855f7', color: '#a855f7' }} onClick={async () => {
            try {
              const resp = await fetch('http://localhost:3001/api/dag/analyze', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': tenantId },
                body: JSON.stringify({ nodes, edges }),
              });
              const data = await resp.json();
              setDagAnalysis(data);
              setIsDagModalOpen(true);
            } catch (e) { console.error('DAG analysis failed', e); }
          }}><GitBranch size={14} /> Analyze DAG</button>
          {flowTraces && flowTraces.length > 0 && !isFlightRecorderOpen && (
            <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }} onClick={() => setIsFlightRecorderOpen(true)}><Activity size={14} /> View Logs</button>
          )}
          <button className="btn btn-primary" style={{ padding: '0.3rem 1rem', fontSize: '0.8rem' }} onClick={handleRun} disabled={isRunning}>
            {isRunning ? 'Running...' : <><Play size={14} /> Run</>}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar - AI Generation Panel */}
        <div style={{ 
          width: isSidebarOpen ? '380px' : '0px', 
          opacity: isSidebarOpen ? 1 : 0,
          borderRight: isSidebarOpen ? '1px solid var(--border-color)' : 'none', 
          background: 'rgba(255,255,255,0.02)', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          transition: 'width 0.3s ease, opacity 0.3s ease'
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {generationPrompt && (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                {generationPrompt}
              </div>
            )}
            
            {generationThoughts.map((t, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: t.type === 'thought' ? '1rem' : '0' }}>
                {t.type === 'thought' && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Play size={14} fill="currentColor" /> Thought process
                    </div>
                    {t.text}
                  </div>
                )}
                
                {t.type === 'step' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--success)' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></div>
                    </div>
                    {t.text}
                  </div>
                )}
                
                {t.type === 'loading' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Activity size={14} className="animate-spin" /> {t.text}
                    </div>
                    <button style={{ background: 'white', color: 'black', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>Stop</button>
                  </div>
                )}
              </div>
            ))}
            
            {!isGenerating && generationThoughts.length > 0 && (
              <div style={{ marginTop: '1rem', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={14} color="var(--accent-primary)" /> Suggestion
                </div>
                <div style={{ padding: '0 0.75rem 0.75rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  I have some suggestions to help you move forward with your automation.
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--border-color)' }}>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleRun}><Play size={14}/> Run Automation</button>
                </div>
              </div>
            )}
          </div>
          
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ 
              background: isDarkMode ? '#1a1a1a' : '#f1f5f9', 
              borderRadius: '20px', 
              padding: '0.75rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <textarea 
                className="no-focus-ring"
                data-gramm="false"
                spellCheck="false"
                placeholder="Ask, build, or solve doubts..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if(chatInput.trim() && !isGenerating) {
                      generateBlueprintFromText(chatInput);
                      setChatInput('');
                    }
                  }
                }}
                style={{ 
                  width: '100%', background: 'transparent', border: 'none', color: isDarkMode ? 'white' : '#0f172a', 
                  outline: 'none', fontSize: '0.9rem', resize: 'none', minHeight: '40px', maxHeight: '150px', fontFamily: 'inherit' 
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}>
                  <Mic size={18} />
                </button>
                <button 
                  onClick={() => {
                    if (isGenerating) {
                      setIsGenerating(false); // Quick stop override
                      setGenerationThoughts(prev => [...prev, { type: 'step', text: 'Generation stopped by user.' }]);
                    } else if (chatInput.trim()) {
                      generateBlueprintFromText(chatInput);
                      setChatInput('');
                    }
                  }}
                  style={{ 
                    background: isGenerating ? '#ef4444' : (chatInput.trim() ? 'var(--accent-primary)' : '#475569'), 
                    color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: chatInput.trim() || isGenerating ? 'pointer' : 'default',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isGenerating ? (
                    <div style={{ width: '12px', height: '12px', background: 'white', borderRadius: '2px' }} />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', background: isDarkMode ? '#09090b' : '#f8fafc', transition: 'background 0.3s ease' }}>
          {/* Floating Process Type UI */}
          <div className="nodrag nopan" style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, background: isDarkMode ? 'rgba(0,0,0,0.4)' : 'white', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', width: '180px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ fontSize: '0.7rem', color: isDarkMode ? 'var(--text-secondary)' : '#64748b', marginBottom: '0.5rem', fontWeight: 500 }}>Version 1</div>
            <div style={{ fontSize: '0.8rem', color: isDarkMode ? 'white' : '#0f172a', fontWeight: 600, marginBottom: '0.25rem' }}>Process Type</div>
            <select 
              value={processType}
              onChange={e => setProcessType(e.target.value)}
              style={{ width: '100%', padding: '0.35rem', fontSize: '0.75rem', borderRadius: '4px', border: isDarkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid #cbd5e1', outline: 'none', background: isDarkMode ? '#0f172a' : 'white', color: isDarkMode ? 'white' : '#0f172a' }}
            >
              <option value="sequential">Sequential</option>
              <option value="hierarchical">Hierarchical</option>
            </select>
          </div>

          {/* Floating Toggle Pill */}
          <div className="nodrag nopan" style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', background: isDarkMode ? 'rgba(0,0,0,0.4)' : '#0f172a', border: isDarkMode ? '1px solid rgba(255,255,255,0.2)' : 'none', borderRadius: '9999px', padding: '0.25rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ background: isDarkMode ? '#3b82f6' : 'white', color: isDarkMode ? 'white' : '#0f172a', padding: '0.5rem 2rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>No Code</div>
            <div style={{ color: '#94a3b8', padding: '0.5rem 2rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>CLI</div>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={() => setSelectedNode(null)}
            nodeTypes={nodeTypes}
            fitView
            panOnScroll={true}
            theme={isDarkMode ? "dark" : "light"}
          >
            <Background color={isDarkMode ? '#333' : '#cbd5e1'} gap={16} size={1.5} />
            <Controls />
            <MiniMap style={{ background: isDarkMode ? 'var(--bg-dark)' : '#f1f5f9', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }} nodeColor={isDarkMode ? "var(--accent-primary)" : "#3b82f6"} maskColor={isDarkMode ? "rgba(0,0,0,0.5)" : "rgba(248, 250, 252, 0.7)"} />
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="glass-panel" style={{ width: '300px', borderTop: 0, borderBottom: 0, borderRight: 0, borderRadius: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            <h3 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Properties</h3>
            
            {selectedNode.type === 'agent' && (
              <>
                <div><label>Name</label><input value={selectedNode.data.name || ''} onChange={e => updateNodeData('name', e.target.value)} style={{width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', padding: '0.5rem', borderRadius: '4px'}}/></div>
                <div><label>Role</label><input value={selectedNode.data.role || ''} onChange={e => updateNodeData('role', e.target.value)} style={{width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', padding: '0.5rem', borderRadius: '4px'}}/></div>
                <div><label>Goal</label><textarea value={selectedNode.data.goal || ''} onChange={e => updateNodeData('goal', e.target.value)} style={{width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', padding: '0.5rem', borderRadius: '4px'}}/></div>
                <div><label>Backstory</label><textarea value={selectedNode.data.backstory || ''} onChange={e => updateNodeData('backstory', e.target.value)} style={{width: '100%', height:'80px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', padding: '0.5rem', borderRadius: '4px'}}/></div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={selectedNode.data.allowDelegation || false} onChange={e => updateNodeData('allowDelegation', e.target.checked)} id="allowDelegation" />
                  <label htmlFor="allowDelegation" style={{ margin: 0, cursor: 'pointer' }}>Allow Delegation</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={selectedNode.data.verbose || false} onChange={e => updateNodeData('verbose', e.target.checked)} id="verbose" />
                  <label htmlFor="verbose" style={{ margin: 0, cursor: 'pointer' }}>Verbose Output</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={selectedNode.data.memory || false} onChange={e => updateNodeData('memory', e.target.checked)} id="memory" />
                  <label htmlFor="memory" style={{ margin: 0, cursor: 'pointer' }}>Enable Memory</label>
                </div>

                <div>
                  <label>Tools</label>
                  <select onChange={e => {
                    const t = Array.from(e.target.selectedOptions, option => option.value);
                    updateNodeData('tools', t);
                  }} multiple value={selectedNode.data.tools || []} style={{width: '100%', background: 'rgba(0,0,0,0.3)', color: 'white', padding:'0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px'}}>
                    <option value="web_search">Web Search Engine</option>
                    <option value="calculator">Calculator</option>
                    <option value="file_reader">File Reader</option>
                    <option value="code_interpreter">Code Interpreter</option>
                    <option value="scraper">Web Scraper</option>
                  </select>
                </div>
                <div>
                  <label>LLM Model</label>
                  <select value={selectedNode.data.model || 'gemini/gemini-2.5-flash'} onChange={e => updateNodeData('model', e.target.value)} style={{width: '100%', background: 'rgba(0,0,0,0.3)', color: 'white', padding:'0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px'}}>
                    <optgroup label="Google">
                      <option value="gemini/gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="gemini/gemini-2.5-pro">Gemini 2.5 Pro</option>
                    </optgroup>
                    <optgroup label="OpenAI">
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                    </optgroup>
                    <optgroup label="Anthropic">
                      <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                    </optgroup>
                    <optgroup label="DeepSeek (Open Source)">
                      <option value="deepseek/deepseek-chat">DeepSeek V3 (Chat)</option>
                      <option value="deepseek/deepseek-coder">DeepSeek Coder</option>
                    </optgroup>
                    <optgroup label="Groq (Ultra-Fast)">
                      <option value="groq/llama3-8b-8192">Llama 3 (8B)</option>
                      <option value="groq/mixtral-8x7b-32768">Mixtral (8x7B)</option>
                    </optgroup>
                    <optgroup label="Local (Ollama)">
                      <option value="ollama/glm-5.2">GLM 5.2 (Local/Demo)</option>
                      <option value="ollama/llama3">Llama 3 (Local)</option>
                      <option value="ollama/mistral">Mistral (Local)</option>
                    </optgroup>
                  </select>
                </div>
              </>
            )}

            {selectedNode.type === 'task' && (
              <>
                <div><label>Task Name</label><input value={selectedNode.data.name || ''} onChange={e => updateNodeData('name', e.target.value)} style={{width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', padding: '0.5rem', borderRadius: '4px'}}/></div>
                <div><label>Description</label><textarea value={selectedNode.data.description || ''} onChange={e => updateNodeData('description', e.target.value)} style={{width: '100%', height:'120px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', padding: '0.5rem', borderRadius: '4px'}}/></div>
                <div><label>Expected Output</label><input value={selectedNode.data.expectedOutput || ''} onChange={e => updateNodeData('expectedOutput', e.target.value)} style={{width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', padding: '0.5rem', borderRadius: '4px'}}/></div>
                <div><label>Output File (Optional)</label><input value={selectedNode.data.outputFile || ''} onChange={e => updateNodeData('outputFile', e.target.value)} placeholder="e.g. report.md" style={{width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', padding: '0.5rem', borderRadius: '4px'}}/></div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={selectedNode.data.asyncExecution || false} onChange={e => updateNodeData('asyncExecution', e.target.checked)} id="asyncExecution" />
                  <label htmlFor="asyncExecution" style={{ margin: 0, cursor: 'pointer' }}>Async Execution</label>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Execution Timeline / Flight Recorder */}
      {(flowLogs || (flowTraces && flowTraces.length > 0)) && isFlightRecorderOpen && (
        <div style={{ height: '320px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-dark)', padding: '1rem 1.5rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={16} color="var(--accent-primary)" /> Flight Recorder</h4>
              {flowTraces && flowTraces.length > 0 && (
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span><span style={{ color: '#eab308', fontWeight: 600 }}>{flowTraces.reduce((sum, t) => sum + (t.latency_seconds || 0), 0).toFixed(2)}s</span> total latency</span>
                  <span><span style={{ color: '#10b981', fontWeight: 600 }}>{flowTraces.reduce((sum, t) => sum + (t.tokens || 0), 0).toLocaleString()}</span> total tokens</span>
                  <span><span style={{ color: '#a855f7', fontWeight: 600 }}>${flowTraces.reduce((sum, t) => sum + (t.cost_usd || 0), 0).toFixed(5)}</span> total cost</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }} onClick={() => { setFlowLogs(null); setFlowTraces([]); setIsFlightRecorderOpen(false); }}>Clear</button>
              <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setIsFlightRecorderOpen(false)}><X size={14} /> Close</button>
            </div>
          </div>
          <div style={{ position: 'relative', paddingLeft: '2rem' }}>
            {/* Vertical timeline line */}
            <div style={{ position: 'absolute', left: '8px', top: 0, bottom: 0, width: '2px', background: 'var(--border-color)' }}></div>
            
            {flowTraces && flowTraces.map((trace, idx) => {
              const isRouter = trace.event === 'ROUTER_EVALUATION';
              const color = isRouter ? '#f43f5e' : trace.event === 'LLM_CALL_START' ? 'var(--accent-primary)' : trace.event === 'TOOL_CALL' ? '#f59e0b' : trace.event === 'LLM_CALL_END' ? 'var(--success)' : '#a855f7';
              const icon = isRouter ? '🧠' : trace.event === 'TOOL_CALL' ? '🔧' : trace.event === 'LLM_CALL_START' ? '📤' : trace.event === 'LLM_CALL_END' ? '📥' : '⚡';
              return (
                <div key={idx} style={{ position: 'relative', marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                  {/* Timeline dot */}
                  <div style={{ position: 'absolute', left: '-1.55rem', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: color, border: '2px solid var(--bg-dark)', zIndex: 1 }}></div>
                  
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem 1rem', borderLeft: `3px solid ${color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8rem', color }}>{icon} {trace.agent} — {trace.event.replace(/_/g, ' ')}</span>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem' }}>
                        {trace.model && <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{trace.model}</span>}
                        {trace.latency_seconds && <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{trace.latency_seconds}s</span>}
                        {trace.cost_usd && <span style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>${trace.cost_usd}</span>}
                        {trace.timestamp && <span style={{ color: 'var(--text-secondary)' }}>{new Date(trace.timestamp).toLocaleTimeString()}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'hidden' }}>
                      {trace.prompt_preview || trace.response_preview || ''}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {flowLogs && typeof flowLogs === 'string' && flowLogs.length > 0 && (
              <div style={{ position: 'relative', marginTop: '2rem', paddingLeft: '1.5rem' }}>
                <div style={{ position: 'absolute', left: '-1.55rem', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-primary)', border: '2px solid var(--bg-dark)', zIndex: 1 }}></div>
                <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--accent-primary)', borderRadius: '8px', padding: '1rem', borderLeft: `3px solid var(--accent-primary)` }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} /> Final Output
                  </div>
                  <div>
                    {(() => {
                      let cleanText = flowLogs;
                      if (cleanText.includes("🚀 CREWAI EXECUTION COMPLETE")) {
                        cleanText = cleanText.split("🚀 CREWAI EXECUTION COMPLETE")[1].replace(/={50}/g, '').trim();
                      }
                      
                      const isMarkdown = cleanText.includes('#') || cleanText.includes('- ') || cleanText.includes('**') || cleanText.includes('`');
                      if (isMarkdown) {
                        try {
                          const htmlContent = marked.parse(cleanText);
                          return (
                            <div 
                              className="markdown-content"
                              style={{ 
                                fontSize: '0.9rem', 
                                color: 'var(--text-primary)', 
                                lineHeight: '1.6',
                              }}
                              dangerouslySetInnerHTML={{ __html: htmlContent }}
                            />
                          );
                        } catch (e) {
                          console.error("Failed to parse markdown:", e);
                        }
                      }
                      
                      return (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                          {cleanText}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* Code Export Modal */}
      {isExportModalOpen && exportedCode && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '800px', maxWidth: '90vw', height: '80vh', padding: '2rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <button onClick={() => setIsExportModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Exported CrewAI Project</h3>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              {Object.keys(exportedCode).map(filename => (
                <button 
                  key={filename}
                  onClick={() => setActiveExportTab(filename)}
                  style={{ 
                    padding: '0.5rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer',
                    color: activeExportTab === filename ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    borderBottom: activeExportTab === filename ? '2px solid var(--accent-primary)' : '2px solid transparent'
                  }}
                >{filename}</button>
              ))}
            </div>

            <pre style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
              {exportedCode[activeExportTab]}
            </pre>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={() => {
                navigator.clipboard.writeText(exportedCode[activeExportTab]);
                alert('Copied to clipboard!');
              }}>Copy File Content</button>
            </div>
          </div>
        </div>
      )}

      {isDagModalOpen && dagAnalysis && (
        <DagModal analysis={dagAnalysis} onClose={() => setIsDagModalOpen(false)} />
      )}
    </div>
  );
}

function DagModal({ analysis, onClose }) {
  if (!analysis || analysis.status !== 'OK') return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="glass-panel" style={{ padding: '2rem', maxWidth: 500 }}>
        <h3 style={{ color: '#ff5252' }}>DAG Analysis Error</h3>
        <p>{analysis?.error || 'Unknown error'}</p>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  const { summary, execution_layers, critical_path, bottlenecks, speedup } = analysis;
  const speedColor = speedup.speedup_factor >= 2 ? '#00e676' : speedup.speedup_factor >= 1.3 ? '#ffab00' : '#ff5252';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div className="glass-panel" style={{ padding: '2rem', maxWidth: 700, maxHeight: '85vh', overflowY: 'auto', width: '90%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><GitBranch size={20} color="#a855f7" /> DAG Analysis Report</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Speedup Hero */}
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: 12, marginBottom: '1.5rem', border: `1px solid ${speedColor}33` }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: speedColor }}>{speedup.speedup_factor}x</div>
          <div style={{ color: 'var(--text-secondary)' }}>Parallelization Speedup</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', fontSize: '0.85rem' }}>
            <span>Sequential: <strong>{speedup.sequential_time}s</strong></span>
            <span>Parallel: <strong style={{ color: speedColor }}>{speedup.parallel_time}s</strong></span>
            <span>Saved: <strong style={{ color: '#00e676' }}>{speedup.time_saved}s</strong></span>
          </div>
        </div>

        {/* Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[['Nodes', summary.total_nodes], ['Layers', summary.total_layers], ['Max ∥', summary.max_parallelism]].map(([label, val]) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 8, textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#00f2fe' }}>{val}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Execution Layers */}
        <h4 style={{ marginBottom: '0.75rem' }}>⚡ Execution Layers</h4>
        {execution_layers.map(layer => (
          <div key={layer.layer} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
            <span style={{ background: layer.can_parallelize ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.05)', color: layer.can_parallelize ? '#00e676' : 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, minWidth: 55, textAlign: 'center' }}>
              L{layer.layer} {layer.can_parallelize ? '∥' : '→'}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {layer.nodes.map(n => (
                <span key={n.id} style={{ background: n.type === 'agent' ? 'rgba(129,140,248,0.15)' : n.type === 'trigger' ? 'rgba(168,85,247,0.15)' : 'rgba(16,185,129,0.15)', color: n.type === 'agent' ? '#818cf8' : n.type === 'trigger' ? '#a855f7' : '#10b981', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500 }}>{n.name}</span>
              ))}
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{layer.layer_duration}s</span>
          </div>
        ))}

        {/* Critical Path */}
        <h4 style={{ margin: '1.25rem 0 0.75rem' }}>🔥 Critical Path ({critical_path.total_duration}s)</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap', padding: '0.75rem', background: 'rgba(255,82,82,0.05)', borderRadius: 8, border: '1px solid rgba(255,82,82,0.2)' }}>
          {critical_path.path_names.map((name, i) => (
            <React.Fragment key={i}>
              <span style={{ background: 'rgba(255,82,82,0.15)', color: '#ff5252', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>{name}</span>
              {i < critical_path.path_names.length - 1 && <ArrowRight size={12} color="#ff5252" />}
            </React.Fragment>
          ))}
        </div>

        {/* Bottlenecks */}
        <h4 style={{ margin: '1.25rem 0 0.75rem' }}>🚧 Top Bottlenecks</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Node</th>
            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Downstream</th>
            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Impact</th>
          </tr></thead>
          <tbody>
            {bottlenecks.map(b => (
              <tr key={b.node_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.5rem' }}>{b.name}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{b.downstream_count}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', color: b.impact_score > 2 ? '#ff5252' : '#00e676' }}>{b.impact_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
