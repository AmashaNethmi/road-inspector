import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCitizenReports, createCitizenReport } from '../services/api';
import { Clock, MapPin, User, Upload, Plus } from 'lucide-react';
import styles from './CitizenReportsPage.module.css';

export default function CitizenReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    reporterName: 'Amila Perera',
    defectType: 'Pothole',
    location: '6.9271° N, 79.8612° E',
    description: '',
    urgencyLevel: 'Medium',
    image: ''
  });

  const loadReports = () => {
    getCitizenReports()
      .then(res => {
        setReports(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to get citizen reports', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCitizenReport(form);
      setForm({
        reporterName: 'Amila Perera',
        defectType: 'Pothole',
        location: '6.9271° N, 79.8612° E',
        description: '',
        urgencyLevel: 'Medium',
        image: ''
      });
      setShowForm(false);
      loadReports();
    } catch (err) {
      console.error('Failed to submit report', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyClass = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'low': return styles.low;
      case 'medium': return styles.medium;
      case 'high': return styles.high;
      case 'critical': return styles.critical;
      default: return '';
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Citizen Portal Reports</h1>
          <p className={styles.subtitle}>Audit, catalog, and verify road damage complaints submitted by the public</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={() => setShowForm(!showForm)} className={styles.btnCreate}>
            <Plus size={18} />
            Submit Complaint
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form 
              onSubmit={handleSubmit}
              className={styles.formContainer}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <h3>File Road Damage Complaint</h3>
              
              <div className={styles.formGroup}>
                <label>Reporter Full Name</label>
                <input 
                  type="text" 
                  value={form.reporterName} 
                  onChange={e => setForm({ ...form, reporterName: e.target.value })} 
                  required 
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Defect Type</label>
                  <select 
                    value={form.defectType} 
                    onChange={e => setForm({ ...form, defectType: e.target.value })}
                  >
                    <option value="Pothole">Pothole</option>
                    <option value="Crack">Structural Crack</option>
                    <option value="Rutting">Rutting / Depressions</option>
                    <option value="Shoving">Shoving / Corrugation</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Urgency Level</label>
                  <select 
                    value={form.urgencyLevel} 
                    onChange={e => setForm({ ...form, urgencyLevel: e.target.value })}
                  >
                    <option value="Low">Low (Monitor)</option>
                    <option value="Medium">Medium (Repair Soon)</option>
                    <option value="High">High (Urgent Repair)</option>
                    <option value="Critical">Critical (Immediate Hazard)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>GPS Coordinates Location</label>
                <input 
                  type="text" 
                  value={form.location} 
                  onChange={e => setForm({ ...form, location: e.target.value })} 
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Structural Description</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                  rows="3" 
                  required 
                  placeholder="Provide depth, dimensions, or specific road hazards..."
                />
              </div>

              <div className={styles.formGroup}>
                <label>Image Upload</label>
                <div className={styles.uploadBox}>
                  <Upload size={24} />
                  <span>Choose file to upload</span>
                  <input type="file" onChange={handleImageUpload} accept="image/*" />
                </div>
                {form.image && (
                  <img src={form.image} className={styles.formPreview} alt="Complaint preview" />
                )}
              </div>

              <div className={styles.formActions}>
                <button type="submit" disabled={submitting} className={styles.btnPrimary}>
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className={styles.btnCancel}>
                  Cancel
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className={styles.loadingState}>
          <p>Fetching citizen submissions...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No citizen complaints logged</h2>
          <p>Road damage complaints submitted by citizens will appear here.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {reports.map((report) => (
            <motion.div 
              key={report._id}
              className={styles.card}
              whileHover={{ y: -5 }}
            >
              <div className={styles.imageBox}>
                {report.image ? (
                  <img src={report.image} alt="Report" />
                ) : (
                  <div className={styles.placeholderImg}>🛣️ No Image Uploaded</div>
                )}
                <span className={`${styles.statusBadge} ${getUrgencyClass(report.urgencyLevel)}`}>
                  {report.urgencyLevel} Urgency
                </span>
              </div>
              <div className={styles.content}>
                <div className={styles.cardHeader}>
                  <h3>{report.defectType}</h3>
                  <span className={styles.statusText}>{report.status}</span>
                </div>
                <p className={styles.desc}>{report.description}</p>
                <div className={styles.details}>
                  <div className={styles.detail}>
                    <MapPin size={14} /> <span>{report.location}</span>
                  </div>
                  <div className={styles.detail}>
                    <User size={14} /> <span>{report.reporterName}</span>
                  </div>
                  <div className={styles.detail}>
                    <Clock size={14} /> <span>{new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button className={styles.btnDispatch}>Dispatch Maintenance Team</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
