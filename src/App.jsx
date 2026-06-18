import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Governance from './pages/Governance';
import Discovery from './pages/Discovery';
import Studio from './pages/Studio';
import Optimize from './pages/Optimize';
import Performance from './pages/Performance';
import Marketplace from './pages/Marketplace';
import DashboardLayout from './components/DashboardLayout';
import { AgentProvider } from './context/AgentContext';
import './App.css';

function App() {
  return (
    <AgentProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="governance" element={<Governance />} />
            <Route path="discovery" element={<Discovery />} />
            <Route path="studio" element={<Studio />} />
            <Route path="optimize" element={<Optimize />} />
            <Route path="performance" element={<Performance />} />
            <Route path="marketplace" element={<Marketplace />} />
            {/* Fallbacks for other sidebar links */}
            <Route path="*" element={<div style={{padding: '2rem'}}><h2>Coming Soon</h2><p>This module is under construction.</p></div>} />
          </Route>
        </Routes>
      </Router>
    </AgentProvider>
  );
}

export default App;
