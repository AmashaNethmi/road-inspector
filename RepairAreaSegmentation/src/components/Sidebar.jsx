import styles from './Sidebar.module.css';
import logoWhite from '../assets/logo_white.png';

const navItems = [
  { icon: '📊', label: 'Dashboard', id: 'dashboard' },
  { icon: '🚧', label: 'Defect Detection', id: 'segmentation', active: true },
  { icon: '📢', label: 'Citizen Reports', id: 'citizen_reports' },
  { icon: '📈', label: 'Analytics', id: 'analytics' },
  { icon: '📋', label: 'History', id: 'history' },
  { icon: '📄', label: 'Reports', id: 'reports' },
  { icon: '⚙️', label: 'Settings', id: 'settings' },
];

const teamNav = [
  { icon: '🚦', label: 'Traffic Scheduling', id: 'traffic' },
  { icon: '🧪', label: 'Material Estimation', id: 'estimator' },
  { icon: '🔍', label: 'Defect Detection', id: 'defect' },
  { icon: '🏋️', label: 'Model Training', id: 'training' },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandLogoWrapper}>
          <img src={logoWhite} alt="Road Inspector White Logo" className={styles.brandLogo} />
        </div>
        <div className={styles.brandTextGroup}>
          <h2 className={styles.brandName}>Road Inspector</h2>
          <p className={styles.brandSub}>AI Research Platform</p>
        </div>
      </div>

      {/* Main Nav */}
      <div className={styles.navSection}>
        <p className={styles.navLabel}>MY MODULE</p>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${activePage === item.id ? styles.active : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
              {activePage === item.id && <span className={styles.activeDot} />}
            </button>
          ))}
        </nav>
      </div>

      {/* Team Modules */}
      <div className={styles.navSection}>
        <p className={styles.navLabel}>TEAM MODULES</p>
        <nav className={styles.nav}>
          {teamNav.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${styles.teamItem} ${activePage === item.id ? styles.active : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
              {activePage === item.id && <span className={styles.activeDot} />}
            </button>
          ))}
        </nav>
      </div>

      {/* User Profile */}
      <div className={styles.profile}>
        <div className={styles.avatar}>IT</div>
        <div>
          <p className={styles.profileName}>IT22082756</p>
          <p className={styles.profileRole}>Research Analyst</p>
        </div>
        <span className={styles.onlineDot} />
      </div>
    </aside>
  );
}
