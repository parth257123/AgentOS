import React, { createContext, useContext, useState, useEffect } from 'react';

const AgentContext = createContext();

export const useAgents = () => useContext(AgentContext);

export const AgentProvider = ({ children }) => {
  const [agents, setAgents] = useState([]);
  const [metrics, setMetrics] = useState({
    tasksCompleted24h: 0,
    avgResponseTime: '0s',
    totalActive: 0,
    systemStatus: 'Loading...'
  });
  const [projects, setProjects] = useState([]);
  const [flowLogs, setFlowLogs] = useState('');
  const [flowTraces, setFlowTraces] = useState([]);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      setAgents(data.agents);
      setMetrics(data.metrics);
    } catch (err) {
      console.error("Failed to fetch agents", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchProjects();
    // Poll every 5s for updates
    const interval = setInterval(() => {
      fetchAgents();
      fetchProjects();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const deployAgent = async (newAgent) => {
    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent)
      });
      fetchAgents();
    } catch (err) {
      console.error("Deploy failed", err);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await fetch(`/api/agents/${id}/toggle`, { method: 'PUT' });
      fetchAgents();
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const removeAgent = async (id) => {
    try {
      await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      fetchAgents();
    } catch (err) {
      console.error("Remove failed", err);
    }
  };

  const runFlow = async () => {
    try {
      setFlowLogs("Running python framework...\n");
      setFlowTraces([]);
      const res = await fetch('/api/flows/run', { method: 'POST' });
      const data = await res.json();
      setFlowLogs(data.logs);
      if (data.traces) setFlowTraces(data.traces);
      fetchAgents();
    } catch (err) {
      console.error("Flow execution failed", err);
      setFlowLogs("Error executing flow.");
    }
  };

    const runCustomFlow = async (config) => {
    try {
      setFlowLogs("Running custom python framework...\n");
      setFlowTraces([]);
      const res = await fetch('http://localhost:3001/api/flows/custom', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setFlowLogs(data.logs);
      if (data.traces) setFlowTraces(data.traces);
      fetchAgents();
      return data;
    } catch (err) {
      console.error("Custom flow execution failed", err);
      setFlowLogs("Error executing custom flow.");
      return null;
    }
  };

  const saveProject = async (projectData) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      const saved = await res.json();
      fetchProjects();
      return saved;
    } catch (err) {
      console.error("Save project failed", err);
      throw err;
    }
  };

  return (
    <AgentContext.Provider value={{
      agents,
      metrics,
      projects,
      deployAgent,
      toggleStatus,
      removeAgent,
      runFlow,
      runCustomFlow,
      saveProject,
      flowLogs,
      setFlowLogs,
      flowTraces
    }}>
      {children}
    </AgentContext.Provider>
  );
};
