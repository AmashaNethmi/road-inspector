import { useState } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
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
      case 'admin':
        return <AdminPage />;
      case 'about':
        return <AboutPage />;
      case 'faq':
        return <FAQPage />;
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
