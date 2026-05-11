import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, CheckCircle, Loader2, UploadCloud, Trash2, Zap, FileText, Shield } from 'lucide-react';
import styles from './ReportPage.module.css';

export default function ReportPage() {
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImage(dataUrl);
      stopCamera();
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
    if (!image || !location || !projectName) {
      alert("Please capture an image, fetch your location, and provide a project name.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      // Save to "Database" (localStorage)
      const newReport = {
        id: Date.now(),
        image,
        location,
        description,
        projectName,
        timestamp: new Date().toLocaleString()
      };

      const existingReports = JSON.parse(localStorage.getItem('road_reports') || '[]');
      localStorage.setItem('road_reports', JSON.stringify([newReport, ...existingReports]));

      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setImage(null);
        setLocation(null);
        setDescription('');
        setProjectName('');
      }, 3000);
    }, 1500);
  };

  return (
    <div className={styles.reportPage}>
      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <header className={styles.header}>
          <div className={styles.categoryBadge}>Field Reporting</div>
          <h2 className={styles.title}>Incident Log Portal</h2>
          <p className={styles.subtitle}>Our AI analyzes every pixel to prioritize national road repairs.</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Project Name Section */}
          <div className={styles.inputCard}>
            <div className={styles.inputHeader}>
              <div className={styles.inputIcon}><Zap size={18} /></div>
              <label className={styles.label}>Designated Project Name</label>
            </div>
            <input 
              type="text"
              className={styles.input}
              placeholder="e.g. A9 Highway Rehabilitation"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>

          {/* Image Upload Section */}
          <div className={styles.uploadSection}>
            <div 
              className={`${styles.imageCanvas} ${image || isCameraOpen ? styles.hasImage : ''}`}
            >
              {isCameraOpen ? (
                <div className={styles.cameraWrapper}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className={styles.videoPreview}
                  />
                  <div className={styles.cameraControls}>
                    <button type="button" className={styles.captureBtn} onClick={takePhoto}>
                      <div className={styles.captureInner} />
                    </button>
                    <button type="button" className={styles.cancelBtn} onClick={stopCamera}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : image ? (
                <div className={styles.previewWrapper}>
                  <img src={image} alt="Defect" className={styles.preview} />
                  <div className={styles.imageOverlay}>
                    <p>Evidence Captured</p>
                    <button type="button" className={styles.removeBtn} onClick={(e) => { e.stopPropagation(); setImage(null); }}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyCanvas}>
                  <div className={styles.iconCircle}>
                    <Camera size={40} />
                  </div>
                  <h3 className={styles.canvasTitle}>Visual Documentation</h3>
                  <p className={styles.uploadPrompt}>Provide a high-quality photo of the road anomaly.</p>
                  
                  <div className={styles.actionButtons}>
                    <button type="button" className={styles.liveCameraBtn} onClick={startCamera}>
                      <Camera size={18} /> Open Field Camera
                    </button>
                    <button type="button" className={styles.uploadBtn} onClick={() => fileInputRef.current.click()}>
                      <UploadCloud size={18} /> From Gallery
                    </button>
                  </div>
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
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* Location Section */}
          <div className={styles.inputCard}>
            <div className={styles.row}>
              <div className={styles.iconBox}>
                <MapPin size={24} />
              </div>
              <div className={styles.details}>
                <label className={styles.label}>Geospatial Data</label>
                {location ? (
                  <p className={styles.locationValue}>
                    {location.lat}° N, {location.lng}° E 
                    <span className={styles.accuracy}> (Precision: ±{location.accuracy}m)</span>
                  </p>
                ) : (
                  <p className={styles.locationPlaceholder}>Awaiting GPS Satellite Lock...</p>
                )}
              </div>
              <button 
                type="button" 
                className={styles.locationBtn} 
                onClick={getLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? <Loader2 className={styles.spinner} size={18} /> : 'Sync GPS'}
              </button>
            </div>
          </div>

          {/* Description Section */}
          <div className={styles.inputCard}>
            <div className={styles.inputHeader}>
              <div className={styles.inputIcon}><FileText size={18} /></div>
              <label className={styles.label}>Field Notes (Optional)</label>
            </div>
            <textarea 
              className={styles.textarea}
              placeholder="Provide context regarding the severity or environmental conditions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.securityNote}>
            <Shield size={14} />
            <span>Secure encryption active. This report is a legal record.</span>
          </div>

          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={isSubmitting || isSuccess}
          >
            {isSubmitting ? (
              <><Loader2 className={styles.spinner} size={20} /> Transmitting Data...</>
            ) : isSuccess ? (
              <><CheckCircle size={20} /> Transmission Successful</>
            ) : (
              <><UploadCloud size={20} /> Push to Road Inspector AI</>
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
