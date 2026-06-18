import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Webhook, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

export default function Settings() {
  const { tenantId } = useTenant();
  const [webhooks, setWebhooks] = useState({});
  const [newUrl, setNewUrl] = useState('');
  const [newEvent, setNewEvent] = useState('*');
  const [loading, setLoading] = useState(true);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/webhooks', {
        headers: { 'X-Tenant-Id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.subscriptions || {});
      }
    } catch (err) {
      console.error("Failed to fetch webhooks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [tenantId]);

  const handleAddWebhook = async (e) => {
    e.preventDefault();
    if (!newUrl) return;
    
    try {
      const res = await fetch('http://localhost:3001/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': tenantId },
        body: JSON.stringify({ event_type: newEvent, url: newUrl })
      });
      if (res.ok) {
        setNewUrl('');
        fetchWebhooks();
      }
    } catch (err) {
      console.error("Failed to add webhook:", err);
    }
  };

  const handleDeleteWebhook = async (eventType, url) => {
    try {
      const res = await fetch('http://localhost:3001/api/webhooks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': tenantId },
        body: JSON.stringify({ event_type: eventType, url })
      });
      if (res.ok) {
        fetchWebhooks();
      }
    } catch (err) {
      console.error("Failed to delete webhook:", err);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '0.75rem', background: 'rgba(168,85,247,0.1)', borderRadius: '12px', color: '#a855f7' }}>
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Platform Settings</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Configure integrations and workspace preferences.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
          <Webhook color="#3b82f6" /> Event Webhooks
        </div>
        
        <form onSubmit={handleAddWebhook} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Event Type</label>
            <select 
              value={newEvent} 
              onChange={(e) => setNewEvent(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', padding: '0.75rem', borderRadius: '8px', outline: 'none' }}
            >
              <option value="*">All Events (*)</option>
              <option value="agent_created">agent_created</option>
              <option value="project_saved">project_saved</option>
              <option value="agent_start">agent_start (Python)</option>
              <option value="agent_complete">agent_complete (Python)</option>
            </select>
          </div>
          <div style={{ flex: 3 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Payload URL</label>
            <input 
              type="url" 
              placeholder="https://your-domain.com/webhook"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', padding: '0.75rem', borderRadius: '8px', outline: 'none' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', height: '44px' }}>
            <Plus size={18} /> Add Webhook
          </button>
        </form>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading webhooks...</div>
        ) : Object.keys(webhooks).length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
            <ShieldAlert size={32} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
            <div style={{ color: 'var(--text-secondary)' }}>No webhooks configured for this tenant.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(webhooks).map(([event, urls]) => 
              urls.map((url, idx) => (
                <div key={`${event}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div>
                    <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, marginRight: '1rem' }}>
                      {event}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{url}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteWebhook(event, url)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                    title="Remove Webhook"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
