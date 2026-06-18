import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Home, Activity, Settings, Users, Server, Search, Edit3, BarChart, Menu, ShoppingCart, Building } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

export default function Sidebar() {
  const location = useLocation();
  const path = location.pathname;
  const [isExpanded, setIsExpanded] = useState(true);
  const { tenantId, setTenantId } = useTenant();

  const NavLink = ({ to, icon: Icon, label }) => (
    <Link to={to} style={{ 
      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px',
      background: path === to ? 'rgba(255,255,255,0.1)' : 'transparent',
      color: path === to ? 'var(--text-primary)' : 'var(--text-secondary)',
      justifyContent: isExpanded ? 'flex-start' : 'center'
    }} title={!isExpanded ? label : undefined}>
      <Icon size={18} /> {isExpanded && label}
    </Link>
  );

  return (
    <aside className="glass-panel" style={{ width: isExpanded ? '250px' : '80px', transition: 'width 0.3s ease', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem', borderRight: '1px solid var(--border-color)', borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0, height: '100vh', position: 'sticky', top: 0, overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center', fontWeight: 600, fontSize: '1.25rem' }}>
        {isExpanded && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bot color="var(--accent-primary)" /> AgentOS</div>}
        <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}>
          <Menu size={20} />
        </button>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', marginTop: '1rem', textAlign: isExpanded ? 'left' : 'center' }}>
          {isExpanded ? 'Platform' : '---'}
        </div>
        <NavLink to="/dashboard" icon={Activity} label="Control Plane" />
        <NavLink to="/dashboard/discovery" icon={Search} label="Discovery Hub" />
        <NavLink to="/dashboard/studio" icon={Edit3} label="Studio Canvas" />
        <NavLink to="/dashboard/performance" icon={BarChart} label="Performance" />
        <NavLink to="/dashboard/marketplace" icon={ShoppingCart} label="Template Store" />
        
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', marginTop: '1rem', textAlign: isExpanded ? 'left' : 'center' }}>
          {isExpanded ? 'Enterprise' : '---'}
        </div>
        <NavLink to="/dashboard/governance" icon={Users} label="Governance" />
        <NavLink to="/dashboard/optimize" icon={BarChart} label="Optimize" />
        <NavLink to="/dashboard/registry" icon={Server} label="Agent Registry" />
        <NavLink to="/dashboard/settings" icon={Settings} label="Settings" />
      </nav>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isExpanded ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Building size={14} /> Active Tenant
            </div>
            <select 
              value={tenantId} 
              onChange={(e) => setTenantId(e.target.value)}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem', borderRadius: '4px', fontSize: '0.9rem', outline: 'none' }}
            >
              <option value="tenant_A" style={{ background: '#1e293b' }}>Acme Corp (Tenant A)</option>
              <option value="tenant_B" style={{ background: '#1e293b' }}>Globex Inc (Tenant B)</option>
              <option value="default_tenant" style={{ background: '#1e293b' }}>Default Workspace</option>
            </select>
          </div>
        ) : (
          <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'center', color: 'var(--accent-primary)' }} title={`Active Tenant: ${tenantId}`}>
            <Building size={20} />
          </div>
        )}
        <Link to="/" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: isExpanded ? '0.75rem' : '0.75rem 0' }} title={!isExpanded ? 'Exit to Site' : undefined}>
          <Home size={18} /> {isExpanded && 'Exit to Site'}
        </Link>
      </div>
    </aside>
  );
}
