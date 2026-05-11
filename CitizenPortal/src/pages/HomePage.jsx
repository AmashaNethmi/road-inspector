import { motion } from 'framer-motion';
import { ShieldCheck, Map, Users, ArrowRight } from 'lucide-react';
import styles from './HomePage.module.css';

export default function HomePage({ onNavigate }) {
  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <motion.div 
            className={styles.heroContent}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={styles.heroTitle}>
              Building Safer Roads, <br />
              <span>One Report at a Time.</span>
            </h1>
            <p className={styles.heroSub}>
              RoadSafe Citizen empowers you to report road hazards directly to local authorities using AI-driven detection technology. Your contribution helps prioritize repairs and save lives.
            </p>
            <div className={styles.heroBtns}>
              <button className={styles.primaryBtn} onClick={() => onNavigate('report')}>
                Report a Pothole <ArrowRight size={18} />
              </button>
              <button className={styles.secondaryBtn} onClick={() => onNavigate('about')}>
                Learn More
              </button>
            </div>
          </motion.div>
          <motion.div 
            className={styles.heroImage}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className={styles.imageCard}>
              <img src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Clean Road" />
              <div className={styles.statsBadge}>
                <div className={styles.badgeIcon}>✨</div>
                <div>
                  <p className={styles.badgeVal}>2,500+</p>
                  <p className={styles.badgeLab}>Issues Resolved</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionSub}>Simple steps to ensure your voice is heard and roads are fixed.</p>
          </div>

          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.fIcon} style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
                <ShieldCheck size={32} />
              </div>
              <h3>Capture Anomaly</h3>
              <p>See a pothole or defect? Snap a quick photo using your smartphone's camera.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.fIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <Map size={32} />
              </div>
              <h3>GPS Tagging</h3>
              <p>Our system automatically fetches your precise GPS coordinates for rapid dispatch.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.fIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <Users size={32} />
              </div>
              <h3>Community Impact</h3>
              <p>Your reports are analyzed by our AI and prioritized in the maintenance queue.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
