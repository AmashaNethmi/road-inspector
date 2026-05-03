import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, Layers, Package, CalendarClock } from 'lucide-react';

const Sidebar = () => {
  return (
    <nav className="sidebar">
      <div className="brand">
        <MapPin size={28} color="#00f2fe" />
        <span>Road Inspector</span>
      </div>
      
      <div className="nav-menu">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>
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
      </div>
    </nav>
  );
};

export default Sidebar;
