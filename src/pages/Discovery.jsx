import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, Zap, Target, Clock } from 'lucide-react';

export default function Discovery() {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [prompt, setPrompt] = useState('');

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      }
    } catch (err) {
      console.error("Discovery failed", err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Discovery Hub</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>AI-powered automation planning based on billions of real agent executions.</p>
      </header>

      {!results ? (
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <Sparkles size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h3>What should we automate?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Describe your team's most repetitive tasks, or connect your ticketing system to discover high-ROI agent use cases.</p>
          
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. My sales team spends 3 hours a day researching prospects on LinkedIn before writing cold emails..."
            style={{ width: '100%', height: '120px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', resize: 'none', marginBottom: '1.5rem' }}
          ></textarea>
          
          <button 
            onClick={handleAnalyze} 
            disabled={analyzing}
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', fontSize: '1.1rem', padding: '0.75rem' }}
          >
            {analyzing ? 'Analyzing Billions of Executions...' : <><Search size={20}/> Discover Use Cases</>}
          </button>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Recommended Automations</h3>
            <button className="btn btn-secondary" onClick={() => setResults(null)}>Start Over</button>
          </div>
          
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {results.map((res, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${res.impact === 'High' ? 'var(--success)' : 'var(--accent-primary)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{res.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '80%' }}>{res.description}</p>
                  </div>
                  <button className="btn btn-primary"><Sparkles size={16}/> Build Agent</button>
                </div>
                
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Target size={16} color="var(--success)" />
                    <span style={{ color: 'var(--text-secondary)' }}>Impact: </span>
                    <strong>{res.impact}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} color="var(--accent-primary)" />
                    <span style={{ color: 'var(--text-secondary)' }}>Effort: </span>
                    <strong>{res.effort}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={16} color="#fbbf24" />
                    <span style={{ color: 'var(--text-secondary)' }}>Expected ROI: </span>
                    <strong>High</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
