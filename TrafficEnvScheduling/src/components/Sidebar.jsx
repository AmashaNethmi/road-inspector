// Sidebar.jsx — Navigation sidebar component
import styles from './Sidebar.module.css';

const navItems = [
  { icon: '📊', label: 'Dashboard', id: 'dashboard' },
  { icon: '🚦', label: 'Traffic Scheduling', id: 'traffic', active: true },
  { icon: '📢', label: 'Citizen Reports', id: 'citizen_reports' },
  { icon: '📈', label: 'Analytics', id: 'analytics' },
  { icon: '📋', label: 'History', id: 'history' },
  { icon: '⚙️', label: 'Settings', id: 'settings' },
];

const teamNav = [
  { icon: '🔍', label: 'Defect Detection', id: 'defect' },
  { icon: '🧪', label: 'Material Estimation', id: 'estimator' },
  { icon: '🚧', label: 'Repair Segmentation', id: 'repair' },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.logo}>
          <span>🛣️</span>
        </div>
        <div>
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
              className={`${styles.navItem} ${styles.teamItem}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* User Profile */}
      <div className={styles.profile}>
        <div className={styles.avatar}>IT</div>
        <div>
          <p className={styles.profileName}>IT22207968</p>
          <p className={styles.profileRole}>Traffic Env Scheduling</p>
        </div>
        <span className={styles.onlineDot} />
      </div>
    </aside>
  );
}
