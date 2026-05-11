import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, MessageSquare, Zap, Shield, HelpCircle as QuestionIcon } from 'lucide-react';
import styles from './FAQPage.module.css';

const faqs = [
  {
    question: "How does the AI detection work?",
    answer: "Our system uses advanced convolutional neural networks trained on thousands of road defect images. When you upload a photo, the AI analyzes pixel density and structural patterns to identify potholes, cracks, or subsidence with over 98% accuracy.",
    category: "Technology"
  },
  {
    question: "Is my personal data safe?",
    answer: "Absolutely. We only collect the image, GPS coordinates, and the description you provide. No personally identifiable information is stored or shared with third parties. All data is transmitted via secure SSL encryption.",
    category: "Security"
  },
  {
    question: "How long does it take for a report to be processed?",
    answer: "Initial AI analysis happens in real-time. Once validated, reports are transmitted to the relevant Road Development Authority (RDA) district office within 15 minutes. Priority is assigned based on hazard severity.",
    category: "Process"
  },
  {
    question: "Do I need an account to report an issue?",
    answer: "No, we've designed the Citizen Portal to be as accessible as possible. You can report defects immediately without any registration process, ensuring that critical hazards are logged without delay.",
    category: "General"
  },
  {
    question: "What happens after I submit a report?",
    answer: "You'll receive a confirmation in the app. The report enters our database where it's cross-referenced with existing reports to avoid duplicates. Engineers then use this data to plan maintenance routes.",
    category: "Process"
  },
  {
    question: "Can I report issues in rural areas?",
    answer: "Yes! Our system is designed to work across the entire national road network. Even if you have a weak data connection, our 'Sync GPS' feature ensures your location is captured accurately.",
    category: "General"
  }
];

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className={styles.faqPage}>
      <header className={styles.header}>
        <div className={styles.container}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.headerContent}
          >
            <div className={styles.badge}><HelpCircle size={14} /> <span>Knowledge Base</span></div>
            <h1 className={styles.title}>Frequently Asked <span>Questions</span></h1>
            <p className={styles.subtitle}>Everything you need to know about the RoadSafe Citizen initiative and our AI-driven reporting system.</p>
          </motion.div>
        </div>
      </header>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.faqGrid}>
            <div className={styles.sidebar}>
              <div className={styles.supportCard}>
                <div className={styles.cardIcon}><MessageSquare size={24} /></div>
                <h3>Still have questions?</h3>
                <p>Can't find the answer you're looking for? Reach out to our technical support team.</p>
                <button className={styles.supportBtn}>Contact Support</button>
              </div>
              
              <div className={styles.statCards}>
                <div className={styles.miniStat}>
                  <Zap size={20} className={styles.iconYellow} />
                  <div>
                    <h4>Real-time</h4>
                    <p>AI Analysis</p>
                  </div>
                </div>
                <div className={styles.miniStat}>
                  <Shield size={20} className={styles.iconBlue} />
                  <div>
                    <h4>Encrypted</h4>
                    <p>Data Transfer</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.accordion}>
              {faqs.map((faq, index) => (
                <motion.div 
                  key={index}
                  className={`${styles.accordionItem} ${activeIndex === index ? styles.active : ''}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <button 
                    className={styles.question}
                    onClick={() => toggleAccordion(index)}
                  >
                    <div className={styles.qText}>
                      <span className={styles.category}>{faq.category}</span>
                      <h3>{faq.question}</h3>
                    </div>
                    <ChevronDown className={styles.chevron} size={20} />
                  </button>
                  <AnimatePresence>
                    {activeIndex === index && (
                      <motion.div 
                        className={styles.answerWrapper}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className={styles.answer}>
                          <p>{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <div className={styles.ctaText}>
              <h2>Ready to make an impact?</h2>
              <p>Your reports help us build a safer Sri Lanka. Start your first report today.</p>
            </div>
            <button className={styles.primaryBtn}>Report an Issue Now</button>
          </div>
        </div>
      </section>
    </div>
  );
}
