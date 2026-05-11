import { motion } from 'framer-motion';
import { HardHat, Pickaxe, Drill, ArrowRight, Construction, Zap, Shield, Activity } from 'lucide-react';
import styles from './HomePage.module.css';
import heroImg from '../assets/highway_inspection.png';
import engineeringImg from '../assets/engineering_team.png';

export default function HomePage({ onNavigate }) {
  return (
    <div className={styles.home}>
      {/* Immersive Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <motion.div 
              className={styles.heroText}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className={styles.badge}>
                <Zap size={14} /> <span>Smart Infrastructure Initiative</span>
              </div>
              <h1 className={styles.mainTitle}>
                The Future of <br />
                <span className={styles.highlight}>Road Maintenance</span> <br />
                is in Your Hands.
              </h1>
              <p className={styles.mainSub}>
                Join a nationwide network of citizens and engineers. Using AI-driven analysis, we turn your reports into actionable construction data for a safer, smoother journey.
              </p>
              <div className={styles.heroActions}>
                <button className={styles.primaryBtn} onClick={() => onNavigate('report')}>
                  Launch Reporting Portal <ArrowRight size={20} />
                </button>
                <div className={styles.trustedBy}>
                  <p>Trusted by national agencies</p>
                  <div className={styles.trustLogos}>🏙️ 🏗️ 🛣️</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className={styles.heroVisual}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
            >
              <div className={styles.imageFrame}>
                <img src={heroImg} alt="Modern Road Inspection" className={styles.mainHeroImg} />
                <div className={styles.floatingCard}>
                  <Activity size={24} className={styles.pulseIcon} />
                  <div>
                    <p className={styles.cardVal}>Live</p>
                    <p className={styles.cardLab}>System Status</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Floating Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <h3>15.2k</h3>
              <p>Reports Resolved</p>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <h3>98.4%</h3>
              <p>Detection Accuracy</p>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <h3>24/7</h3>
              <p>Real-time Monitoring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <section className={styles.process}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Precision Field Ops</h2>
            <p>Our four-step protocol for national infrastructure restoration.</p>
          </div>

          <div className={styles.processSteps}>
            {[
              { icon: Shield, title: 'Scan', text: 'Identify structural anomalies on any public road.' },
              { icon: Construction, title: 'Map', text: 'High-precision GPS tagging for field crews.' },
              { icon: Activity, title: 'Analyze', text: 'AI-driven material estimation and prioritization.' },
              { icon: HardHat, title: 'Restore', text: 'Dispatching expert teams for permanent repair.' }
            ].map((step, i) => (
              <div key={i} className={styles.stepCard}>
                <div className={styles.stepIcon}><step.icon size={28} /></div>
                <h4>{step.title}</h4>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={styles.mission}>
        <div className={styles.container}>
          <div className={styles.missionContent}>
            <img src={engineeringImg} alt="Engineering Team" className={styles.missionImg} />
            <div className={styles.missionText}>
              <h2 className={styles.accentTitle}>Our Mission</h2>
              <p>We are a dedicated collective of engineers, data scientists, and citizens committed to zero-defect infrastructure. By bridging the gap between public reporting and professional construction, we ensure every Sri Lankan road meets world-class standards.</p>
              <button className={styles.textBtn} onClick={() => onNavigate('about')}>
                Meet the Team <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
