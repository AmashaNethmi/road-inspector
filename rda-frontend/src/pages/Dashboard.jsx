import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, AlertTriangle, ShieldCheck, Map } from 'lucide-react';

const mockData = [
  { name: 'Mon', defects: 40, repaired: 24 },
  { name: 'Tue', defects: 30, repaired: 13 },
  { name: 'Wed', defects: 20, repaired: 38 },
  { name: 'Thu', defects: 27, repaired: 39 },
  { name: 'Fri', defects: 18, repaired: 48 },
  { name: 'Sat', defects: 23, repaired: 38 },
  { name: 'Sun', defects: 34, repaired: 43 },
];

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="module-header">
        <h1>RDA Central Command Dashboard</h1>
        <p>Real-time road infrastructure monitoring and repair management</p>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span className="stat-title">Active Edge Nodes</span>
            <Activity color="#00f2fe" />
          </div>
          <span className="stat-value">24<span className="stat-accent">/25</span></span>
          <span style={{color: 'var(--success)', fontSize: '0.875rem'}}>96% Online</span>
        </div>

        <div className="glass-panel stat-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span className="stat-title">Critical Defects Detected</span>
            <AlertTriangle color="#ff4b4b" />
          </div>
          <span className="stat-value">142</span>
          <span style={{color: 'var(--danger)', fontSize: '0.875rem'}}>+12% from last week</span>
        </div>

        <div className="glass-panel stat-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span className="stat-title">Material Budgets Optimized</span>
            <ShieldCheck color="#2ecc71" />
          </div>
          <span className="stat-value">LKR 4.2M</span>
          <span style={{color: 'var(--success)', fontSize: '0.875rem'}}>Saved this month</span>
        </div>
      </div>

      <div className="dashboard-grid" style={{gridTemplateColumns: '2fr 1fr'}}>
        <div className="glass-panel">
          <h3>Defect Detection vs Repair Flow</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="colorDefects" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4b4b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ff4b4b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRepaired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#a0a5b1" />
                <YAxis stroke="#a0a5b1" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(19, 20, 28, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="defects" stroke="#ff4b4b" fillOpacity={1} fill="url(#colorDefects)" />
                <Area type="monotone" dataKey="repaired" stroke="#00f2fe" fillOpacity={1} fill="url(#colorRepaired)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel">
          <h3>Recent Priority Alerts</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
            <div style={{padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid #ff4b4b'}}>
              <h4 style={{marginBottom: '0.25rem'}}>Critical Pothole - A1 Highway</h4>
              <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>Detected 10 mins ago. Volume: 0.15m³</p>
            </div>
            <div style={{padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid #f5a623'}}>
              <h4 style={{marginBottom: '0.25rem'}}>Heavy Rain Warning</h4>
              <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>Pausing 3 scheduled repairs tomorrow.</p>
            </div>
            <div style={{padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid #00f2fe'}}>
              <h4 style={{marginBottom: '0.25rem'}}>Material Delivery</h4>
              <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>Asphalt arriving at Colombo Depot.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
