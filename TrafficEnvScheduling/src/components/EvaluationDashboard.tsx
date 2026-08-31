import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BarChart, 
  Settings, 
  ShieldAlert, 
  Activity, 
  Clock, 
  FileText, 
  Download,
  Info,
  Layers,
  ChevronDown
} from 'lucide-react';
import { CircularProgress, Tooltip } from '@mui/material';

// Inline Custom SVG Density/Distribution Chart representing 10,000 Monte Carlo runs
function SVGDensityChart({ data, ci }) {
  if (!data || data.length === 0) return <div className="h-28 flex items-center justify-center text-xs text-zinc-500">No Monte Carlo data</div>;
  
  const width = 500;
  const height = 120;
  const counts = data.map(d => d.count);
  const maxCount = Math.max(...counts, 1);
  const padding = 15;
  const chartHeight = height - padding * 2;
  const barWidth = (width - 40) / data.length;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 overflow-visible">
        {/* Draw distribution bars */}
        {data.map((d, i) => {
          const x = 20 + i * barWidth;
          const h = (d.count / maxCount) * chartHeight;
          const y = height - padding - h;
          return (
            <rect 
              key={i} 
              x={x} 
              y={y} 
              width={barWidth - 2} 
              height={h} 
              fill="#f97316" 
              opacity={0.3} 
              rx="1.5"
            />
          );
        })}
        
        {/* Draw Mean line */}
        {ci && (
          <>
            {/* Mean */}
            <line 
              x1={20 + (ci.mean_prediction / 100.0) * (width - 40)} 
              y1={5} 
              x2={20 + (ci.mean_prediction / 100.0) * (width - 40)} 
              y2={height - 15} 
              stroke="#ef4444" 
              strokeWidth="1.5" 
              strokeDasharray="2 2"
            />
            <text 
              x={20 + (ci.mean_prediction / 100.0) * (width - 40) + 4} 
              y={15} 
              fontSize="7" 
              fill="#ef4444" 
              className="font-mono font-bold"
            >
              Mean: {ci.mean_prediction}%
            </text>
            
            {/* 95% CI bounds shaded region */}
            <rect 
              x={20 + (ci.confidence_interval.lower_bound / 100.0) * (width - 40)}
              y={10}
              width={((ci.confidence_interval.upper_bound - ci.confidence_interval.lower_bound) / 100.0) * (width - 40)}
              height={height - 25}
              fill="#38bdf8"
              opacity={0.15}
            />
          </>
        )}
        
        {/* Axes */}
        <line x1="20" y1={height - 15} x2={width - 20} y2={height - 15} stroke="#27272a" strokeWidth="1" />
        {data.map((d, i) => {
          if (i % 2 !== 0) return null;
          return (
            <text key={i} x={20 + i * barWidth + barWidth/2} y={height - 2} fontSize="7" fill="#71717a" textAnchor="middle" className="font-mono">
              {d.bin}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function EvaluationDashboard() {
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  
  // Custom inputs
  const [urgency, setUrgency] = useState(75.0);
  const [traffic, setTraffic] = useState(45.0);
  const [weather, setWeather] = useState(35.0);

  // Result States
  const [mcData, setMcData] = useState<any>(null);
  const [comparisons, setComparisons] = useState<any>(null);
  const [backtestData, setBacktestData] = useState<any>(null);

  const getApiBase = () => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:8002`;
  };
  const API_BASE = getApiBase();

  const runMonteCarlo = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`${API_BASE}/api/evaluation/monte_carlo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urgency, traffic, weather })
      });
      const data = await res.json();
      setMcData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const loadComparisons = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/evaluation/compare_models`);
      const data = await res.json();
      setComparisons(data);
      
      const backtestRes = await fetch(`${API_BASE}/api/evaluation/backtest`);
      const backtestVal = await backtestRes.json();
      setBacktestData(backtestVal);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadReport = () => {
    if (!mcData || !comparisons) return;
    
    const reportText = `ROAD INSPECTOR EVALUATION & UNCERTAINTY RESEARCH REPORT
==========================================================
Timestamp: ${new Date().toISOString()}

1. SYSTEM STABILITY ANALYTICS
----------------------------------------------------------
- Overall Decision Stability: ${mcData.decision_stability.overall_stability}%
- Route Stability: ${mcData.decision_stability.route_stability}%
- Schedule Stability: ${mcData.decision_stability.schedule_stability}%
- Weather Stability: ${mcData.decision_stability.weather_stability}%

2. MONTE CARLO UNCERTAINTY PROPAGATION (10,000 SAMPLES)
----------------------------------------------------------
- Mean Recommendation Score: ${mcData.confidence_intervals.mean_prediction}%
- Std Deviation: ${mcData.confidence_intervals.std_deviation}%
- 95% Confidence Interval: [${mcData.confidence_intervals.confidence_interval.lower_bound}%, ${mcData.confidence_intervals.confidence_interval.upper_bound}%]
- 95% Prediction Interval: [${mcData.confidence_intervals.prediction_interval.lower_bound}%, ${mcData.confidence_intervals.prediction_interval.upper_bound}%]

3. FORECASTING SENSITIVITY INDICES
----------------------------------------------------------
- Weather Forecast Errors Impact: ${mcData.sensitivity_analysis.weather_error_impact_pct}%
- Traffic Forecast Errors Impact: ${mcData.sensitivity_analysis.traffic_error_impact_pct}%
- Model Prediction Errors Impact: ${mcData.sensitivity_analysis.prediction_error_impact_pct}%

4. MODEL PERFORMANCE RANKINGS
----------------------------------------------------------
${comparisons.models_comparison.models.map((m, i) => `${i+1}. ${m.model_name} (MAE: ${m.mae}, RMSE: ${m.rmse}, R2: ${m.r2}, F1: ${m.f1}%)`).join('\n')}

Report exported successfully.`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `road_inspector_evaluation_report_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadComparisons();
      await runMonteCarlo();
      setLoading(false);
    };
    init();
  }, []);

  if (loading && !mcData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <CircularProgress className="text-orange-500" />
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Assembling Research Reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 text-zinc-100">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-900 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight uppercase flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-500" /> Decision Support & Evaluation Dashboard
          </h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
            Module 4 Research Compliance Report (Uncertainty Propagation Framework)
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadReport} 
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] uppercase font-bold px-4 py-2 rounded-xl transition-all"
          >
            <Download className="w-4 h-4" /> Download Evaluation Report
          </button>
          <button 
            onClick={runMonteCarlo} 
            disabled={simulating}
            className="bg-orange-500 hover:bg-orange-400 text-zinc-950 font-mono text-[10px] uppercase font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            {simulating ? "Simulating..." : "Run Monte Carlo (10,000 Runs)"}
          </button>
        </div>
      </div>

      {/* Grid: Monte Carlo Uncertainty on Left, Sensitivity / Stability on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Monte Carlo Density Chart & Confidence Interval bounds */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider">Uncertainty Propagation Histogram (10,000 Bins)</span>
              <span className="text-[9px] font-mono text-orange-400 animate-pulse">● Simulation active</span>
            </div>

            {mcData && (
              <>
                <SVGDensityChart 
                  data={mcData.monte_carlo_results.simulated_scores_distribution} 
                  ci={mcData.confidence_intervals} 
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-900">
                    <span className="text-zinc-500 block text-[9px] uppercase">Mean Score</span>
                    <span className="text-lg font-bold text-zinc-200">{mcData.confidence_intervals.mean_prediction}%</span>
                  </div>
                  <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-900">
                    <span className="text-zinc-500 block text-[9px] uppercase">Std Dev</span>
                    <span className="text-lg font-bold text-zinc-200">{mcData.confidence_intervals.std_deviation}%</span>
                  </div>
                  <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-900 col-span-2">
                    <span className="text-zinc-500 block text-[9px] uppercase">95% Confidence Interval</span>
                    <span className="text-md font-bold text-sky-400">
                      [{mcData.confidence_intervals.confidence_interval.lower_bound}%, {mcData.confidence_intervals.confidence_interval.upper_bound}%]
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/20 border border-zinc-900/60 rounded-xl font-mono text-[10px] text-zinc-500 flex justify-between">
                  <span>95% Prediction Bound interval:</span>
                  <span className="text-zinc-300">[{mcData.confidence_intervals.prediction_interval.lower_bound}%, {mcData.confidence_intervals.prediction_interval.upper_bound}%]</span>
                </div>
              </>
            )}

          </div>

        </div>

        {/* Right Side: Global Sensitivity Index & Stability Analytics */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Sensitivity Indices */}
          {mcData && (
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-500" /> Global Sensitivity index Analysis
              </h3>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-400">Weather Forecast Errors Impact</span>
                    <span className="text-orange-400 font-bold">{mcData.sensitivity_analysis.weather_error_impact_pct}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full" style={{ width: `${mcData.sensitivity_analysis.weather_error_impact_pct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-400">Traffic Congestion Variances Impact</span>
                    <span className="text-sky-400 font-bold">{mcData.sensitivity_analysis.traffic_error_impact_pct}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-400 h-full" style={{ width: `${mcData.sensitivity_analysis.traffic_error_impact_pct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-400">Defect Urgency Classification Impact</span>
                    <span className="text-purple-400 font-bold">{mcData.sensitivity_analysis.prediction_error_impact_pct}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-400 h-full" style={{ width: `${mcData.sensitivity_analysis.prediction_error_impact_pct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Decision Stability Indexes */}
          {mcData && (
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Decision Stability Analytics
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-center text-xs">
                <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                  <span className="text-zinc-500 text-[9px] uppercase block">Schedule Stability</span>
                  <span className="text-md font-bold text-emerald-400">{mcData.decision_stability.schedule_stability}%</span>
                </div>
                <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                  <span className="text-zinc-500 text-[9px] uppercase block">Route Stability</span>
                  <span className="text-md font-bold text-emerald-400">{mcData.decision_stability.route_stability}%</span>
                </div>
                <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                  <span className="text-zinc-500 text-[9px] uppercase block">Repair Window</span>
                  <span className="text-md font-bold text-emerald-400">{mcData.decision_stability.repair_window_stability}%</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Model Comparisons Table */}
      {comparisons && comparisons.models_comparison && (
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-500" /> Time Series Forecasting Models Performance Rankings
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[9px]">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4 text-center">MAE</th>
                  <th className="py-3 px-4 text-center">RMSE</th>
                  <th className="py-3 px-4 text-center">MAPE (%)</th>
                  <th className="py-3 px-4 text-center">R² Score</th>
                  <th className="py-3 px-4 text-center">Accuracy (%)</th>
                  <th className="py-3 px-4 text-center">F1 Score (%)</th>
                  <th className="py-3 px-4 text-center">Training Time</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.models_comparison.models.map((m, idx) => (
                  <tr key={idx} className={`border-b border-zinc-900 hover:bg-zinc-900/10 transition-all ${idx === 0 ? 'bg-orange-500/5' : ''}`}>
                    <td className="py-3 px-4 font-bold text-orange-400">#{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-zinc-200">{m.model_name}</td>
                    <td className="py-3 px-4 text-center">{m.mae}</td>
                    <td className="py-3 px-4 text-center">{m.rmse}</td>
                    <td className="py-3 px-4 text-center">{m.mape}%</td>
                    <td className="py-3 px-4 text-center">{m.r2}</td>
                    <td className="py-3 px-4 text-center text-emerald-400">{m.accuracy}%</td>
                    <td className="py-3 px-4 text-center text-sky-400">{m.f1}%</td>
                    <td className="py-3 px-4 text-center text-zinc-500">{m.train_time}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scheduler and Routers Comparisons */}
      {comparisons && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Schedulers */}
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 mb-4">
              📅 Scheduler Optimization Comparisons
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[9px]">
                    <th className="py-3">Algorithm</th>
                    <th className="py-3 text-center">Runtime (s)</th>
                    <th className="py-3 text-center">Obj Score (%)</th>
                    <th className="py-3 text-center">Resource Usage (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.schedulers_comparison.schedulers.map((s, idx) => (
                    <tr key={idx} className="border-b border-zinc-900">
                      <td className="py-3 font-bold text-zinc-200">{s.algorithm}</td>
                      <td className="py-3 text-center">{s.runtime_sec}s</td>
                      <td className="py-3 text-center font-bold text-orange-400">{s.objective_score}%</td>
                      <td className="py-3 text-center text-sky-400">{s.resource_usage_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Routers */}
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 mb-4">
              🧭 shortest Path Routers Comparisons
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[9px]">
                    <th className="py-3">Algorithm</th>
                    <th className="py-3 text-center">Expanded Nodes</th>
                    <th className="py-3 text-center">Runtime (s)</th>
                    <th className="py-3 text-center">Memory (bytes)</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.routers_comparison.routers.map((r, idx) => (
                    <tr key={idx} className="border-b border-zinc-900">
                      <td className="py-3 font-bold text-zinc-200">{r.algorithm}</td>
                      <td className="py-3 text-center">{r.expanded_nodes}</td>
                      <td className="py-3 text-center text-orange-400">{r.runtime_sec}s</td>
                      <td className="py-3 text-center text-sky-400">{r.memory_bytes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Monsoonal Weather Availability Backtest */}
      {backtestData && (
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 mb-6">
            Seasonal & Monsoonal Repair Availability Backtest
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60 font-mono text-xs">
              <span className="text-[10px] text-zinc-500 block mb-4 uppercase">Monthly Availability Percentage</span>
              <div className="flex items-end justify-between h-28 pt-4">
                {backtestData.monthly_availability_pct.map((m, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 w-full">
                    <div className="w-4 bg-orange-500/20 border border-orange-500/40 rounded-t" style={{ height: `${m.availability_pct * 0.8}px` }} />
                    <span className="text-[9px] text-zinc-500">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60 font-mono text-xs space-y-2.5">
              <span className="text-[10px] text-zinc-500 block uppercase">Monsoonal Availability Summary</span>
              {Object.entries(backtestData.seasonal_availability_pct).map(([season, val]: [string, any], i) => (
                <div key={i} className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-400">{season}</span>
                  <span className="text-orange-400 font-bold">{val}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
