import React, { useState, useEffect } from 'react';
import './Performance.css';

const Performance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/analytics/performance')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load performance analytics", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="perf-loading-container">
        <div className="perf-spinner"></div>
        <p>Loading Telemetry Streams...</p>
      </div>
    );
  }

  return (
    <div className="perf-dashboard">
      <header className="perf-header">
        <h1>Agent Performance Analytics</h1>
        <p>Real-time telemetry, routing, and A/B Testing results.</p>
      </header>

      {/* Top KPIs */}
      <section className="perf-kpis">
        <div className="kpi-card glass-panel">
          <div className="kpi-icon latency-icon">⚡</div>
          <div className="kpi-info">
            <h3>Avg Latency</h3>
            <div className="kpi-value">{data.kpis.avgLatency} <span className="kpi-trend positive">{data.kpis.latencyTrend}</span></div>
          </div>
        </div>
        <div className="kpi-card glass-panel">
          <div className="kpi-icon success-icon">✓</div>
          <div className="kpi-info">
            <h3>Task Success Rate</h3>
            <div className="kpi-value">{data.kpis.successRate} <span className="kpi-trend positive">{data.kpis.successTrend}</span></div>
          </div>
        </div>
        <div className="kpi-card glass-panel">
          <div className="kpi-icon loop-icon">⟳</div>
          <div className="kpi-info">
            <h3>Loop Mitigations</h3>
            <div className="kpi-value">{data.kpis.loopMitigations} <span className="kpi-subtext">Prevented</span></div>
          </div>
        </div>
      </section>

      <div className="perf-grid">
        {/* A/B Testing Component */}
        <section className="perf-ab-tests glass-panel">
          <h2>Active A/B Experiments</h2>
          <div className="ab-list">
            {data.abTests.map((test, i) => (
              <div key={i} className="ab-experiment">
                <h3>{test.experimentName}</h3>
                <div className="ab-variants">
                  {test.variants.map((variant, j) => (
                    <div key={j} className={`ab-variant-card ${variant.isWinner ? 'winner' : ''}`}>
                      {variant.isWinner && <div className="winner-badge">🏆 Winner</div>}
                      <h4>{variant.name}</h4>
                      <div className="variant-metric">
                        <span>Success:</span> <strong>{variant.successRate}%</strong>
                      </div>
                      <div className="variant-metric">
                        <span>Latency:</span> <strong>{variant.avgLatency}s</strong>
                      </div>
                      <div className="variant-metric">
                        <span>Cost:</span> <strong>${variant.avgCost}</strong>
                      </div>
                      <div className="variant-metric">
                        <span>Samples:</span> <strong>{variant.executions}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Telemetry Feed */}
        <section className="perf-telemetry glass-panel">
          <h2>Live Execution Feed</h2>
          <div className="telemetry-list">
            {data.liveTelemetry.map((log, i) => (
              <div key={i} className="telemetry-item">
                <div className="tel-header">
                  <span className="tel-id">{log.id}</span>
                  <span className="tel-time">{log.time}</span>
                </div>
                <div className="tel-body">
                  <span className="tel-agent">{log.agent}</span>
                  <span className={`tel-status ${log.status.toLowerCase().includes('fail') ? 'fail' : 'success'}`}>
                    {log.status}
                  </span>
                  <span className="tel-latency">{log.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Performance;
