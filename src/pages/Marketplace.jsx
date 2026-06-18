import React, { useState, useEffect } from 'react';
import './Marketplace.css';

const Marketplace = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [installingId, setInstallingId] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/marketplace/templates')
      .then(res => res.json())
      .then(data => {
        setTemplates(data.templates || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load templates", err);
        setLoading(false);
      });
  }, []);

  const handleInstall = (id) => {
    setInstallingId(id);
    fetch(`http://localhost:3001/api/marketplace/install/${id}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setTimeout(() => setInstallingId(null), 500); // Small delay for UX
        alert(`Successfully installed template as new agent: ${data.installedAgent.name}`);
      })
      .catch(err => {
        console.error("Install failed", err);
        setInstallingId(null);
      });
  };

  const categories = ['All', 'Finance', 'Engineering', 'Support'];
  
  const filteredTemplates = filter === 'All' 
    ? templates 
    : templates.filter(t => t.category === filter);

  if (loading) {
    return (
      <div className="marketplace-loading">
        <div className="spinner"></div>
        <p>Loading Agent Store...</p>
      </div>
    );
  }

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <h1>Workflow Templates</h1>
        <p>Discover and deploy pre-built agentic meshes into your tenant with a single click.</p>
        
        <div className="marketplace-filters">
          {categories.map(c => (
            <button 
              key={c} 
              className={`filter-btn ${filter === c ? 'active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      <div className="templates-grid">
        {filteredTemplates.map(template => (
          <div key={template.id} className="template-card glass-panel">
            <div className="card-header">
              <span className={`category-badge ${template.category.toLowerCase()}`}>{template.category}</span>
              <span className="price-tag">{template.price}</span>
            </div>
            
            <h3>{template.title}</h3>
            <p className="author">by <strong>{template.author}</strong></p>
            <p className="description">{template.description}</p>
            
            <div className="card-stats">
              <span className="rating">⭐ {template.rating}</span>
              <span className="downloads">⬇️ {(template.downloads / 1000).toFixed(1)}k installs</span>
            </div>
            
            <div className="card-footer">
              <button 
                className={`install-btn ${installingId === template.id ? 'installing' : ''}`}
                onClick={() => handleInstall(template.id)}
                disabled={installingId === template.id}
              >
                {installingId === template.id ? 'Installing...' : 'Install Template'}
              </button>
            </div>
          </div>
        ))}
        {filteredTemplates.length === 0 && (
          <p className="no-results">No templates found for this category.</p>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
