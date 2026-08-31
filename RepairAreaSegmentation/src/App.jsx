// App.jsx — Root layout with sidebar + page routing
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import SegmentationPage from './pages/SegmentationPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CitizenReportsPage from './pages/CitizenReportsPage';

import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import MaterialEstimationPage from './pages/MaterialEstimationPage';
import DefectDetectionPage from './pages/DefectDetectionPage';
import TrafficSchedulingPage from './pages/TrafficSchedulingPage';
import TrainingPage from './pages/TrainingPage';
import styles from './App.module.css';

export default function App() {
  const [activePage, setActivePage] = useState('segmentation');
  const [segmentationSummary, setSegmentationSummary] = useState(null);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage segmentationData={segmentationSummary} />;
      case 'segmentation':
        return <SegmentationPage onAnalysisComplete={setSegmentationSummary} />;
      case 'history':
        return <HistoryPage onReopen={setSegmentationSummary} onNavigate={setActivePage} />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'citizen_reports':
        return <CitizenReportsPage />;

      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'estimator':
        return <MaterialEstimationPage />;
      case 'defect':
        return <DefectDetectionPage />;
      case 'traffic':
        return <TrafficSchedulingPage />;
      case 'training':
        return <TrainingPage />;
      default:
        return (
          <div className={styles.placeholder}>
            <h2>🚧 Coming Soon</h2>
            <p>This module is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className={styles.content}>
        {renderPage()}
      </div>
    </div>
  );
}
