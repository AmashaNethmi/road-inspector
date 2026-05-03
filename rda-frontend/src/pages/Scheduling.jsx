import React from 'react';

const Scheduling = () => {
  return (
    <div className="module-page">
      <div className="module-header">
        <h1>Predictive Repair Scheduling</h1>
        <p>Lead Researcher: Manathunga M.A.D.V.G (IT22207968)</p>
        <span className="badge badge-success" style={{marginTop: '0.5rem', display: 'inline-block'}}>Module Active</span>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel">
          <h2>Optimal Paving Windows</h2>
          <div style={{marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{padding: '1rem', border: '1px solid var(--accent-primary)', borderRadius: '8px', background: 'rgba(0, 242, 254, 0.05)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                <h3 style={{fontSize: '1.1rem', color: 'var(--accent-primary)'}}>⭐ Top Recommendation</h3>
                <span className="badge badge-success">Score: 0.92</span>
              </div>
              <p style={{fontWeight: 'bold', fontSize: '1.2rem'}}>Tomorrow, 10:00 AM - 02:00 PM</p>
              <div style={{display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
                <span>🌤️ Temp: 28°C, Rain: 0mm</span>
                <span>🚗 Traffic: Light (Jam: 1.2)</span>
              </div>
            </div>

            <div style={{padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                <h3 style={{fontSize: '1.1rem'}}>✅ Alternative Window</h3>
                <span className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>Score: 0.78</span>
              </div>
              <p style={{fontWeight: 'bold', fontSize: '1.2rem'}}>Thursday, 11:00 AM - 03:00 PM</p>
              <div style={{display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
                <span>⛅ Temp: 31°C, Rain: 0mm</span>
                <span>🚗 Traffic: Moderate (Jam: 3.4)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <h2>Live Environmental Data</h2>
          <ul style={{listStyle: 'none', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
            <li style={{padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between'}}>
              <span>Current Weather</span>
              <span style={{color: 'var(--text-muted)'}}>Colombo (API)</span>
            </li>
            <li style={{padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between'}}>
              <span>Temperature</span>
              <span>29.5°C</span>
            </li>
            <li style={{padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between'}}>
              <span>Rainfall (1h)</span>
              <span>0.0 mm</span>
            </li>
            <li style={{padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between'}}>
              <span>TomTom Jam Factor</span>
              <span style={{color: 'var(--warning)'}}>6.2 / 10 (Peak)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Scheduling;
