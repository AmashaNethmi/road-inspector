import { useState } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import styles from './App.module.css';

// Simple Router-like state
export default function App() {
  const [activePage, setActivePage] = useState('home');

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage onNavigate={setActivePage} />;
      case 'report':
        return <ReportPage />;
      case 'about':
        return (
          <div className={styles.placeholder}>
            <h2>About Us</h2>
            <p>We are a team dedicated to road safety through AI.</p>
          </div>
        );
      case 'faq':
        return (
          <div className={styles.placeholder}>
            <h2>Frequently Asked Questions</h2>
            <p>How do I report? Just snap a photo!</p>
          </div>
        );
      default:
        return <HomePage onNavigate={setActivePage} />;
    }
  };

  return (
    <div className={styles.app}>
      <Navbar activePage={activePage} onNavigate={setActivePage} />
      <main className={styles.main}>
        {renderPage()}
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <p>&copy; 2026 RoadSafe Citizen Initiative. Sri Lanka RDA Standards.</p>
        </div>
      </footer>
    </div>
  );
}
