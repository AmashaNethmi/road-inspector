import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getHistory } from '../services/api';
import { Calendar, MapPin, Play, Download } from 'lucide-react';
import styles from './HistoryPage.module.css';

export default function HistoryPage({ onReopen, onNavigate }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = () => {
    getHistory()
      .then(res => {
        setHistory(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load history', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const getSeverityClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'minor': return styles.minor;
      case 'moderate': return styles.moderate;
      case 'major': return styles.major;
      case 'critical': return styles.critical;
      default: return '';
    }
  };

  const handleReopen = (item) => {
    // Map the database record format to the expected React state format
    const formattedData = {
      uploadedImage: item.locationID || 'Loaded Image',
      form: {
        locationID: item.locationID,
        gps:        item.gps,
        roadType:   item.roadType,
        pixelScale: 0.01
      },
      result: {
        success:               true,
        masks_found:           true,
        damaged_pixels:        item.metrics?.damagedPixels || 0,
        total_pixels:          300000,
        coverage_percentage:   parseFloat(item.metrics?.severityScore || 0),
        estimated_repair_area: parseFloat(item.metrics?.repairArea || 0),
        num_regions:           item.metrics?.numRegions || 1,
        severity_level:        item.metrics?.structuralStability,
        repair_priority:       item.metrics?.structuralStability,
        recommendation:        item.metrics?.recommendation,
        length:                item.metrics?.length || 0,
        width:                 item.metrics?.width || 0,
        estimated_depth:       item.metrics?.estimatedDepth || 0.04,
        risk_level:            item.metrics?.riskLevel || 'Elevated',
        mask_image:            item.mask,
        overlay_image:         item.overlay || item.mask,
        // Module 2 fields (populated if record was created with Module 2)
        ipm_image:             item.ipm || null,
        metric_method:         item.metrics?.metricMethod || 'pixel_scale',
        ipm_calibration:       item.metrics?.ipmCalibration || null,
        gsd_m_per_px:          item.metrics?.gsdMPerPx || null,
        defect_area_m2:        item.metrics?.defectAreaM2 || null,
        patch_area_m2:         item.metrics?.patchAreaM2 || null,
        crack_length_m:        item.metrics?.crackLengthM || null,
        avg_crack_width_m:     item.metrics?.avgCrackWidthM || null,
        linear_density_m_per_m2: item.metrics?.linearDensity || null,
        depth_method:          item.metrics?.depthMethod || 'N/A',
        mean_depth_m:          item.metrics?.meanDepthM || null,
        volume_m3:             item.metrics?.volumeM3 || null,
      }
    };
    if (typeof onReopen === 'function') {
      onReopen(formattedData);
      onNavigate('segmentation');
    }
  };


  return (
    <motion.div 
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Analysis History</h1>
          <p className={styles.subtitle}>Browse and manage past YOLOv8 road segmentation audits and spatial telemetry</p>
        </div>
      </header>

      {loading ? (
        <div className={styles.loadingState}>
          <p>Retrieving diagnostic history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No historical records logged</h2>
          <p>Run predictions in the Defect Detection module to compile a history file.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date & Timestamp</th>
                <th>Location Segment</th>
                <th>Estimated Area</th>
                <th>Defect Coverage</th>
                <th>Risk Priority</th>
                <th>Regions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item._id} className={styles.row}>
                  <td className={styles.timeCell}>
                    <Calendar size={14} />
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </td>
                  <td className={styles.locationCell}>
                    <MapPin size={14} />
                    <strong>{item.locationID}</strong>
                    <span className={styles.gps}>{item.gps}</span>
                  </td>
                  <td className={styles.areaCell}>
                    <strong>{item.metrics?.repairArea} m²</strong>
                  </td>
                  <td>
                    <span>{parseFloat(item.metrics?.severityScore || 0).toFixed(2)}%</span>
                  </td>
                  <td>
                    <span className={`${styles.riskBadge} ${getSeverityClass(item.metrics?.structuralStability)}`}>
                      {item.metrics?.riskLevel || 'MAJOR'}
                    </span>
                  </td>
                  <td>
                    <span>{item.metrics?.numRegions || 1} regions</span>
                  </td>
                  <td className={styles.actionCell}>
                    <button 
                      onClick={() => handleReopen(item)} 
                      className={styles.btnReopen}
                      title="Load this report in Segmentation Page"
                    >
                      <Play size={14} /> Reopen
                    </button>
                    <button 
                      onClick={() => onNavigate('reports')} 
                      className={styles.btnReport}
                      title="Go to Reports Page"
                    >
                      <Download size={14} /> Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
