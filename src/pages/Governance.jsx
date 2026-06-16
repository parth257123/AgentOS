import React, { useState } from 'react';
import { Shield, Key, Users, Search, Plus } from 'lucide-react';

export default function Governance() {
  const [activeTab, setActiveTab] = useState('users');

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
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Shield size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3>Immutable Audit Logs</h3>
          <p>This workspace is configured with 30-day log retention.</p>
        </div>
      )}
    </div>
  );
}
