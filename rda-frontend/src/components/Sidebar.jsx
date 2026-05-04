import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, Layers, Package, CalendarClock, Users, LogOut } from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  return (
    <nav className="sidebar">
      <div className="brand">
        <MapPin size={28} color="#00f2fe" />
        <span>Road Inspector</span>
      </div>
      
      <div className="nav-menu">
        <NavLink to="/admin" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>
          <LayoutDashboard size={20} />
          System Overview
        </NavLink>
        
        <NavLink to="/iot-detection" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <MapPin size={20} />
          IoT Detection
        </NavLink>
        
        <NavLink to="/segmentation" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Layers size={20} />
          Volumetrics
        </NavLink>
        
        <NavLink to="/materials" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Package size={20} />
          Material Est.
        </NavLink>
        
        <NavLink to="/scheduling" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <CalendarClock size={20} />
          Scheduling
        </NavLink>

        <div style={{ margin: '2rem 0 0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Public Access
        </div>

        <a href="/report" className="nav-link">
          <Users size={20} />
          Citizen Portal
        </a>
      </div>

      {/* Logout */}
      {onLogout && (
        <button
          onClick={onLogout}
          style={{
            marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.9rem 1rem', background: 'rgba(255,75,75,0.08)',
            border: '1px solid rgba(255,75,75,0.2)', borderRadius: '12px',
            color: '#ff4b4b', fontWeight: 600, fontSize: '0.95rem',
            cursor: 'pointer', width: '100%', transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,75,75,0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,75,75,0.08)'}
        >
          <LogOut size={18} />
          Logout
        </button>
      )}
    </nav>
  );
};

export default Sidebar;

