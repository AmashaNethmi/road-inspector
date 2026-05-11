import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, CheckCircle, Loader2, UploadCloud, Trash2 } from 'lucide-react';
import styles from './ReportPage.module.css';

export default function ReportPage() {
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef(null);

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
            accuracy: position.coords.accuracy.toFixed(1)
          });
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location. Please ensure GPS is enabled.");
          setIsGettingLocation(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !location) {
      alert("Please capture an image and fetch your location.");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      // Reset after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setImage(null);
        setLocation(null);
        setDescription('');
      }, 3000);
    }, 2000);
  };

  return (
    <div className={styles.reportPage}>
      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Report a Road Issue</h2>
          <p className={styles.subtitle}>Help us identify potholes and road defects by uploading a photo.</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Image Upload Section */}
          <div className={styles.uploadSection}>
            <div 
              className={`${styles.imageCanvas} ${image ? styles.hasImage : ''}`}
              onClick={() => !image && fileInputRef.current.click()}
            >
              {image ? (
                <>
                  <img src={image} alt="Defect" className={styles.preview} />
                  <button type="button" className={styles.removeBtn} onClick={(e) => { e.stopPropagation(); setImage(null); }}>
                    <Trash2 size={20} />
                  </button>
                </>
              ) : (
                <div className={styles.emptyCanvas}>
                  <div className={styles.iconCircle}>
                    <Camera size={32} />
                  </div>
                  <p className={styles.uploadPrompt}>Tap to Capture or Upload Image</p>
                  <span className={styles.uploadSub}>JPEG, PNG supported</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              hidden 
              ref={fileInputRef} 
              onChange={handleCapture} 
            />
          </div>

          {/* Location Section */}
          <div className={styles.inputCard}>
            <div className={styles.row}>
              <div className={styles.iconBox} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <MapPin size={24} />
              </div>
              <div className={styles.details}>
                <label className={styles.label}>Precise Location</label>
                {location ? (
                  <p className={styles.locationValue}>
                    {location.lat}° N, {location.lng}° E 
                    <span className={styles.accuracy}> (±{location.accuracy}m)</span>
                  </p>
                ) : (
                  <p className={styles.locationPlaceholder}>Fetch GPS coordinates from your device</p>
                )}
              </div>
              <button 
                type="button" 
                className={styles.locationBtn} 
                onClick={getLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? <Loader2 className={styles.spinner} size={18} /> : 'Fetch Location'}
              </button>
            </div>
          </div>

          {/* Description Section */}
          <div className={styles.inputCard}>
            <label className={styles.label}>Additional Details (Optional)</label>
            <textarea 
              className={styles.textarea}
              placeholder="e.g. Deep pothole near the bus stop..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={isSubmitting || isSuccess}
          >
            {isSubmitting ? (
              <><Loader2 className={styles.spinner} size={20} /> Submitting Report...</>
            ) : isSuccess ? (
              <><CheckCircle size={20} /> Reported Successfully!</>
            ) : (
              <><UploadCloud size={20} /> Send to Road Inspector</>
            )}
          </button>
        </form>
      </motion.div>

      {/* Success Overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.successCard}>
              <div className={styles.successIcon}>🎉</div>
              <h3>Thank You!</h3>
              <p>Your report has been safely transmitted to our AI analysis team. Together, we make roads safer.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
