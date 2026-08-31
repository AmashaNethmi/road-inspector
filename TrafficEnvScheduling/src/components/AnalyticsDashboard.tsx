import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  BarChart2, 
  Cpu, 
  Leaf, 
  Clock, 
  ShieldAlert, 
  Layers, 
  DollarSign,
  Activity,
  Award
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const savingsData = [
    { month: 'Jan', ai_hours: 420, baseline_hours: 480 },
    { month: 'Feb', ai_hours: 380, baseline_hours: 430 },
    { month: 'Mar', ai_hours: 510, baseline_hours: 590 },
    { month: 'Apr', ai_hours: 460, baseline_hours: 530 },
    { month: 'May', ai_hours: 590, baseline_hours: 680 },
    { month: 'Jun', ai_hours: 620, baseline_hours: 710 },
  ];

  const severityDistribution = [
    { label: 'Low Severity', percentage: 45, count: 184, color: '#38bdf8' },
    { label: 'Moderate Severity', percentage: 35, count: 142, color: '#f59e0b' },
    { label: 'High / Critical', percentage: 20, count: 82, color: '#f43f5e' },
  ];

  const scatterData = [
    { area: 1.2, mass: 2.8 },
    { area: 2.0, mass: 4.6 },
    { area: 2.8, mass: 6.4 },
    { area: 3.5, mass: 8.1 },
    { area: 4.2, mass: 9.8 },
    { area: 5.0, mass: 11.5 },
    { area: 6.2, mass: 14.1 },
    { area: 7.5, mass: 17.2 },
  ];

  const renderSavingsChart = () => {
    const width = 500;
    const height = 150;
    const padding = 25;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;
    const maxVal = 800;

    const baselinePoints = savingsData.map((d, i) => {
      const x = padding + (i / (savingsData.length - 1)) * chartW;
      const y = height - padding - (d.baseline_hours / maxVal) * chartH;
      return { x, y, label: d.month };
    });

    const aiPoints = savingsData.map((d, i) => {
      const x = padding + (i / (savingsData.length - 1)) * chartW;
      const y = height - padding - (d.ai_hours / maxVal) * chartH;
      return { x, y, label: d.month };
    });

    const basePath = baselinePoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
    const aiPath = aiPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
    const aiArea = `${aiPath} L ${aiPoints[aiPoints.length - 1].x} ${height - padding} L ${aiPoints[0].x} ${height - padding} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible">
        <defs>
          <linearGradient id="aiSavingsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[200, 400, 600].map(v => {
          const y = height - padding - (v / maxVal) * chartH;
          return (
            <line key={v} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
          );
        })}

        <path d={aiArea} fill="url(#aiSavingsGrad)" />
        <path d={basePath} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" />
        <path d={aiPath} fill="none" stroke="#10b981" strokeWidth="2.5" />

        {aiPoints.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#10b981" />
            <text x={p.x} y={height - 8} fill="#71717a" fontSize="8" textAnchor="middle" className="font-mono">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  const renderScatterChart = () => {
    const width = 450;
    const height = 130;
    const padding = 25;
    const maxArea = 8.0;
    const maxMass = 20.0;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#3f3f46" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#3f3f46" strokeWidth="1" />

        {/* Trendline */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={padding + 10}
          stroke="#f97316"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* Scatter points */}
        {scatterData.map((d, i) => {
          const x = padding + (d.area / maxArea) * (width - padding * 2);
          const y = height - padding - (d.mass / maxMass) * (height - padding * 2);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#0ea5e9" className="hover:fill-orange-400 transition-colors" />
            </g>
          );
        })}

        <text x={width - padding} y={height - 8} fill="#71717a" fontSize="7" textAnchor="end" className="font-mono">Defect Surface Area (m²) →</text>
        <text x={padding + 5} y={padding - 5} fill="#71717a" fontSize="7" textAnchor="start" className="font-mono">Asphalt Mass (Tons) ↑</text>
      </svg>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl">
            <BarChart2 className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-100 font-mono uppercase">
              System Impact & AI Estimation Analytics
            </h2>
            <p className="text-xs text-zinc-400">
              Macro performance, carbon offset metrics, and machine learning regression correlation
            </p>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-zinc-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Cumulative Time Saved</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">2,980 <span className="text-xs text-zinc-500 font-normal">hrs</span></div>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +14.2% vs baseline
          </span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-zinc-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">CO₂ Emissions Prevented</span>
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">4.28 <span className="text-xs text-zinc-500 font-normal">Tons</span></div>
          <span className="text-[10px] text-zinc-500 font-mono">Via dynamic detour paths</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-zinc-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">AI Model R² Score</span>
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">99.88%</div>
          <span className="text-[10px] text-amber-400/80 font-mono">LightGBM Regression</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-zinc-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Gridlock Prevention</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">28.4%</div>
          <span className="text-[10px] text-zinc-500 font-mono">At arterial work zones</span>
        </div>
      </div>

      {/* Main Visuals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Monthly Travel Time Savings */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                  Monthly Travel Time Comparison (AI Scheduling vs Baseline)
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">Optimized detour timing prevents peak rush-hour bottlenecks</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> AI Optimized
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-400" /> Fixed Baseline
                </span>
              </div>
            </div>

            <div className="pt-2">
              {renderSavingsChart()}
            </div>
          </div>
        </div>

        {/* Right: Severity Distribution & Scatter Correlation */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Defect Severity Breakdown */}
          <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 border-b border-zinc-800/60 pb-2">
              Defect Severity Distribution
            </h3>
            
            <div className="space-y-3 pt-1">
              {severityDistribution.map(item => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">{item.label}</span>
                    <span className="text-zinc-400">{item.percentage}% ({item.count} defects)</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Area vs Mass Scatter */}
          <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 border-b border-zinc-800/60 pb-2">
              Asphalt Material Mass vs Defect Area Regression
            </h3>
            <div className="pt-1">
              {renderScatterChart()}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
