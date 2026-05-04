import React from 'react';
import { Shield, Zap, TrendingUp } from 'lucide-react';

const AdBanner = () => {
  return (
    <div className="glass-panel" style={{
      margin: '2rem 0',
      padding: '2rem',
      background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.05) 0%, rgba(79, 172, 254, 0.05) 100%)',
      border: '1px solid rgba(0, 242, 254, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: '1.5rem'
    }}>
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <Shield color="var(--accent-primary)" size={32} />
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>SECURE REPORTING</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <Zap color="var(--accent-primary)" size={32} />
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>AI-POWERED ANALYSIS</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp color="var(--accent-primary)" size={32} />
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>REAL-TIME UPDATES</span>
        </div>
      </div>
      
      <div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Ready to Upgrade Your Infrastructure?</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Join 50+ municipalities using Road Inspector to save 40% on maintenance costs.
        </p>
      </div>

      <button style={{
        padding: '0.75rem 2rem',
        background: 'var(--accent-gradient)',
        border: 'none',
        borderRadius: '30px',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-glow)'
      }}>
        Get Started Today
      </button>
    </div>
  );
};

export default AdBanner;
