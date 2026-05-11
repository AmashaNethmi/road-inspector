// App.jsx — Root layout with sidebar + page routing
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TrafficPage from './pages/TrafficPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CitizenReportsPage from './pages/CitizenReportsPage';
import styles from './App.module.css';

export default function App() {
  const [activePage, setActivePage] = useState('traffic');

  const renderPage = () => {
    switch (activePage) {
      case 'traffic': return <TrafficPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'citizen_reports': return <CitizenReportsPage />;
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
