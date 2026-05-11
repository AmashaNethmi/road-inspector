import { motion } from 'framer-motion';
import styles from './CitizenReportsPage.module.css';

const MOCK_REPORTS = [
  {
    id: 'CIT-001',
    user: 'Amila Perera',
    type: 'Pothole',
    location: '6.9271° N, 79.8612° E',
    timestamp: '2026-05-11 09:15 AM',
    status: 'Pending Review',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    description: 'Very deep pothole near the main junction. Hazardous for motorcycles.'
  },
  {
    id: 'CIT-002',
    user: 'Kasun Silva',
    type: 'Crack',
    location: '7.2906° N, 80.6337° E',
    timestamp: '2026-05-11 10:30 AM',
    status: 'AI Analyzed',
    image: 'https://images.unsplash.com/photo-1599423300746-b62533397364?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    description: 'Long longitudinal crack spanning across two lanes.'
  },
];

export default function CitizenReportsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Citizen Reports</h1>
          <p className={styles.subtitle}>Manage issues reported by the public via RoadSafe Citizen Portal</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statVal}>12</span>
            <span className={styles.statLab}>New Today</span>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        {MOCK_REPORTS.map((report) => (
          <motion.div 
            key={report.id}
            className={styles.card}
            whileHover={{ y: -5 }}
          >
            <div className={styles.imageBox}>
              <img src={report.image} alt="Report" />
              <span className={styles.statusBadge}>{report.status}</span>
            </div>
            <div className={styles.content}>
              <div className={styles.cardHeader}>
                <h3>{report.type}</h3>
                <span className={styles.reportId}>{report.id}</span>
              </div>
              <p className={styles.desc}>{report.description}</p>
              <div className={styles.details}>
                <div className={styles.detail}>
                  <span>📍</span> {report.location}
                </div>
                <div className={styles.detail}>
                  <span>👤</span> {report.user}
                </div>
                <div className={styles.detail}>
                  <span>⏰</span> {report.timestamp}
                </div>
              </div>
              <div className={styles.actions}>
                <button className={styles.btnPrimary}>Dispatch Team</button>
                <button className={styles.btnSecondary}>Verify with AI</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
