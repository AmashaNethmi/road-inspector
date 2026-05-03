import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import IoTDetection from './pages/IoTDetection';
import Volumetrics from './pages/Volumetrics';
import Materials from './pages/Materials';
import Scheduling from './pages/Scheduling';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/iot-detection" element={<IoTDetection />} />
            <Route path="/segmentation" element={<Volumetrics />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/scheduling" element={<Scheduling />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
