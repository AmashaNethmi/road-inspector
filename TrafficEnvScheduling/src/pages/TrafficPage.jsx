// TrafficPage.jsx — Main Traffic Environment Scheduling page with AI
import { useState, useEffect } from 'react';
import { checkHealth, getHistory } from '../services/api'; // using mocked function below
import StatusBadge from '../components/StatusBadge';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './TrafficPage.module.css'; // Renamed import

// --- SRI LANKAN MARKET CONSTANTS FOR TRAFFIC ---
const AVERAGE_SPEED_LIMIT = 60; // km/h
const CARBON_EMISSION_PER_VEHICLE = 0.12; // kg CO2 per km

const ROAD_TYPE_OPTIONS = [
  { value: 'highway',    label: 'Highway (Express)', capacity: 4000 },
  { value: 'arterial', label: 'Arterial Road', capacity: 2500 },
  { value: 'local',   label: 'Local Street',   capacity: 1000 },
];

const DEFAULT_FORM = {
  vehicleCount: '',
  timeOfDay: '',
  roadType: 'arterial',
  customCapacity: '',
  weatherCondition: '',
  eventImpact: '',
  location_name: '',
};

export default function TrafficPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [backendStatus, setBackendStatus] = useState('loading');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    // Mock health
    setTimeout(() => setBackendStatus('ok'), 500);
    // Mock history
    setHistory([]);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getCapacity = () => {
    if (form.customCapacity) return parseFloat(form.customCapacity);
    const rt = ROAD_TYPE_OPTIONS.find(s => s.value === form.roadType);
    return rt ? rt.capacity : 2500;
  };

  const mockPredictTraffic = (payload) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const capacity = payload.capacity;
        const volume = payload.vehicle_count;
        const congestionLevel = (volume / capacity) * 100;
        
        resolve({
          data: {
            inputs: {
              volume: volume,
              capacity: capacity,
              weather: payload.weather_condition,
              time_of_day: payload.time_of_day,
              congestion_severity: congestionLevel > 80 ? 'High' : congestionLevel > 50 ? 'Medium' : 'Low'
            },
            location_name: payload.location_name || 'Unknown Location',
            model_info: {
              r2_score: 0.92,
              mae_vehicles: 45
            },
            ai_prediction: {
              predicted_travel_time_mins: Math.round((10 / AVERAGE_SPEED_LIMIT) * 60 * (1 + congestionLevel / 100)),
              optimal_speed_kmh: Math.max(10, AVERAGE_SPEED_LIMIT - (congestionLevel * 0.4)),
              signal_timing_adjustment: congestionLevel > 70 ? '+15s Green' : 'Standard',
              reroute_recommended: congestionLevel > 85,
              emissions_kg: (volume * CARBON_EMISSION_PER_VEHICLE).toFixed(2)
            },
            environmental_analysis: {
              is_optimal: congestionLevel < 60,
              confidence_pct: 88,
              recommendation: congestionLevel > 80 ? 'Divert traffic to alternate routes immediately.' : 'Maintain current signal patterns.',
              issues: congestionLevel > 80 ? ['High emissions due to idling', 'Risk of gridlock'] : []
            }
          }
        });
      }, 1500);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      vehicle_count: parseFloat(form.vehicleCount),
      time_of_day: parseFloat(form.timeOfDay),
      capacity: getCapacity(),
      weather_condition: parseFloat(form.weatherCondition),
      event_impact: parseFloat(form.eventImpact),
      location_name: form.location_name,
    };

    try {
      const res = await mockPredictTraffic(payload);
      const data = res.data;
      setResult(data);
      setHistory(prev => [{ ...data, id: Date.now(), timestamp: Date.now() }, ...prev.slice(0, 4)]);
    } catch (err) {
      setError('Prediction failed. Check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportPDF = () => {
    const element = document.getElementById('spec-sheet-pdf');
    if (!element) return;
    
    html2canvas(element, { scale: 2, backgroundColor: '#0f1424' }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.setFontSize(16);
      pdf.text('Road Inspector - Traffic Control Sheet', 10, 15);
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 10, 22);
      if (form.location_name) {
        pdf.text(`Location: ${form.location_name}`, 10, 28);
      }
      
      pdf.addImage(imgData, 'PNG', 0, 35, pdfWidth, pdfHeight);
      pdf.save('Traffic_Control_Sheet.pdf');
    });
  };

  const radarData = result ? [
    { subject: 'Volume', value: Math.min(result.inputs.volume / 50, 100) },
    { subject: 'Congestion', value: result.inputs.congestion_severity === 'High' ? 100 : result.inputs.congestion_severity === 'Medium' ? 60 : 20 },
    { subject: 'Env Safe', value: result.environmental_analysis.is_optimal ? 90 : 30 },
    { subject: 'Speed Drop', value: 100 - result.ai_prediction.optimal_speed_kmh },
    { subject: 'Accuracy', value: result.model_info.r2_score * 100 },
  ] : [];

  return (
    <motion.div 
      className={styles.page}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Traffic Env Scheduling AI</h1>
          <p className={styles.subtitle}>
            Neural network–powered traffic flow & environment prediction
          </p>
        </div>
        <StatusBadge status={backendStatus} />
      </header>

      <div className={styles.mainGrid}>
        {/* ========== INPUT FORM ========== */}
        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>🚦</span>
            <div>
              <h3>Traffic Parameters</h3>
              <p>Enter traffic volume & environmental factors</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Dimensions */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>
                <span>🚗</span> Traffic Volume Data
              </h4>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Vehicle Count / Hr</label>
                  <input
                    type="number" name="vehicleCount" min="0"
                    placeholder="e.g. 1500" required
                    value={form.vehicleCount} onChange={handleChange}
                  />
                </div>
                <div className={styles.field}>
                  <label>Time of Day (0-24)</label>
                  <input
                    type="number" name="timeOfDay" step="0.1" min="0" max="24"
                    placeholder="e.g. 14.5" required
                    value={form.timeOfDay} onChange={handleChange}
                  />
                </div>
              </div>

              {/* Location Input */}
              <div className={styles.field} style={{ marginTop: '0.5rem' }}>
                <label><span>📍</span> Intersection / Road Section</label>
                <input
                  type="text" name="location_name"
                  placeholder="e.g. Kandy Road Sec A"
                  value={form.location_name} onChange={handleChange}
                />
              </div>
            </div>

            {/* Road Type */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>
                <span>🛣️</span> Road Classification
              </h4>
              <div className={styles.severityGrid}>
                {ROAD_TYPE_OPTIONS.map(opt => (
                  <button
                    type="button" key={opt.value}
                    className={`${styles.severityBtn} ${form.roadType === opt.value ? styles.severityActive : ''}`}
                    onClick={() => setForm({ ...form, roadType: opt.value, customCapacity: '' })}
                  >
                    <span className={styles.sevLabel}>{opt.label}</span>
                    <span className={styles.sevDepth}>{opt.capacity} v/hr</span>
                  </button>
                ))}
              </div>
              <div className={styles.field} style={{ marginTop: '0.75rem' }}>
                <label>Custom Capacity (v/hr) — optional</label>
                <input
                  type="number" name="customCapacity" min="100"
                  placeholder="e.g. 3000"
                  value={form.customCapacity} onChange={handleChange}
                />
              </div>
            </div>

            {/* Environment Conditions */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>
                <span>🌧️</span> Environment & Events
              </h4>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Weather Impact (0-1)</label>
                  <input
                    type="number" name="weatherCondition" step="0.1" min="0" max="1"
                    placeholder="e.g. 0.2 (Light Rain)" required
                    value={form.weatherCondition} onChange={handleChange}
                  />
                  <span className={styles.hint}>0: Clear, 1: Severe Storm</span>
                </div>
                <div className={styles.field}>
                  <label>Event Impact (0-1)</label>
                  <input
                    type="number" name="eventImpact" step="0.1" min="0" max="1"
                    placeholder="e.g. 0.5" required
                    value={form.eventImpact} onChange={handleChange}
                  />
                  <span className={styles.hint}>Local events / accidents</span>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className={styles.errorBox}>
                <span>⛔</span> {error}
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? (
                <><span className={styles.spinner} /> Processing Flow...</>
              ) : (
                <><span>🤖</span> Optimize Traffic Flow</>
              )}
            </button>
          </form>
        </div>

        {/* ========== RESULTS ========== */}
        <div className={styles.resultsArea}>
          {!result && !isLoading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🚦</div>
              <h3>AI Ready</h3>
              <p>Enter volume and conditions, then click <em>Optimize Traffic Flow</em> to get AI scheduling insights.</p>
            </div>
          )}

          {isLoading && (
            <div className={styles.emptyState}>
              <div className={styles.loadingRing} />
              <h3>AI is Processing...</h3>
              <p>Evaluating signal timings & congestion models...</p>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Spec Sheet */}
              <div className={styles.specCard} id="spec-sheet-pdf">
                <div className={styles.cardHeader}>
                  <span className={styles.cardIcon}>📋</span>
                  <div>
                    <h3>Traffic Control Sheet</h3>
                    <p>AI-generated schedule — Confidence: R² = {(result.model_info.r2_score * 100).toFixed(1)}%</p>
                  </div>
                </div>

                {result.location_name && result.location_name !== 'Unknown Location' && (
                  <div className={styles.locationBadge}>
                    <strong>📍 Location:</strong> {result.location_name}
                  </div>
                )}

                <div className={styles.metricsGrid}>
                  <div className={styles.metric}>
                    <span className={styles.mLabel}>Current Volume</span>
                    <span className={styles.mValue}>{result.inputs.volume} v/hr</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.mLabel}>Road Capacity</span>
                    <span className={styles.mValue}>{result.inputs.capacity} v/hr</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.mLabel}>Travel Time</span>
                    <span className={styles.mValue}>{result.ai_prediction.predicted_travel_time_mins} mins</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.mLabel}>Congestion</span>
                    <span className={`${styles.mValue} ${styles[`sev${result.inputs.congestion_severity.toLowerCase()}`]}`}>
                      {result.inputs.congestion_severity}
                    </span>
                  </div>
                </div>

                {/* Hero Result */}
                <div className={styles.massHero}>
                  <div>
                    <p className={styles.massLabel}>🤖 Optimal Flow Speed</p>
                    <p className={styles.massValue}>{Math.round(result.ai_prediction.optimal_speed_kmh)} km/h</p>
                    <p className={styles.massNote}>Base Limit: {AVERAGE_SPEED_LIMIT} km/h</p>
                  </div>
                  <div className={styles.massRight}>
                    <p className={styles.gradeLabel}>Signal Adjustment</p>
                    <p className={styles.gradeValue}>{result.ai_prediction.signal_timing_adjustment}</p>
                    <p className={styles.appTemp}>{result.ai_prediction.reroute_recommended ? 'Rerouting Active' : 'Normal Operations'}</p>
                  </div>
                </div>

                {/* Environmental Impact */}
                <div className={styles.impactGrid}>
                  <div className={styles.financeBox}>
                    <div className={styles.impactIcon}>🛣️</div>
                    <div>
                      <p className={styles.impactLabel}>Throughput Status</p>
                      <h4 className={styles.financeValue}>
                        {result.inputs.congestion_severity === 'High' ? 'Gridlock Risk' : 'Flowing'}
                      </h4>
                      <p className={styles.impactNote}>Capacity at {Math.round((result.inputs.volume/result.inputs.capacity)*100)}%</p>
                    </div>
                  </div>
                  <div className={styles.carbonBox}>
                    <div className={styles.impactIcon}>🌱</div>
                    <div>
                      <p className={styles.impactLabel}>Est. Carbon Emission</p>
                      <h4 className={styles.carbonValue}>
                        {result.ai_prediction.emissions_kg} kg CO₂
                      </h4>
                      <p className={styles.impactNote}>Per hour for this section</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className={`${styles.thermalBox} ${result.environmental_analysis.is_optimal ? styles.thermalSafe : styles.thermalUnsafe}`}>
                  <div className={styles.thermalIcon}>
                    {result.environmental_analysis.is_optimal ? '✅' : '⛔'}
                  </div>
                  <div>
                    <h4>
                      {result.environmental_analysis.is_optimal
                        ? `Optimal Flow — AI Confidence: ${result.environmental_analysis.confidence_pct}%`
                        : `Congestion Warning — AI Confidence: ${result.environmental_analysis.confidence_pct}%`}
                    </h4>
                    <p>{result.environmental_analysis.recommendation}</p>
                    {result.environmental_analysis.issues.map((iss, i) => (
                      <p key={i} className={styles.issueItem}>⚠️ {iss}</p>
                    ))}
                  </div>
                </div>

                {/* Input Summary */}
                <div className={styles.inputSummary}>
                  <span>Weather: <strong>{result.inputs.weather}</strong></span>
                  <span>Time: <strong>{result.inputs.time_of_day}H</strong></span>
                  <span>MAE: <strong>±{result.model_info.mae_vehicles} vehicles</strong></span>
                </div>
              </div>

              {/* Export Button */}
              <motion.button 
                className={styles.exportBtn}
                onClick={exportPDF}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>📄</span> Download Traffic Control Report
              </motion.button>

              {/* Radar Chart */}
              {radarData.length > 0 && (
                <div className={styles.chartCard}>
                  <h4 className={styles.chartTitle}>📊 Simulation Quality Radar</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#8895b3', fontSize: 12 }} />
                      <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className={styles.historyCard}>
          <div className={styles.cardHeader} style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.875rem' }}>
              <span className={styles.cardIcon}>🗄️</span>
              <div>
                <h3>Database Estimations</h3>
                <p>Past AI predictions</p>
              </div>
            </div>
            <input
              type="text"
              placeholder="🔍 Filter by location..."
              className={styles.filterInput}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          
          <div className={styles.tableContainer}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Volume (v/hr)</th>
                  <th>Speed (km/h)</th>
                  <th>Congestion</th>
                  <th>Signal Mode</th>
                </tr>
              </thead>
              <tbody>
                {history
                  .filter(h => h.location_name && h.location_name.toLowerCase().includes(filterText.toLowerCase()))
                  .map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.timestamp).toLocaleDateString()}</td>
                    <td>{h.location_name || 'Unknown'}</td>
                    <td>{h.inputs.volume}</td>
                    <td>{Math.round(h.ai_prediction.optimal_speed_kmh)}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>{h.inputs.congestion_severity}</td>
                    <td>
                      {h.ai_prediction.signal_timing_adjustment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Constants Reference */}
      <motion.div 
        className={styles.constantsCard}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>📌</span>
          <div>
            <h3>Traffic Control Constants — RDA Sri Lanka</h3>
            <p>Based on national highway standards and predictive models</p>
          </div>
        </div>
        <div className={styles.constantsGrid}>
          {[
            { label: 'Avg Speed Limit',       value: '60 km/h',        icon: '⚖️' },
            { label: 'Highway Capacity',      value: '4,000 v/hr',     icon: '🛣️' },
            { label: 'Arterial Capacity',     value: '2,500 v/hr',     icon: '🚦' },
            { label: 'Local Capacity',        value: '1,000 v/hr',     icon: '🏠' },
            { label: 'Carbon Base',           value: '0.12 kg/km',     icon: '🌱' },
            { label: 'Max Congestion',        value: '85% Limit',      icon: '⛔' },
            { label: 'Signal Cycle Base',     value: '90s',            icon: '⏱️' },
            { label: 'AI Optimization',       value: 'Active',         icon: '🤖' },
          ].map((c, i) => (
            <div key={i} className={styles.constant}>
              <span className={styles.constIcon}>{c.icon}</span>
              <span className={styles.constLabel}>{c.label}</span>
              <span className={styles.constValue}>{c.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
