import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import { getHistory, getCitizenReports } from '../services/api';
import { LayoutDashboard, AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './AnalyticsPage.module.css';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data States
  const [historyData, setHistoryData] = useState([]);
  const [citizenReports, setCitizenReports] = useState([]);

  // Stats
  const [stats, setStats] = useState({
    totalDefects: 0,
    totalArea: 0,
    totalVolume: 0,
    totalInspections: 0,
    totalReports: 0,
  });

  // Chart Data
  const [defectsByType, setDefectsByType] = useState([]);
  const [severityData, setSeverityData] = useState([]);
  const [inspectionTrend, setInspectionTrend] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [histRes, repRes] = await Promise.all([
        getHistory().catch(() => ({ data: [] })),
        getCitizenReports().catch(() => ({ data: [] }))
      ]);

      const hist = histRes.data || [];
      const reports = repRes.data || [];

      setHistoryData(hist);
      setCitizenReports(reports);
      calculateAnalytics(hist, reports);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError('Unable to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateAnalytics = (hist, reports) => {
    let totalDefects = 0;
    let totalArea = 0;
    let totalVolume = 0;

    const severityCounts = { Minor: 0, Moderate: 0, Major: 0, Critical: 0 };
    const dateCounts = {};

    hist.forEach(item => {
      // Safely parse numbers
      totalDefects += item.metrics?.numRegions || (item.defects ? item.defects.length : 1);
      totalArea += parseFloat(item.metrics?.defectAreaM2 || item.metrics?.repairArea || 0);
      totalVolume += parseFloat(item.metrics?.volumeM3 || 0);

      // Severity Distribution
      const severity = item.metrics?.structuralStability || item.metrics?.severityLevel || item.metrics?.riskLevel || 'Moderate';
      if (severityCounts[severity] !== undefined) {
        severityCounts[severity]++;
      } else if (severity.includes('Elevated')) {
        severityCounts['Major']++;
      } else {
        severityCounts['Moderate']++;
      }

      // Inspection Trend by Date
      const dateStr = item.createdAt || item.timestamp;
      if (dateStr) {
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          const dateKey = dateObj.toLocaleDateString();
          dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
        }
      }
    });

    const defectTypes = { Pothole: 0, Crack: 0, Rutting: 0, Shoving: 0, Other: 0 };
    reports.forEach(r => {
      const t = r.defectType;
      if (defectTypes[t] !== undefined) defectTypes[t]++;
      else defectTypes['Other']++;
    });

    setStats({
      totalDefects,
      totalArea,
      totalVolume,
      totalInspections: hist.length,
      totalReports: reports.length
    });

    setSeverityData(Object.keys(severityCounts).map(k => ({ name: k, value: severityCounts[k] })));
    setDefectsByType(Object.keys(defectTypes).map(k => ({ name: k, value: defectTypes[k] })).filter(d => d.value > 0));

    // Sort dates for trend
    const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b));
    setInspectionTrend(sortedDates.map(d => ({ date: d, count: dateCounts[d] })));
  };

  if (loading) {
    return (
      <div className={styles.page} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={32} color="#8b5cf6" />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 style={{ color: 'var(--text-primary)' }}>{error}</h2>
        <button 
          onClick={loadData}
          style={{ 
            marginTop: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', 
            color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' 
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (historyData.length === 0 && citizenReports.length === 0) {
    return (
      <div className={styles.page} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <LayoutDashboard size={48} color="#8895b3" style={{ marginBottom: '1rem' }} />
        <h2 style={{ color: 'var(--text-primary)' }}>No inspection data available yet.</h2>
      </div>
    );
  }

  return (
    <motion.div className={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>System Analytics</h1>
          <p className={styles.subtitle}>Unified dashboard for road defect statistics, repair estimations, and inspection trends.</p>
        </div>
      </header>

      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>🔍</div>
          <div className={styles.metricInfo}>
            <p className={styles.mLabel}>Total Defects</p>
            <h3 className={styles.mValue}>{stats.totalDefects}</h3>
            <p className={styles.mSub}>Detected anomalies</p>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>📏</div>
          <div className={styles.metricInfo}>
            <p className={styles.mLabel}>Total Repair Area</p>
            <h3 className={styles.mValue}>{stats.totalArea.toFixed(2)} m²</h3>
            <p className={styles.mSub}>Calculated surface area</p>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>📦</div>
          <div className={styles.metricInfo}>
            <p className={styles.mLabel}>Est. Repair Volume</p>
            <h3 className={styles.mValue}>{stats.totalVolume.toFixed(3)} m³</h3>
            <p className={styles.mSub}>Material estimation</p>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>📋</div>
          <div className={styles.metricInfo}>
            <p className={styles.mLabel}>Inspections & Reports</p>
            <h3 className={styles.mValue}>{stats.totalInspections + stats.totalReports}</h3>
            <p className={styles.mSub}>Total logged records</p>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>Defects by Type</h3>
            <p>Distribution of road defect classifications</p>
          </div>
          <div className={styles.chartWrapper}>
            {defectsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defectsByType} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#8895b3" tick={{fontSize: 11}} />
                  <YAxis stroke="#8895b3" tick={{fontSize: 11}} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f1424', border: '1px solid rgba(255,255,255,0.1)' }} cursor={{fill: 'rgba(255,255,255,0.05)'}}/>
                  <Bar dataKey="value" name="Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No data available
              </div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>Severity Distribution</h3>
            <p>Risk levels across all analyzed inspections</p>
          </div>
          <div className={styles.chartWrapper}>
            {severityData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severityData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {severityData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f1424', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No data available
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.chartCard} ${styles.colSpan2}`}>
          <div className={styles.cardHeader}>
            <h3>Inspection Trend</h3>
            <p>Frequency of road inspections over time</p>
          </div>
          <div className={styles.chartWrapper}>
            {inspectionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inspectionTrend} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#8895b3" tick={{fontSize: 11}} />
                  <YAxis stroke="#8895b3" tick={{fontSize: 11}} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f1424', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Line type="monotone" dataKey="count" name="Inspections" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
