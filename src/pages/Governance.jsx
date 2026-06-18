import React, { useState, useEffect } from 'react';
import { Shield, Key, Users, Search, Plus, ChevronDown, ChevronRight, Activity, Terminal, User } from 'lucide-react';

export default function Governance() {
  const [activeTab, setActiveTab] = useState('users');
  const [auditLogs, setAuditLogs] = useState([]);
  const [expandedLog, setExpandedLog] = useState(null);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetch('http://localhost:3001/api/audit/logs')
        .then(res => res.json())
        .then(data => setAuditLogs(data.logs || []))
        .catch(err => console.error("Failed to load audit logs", err));
    }
  }, [activeTab]);

  const users = [
    { name: 'Alice Smith', email: 'alice@company.com', role: 'Admin', status: 'Active' },
    { name: 'Bob Jones', email: 'bob@company.com', role: 'Developer', status: 'Active' },
    { name: 'Charlie Day', email: 'charlie@company.com', role: 'Viewer', status: 'Pending' },
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Governance Console</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Manage team access, RBAC policies, and secure API keys.</p>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <button onClick={() => setActiveTab('users')} className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '8px' }}><Users size={18}/> Users & Roles</button>
        <button onClick={() => setActiveTab('secrets')} className={`btn ${activeTab === 'secrets' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '8px' }}><Key size={18}/> Secrets Vault</button>
        <button onClick={() => setActiveTab('audit')} className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '8px' }}><Shield size={18}/> Audit Logs</button>
      </div>

      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '300px' }}>
              <Search size={18} color="var(--text-secondary)" />
              <input type="text" placeholder="Search users..." style={{ background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%' }} />
            </div>
            <button className="btn btn-primary"><Plus size={18}/> Invite User</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Name</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Email</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Role</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{user.name}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.8rem' }}>{user.role}</span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: user.status === 'Active' ? 'var(--success)' : 'var(--warning)' }}>{user.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'secrets' && (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
          <h3>API Key Vault</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Keys are encrypted at rest using AES-256 and only accessible by runtime agents.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>OpenAI API Key</label>
              <input type="password" value="sk-xxxxxxxxxxxxxxxxxxxx" readOnly style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-secondary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Gemini API Key</label>
              <input type="password" placeholder="Enter new API key..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
            </div>
            <button className="btn btn-primary" style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>Save to Vault</button>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={20} color="var(--accent-primary)"/> Immutable Audit Logs</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>30-day retention</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem', fontWeight: 500, width: '40px' }}></th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Time</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Actor</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Action</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Resource</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No audit logs found.</td>
                </tr>
              ) : auditLogs.map((log, idx) => {
                const isExpanded = expandedLog === idx;
                const date = new Date(log.timestamp).toLocaleString();
                
                let ActorIcon = User;
                let actorColor = '#00e676';
                if (log.actor === 'Agent') { ActorIcon = Terminal; actorColor = '#00f2fe'; }
                if (log.actor === 'System') { ActorIcon = Activity; actorColor = '#ff5252'; }

                return (
                  <React.Fragment key={idx}>
                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--border-color)', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }} onClick={() => setExpandedLog(isExpanded ? null : idx)}>
                      <td style={{ padding: '1rem' }}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{date}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ActorIcon size={14} color={actorColor} />
                          <span style={{ color: actorColor, fontWeight: 500 }}>{log.actor}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{log.action}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{log.resource}</td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                        <td colSpan="5" style={{ padding: '1rem 1rem 1.5rem 3.5rem' }}>
                          <div style={{ background: '#111', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <pre style={{ margin: 0, color: '#00f2fe', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
