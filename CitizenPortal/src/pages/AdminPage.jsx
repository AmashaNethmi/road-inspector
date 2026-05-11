import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, FileText, Database, Trash2, ExternalLink, Download } from 'lucide-react';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const [reports, setReports] = useState([]);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const savedReports = JSON.parse(localStorage.getItem('road_reports') || '[]');
    setReports(savedReports);
  }, []);

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const deleteReport = (id) => {
    if (confirmingId !== id) {
      setConfirmingId(id);
      setTimeout(() => setConfirmingId(null), 3000);
      return;
    }
    const updatedReports = reports.filter(report => report.id !== id);
    localStorage.setItem('road_reports', JSON.stringify(updatedReports));
    setReports(updatedReports);
    setConfirmingId(null);
    showNotification('Report deleted successfully');
  };

  const handleClearAll = () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      setTimeout(() => setIsConfirmingClear(false), 3000);
      return;
    }
    localStorage.removeItem('road_reports');
    setReports([]);
    setIsConfirmingClear(false);
    showNotification('All reports cleared');
  };

  const exportToCSV = () => {
    if (reports.length === 0) return;
    
    const headers = ['Project Name', 'Latitude', 'Longitude', 'Accuracy', 'Timestamp', 'Description'];
    const csvContent = [
      headers.join(','),
      ...reports.map(r => [
        `"${r.projectName}"`,
        r.location.lat,
        r.location.lng,
        r.location.accuracy,
        `"${r.timestamp}"`,
        `"${r.description?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `road_reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Reports exported to CSV');
  };

  return (
    <div className={styles.adminPage}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>Reviewing citizen reports from the field</p>
        </div>
        <div className={styles.stats}>
          <button 
            className={styles.exportBtn}
            onClick={exportToCSV}
            disabled={reports.length === 0}
          >
            <Download size={16} /> Export Data
          </button>
          <button 
            className={`${styles.clearAllBtn} ${isConfirmingClear ? styles.confirming : ''}`}
            onClick={handleClearAll}
            disabled={reports.length === 0}
          >
            <Trash2 size={16} /> 
            {isConfirmingClear ? 'Confirm Clear All?' : 'Clear All'}
          </button>
          <div className={styles.statCard}>
            <Database size={20} />
            <span>Total Reports: {reports.length}</span>
          </div>
        </div>
      </header>

      {reports.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={48} opacity={0.2} />
          <h3>No reports yet</h3>
          <p>Reports submitted by citizens will appear here.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {reports.map((report) => (
            <motion.div 
              key={report.id}
              className={styles.reportCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.imageWrapper}>
                <img src={report.image} alt={report.projectName} className={styles.reportImage} />
                <div className={styles.badge}>{report.projectName}</div>
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.meta}>
                  <div className={styles.metaItem}>
                    <MapPin size={14} />
                    <span>{report.location.lat}, {report.location.lng}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Clock size={14} />
                    <span>{report.timestamp}</span>
                  </div>
                </div>

                {report.description && (
                  <p className={styles.description}>{report.description}</p>
                )}

                <div className={styles.actions}>
                  <button 
                    className={styles.viewBtn}
                    onClick={() => window.open(`https://www.google.com/maps?q=${report.location.lat},${report.location.lng}`, '_blank')}
                  >
                    <ExternalLink size={16} /> View Map
                  </button>
                  <button 
                    className={`${styles.deleteBtn} ${confirmingId === report.id ? styles.confirming : ''}`}
                    onClick={() => deleteReport(report.id)}
                    title={confirmingId === report.id ? "Click again to confirm" : "Delete Report"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            className={styles.toast}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className={styles.toastIcon}>✅</div>
            <p>{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
