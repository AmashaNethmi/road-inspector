import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import AdBanner from '../../components/portal/AdBanner';

const PortalHome = () => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 2rem 4rem' }}>
      <section style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem' }}>
          Smart Roads for <br />
          <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Safer Cities
          </span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
          Experience the future of road maintenance. Road Inspector uses cutting-edge AI and IoT 
          to detect, analyze, and schedule repairs automatically.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/report" style={{
            padding: '1rem 2.5rem',
            background: 'var(--accent-gradient)',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '1.1rem'
          }}>
            Report a Defect <ArrowRight size={20} />
          </Link>
          <Link to="/portal/about" style={{
            padding: '1rem 2.5rem',
            border: '1px solid var(--border-light)',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>
            Learn More
          </Link>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <Cpu color="var(--accent-primary)" size={40} style={{ marginBottom: '1.5rem' }} />
          <h3>AI Analysis</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Instant detection of potholes, cracks, and road wear using computer vision.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <ShieldCheck color="var(--accent-primary)" size={40} style={{ marginBottom: '1.5rem' }} />
          <h3>Secure Reporting</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Verified reports from citizens ensure that critical issues are prioritized first.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <CheckCircle2 color="var(--accent-primary)" size={40} style={{ marginBottom: '1.5rem' }} />
          <h3>Efficiency</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Automated scheduling and material estimation save time and taxpayer money.
          </p>
        </div>
      </div>

      <AdBanner />
    </div>
  );
};

export default PortalHome;
