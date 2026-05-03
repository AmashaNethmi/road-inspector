import React from 'react';

const IoTDetection = () => {
  return (
    <div className="module-page">
      <div className="module-header">
        <h1>IoT Edge Detection</h1>
        <p>Lead Researcher: Nethmi I.W.D.A (IT22082756)</p>
        <span className="badge badge-success" style={{marginTop: '0.5rem', display: 'inline-block'}}>Module Active</span>
      </div>
      
      <div className="dashboard-grid">
        <div className="glass-panel" style={{gridColumn: '1 / -1'}}>
          <h2>Live Edge Node Feeds</h2>
          <div style={{height: '400px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1rem', border: '1px solid var(--border-light)'}}>
            <p style={{color: 'var(--text-muted)'}}>Connecting to Amasha-IoT Edge Nodes...</p>
          </div>
        </div>

        <div className="glass-panel">
          <h3>Recent Detections (Edge Consensus)</h3>
          <ul style={{listStyle: 'none', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
            <li style={{padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between'}}>
              <span>Pothole (Critical)</span>
              <span style={{color: 'var(--text-muted)'}}>0.92 Conf</span>
            </li>
            <li style={{padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between'}}>
              <span>Longitudinal Crack</span>
              <span style={{color: 'var(--text-muted)'}}>0.85 Conf</span>
            </li>
          </ul>
        </div>
        
        <div className="glass-panel">
          <h3>Sensor Status</h3>
          <ul style={{listStyle: 'none', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
            <li style={{padding: '0.75rem', background: 'rgba(46, 204, 113, 0.1)', color: 'var(--success)', borderRadius: '6px'}}>Camera: Online (30 FPS)</li>
            <li style={{padding: '0.75rem', background: 'rgba(46, 204, 113, 0.1)', color: 'var(--success)', borderRadius: '6px'}}>LiDAR: Online (10Hz)</li>
            <li style={{padding: '0.75rem', background: 'rgba(46, 204, 113, 0.1)', color: 'var(--success)', borderRadius: '6px'}}>IMU/GPS: Online (Fix 3D)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IoTDetection;
