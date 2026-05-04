import React, { useState } from 'react';
import { Camera, MapPin, Send, CheckCircle } from 'lucide-react';
import AdBanner from '../components/portal/AdBanner';

const PublicPortal = ({ addReport }) => {
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleGetLocation = () => {
    // Simulate getting GPS coordinates
    setLocation('6.9271° N, 79.8612° E (Colombo)');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!image || !location) return;
    
    setIsSubmitting(true);
    
    // Simulate API call to backend
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      
      if (addReport) {
        addReport({
          id: Date.now(),
          image,
          location,
          description,
          status: 'Pending Verification',
          timestamp: new Date().toISOString()
        });
      }
    }, 1500);
  };

  if (submitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '120px 2rem 4rem' }}>
        <CheckCircle size={80} color="#2ecc71" style={{ marginBottom: '2rem' }} />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Thank You!</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '500px' }}>
          Your road defect report has been successfully submitted to the Road Development Authority. Our AI will analyze the image and schedule a repair.
        </p>
        <button 
          onClick={() => { setSubmitted(false); setImage(null); setLocation(''); setDescription(''); }}
          style={{ marginTop: '2rem', padding: '0.75rem 2rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 2rem 4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Citizen Road Watch
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
          Help us keep your roads safe. Report potholes and defects directly to the RDA.
        </p>
      </div>

      <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Image Upload */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>1. Photo of the Defect *</label>
            <div style={{
              border: '2px dashed var(--border-light)', borderRadius: '12px', padding: '2rem',
              textAlign: 'center', background: 'rgba(0,0,0,0.2)', cursor: 'pointer', position: 'relative',
              overflow: 'hidden', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} required />
              {image ? (
                <img src={image} alt="Preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>
                  <Camera size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Tap to take a photo or upload from gallery</p>
                </div>
              )}
            </div>
          </div>

          {/* Location Pin */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>2. Pin Location *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="GPS Coordinates or Address" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                required
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }} 
              />
              <button type="button" onClick={handleGetLocation} style={{
                padding: '0 1rem', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid var(--accent-primary)',
                color: 'var(--accent-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <MapPin size={18} />
                Get Location
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>3. Description (Optional)</label>
            <textarea 
              placeholder="e.g., Deep pothole in the middle lane causing traffic..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={!image || !location || isSubmitting}
            style={{
              padding: '1rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: '8px', color: 'white', 
              fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
              cursor: (!image || !location || isSubmitting) ? 'not-allowed' : 'pointer',
              opacity: (!image || !location || isSubmitting) ? 0.5 : 1,
              marginTop: '1rem'
            }}
          >
            {isSubmitting ? 'Sending to RDA...' : <><Send size={20} /> Send Report</>}
          </button>
        </form>
      </div>
      
      <div style={{ marginTop: '4rem' }}>
        <AdBanner />
      </div>
    </div>
  );
};

export default PublicPortal;
