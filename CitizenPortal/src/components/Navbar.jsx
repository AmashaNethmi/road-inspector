import { motion } from 'framer-motion';
import { Camera, Home, Info, HelpCircle, LayoutDashboard } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar({ activePage, onNavigate }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'report', label: 'Report Issue', icon: Camera },
    { id: 'admin', label: 'Admin Panel', icon: LayoutDashboard },
    { id: 'about', label: 'About Us', icon: Info },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.brand} onClick={() => onNavigate('home')}>
          <div className={styles.logo}>🛣️</div>
          <h1 className={styles.title}>RoadSafe <span>Citizen</span></h1>
        </div>

        <ul className={styles.navLinks}>
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                className={`${styles.navItem} ${activePage === item.id ? styles.active : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {activePage === item.id && (
                  <motion.div layoutId="nav-pill" className={styles.pill} />
                )}
              </button>
            </li>
          ))}
        </ul>

        <button className={styles.cta} onClick={() => onNavigate('report')}>
          Report Now
        </button>
      </div>
    </nav>
  );
}
