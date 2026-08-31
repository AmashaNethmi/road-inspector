import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, MapPin, Clipboard, Sliders, Layers } from 'lucide-react';
import { getHistory } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_WHITE_BASE64 } from '../assets/logosBase64';
import styles from './ReportsPage.module.css';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    getHistory()
      .then(res => {
        setReports(res.data);
        if (res.data.length > 0) {
          setSelectedReport(res.data[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load history', err);
        setLoading(false);
      });
  }, []);

  const handleExportPDF = async () => {
    if (!selectedReport) return;
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#05070a' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Road_Inspector_Report_${selectedReport.locationID || 'DEFECT'}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getSeverityClass = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'minor': return styles.minor;
      case 'moderate': return styles.moderate;
      case 'major': return styles.major;
      case 'critical': return styles.critical;
      default: return '';
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
          <h1 className={styles.title}>Research Reporting Centre</h1>
          <p className={styles.subtitle}>Generate and download dynamic PDF summaries including defect details and metric outputs</p>
        </div>
      </header>

      {loading ? (
        <div className={styles.loadingState}>
          <p>Loading analytical reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No reports found</h2>
          <p>Once you run predictions in the Repair Area Segmentation module, records will be logged here.</p>
        </div>
      ) : (
        <div className={styles.reportingLayout}>
          {/* Sidebar selector */}
          <div className={styles.reportSelector}>
            <h3>Diagnostic Records ({reports.length})</h3>
            <div className={styles.list}>
              {reports.map((report) => (
                <button
                  key={report._id}
                  className={`${styles.selectorCard} ${selectedReport?._id === report._id ? styles.active : ''}`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className={styles.selectorHeader}>
                    <strong>{report.locationID}</strong>
                    <span className={`${styles.statusDot} ${getSeverityClass(report.metrics?.structuralStability)}`} />
                  </div>
                  <div className={styles.selectorMeta}>
                    <span>📅 {new Date(report.timestamp).toLocaleDateString()}</span>
                    <span>🗺️ {report.metrics?.repairArea} m²</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Report Sheet Column */}
          <div className={styles.sheetColumn}>
            <div className={styles.sheetActions}>
              <button 
                onClick={handleExportPDF} 
                disabled={isExporting} 
                className={styles.exportBtn}
              >
                <Download size={18} />
                {isExporting ? 'Compiling PDF...' : 'Download PDF Report'}
              </button>
            </div>

            {selectedReport && (
              <div id="report-sheet" ref={reportRef} className={styles.reportSheet}>
                {/* PDF Header */}
                <div className={styles.sheetHeader}>
                  <div className={styles.sheetBrand}>
                    <div className={styles.sheetLogoWrapper}>
                      <img src={LOGO_WHITE_BASE64} alt="Road Inspector White Logo" className={styles.sheetLogoImg} />
                    </div>
                    <div>
                      <h2>ROAD INSPECTOR</h2>
                      <p>INDEPENDENT RESEARCH PLATFORM REPORT</p>
                    </div>
                  </div>
                  <div className={styles.sheetReportInfo}>
                    <p><strong>REPORT ID:</strong> #{selectedReport._id.substring(18)}</p>
                    <p><strong>DATE GENERATED:</strong> {new Date(selectedReport.timestamp).toLocaleString()}</p>
                    <p><strong>AI WEIGHTS FILE:</strong> backend/models/best.pt</p>
                  </div>
                </div>

                {/* Section 1: Field Context */}
                <div className={styles.sheetSection}>
                  <div className={styles.sectionTitle}>
                    <MapPin size={16} />
                    <span>I. Field Context & Telemetry</span>
                  </div>
                  <div className={styles.metaGrid}>
                    <div className={styles.metaItem}><span>Location Segment ID:</span><strong>{selectedReport.locationID}</strong></div>
                    <div className={styles.metaItem}><span>GPS Coordinates:</span><strong>{selectedReport.gps}</strong></div>
                    <div className={styles.metaItem}><span>Road Type Factor:</span><strong>{selectedReport.roadType}</strong></div>
                  </div>
                </div>

                {/* Section 2: Defect Images */}
                <div className={styles.sheetSection}>
                  <div className={styles.sectionTitle}>
                    <Layers size={16} />
                    <span>II. Computer Vision Segmentations</span>
                  </div>
                  <div className={styles.imageComparison}>
                    <div className={styles.imageWrapper}>
                      <img src={selectedReport.image} alt="Original road defect input" />
                      <span>Original Defect Input</span>
                    </div>
                    <div className={styles.imageWrapper}>
                      <img src={selectedReport.overlay || selectedReport.mask} alt="Segmented AI overlay" />
                      <span>AI Purple Overlay Output</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: AI Measurements */}
                <div className={styles.sheetSection}>
                  <div className={styles.sectionTitle}>
                    <Sliders size={16} />
                    <span>III. Spatial Defect Metrics (Module 1 — Pixel Scale)</span>
                  </div>
                  <div className={styles.metricsReportGrid}>
                    <div className={styles.metricRow}>
                      <span>Damaged Area Coverage:</span>
                      <strong>{selectedReport.metrics?.severityScore}%</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Pixel-Scale Repair Area:</span>
                      <strong className={styles.highlight}>{selectedReport.metrics?.repairArea} m²</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Isolated Defect Count:</span>
                      <strong>{selectedReport.metrics?.numRegions || 1} regions</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Cumulative Defect Length:</span>
                      <strong>{selectedReport.metrics?.length ? `${Number(selectedReport.metrics.length).toFixed(2)} m` : '--'}</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Average Defect Width:</span>
                      <strong>{selectedReport.metrics?.width ? `${Number(selectedReport.metrics.width).toFixed(2)} m` : '--'}</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Estimated Depth:</span>
                      <strong>{selectedReport.metrics?.estimatedDepth ? `${(selectedReport.metrics.estimatedDepth * 100).toFixed(0)} cm` : '--'}</strong>
                    </div>
                  </div>
                </div>

                {/* Section 3b: Module 2 Metric Geometry */}
                <div className={styles.sheetSection}>
                  <div className={styles.sectionTitle}>
                    <Sliders size={16} />
                    <span>III-B. Metric Geometry (Module 2 — IPM Homography)</span>
                  </div>
                  <div className={styles.metricsReportGrid}>
                    <div className={styles.metricRow}>
                      <span>Metric Method:</span>
                      <strong>{selectedReport.metrics?.metricMethod || 'N/A'}</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Ground Sampling Distance:</span>
                      <strong>{selectedReport.metrics?.gsdMPerPx != null ? `${Number(selectedReport.metrics.gsdMPerPx).toFixed(6)} m/px` : 'N/A'}</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Defect Area (IPM):</span>
                      <strong className={styles.highlight}>{selectedReport.metrics?.defectAreaM2 != null ? `${Number(selectedReport.metrics.defectAreaM2).toFixed(4)} m²` : 'N/A'}</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Repair Patch Area (+10%):</span>
                      <strong className={styles.highlight}>{selectedReport.metrics?.patchAreaM2 != null ? `${Number(selectedReport.metrics.patchAreaM2).toFixed(4)} m²` : 'N/A'}</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Crack Skeleton Length:</span>
                      <strong>{selectedReport.metrics?.crackLengthM != null ? `${Number(selectedReport.metrics.crackLengthM).toFixed(3)} m` : 'N/A'}</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Average Crack Width:</span>
                      <strong>{selectedReport.metrics?.avgCrackWidthM != null ? `${Number(selectedReport.metrics.avgCrackWidthM).toFixed(4)} m` : 'N/A'}</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Linear Crack Density:</span>
                      <strong>{selectedReport.metrics?.linearDensity != null ? `${Number(selectedReport.metrics.linearDensity).toFixed(3)} m/m²` : 'N/A'}</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Depth Estimation Method:</span>
                      <strong>{selectedReport.metrics?.depthMethod || 'N/A'}</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Mean Depth (MiDaS+RANSAC):</span>
                      <strong>{selectedReport.metrics?.meanDepthM != null ? `${Number(selectedReport.metrics.meanDepthM).toFixed(4)} m` : 'N/A'}</strong>
                    </div>
                    <div className={styles.metricRow}>
                      <span>Estimated Volume:</span>
                      <strong>{selectedReport.metrics?.volumeM3 != null ? `${Number(selectedReport.metrics.volumeM3).toFixed(5)} m³` : 'N/A'}</strong>
                    </div>
                  </div>
                </div>

                {/* Section 4: Diagnostics */}
                <div className={styles.sheetSection}>
                  <div className={styles.sectionTitle}>
                    <Clipboard size={16} />
                    <span>IV. AI Diagnostics & Priorities</span>
                  </div>
                  <div className={styles.diagnosticsContainer}>
                    <div className={styles.diagRow}>
                      <div className={styles.diagItem}>
                        <span>Risk Level:</span>
                        <strong className={`${styles.badge} ${getSeverityClass(selectedReport.metrics?.structuralStability)}`}>
                          {selectedReport.metrics?.riskLevel || 'ELEVATED'}
                        </strong>
                      </div>
                      <div className={styles.diagItem}>
                        <span>Severity Status:</span>
                        <strong className={`${styles.badge} ${getSeverityClass(selectedReport.metrics?.structuralStability)}`}>
                          {selectedReport.metrics?.structuralStability || 'MAJOR'}
                        </strong>
                      </div>
                    </div>
                    <div className={styles.diagRecommendation}>
                      <span>AI Repair Recommendation:</span>
                      <p>{selectedReport.metrics?.recommendation}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Disclaimer */}
                <div className={styles.sheetFooter}>
                  <p>This document is generated automatically by the Antigravity Road Inspector platform. Computations are predictive mathematical bounds calculated using deep convolutional networks and scaling metrics.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
