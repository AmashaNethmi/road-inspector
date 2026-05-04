import React from 'react';
import { Layers, Activity, Calendar, BarChart3 } from 'lucide-react';

const PortalFeatures = () => {
  const features = [
    {
      title: "Volumetric Analysis",
      description: "Our AI calculates the exact volume of material needed for repairs, preventing waste and optimizing budget allocation.",
      icon: <Layers size={40} color="var(--accent-primary)" />
    },
    {
      title: "Real-time Monitoring",
      description: "Live data from IoT-equipped vehicles provides a constant stream of information on road surface conditions.",
      icon: <Activity size={40} color="var(--accent-primary)" />
    },
    {
      title: "Intelligent Scheduling",
      description: "Proprietary algorithms prioritize repairs based on traffic volume, severity of defect, and proximity to critical services.",
      icon: <Calendar size={40} color="var(--accent-primary)" />
    },
    {
      title: "Comprehensive Analytics",
      description: "Detailed dashboards for city planners to track infrastructure health trends and long-term planning.",
      icon: <BarChart3 size={40} color="var(--accent-primary)" />
    }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '120px 2rem 4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem' }}>The Road Inspector Suite</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          Explore the powerful tools that keep our infrastructure in peak condition.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {features.map((feature, index) => (
          <div key={index} className="glass-panel" style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
            <div style={{ flexShrink: 0 }}>{feature.icon}</div>
            <div>
              <h3 style={{ marginBottom: '0.75rem' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortalFeatures;
