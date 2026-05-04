import React from 'react';
import { NavLink } from 'react-router-dom';
import { MapPin, Info, Home, Send, Sparkles } from 'lucide-react';

const PortalNavbar = () => {
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '70px',
      background: 'rgba(10, 11, 16, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      zIndex: 1000
    }}>
      <div className="brand" style={{ marginBottom: 0 }}>
        <MapPin size={24} color="#00f2fe" />
        <span style={{ fontSize: '1.2rem' }}>Road Inspector</span>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <NavLink to="/portal/home" style={({ isActive }) => ({
          color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: '500'
        })}>
          <Home size={18} /> Home
        </NavLink>
        <NavLink to="/portal/about" style={({ isActive }) => ({
          color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: '500'
        })}>
          <Info size={18} /> About
        </NavLink>
        <NavLink to="/portal/features" style={({ isActive }) => ({
          color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: '500'
        })}>
          <Sparkles size={18} /> Features
        </NavLink>
        <NavLink to="/report" style={{
          background: 'var(--accent-gradient)',
          padding: '0.5rem 1.25rem',
          borderRadius: '8px',
          color: 'white',
          textDecoration: 'none',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem'
        }}>
          <Send size={18} /> Report Defect
        </NavLink>
      </div>
    </nav>
  );
};

export default PortalNavbar;
