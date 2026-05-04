import React from 'react';
import PortalNavbar from './PortalNavbar';

const PortalLayout = ({ children }) => {
  return (
    <div className="portal-container" style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      <PortalNavbar />
      <main>
        {children}
      </main>
      <footer style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border-light)',
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
      }}>
        <p>© 2024 Road Inspector AI. Engineering for a safer tomorrow.</p>
        <p style={{ marginTop: '0.5rem' }}>Managed by the Road Development Authority.</p>
      </footer>
    </div>
  );
};

export default PortalLayout;
