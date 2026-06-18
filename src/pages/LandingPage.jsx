import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ArrowRight, Zap, Shield, Activity, Terminal, LayoutDashboard, Cpu } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="landing-page animate-fade-in" style={{ position: 'relative' }}>
      
      {/* Navbar */}
      <nav className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
          <div style={{ background: 'linear-gradient(135deg, #60a5fa, #a855f7)', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
            <Bot color="white" size={20} />
          </div>
          AgentOS
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='var(--text-secondary)'}>Documentation</Link>
          <Link to="/dashboard" className="btn btn-secondary" style={{ marginLeft: '1rem' }}>Login</Link>
          <Link to="/dashboard" className="btn btn-primary">Start Building</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container" style={{ paddingTop: '8rem', paddingBottom: '6rem', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.4rem 1rem', borderRadius: '99px', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 600, marginBottom: '2rem', animation: 'fadeIn 1s ease 0.2s both' }}>
          <SparkleIcon /> AgentOS 1.0 is now live
        </div>

        <h1 style={{ fontSize: '5.5rem', lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-0.04em' }} className="animate-fade-in">
          The Operating System<br />
          <span className="text-gradient-primary">for Autonomous AI.</span>
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto 3rem auto', lineHeight: 1.6, animation: 'fadeIn 1s ease 0.4s both' }}>
          Design, deploy, and manage multi-agent workflows at enterprise scale. AgentOS provides the observability and execution engine you need for mission-critical AI.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '5rem', animation: 'fadeIn 1s ease 0.6s both' }}>
          <Link to="/dashboard" className="btn btn-primary hover-lift" style={{ padding: '1rem 2rem', fontSize: '1.05rem', borderRadius: '8px' }}>
            Enter Dashboard <ArrowRight size={18} />
          </Link>
          <button className="btn btn-secondary hover-lift" style={{ padding: '1rem 2rem', fontSize: '1.05rem', borderRadius: '8px' }}>
            <Terminal size={18} /> View CLI Docs
          </button>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', textAlign: 'left', animation: 'fadeIn 1s ease 0.8s both' }}>
          <FeatureCard 
            icon={<LayoutDashboard color="#3b82f6" size={24} />}
            title="Visual Orchestration"
            desc="Coordinate complex multi-agent workflows with our interactive node-based canvas."
          />
          <FeatureCard 
            icon={<Activity color="#10b981" size={24} />}
            title="Real-time Observability"
            desc="Monitor task completion, agent health, DAG bottlenecks, and system metrics live."
          />
          <FeatureCard 
            icon={<Shield color="#a855f7" size={24} />}
            title="Enterprise Security"
            desc="Multi-tenant isolation, granular permissions, and comprehensive audit logs built-in."
          />
          <FeatureCard 
            icon={<Cpu color="#f59e0b" size={24} />}
            title="Any LLM, Anywhere"
            desc="Seamlessly switch between OpenAI, Gemini, and local Ollama models with smart routing."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="glass-panel hover-lift" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
