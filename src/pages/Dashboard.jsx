import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Home, Activity, Settings, Users, Server, CheckCircle2, XCircle, Clock, Play, Square, Trash2, X, ChevronDown, MessageSquare } from 'lucide-react';
import { useAgents } from '../context/AgentContext';

export default function Dashboard() {
  const { agents, metrics, deployAgent, toggleStatus, removeAgent, runFlow, flowLogs, setFlowLogs, flowTraces } = useAgents();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [expandedTrace, setExpandedTrace] = useState(null);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentOwner, setNewAgentOwner] = useState('');

  const handleDeploy = (e) => {
    e.preventDefault();
    if (!newAgentName || !newAgentOwner) return;
    deployAgent({ name: newAgentName, owner: newAgentOwner });
    setNewAgentName('');
    setNewAgentOwner('');
    setIsModalOpen(false);
  };

  return (
    <div className="dashboard animate-fade-in" style={{ padding: '2rem', position: 'relative' }}>
      {/* Main Content */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Control Plane</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => { setIsLogsModalOpen(true); runFlow(); }}>
              <Play size={18} style={{ marginRight: '0.5rem' }} /> Run Research Flow
            </button>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Deploy New Agent</button>
          </div>
        </header>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-panel hover-lift" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Active Agents</div>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: metrics.totalActive > 0 ? 'var(--success)' : 'var(--text-secondary)' }}>{metrics.totalActive}</div>
            <Users size={40} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1 }} />
          </div>
          <div className="glass-panel hover-lift" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Est. Daily Cost (USD)</div>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--accent-primary)' }}>${(metrics.totalActive * 0.42).toFixed(2)}</div>
            <Activity size={40} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1, color: 'var(--accent-primary)' }} />
          </div>
          <div className="glass-panel hover-lift" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Avg Response Time</div>
            <div style={{ fontSize: '2rem', fontWeight: 600 }}>{metrics.avgResponseTime || '1.2s'}</div>
            <Clock size={40} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1 }} />
          </div>
          <div className="glass-panel hover-lift" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>System Status</div>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: metrics.systemStatus === 'Optimal' ? 'var(--success)' : 'var(--warning)' }}>{metrics.systemStatus}</div>
            <Server size={40} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1 }} />
          </div>
        </div>

        {/* Agent Registry Table */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Agent Registry</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Name</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Owner</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Tasks</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{agent.name}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.875rem',
                      background: agent.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : agent.status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.1)',
                      color: agent.status === 'active' ? 'var(--success)' : agent.status === 'error' ? 'var(--danger)' : 'var(--text-secondary)'
                    }}>
                      {agent.status === 'active' && <CheckCircle2 size={14} />}
                      {agent.status === 'error' && <XCircle size={14} />}
                      {agent.status === 'idle' && <Clock size={14} />}
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{agent.owner}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{agent.tasks}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => toggleStatus(agent.id)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '6px' }} title={agent.status === 'active' ? 'Pause Agent' : 'Start Agent'}>
                        {agent.status === 'active' ? <Square size={16} /> : <Play size={16} />}
                      </button>
                      <button onClick={() => removeAgent(agent.id)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '6px', color: 'var(--danger)' }} title="Delete Agent">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {agents.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No agents deployed. Click "Deploy New Agent" to begin.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      {/* Deploy Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '400px', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem' }}>Deploy New Agent</h3>
            <form onSubmit={handleDeploy} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Agent Name</label>
                <input type="text" value={newAgentName} onChange={e => setNewAgentName(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} placeholder="e.g. SalesBot-X" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Owner</label>
                <input type="text" value={newAgentOwner} onChange={e => setNewAgentOwner(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} placeholder="e.g. Jane Doe" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Deploy</button>
            </form>
          </div>
        </div>
      )}
      {/* Logs Modal */}
      {isLogsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '800px', maxWidth: '90vw', height: '80vh', padding: '2rem', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => { setIsLogsModalOpen(false); setFlowLogs(''); }} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem' }}>Flow Execution Telemetry</h3>
            
            {flowTraces && flowTraces.length > 0 ? (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '1rem' }}>
                {flowTraces.map((trace, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: '1.25rem', borderLeft: `4px solid ${trace.event === 'LLM_CALL_START' ? 'var(--accent-primary)' : 'var(--success)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bot size={18} color="var(--text-secondary)" />
                        <span style={{ fontWeight: 600 }}>{trace.agent}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {trace.event === 'LLM_CALL_START' ? 'Prompt Sent' : 'Response Received'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(trace.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setExpandedTrace(expandedTrace === idx ? null : idx)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={14} /> {trace.event === 'LLM_CALL_START' ? 'System Prompt & Task' : 'LLM Output'}</span>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          {trace.event === 'LLM_CALL_END' && (
                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                              <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{trace.model || 'gemini-1.5'}</span>
                              <span style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{trace.latency_seconds || '1.2'}s</span>
                              <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>${trace.cost_usd || '0.0001'}</span>
                            </div>
                          )}
                          <ChevronDown size={16} style={{ transform: expandedTrace === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>
                      </div>
                      <div style={{ marginTop: '0.5rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: expandedTrace === idx ? 'none' : '60px', overflow: 'hidden', opacity: expandedTrace === idx ? 1 : 0.8 }}>
                        {expandedTrace === idx ? (trace.prompt_full || trace.response_full || trace.prompt_preview || trace.response_preview) : (trace.prompt_preview || trace.response_preview)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <pre style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {flowLogs || 'Waiting for Python framework execution...'}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
