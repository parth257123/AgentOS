import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Target, Settings2, ChevronDown, Search, Calculator, FileText, Code, Globe, Zap, Clock, Settings } from 'lucide-react';

const toolIcons = {
  web_search: { icon: Search, label: 'Search the Internet' },
  calculator: { icon: Calculator, label: 'Calculator' },
  file_reader: { icon: FileText, label: 'File Reader' },
  code_interpreter: { icon: Code, label: 'Code Interpreter' },
  scraper: { icon: Globe, label: 'Web Scraper' }
};

export const AgentNode = ({ data }) => {
  const modelName = data.model ? data.model.split('/').pop() : 'gpt-5.4'; 
  const isDark = data.theme === 'dark';
  
  return (
    <div style={{ 
      background: isDark ? 'rgba(20, 20, 30, 0.95)' : 'white', 
      border: isDark ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid #bfdbfe', 
      borderRadius: '8px', 
      width: '280px', 
      color: isDark ? 'white' : '#0f172a', 
      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.03)',
      overflow: 'hidden'
    }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={16} color={isDark ? "#818cf8" : "#3b82f6"} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.2 }}>{data.name || 'Unnamed Agent'}</div>
          <div style={{ fontSize: '0.7rem', color: isDark ? 'var(--text-secondary)' : '#64748b', marginTop: '1px' }}>{data.role || 'Agent'}</div>
        </div>
      </div>
      
      <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: isDark ? 'var(--text-secondary)' : '#475569', lineHeight: 1.4 }}>
        {data.goal ? (data.goal.length > 80 ? data.goal.substring(0, 80) + '...' : data.goal) : 'No goal set'}
      </div>
      
      <div style={{ padding: '0 1rem 0.5rem 1rem' }}>
        <span style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          background: isDark ? 'rgba(99, 102, 241, 0.1)' : '#f8fafc', 
          color: isDark ? '#818cf8' : '#334155', 
          padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600
        }}>
          <Settings2 size={12} /> {modelName}
        </span>
      </div>
      
      {data.tools && data.tools.length > 0 && (
        <div style={{ padding: '0 1rem 0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.tools.map(t => {
            const toolInfo = toolIcons[t] || { icon: Search, label: t };
            const ToolIcon = toolInfo.icon;
            return (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: isDark ? 'var(--text-secondary)' : '#334155', fontWeight: 500 }}>
                <ToolIcon size={14} color={isDark ? "#818cf8" : "#0f172a"} />
                {toolInfo.label}
              </div>
            );
          })}
        </div>
      )}
      
      {(!data.tools || data.tools.length === 0) && (
        <div style={{ margin: '0 1rem 0.75rem 1rem', padding: '0.75rem', fontSize: '0.7rem', color: isDark ? 'rgba(255,255,255,0.2)' : '#94a3b8', border: isDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed #cbd5e1', borderRadius: '4px', textAlign: 'center' }}>
          Drop tools here
        </div>
      )}
      
      <div style={{ padding: '0.5rem 1rem', borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Settings size={14} color={isDark ? "#818cf8" : "#3b82f6"} style={{ cursor: 'pointer' }} />
      </div>

      <Handle type="target" position={Position.Top} id="agent-in-top" style={{ background: isDark ? '#818cf8' : '#3b82f6', width: '10px', height: '10px', border: `2px solid ${isDark ? 'rgba(20,20,30,0.95)' : 'white'}` }} />
      <Handle type="target" position={Position.Left} id="agent-in-left" style={{ background: isDark ? '#818cf8' : '#3b82f6', width: '10px', height: '10px', border: `2px solid ${isDark ? 'rgba(20,20,30,0.95)' : 'white'}` }} />
      <Handle type="source" position={Position.Right} id="agent-out-right" style={{ background: isDark ? '#818cf8' : '#3b82f6', width: '10px', height: '10px', border: `2px solid ${isDark ? 'rgba(20,20,30,0.95)' : 'white'}` }} />
      <Handle type="source" position={Position.Bottom} id="agent-out-bottom" style={{ background: isDark ? '#818cf8' : '#3b82f6', width: '10px', height: '10px', border: `2px solid ${isDark ? 'rgba(20,20,30,0.95)' : 'white'}` }} />
    </div>
  );
};

export const TaskNode = ({ data }) => {
  const isDark = data.theme === 'dark';
  return (
    <div style={{ 
      background: isDark ? 'rgba(20, 20, 30, 0.95)' : 'white', 
      border: isDark ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #bfdbfe', 
      borderRadius: '8px', 
      width: '280px', 
      color: isDark ? 'white' : '#0f172a', 
      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.03)',
      overflow: 'hidden'
    }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Target size={16} color={isDark ? "#34d399" : "#3b82f6"} />
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.2 }}>{data.name || 'Unnamed Task'}</div>
          {data.asyncExecution && (
            <span style={{ background: isDark ? 'rgba(168, 85, 247, 0.2)' : '#f3e8ff', color: '#a855f7', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 600 }}>Async</span>
          )}
        </div>
      </div>
      
      <div style={{ padding: '0.5rem 1rem 0.75rem 1rem', fontSize: '0.75rem', color: isDark ? 'var(--text-secondary)' : '#475569', lineHeight: 1.4 }}>
        {data.description ? (data.description.length > 100 ? data.description.substring(0, 100) + '...' : data.description) : 'No description'}
      </div>
      
      <div style={{ padding: '0.5rem 1rem', borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
        <Settings size={14} color={isDark ? "#34d399" : "#3b82f6"} style={{ cursor: 'pointer' }} />
      </div>

      <Handle type="target" position={Position.Top} id="task-agent-in" style={{ background: isDark ? '#10b981' : '#3b82f6', width: '10px', height: '10px', border: `2px solid ${isDark ? 'rgba(20,20,30,0.95)' : 'white'}` }} />
      <Handle type="target" position={Position.Left} id="task-flow-in" style={{ background: isDark ? '#10b981' : '#3b82f6', width: '10px', height: '10px', border: `2px solid ${isDark ? 'rgba(20,20,30,0.95)' : 'white'}` }} />
      <Handle type="source" position={Position.Right} id="task-flow-out" style={{ background: isDark ? '#10b981' : '#3b82f6', width: '10px', height: '10px', border: `2px solid ${isDark ? 'rgba(20,20,30,0.95)' : 'white'}` }} />
      <Handle type="source" position={Position.Bottom} id="task-flow-out-bottom" style={{ background: isDark ? '#10b981' : '#3b82f6', width: '10px', height: '10px', border: `2px solid ${isDark ? 'rgba(20,20,30,0.95)' : 'white'}` }} />
    </div>
  );
};

export const TriggerNode = ({ data }) => {
  const [activeTab, setActiveTab] = React.useState(null);
  const isDark = data.theme === 'dark';
  
  const handleClick = (tab) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  return (
    <div style={{ 
      background: isDark ? 'rgba(20, 20, 30, 0.95)' : 'white', 
      border: isDark ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(0,0,0,0.1)', 
      borderRadius: '8px', 
      width: '180px', 
      color: isDark ? 'white' : '#333', 
      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
      overflow: 'hidden'
    }}>
      <div style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ background: isDark ? 'rgba(168, 85, 247, 0.15)' : '#f1f5f9', padding: '0.35rem', borderRadius: '6px' }}>
          <Settings size={16} color={isDark ? "#a855f7" : "#64748b"} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: isDark ? 'white' : '#1e293b' }}>Triggers</div>
          <div style={{ fontSize: '0.65rem', color: isDark ? 'var(--text-secondary)' : '#64748b', marginTop: '2px' }}>
            {activeTab ? `1 active trigger` : `No triggers configured`}
          </div>
        </div>
      </div>
      
      <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div 
          onClick={() => handleClick('event')}
          style={{ padding: '0.4rem', border: activeTab === 'event' ? `1px solid ${isDark ? '#a855f7' : '#3b82f6'}` : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, borderRadius: '4px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', cursor: 'pointer', background: activeTab === 'event' ? (isDark ? 'rgba(168, 85, 247, 0.1)' : '#eff6ff') : (isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc') }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Zap size={12} color={activeTab === 'event' ? (isDark ? "#d8b4fe" : "#3b82f6") : (isDark ? "var(--text-secondary)" : "#64748b")} /> <span style={{ color: activeTab === 'event' ? (isDark ? "#d8b4fe" : "#1d4ed8") : "inherit", fontWeight: activeTab === 'event' ? 600 : 400 }}>Event</span>
          </div>
          {activeTab === 'event' && (
            <input type="text" placeholder="Webhook URL..." style={{ width: '100%', fontSize: '0.65rem', padding: '0.2rem', border: `1px solid ${isDark ? 'rgba(168, 85, 247, 0.4)' : '#bfdbfe'}`, borderRadius: '2px', background: isDark ? 'rgba(0,0,0,0.3)' : 'white', color: isDark ? 'white' : 'black' }} onClick={(e) => e.stopPropagation()} />
          )}
        </div>
        
        <div 
          onClick={() => handleClick('schedule')}
          style={{ padding: '0.4rem', border: activeTab === 'schedule' ? `1px solid ${isDark ? '#a855f7' : '#3b82f6'}` : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, borderRadius: '4px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', cursor: 'pointer', background: activeTab === 'schedule' ? (isDark ? 'rgba(168, 85, 247, 0.1)' : '#eff6ff') : (isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc') }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={12} color={activeTab === 'schedule' ? (isDark ? "#d8b4fe" : "#3b82f6") : (isDark ? "var(--text-secondary)" : "#64748b")} /> <span style={{ color: activeTab === 'schedule' ? (isDark ? "#d8b4fe" : "#1d4ed8") : "inherit", fontWeight: activeTab === 'schedule' ? 600 : 400 }}>Schedule</span>
          </div>
          {activeTab === 'schedule' && (
            <input type="text" placeholder="Cron (* * * * *)" style={{ width: '100%', fontSize: '0.65rem', padding: '0.2rem', border: `1px solid ${isDark ? 'rgba(168, 85, 247, 0.4)' : '#bfdbfe'}`, borderRadius: '2px', background: isDark ? 'rgba(0,0,0,0.3)' : 'white', color: isDark ? 'white' : 'black' }} onClick={(e) => e.stopPropagation()} />
          )}
        </div>
        
        <div 
          onClick={() => handleClick('manage')}
          style={{ padding: '0.4rem', border: activeTab === 'manage' ? `1px solid ${isDark ? '#a855f7' : '#3b82f6'}` : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, borderRadius: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', background: activeTab === 'manage' ? (isDark ? 'rgba(168, 85, 247, 0.1)' : '#eff6ff') : (isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc') }}
        >
          <Settings2 size={12} color={activeTab === 'manage' ? (isDark ? "#d8b4fe" : "#3b82f6") : (isDark ? "var(--text-secondary)" : "#64748b")} /> <span style={{ color: activeTab === 'manage' ? (isDark ? "#d8b4fe" : "#1d4ed8") : "inherit", fontWeight: activeTab === 'manage' ? 600 : 400 }}>Manage</span>
        </div>
      </div>

      <Handle type="target" position={Position.Top} id="trigger-in-top" style={{ background: isDark ? '#a855f7' : '#9333ea', width: '10px', height: '10px', border: `2px solid ${isDark ? 'rgba(20,20,30,0.95)' : 'white'}` }} />
      <Handle type="target" position={Position.Left} id="trigger-in-left" style={{ background: isDark ? '#a855f7' : '#9333ea', width: '10px', height: '10px', border: `2px solid ${isDark ? 'rgba(20,20,30,0.95)' : 'white'}` }} />
      <Handle type="source" position={Position.Right} id="trigger-out-right" style={{ background: isDark ? '#a855f7' : '#9333ea', width: '10px', height: '10px', border: `2px solid ${isDark ? 'rgba(20,20,30,0.95)' : 'white'}` }} />
      <Handle type="source" position={Position.Bottom} id="trigger-out-bottom" style={{ background: isDark ? '#a855f7' : '#9333ea', width: '10px', height: '10px', border: `2px solid ${isDark ? 'rgba(20,20,30,0.95)' : 'white'}` }} />
    </div>
  );
};
