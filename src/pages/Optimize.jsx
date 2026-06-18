import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, Activity, Server, Zap, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

export default function Optimize() {
  const { tenantId } = useTenant();
  const [wallet, setWallet] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, analyticsRes] = await Promise.all([
          fetch('http://localhost:3001/api/wallet', { headers: { 'X-Tenant-Id': tenantId } }).then(res => res.json()),
          fetch('http://localhost:3001/api/analytics/cost', { headers: { 'X-Tenant-Id': tenantId } }).then(res => res.json())
        ]);
        setWallet(walletRes);
        setAnalytics(analyticsRes);
      } catch (err) {
        console.error("Failed to fetch cost data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !analytics) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <Activity className="animate-spin" style={{ marginRight: '0.5rem' }} /> Loading Analytics...
      </div>
    );
  }

  // Find max input to scale the bars
  const maxToken = Math.max(...analytics.tokenUsage.map(d => d.input + d.output));

  return (
    <div className="dashboard animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap color="var(--accent-primary)" /> Optimize & Save
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Smart Routing Cost Analytics and Wallet Overview</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Period: Last 7 Days</span>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            Export PDF <ChevronDown size={14} style={{ marginLeft: '0.25rem' }} />
          </button>
        </div>
      </header>

      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Wallet Balance */}
        <div className="glass-panel" style={{ padding: '2rem', position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>Available API Credits</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center' }}>
            <DollarSign size={32} color="var(--accent-primary)" style={{ marginRight: '-0.2rem' }} />
            {wallet?.balance?.toFixed(2) || '0.00'}
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
            <CheckCircle2 size={16} /> Auto-refill enabled
          </div>
        </div>

        {/* Smart Routing Savings */}
        <div className="glass-panel" style={{ padding: '2rem', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0) 100%)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>Saved via Smart Routing (30d)</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center' }}>
            ${analytics.totalSavings30d.toFixed(2)}
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
            <TrendingDown size={16} /> {analytics.smartRoutingImpact} vs Baseline
          </div>
        </div>

        {/* Average Cost per Run */}
        <div className="glass-panel" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>Avg Cost Per Agent Run</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center' }}>
            $0.024
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <Activity size={16} /> Down 12% from last week
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Token Usage Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Token Consumption Over Time</h3>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flex: 1, padding: '1rem 0', gap: '1rem' }}>
            {analytics.tokenUsage.map((dayData, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.5rem' }}>
                <div style={{ width: '100%', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', padding: '2px', position: 'relative' }}>
                  {/* Tooltip on hover could go here */}
                  <div style={{ 
                    width: '100%', 
                    height: `${(dayData.output / maxToken) * 100}%`, 
                    background: 'var(--accent-secondary)', 
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 1s ease-out'
                  }} title={`Output: ${dayData.output}M`}></div>
                  <div style={{ 
                    width: '100%', 
                    height: `${(dayData.input / maxToken) * 100}%`, 
                    background: 'var(--accent-primary)', 
                    borderRadius: dayData.output === 0 ? '2px 2px 0 0' : '0',
                    transition: 'height 1s ease-out'
                  }} title={`Input: ${dayData.input}M`}></div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{dayData.day}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--accent-primary)' }}></div> Input Tokens (Millions)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--accent-secondary)' }}></div> Output Tokens (Millions)
            </div>
          </div>
        </div>

        {/* Cost by Agent */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Cost By Agent</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {analytics.agentCosts.map((agent, idx) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', transition: 'transform 0.2s, border-color 0.2s', cursor: 'default' }} onMouseOver={e => {e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--accent-primary)';}} onMouseOut={e => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)';}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{agent.name}</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>${agent.cost.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Server size={14} /> {agent.runs} runs
                  </div>
                  <div>Avg: ${(agent.cost / agent.runs).toFixed(3)}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', background: 'rgba(168, 85, 247, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <div style={{ fontSize: '0.85rem', color: '#d8b4fe', marginBottom: '0.25rem', fontWeight: 600 }}>Pro Tip</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              "ReportGen-Beta" is consuming 68% of your budget. Consider downgrading its model from GPT-4o to Gemini 2.5 Flash in the Studio.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
