import { motion } from 'framer-motion';
import { Shield, Target, Users, Globe, ArrowRight } from 'lucide-react';
import styles from './AboutPage.module.css';
import engineeringImg from '../assets/engineering_team.png';

export default function AboutPage() {
  return (
    <div className={styles.aboutPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <motion.div 
            className={styles.heroContent}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className={styles.title}>Precision Engineering. <br /><span>Community Driven.</span></h1>
            <p className={styles.subtitle}>
              We are a specialized technology unit dedicated to the continuous monitoring and restoration of national road networks.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className={styles.mission}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <div className={styles.textBlock}>
              <div className={styles.accentBadge}>Our Mission</div>
              <h2>Building the infrastructure of tomorrow, today.</h2>
              <p>Our mission is to eliminate road hazards through the integration of citizen-led reporting and state-of-the-art AI analysis. We provide the Road Development Authority with real-time, high-precision data to ensure maintenance efforts are prioritized where they are needed most.</p>
              
              <div className={styles.values}>
                <div className={styles.valueItem}>
                  <Target className={styles.valueIcon} />
                  <div>
                    <h4>Data Precision</h4>
                    <p>Using advanced geospatial mapping to pinpoint defects within centimeters.</p>
                  </div>
                </div>
                <div className={styles.valueItem}>
                  <Shield className={styles.valueIcon} />
                  <div>
                    <h4>Public Safety</h4>
                    <p>Reducing transit accidents by identifying structural risks before they escalate.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.visualBlock}>
              <img src={engineeringImg} alt="Engineering Team" className={styles.mainImg} />
              <div className={styles.experienceCard}>
                <h3>15+</h3>
                <p>Years of Engineering Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Stats */}
      <section className={styles.stats}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <Users size={32} />
              <h3>500+</h3>
              <p>Certified Inspectors</p>
            </div>
            <div className={styles.statBox}>
              <Globe size={32} />
              <h3>24</h3>
              <p>Districts Covered</p>
            </div>
            <div className={styles.statBox}>
              <Shield size={32} />
              <h3>100%</h3>
              <p>Secure Reporting</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
