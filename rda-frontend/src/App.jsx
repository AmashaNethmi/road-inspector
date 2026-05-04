import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import PortalLayout from './components/portal/PortalLayout';
import Dashboard from './pages/Dashboard';
import IoTDetection from './pages/IoTDetection';
import Volumetrics from './pages/Volumetrics';
import Materials from './pages/Materials';
import Scheduling from './pages/Scheduling';
import PublicPortal from './pages/PublicPortal';
import AdminLogin from './pages/AdminLogin';
import PortalHome from './pages/portal/Home';
import PortalAbout from './pages/portal/About';
import PortalFeatures from './pages/portal/Features';
import './index.css';

const AdminLayout = ({ children, isLoggedIn, onLogout }) => {
  if (!isLoggedIn) return <Navigate to="/admin/login" replace />;
  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

const PublicLayout = ({ children }) => {
  const location = useLocation();
  const isPortal = location.pathname.startsWith('/portal') || location.pathname === '/report';
  if (isPortal) {
    return <PortalLayout>{children}</PortalLayout>;
  }
  return <>{children}</>;
};

function App() {
  const [citizenReports, setCitizenReports] = useState([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const handleAddReport = (report) => {
    setCitizenReports((prev) => [report, ...prev]);
  };

  return (
    <Router>
      <Routes>
        {/* Public Portal Routes */}
        <Route path="/" element={<Navigate to="/portal/home" replace />} />
        <Route path="/portal/home" element={<PublicLayout><PortalHome /></PublicLayout>} />
        <Route path="/portal/about" element={<PublicLayout><PortalAbout /></PublicLayout>} />
        <Route path="/portal/features" element={<PublicLayout><PortalFeatures /></PublicLayout>} />
        <Route path="/report" element={<PublicLayout><PublicPortal addReport={handleAddReport} /></PublicLayout>} />

        {/* Admin Login */}
        <Route
          path="/admin/login"
          element={
            isAdminLoggedIn
              ? <Navigate to="/admin" replace />
              : <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} />
          }
        />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<AdminLayout isLoggedIn={isAdminLoggedIn} onLogout={() => setIsAdminLoggedIn(false)}><Dashboard citizenReports={citizenReports} /></AdminLayout>} />
        <Route path="/iot-detection" element={<AdminLayout isLoggedIn={isAdminLoggedIn} onLogout={() => setIsAdminLoggedIn(false)}><IoTDetection /></AdminLayout>} />
        <Route path="/segmentation" element={<AdminLayout isLoggedIn={isAdminLoggedIn} onLogout={() => setIsAdminLoggedIn(false)}><Volumetrics /></AdminLayout>} />
        <Route path="/materials" element={<AdminLayout isLoggedIn={isAdminLoggedIn} onLogout={() => setIsAdminLoggedIn(false)}><Materials /></AdminLayout>} />
        <Route path="/scheduling" element={<AdminLayout isLoggedIn={isAdminLoggedIn} onLogout={() => setIsAdminLoggedIn(false)}><Scheduling /></AdminLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
