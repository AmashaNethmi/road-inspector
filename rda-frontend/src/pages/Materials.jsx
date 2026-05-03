import React from 'react';

const Materials = () => {
  return (
    <div className="module-page">
      <div className="module-header">
        <h1>Material Requirement Estimation</h1>
        <p>Lead Researcher: Bandara T.C.N (IT22113122)</p>
        <span className="badge badge-warning" style={{marginTop: '0.5rem', display: 'inline-block'}}>Awaiting Data</span>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel" style={{gridColumn: '1 / -1'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2>Predictive Material Budgeting</h2>
            <button style={{padding: '0.5rem 1rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>Generate Procurement Trigger</button>
          </div>
          
          <table style={{width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-secondary)'}}>
                <th style={{padding: '1rem'}}>Material Type</th>
                <th style={{padding: '1rem'}}>Required Mass</th>
                <th style={{padding: '1rem'}}>Est. Cost (LKR)</th>
                <th style={{padding: '1rem'}}>ML Optimization</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                <td style={{padding: '1rem'}}>Asphalt Wearing Course</td>
                <td style={{padding: '1rem'}}>1,450 kg</td>
                <td style={{padding: '1rem'}}>268,250</td>
                <td style={{padding: '1rem'}}><span className="badge badge-warning">+15% (Heavy Traffic)</span></td>
              </tr>
              <tr style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                <td style={{padding: '1rem'}}>Asphalt Binder Course</td>
                <td style={{padding: '1rem'}}>2,100 kg</td>
                <td style={{padding: '1rem'}}>346,500</td>
                <td style={{padding: '1rem'}}><span className="badge badge-warning">+15% (Heavy Traffic)</span></td>
              </tr>
              <tr style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                <td style={{padding: '1rem'}}>Gravel Base Course</td>
                <td style={{padding: '1rem'}}>4,500 kg</td>
                <td style={{padding: '1rem'}}>202,500</td>
                <td style={{padding: '1rem'}}><span className="badge badge-success">Standard</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Materials;
