import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, BarChart, Bar, Legend
} from 'recharts';
import styles from './AnalyticsPage.module.css';

// --- MOCK DATA FOR CHARTS ---

// 1. Time Savings (Monthly comparison: Baseline vs AI)
const savingsData = [
  { month: 'Jan', ai_mass: 420, human_mass: 480 },
  { month: 'Feb', ai_mass: 380, human_mass: 430 },
  { month: 'Mar', ai_mass: 510, human_mass: 590 },
  { month: 'Apr', ai_mass: 460, human_mass: 530 },
  { month: 'May', ai_mass: 590, human_mass: 680 },
  { month: 'Jun', ai_mass: 620, human_mass: 710 },
];

// 2. Weather Safety Distribution
const thermalData = [
  { name: 'Optimal (Safe Flow)', value: 72 },
  { name: 'Heavy Rain (Risk)', value: 18 },
  { name: 'Accident (Reroute)', value: 10 },
];
const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

// 3. Severity Breakdown
const severityData = [
  { name: 'Low (Free Flow)', value: 45 },
  { name: 'Medium (Slow)', value: 35 },
  { name: 'High (Gridlock)', value: 20 },
];
const SEV_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899'];

// 4. Area vs Mass Scatter (AI Model Correlation)
const scatterData = Array.from({ length: 50 }, () => {
  const area = parseFloat((Math.random() * 5).toFixed(2));
  const depth = (Math.random() * 0.08) + 0.02; // 2cm to 10cm
  const mass = area * depth * 2400 * 1.03;
  return { area, mass: parseFloat(mass.toFixed(1)) };
});

export default function AnalyticsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>AI Estimation Analytics</h1>
          <p className={styles.subtitle}>System performance, impact metrics, and historical insights</p>
        </div>
      </header>

      {/* Top Metrics Cards */}
      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>🚦</div>
          <div className={styles.metricInfo}>
            <p className={styles.mLabel}>Total Hours Saved</p>
            <h3 className={styles.mValue}>2,980 hrs</h3>
            <p className={styles.mSub}><span className={styles.trendUp}>↗ 12%</span> vs last month</p>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>🌱</div>
          <div className={styles.metricInfo}>
            <p className={styles.mLabel}>Emissions Prevented (CO₂)</p>
            <h3 className={styles.mValue}>4.2 Tons</h3>
            <p className={styles.mSub}>Via smart signal timing</p>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>🤖</div>
          <div className={styles.metricInfo}>
            <p className={styles.mLabel}>AI Model Accuracy (R²)</p>
            <h3 className={styles.mValue}>99.88%</h3>
            <p className={styles.mSub}>Regression Network</p>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>⛔</div>
          <div className={styles.metricInfo}>
            <p className={styles.mLabel}>Gridlock Risk Blocked</p>
            <h3 className={styles.mValue}>28%</h3>
            <p className={styles.mSub}>High volume intersections</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className={styles.chartsGrid}>
        
        {/* CHART 1: Travel Time Savings */}
        <div className={`${styles.chartCard} ${styles.colSpan2}`}>
          <div className={styles.cardHeader}>
            <h3>AI vs Baseline (Travel Time)</h3>
            <p>Comparing AI precise signal adjustments against standard fixed-time signals</p>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={savingsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHuman" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#8895b3" tick={{fontSize: 12}} />
                <YAxis stroke="#8895b3" tick={{fontSize: 12}} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f1424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="human_mass" name="Fixed Signals (mins)" stroke="#ef4444" fillOpacity={1} fill="url(#colorHuman)" />
                <Area type="monotone" dataKey="ai_mass" name="AI Optimal (mins)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAI)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Thermal Safety Distribution */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>Thermal Suitability</h3>
            <p>Analysis of environmental risks</p>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={thermalData} cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5} dataKey="value"
                >
                  {thermalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f1424', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Severity Breakdown */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>Defect Severity Analysis</h3>
            <p>Based on inputted depth mapping</p>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#8895b3" tick={{fontSize: 11}} />
                <YAxis stroke="#8895b3" tick={{fontSize: 11}} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1424', border: '1px solid rgba(255,255,255,0.1)' }} cursor={{fill: 'rgba(255,255,255,0.05)'}}/>
                <Bar dataKey="value" name="% of Total Reports" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEV_COLORS[index % SEV_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Scatter Plot */}
        <div className={`${styles.chartCard} ${styles.colSpan2}`}>
          <div className={styles.cardHeader}>
            <h3>AI Prediction Distribution (Area vs Mass)</h3>
            <p>Demonstrating the neural network's regression mapping capability</p>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="area" name="Surface Area" unit=" m²" stroke="#8895b3" />
                <YAxis type="number" dataKey="mass" name="Asphalt Mass" unit=" kg" stroke="#8895b3" />
                <ZAxis type="number" range={[40, 40]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0f1424', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Scatter name="AI Estimations" data={scatterData} fill="#8b5cf6" opacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
