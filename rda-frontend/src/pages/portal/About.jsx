import React from 'react';
import AdBanner from '../../components/portal/AdBanner';

const PortalAbout = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 2rem 4rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '3rem' }}>About Road Inspector</h1>
      
      <div className="glass-panel" style={{ padding: '3rem', lineHeight: '1.8' }}>
        <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          Road Inspector was born from a simple mission: to make our city's infrastructure smarter and more responsive. 
          The traditional method of manual inspection is slow, expensive, and often overlooks critical defects until they become dangerous.
        </p>
        
        <h2 style={{ color: 'var(--accent-primary)', marginTop: '2rem' }}>How It Works</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          By leveraging a network of IoT sensors and crowdsourced reports from citizens like you, 
          we create a real-time digital twin of our road network. Our AI models analyze thousands 
          of images daily to categorize damage and estimate the necessary resources for repair.
        </p>

        <h2 style={{ color: 'var(--accent-primary)', marginTop: '2rem' }}>Our Impact</h2>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', listStyle: 'square' }}>
          <li>60% Faster repair response times</li>
          <li>40% Reduction in maintenance overhead</li>
          <li>Increased transparency for citizens</li>
          <li>Improved road safety for all commuters</li>
        </ul>
      </div>

      <AdBanner />
    </div>
  );
};

export default PortalAbout;
