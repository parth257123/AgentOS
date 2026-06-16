import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ArrowRight, Zap, Shield, Activity } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="landing-page animate-fade-in">
      <nav className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '1.25rem' }}>
          <Bot color="var(--accent-primary)" />
          AgentOS
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/dashboard" className="btn btn-secondary">Login</Link>
          <Link to="/dashboard" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          The Operating System<br />for Enterprise AI Agents
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          Deploy, manage, and monitor your autonomous workforce at scale. AgentOS provides the visibility and control you need for mission-critical AI.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '5rem' }}>
          <Link to="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            Enter Dashboard <ArrowRight size={20} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', textAlign: 'left' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <Activity color="var(--accent-primary)" size={32} style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Real-time Observability</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Monitor task completion, agent health, and system metrics from a centralized dashboard.</p>
          </div>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <Shield color="var(--success)" size={32} style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Enterprise Security</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Granular permissions, secure credential management, and comprehensive audit logs.</p>
          </div>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <Zap color="var(--warning)" size={32} style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Instant Orchestration</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Coordinate multi-agent workflows with ease using our visual orchestration engine.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
