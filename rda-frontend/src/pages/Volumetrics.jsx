import React from 'react';

const Volumetrics = () => {
  return (
    <div className="module-page">
      <div className="module-header">
        <h1>Semantic Segmentation & Volumetrics</h1>
        <p>Lead Researcher: Walallawita K.L.T.D (IT22252340)</p>
        <span className="badge badge-success" style={{marginTop: '0.5rem', display: 'inline-block'}}>Module Active</span>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel" style={{gridColumn: '1 / -1'}}>
          <h2>3D Volumetric Modeller Engine</h2>
          <div style={{display: 'flex', gap: '1rem', marginTop: '1rem', height: '300px'}}>
            <div style={{flex: 1, background: 'rgba(0,0,0,0.5)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)'}}>
              <p style={{color: 'var(--text-muted)'}}>2D Feature Mask</p>
            </div>
            <div style={{flex: 1, background: 'rgba(0,0,0,0.5)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)'}}>
              <p style={{color: 'var(--text-muted)'}}>3D LiDAR Point Cloud Projection</p>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <h3>Calculated Metrics (Latest Defect)</h3>
          <div style={{marginTop: '1rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <span style={{color: 'var(--text-secondary)'}}>Defect ID</span>
              <span>DEF-8821</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <span style={{color: 'var(--text-secondary)'}}>Physical Area</span>
              <span>1.25 m²</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <span style={{color: 'var(--text-secondary)'}}>Mean Depth</span>
              <span>0.12 m</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <span style={{color: 'var(--text-secondary)'}}>Calculated Volume</span>
              <span style={{color: 'var(--accent-primary)', fontWeight: 'bold'}}>0.15 m³</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Volumetrics;
