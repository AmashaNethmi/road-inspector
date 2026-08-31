import React, { useState, useEffect } from 'react';
import { 
  Timer, 
  Calendar, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Zap, 
  Info, 
  Clock, 
  TrendingUp, 
  Sliders,
  Sparkles,
  GitCommit,
  LineChart,
  Shield
} from 'lucide-react';
import { CircularProgress, Tooltip } from '@mui/material';

// Inline Custom SVG Scatter Plot for Pareto Front Trade-off
function SVGParetoPlot({ points }) {
  if (!points || points.length === 0) return <div className="h-40 flex items-center justify-center text-xs text-zinc-500">No Pareto frontier data</div>;
  
  const width = 500;
  const height = 150;
  
  // X: Traffic Delay (minimize, ranges 30 to 90)
  // Y: Weather Risk (minimize, ranges 10 to 80)
  const xMin = 20, xMax = 90;
  const yMin = 0, yMax = 80;
  
  const mappedPoints = points.map(p => {
    const x = 30 + ((p.traffic_delay - xMin) / (xMax - xMin)) * (width - 60);
    const y = height - 20 - ((p.weather_risk - yMin) / (yMax - yMin)) * (height - 40);
    return { ...p, x, y };
  });

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible">
        {/* Axes */}
        <line x1="30" y1={height - 20} x2={width - 20} y2={height - 20} stroke="#27272a" strokeWidth="1.5" />
        <line x1="30" y1="10" x2="30" y2={height - 20} stroke="#27272a" strokeWidth="1.5" />
        
        {/* Axis Labels */}
        <text x={width - 20} y={height - 5} fontSize="7" fill="#71717a" textAnchor="end" className="font-mono">Traffic Delay →</text>
        <text x="35" y="15" fontSize="7" fill="#71717a" textAnchor="start" className="font-mono">Weather Risk ↑</text>
        
        {/* Pareto curve connection line */}
        {mappedPoints.length > 1 && (
          <path 
            d={mappedPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "")} 
            fill="none" 
            stroke="#f97316" 
            strokeWidth="1.5" 
            strokeDasharray="3 3"
          />
        )}
        
        {/* Pareto dots */}
        {mappedPoints.map((p, i) => (
          <g key={i} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r="5" fill="#f97316" className="hover:scale-125 transition-transform" />
            <text x={p.x} y={p.y - 7} fontSize="7" fill="#a1a1aa" textAnchor="middle" className="font-mono font-bold bg-zinc-950 px-1">
              S{i+1}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[9px] font-mono text-zinc-500 justify-center mt-2 border-t border-zinc-900 pt-2">
        {points.slice(0, 3).map((p, i) => (
          <span key={i}><strong className="text-orange-400">S{i+1}:</strong> Delay {p.traffic_delay}% | Risk {p.weather_risk}% | Score {p.priority_score}%</span>
        ))}
      </div>
    </div>
  );
}

// Inline Custom SVG Bar Chart comparing algorithms
function SVGCompareChart({ data, yKey, color, label }) {
  if (!data || data.length === 0) return null;
  const width = 500;
  const height = 110;
  
  const values = data.map(d => d[yKey]);
  const maxVal = Math.max(...values, 0.0001);
  const chartHeight = height - 25;
  const barWidth = 60;
  const gap = 50;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
        <line x1="20" y1={height - 15} x2={width - 20} y2={height - 15} stroke="#27272a" strokeWidth="1" />
        {data.map((d, i) => {
          const x = 50 + i * (barWidth + gap);
          const barHeight = (d[yKey] / maxVal) * chartHeight;
          const y = height - 15 - barHeight;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill={color} rx="3" opacity={0.8} />
              <text x={x + barWidth / 2} y={y - 5} fontSize="9" fill="#a1a1aa" textAnchor="middle" className="font-mono">
                {d[yKey]}
              </text>
              <text x={x + barWidth / 2} y={height - 2} fontSize="8" fill="#71717a" textAnchor="middle" className="font-mono">
                {d.algorithm.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function SchedulingDashboard() {
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  
  // Custom parameters
  const [severity, setSeverity] = useState("high");
  const [roadPriority, setRoadPriority] = useState("highway");
  const [trafficImpact, setTrafficImpact] = useState(65.0);
  const [weatherRisk, setWeatherRisk] = useState(35.0);
  const [repairUrgency, setRepairUrgency] = useState("high");
  
  // Result States
  const [priorityData, setPriorityData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [exhaustiveData, setExhaustiveData] = useState<any>(null);
  const [paretoPoints, setParetoPoints] = useState<any[]>([]);
  const [crewResources, setCrewResources] = useState<any[]>([]);
  
  const getApiBase = () => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:8002`;
  };
  const API_BASE = getApiBase();

  const runPriorityEngine = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/scheduling/priority`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity,
          road_priority: roadPriority,
          traffic_impact: trafficImpact,
          weather_risk: weatherRisk,
          repair_urgency: repairUrgency
        })
      });
      const data = await res.json();
      setPriorityData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const runSchedulingOptimization = async () => {
    setOptimizing(true);
    try {
      const res = await fetch(`${API_BASE}/api/scheduling/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: "Sector 4, Highway A-12",
          severity,
          road_priority: roadPriority,
          duration: 4.0,
          curing: 4.0,
          traffic_impact: trafficImpact,
          weather_risk: weatherRisk
        })
      });
      const val = await res.json();
      setScheduleData(val);
      setExhaustiveData(val.exhaustive);
      setParetoPoints(val.nsga2.pareto_front);
    } catch (e) {
      console.error(e);
    } finally {
      setOptimizing(false);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/scheduling/resources`);
      const val = await res.json();
      setCrewResources(val.crews);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    runPriorityEngine();
  }, [severity, roadPriority, trafficImpact, weatherRisk, repairUrgency]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await runSchedulingOptimization();
      await fetchResources();
      setLoading(false);
    };
    loadAll();
  }, []);

  if (loading && !scheduleData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <CircularProgress className="text-orange-500" />
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Initializing Operations Scheduling Engine...</span>
      </div>
    );
  }

  const getPriorityColor = (level) => {
    if (level === "Critical") return "text-red-500 bg-red-500/5 border-red-500/10";
    if (level === "High") return "text-orange-400 bg-orange-500/5 border-orange-500/10";
    if (level === "Medium") return "text-amber-400 bg-amber-500/5 border-amber-500/10";
    return "text-emerald-400 bg-emerald-500/5 border-emerald-500/10";
  };

  return (
    <div className="space-y-8 text-zinc-100">
      
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-900 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight uppercase flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange-500" /> Scheduling & Optimization Engine
          </h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
            Multi-Objective Scheduling Framework (Objective: Min traffic delay, Min weather risk, Max urgency)
          </p>
        </div>
        <button 
          onClick={runSchedulingOptimization} 
          disabled={optimizing}
          className="bg-orange-500 hover:bg-orange-400 text-zinc-950 font-mono text-[10px] uppercase font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
        >
          {optimizing ? "Re-optimizing..." : "Trigger Optimization Run"}
        </button>
      </div>

      {/* Grid: Priority Configurator on Left, Best Windows / Explainability on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Priority Engine Configuration */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Priority Engine Inputs</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-xs font-mono text-zinc-400">
                <span>Defect Severity</span>
                <select 
                  value={severity} 
                  onChange={e => setSeverity(e.target.value)}
                  className="bg-zinc-950 text-zinc-200 py-2 px-3 rounded-xl border border-zinc-800 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 text-xs font-mono text-zinc-400">
                <span>Road Importance</span>
                <select 
                  value={roadPriority} 
                  onChange={e => setRoadPriority(e.target.value)}
                  className="bg-zinc-950 text-zinc-200 py-2 px-3 rounded-xl border border-zinc-800 focus:outline-none"
                >
                  <option value="local">Local Street</option>
                  <option value="arterial">Arterial Road</option>
                  <option value="highway">Highway (Express)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5 text-xs font-mono text-zinc-400">
                <span>Repair Urgency</span>
                <select 
                  value={repairUrgency} 
                  onChange={e => setRepairUrgency(e.target.value)}
                  className="bg-zinc-950 text-zinc-200 py-2 px-3 rounded-xl border border-zinc-800 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Traffic Delay Level</span>
                  <span className="text-sky-400 font-bold">{trafficImpact}%</span>
                </div>
                <input 
                  type="range" min="10" max="100" value={trafficImpact} 
                  onChange={e => setTrafficImpact(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Weather Risk Probability</span>
                  <span className="text-sky-400 font-bold">{weatherRisk}%</span>
                </div>
                <input 
                  type="range" min="10" max="100" value={weatherRisk} 
                  onChange={e => setWeatherRisk(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {priorityData && (
              <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-900 flex justify-between items-center font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Priority Engine Urgency</span>
                  <span className="text-xl font-bold text-orange-400">{priorityData.urgency_score}%</span>
                </div>
                <span className={`text-[10px] uppercase font-mono px-3 py-1 rounded-full border ${getPriorityColor(priorityData.priority_level)}`}>
                  {priorityData.priority_level}
                </span>
              </div>
            )}

          </div>

        </div>

        {/* Right Side: Optimization Solutions & Explainability */}
        <div className="lg:col-span-7 space-y-6">
          
          {scheduleData && scheduleData.scheduled_jobs && scheduleData.scheduled_jobs.length > 0 && (
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Current Optimal Recommendation</h3>
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">Defect Priority: {scheduleData.scheduled_jobs[0].priority_level}</span>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-3 py-1 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Optimal Target Found
                </span>
              </div>

              {/* Best Window details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/50 font-mono">
                  <span className="text-[9px] text-zinc-500 uppercase block">Best Start Window</span>
                  <span className="text-sm font-bold text-zinc-200">
                    {scheduleData.scheduled_jobs[0].start_time.replace('T', ' ').substring(0, 16)}
                  </span>
                </div>
                <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/50 font-mono">
                  <span className="text-[9px] text-zinc-500 uppercase block">Finish Time</span>
                  <span className="text-sm font-bold text-zinc-200">
                    {scheduleData.scheduled_jobs[0].end_time.replace('T', ' ').substring(0, 16)}
                  </span>
                </div>
                <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/50 font-mono">
                  <span className="text-[9px] text-zinc-500 uppercase block">Overall Score</span>
                  <span className="text-lg font-bold text-orange-400">{scheduleData.scheduled_jobs[0].score}%</span>
                </div>
              </div>

              {/* Robustness Gauges */}
              <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-900/60 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-1.5 mb-2 text-xs text-zinc-400">
                  <Shield className="w-3.5 h-3.5 text-orange-500" /> Schedule Sensitivity & Robustness
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Schedule Stability:</span>
                      <span className="text-emerald-400 font-bold">{scheduleData.scheduled_jobs[0].robustness.schedule_stability_pct}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${scheduleData.scheduled_jobs[0].robustness.schedule_stability_pct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Forecast Sensitivity:</span>
                      <span className="text-orange-400 font-bold">{scheduleData.scheduled_jobs[0].robustness.forecast_sensitivity_pct}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-orange-400 h-full rounded-full" style={{ width: `${scheduleData.scheduled_jobs[0].robustness.forecast_sensitivity_pct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Weather Sensitivity:</span>
                      <span className="text-orange-400 font-bold">{scheduleData.scheduled_jobs[0].robustness.weather_sensitivity_pct}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-orange-400 h-full rounded-full" style={{ width: `${scheduleData.scheduled_jobs[0].robustness.weather_sensitivity_pct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Traffic Sensitivity:</span>
                      <span className="text-orange-400 font-bold">{scheduleData.scheduled_jobs[0].robustness.traffic_sensitivity_pct}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-orange-400 h-full rounded-full" style={{ width: `${scheduleData.scheduled_jobs[0].robustness.traffic_sensitivity_pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainability reasons */}
              <div className="p-4 bg-zinc-950/20 border border-zinc-900 rounded-2xl font-mono text-xs text-zinc-400 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">Recommendation Explainability</span>
                <p>• <strong>Weather Score:</strong> {scheduleData.scheduled_jobs[0].score}% (Within safe curing margins)</p>
                <p>• <strong>Traffic Score:</strong> {round(100 - trafficImpact)}% (Avoids peak RDA flow delays)</p>
                <p>• <strong>Urgency Level:</strong> {priorityData?.priority_level} (Urgency: {scheduleData.scheduled_jobs[0].urgency_score}%)</p>
                <p>• <strong>Assigned Crew:</strong> {scheduleData.scheduled_jobs[0].crew_id.toUpperCase()}</p>
                <p>• <strong>Assigned Equipment:</strong> {scheduleData.scheduled_jobs[0].equipment_ids.join(', ').toUpperCase()}</p>
                <p className="text-orange-400 font-bold mt-2">Overall Recommendation: Schedule job for {scheduleData.scheduled_jobs[0].start_time.replace('T', ' ')}</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Multi-Defect Schedule Timeline & Resource Assignments */}
      {scheduleData && scheduleData.scheduled_jobs && (
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-6">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" /> Multi-Defect Repair Timeline Schedule (Resource Constrained)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[9px]">
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Start Time</th>
                  <th className="py-3 px-4">Finish Time</th>
                  <th className="py-3 px-4">Duration / Cure</th>
                  <th className="py-3 px-4">Assigned Crew</th>
                  <th className="py-3 px-4">Assigned Equipment</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4">Priority</th>
                </tr>
              </thead>
              <tbody>
                {scheduleData.scheduled_jobs.map((job, idx) => (
                  <tr key={idx} className="border-b border-zinc-900 hover:bg-zinc-900/10 transition-all">
                    <td className="py-3 px-4 font-bold text-zinc-200">{job.id.toUpperCase()}</td>
                    <td className="py-3 px-4">{job.start_time.replace('T', ' ').substring(0, 16)}</td>
                    <td className="py-3 px-4">{job.end_time.replace('T', ' ').substring(0, 16)}</td>
                    <td className="py-3 px-4">{job.duration}h / {job.curing}h</td>
                    <td className="py-3 px-4 text-orange-400 font-bold">{job.crew_id.toUpperCase()}</td>
                    <td className="py-3 px-4 text-zinc-300">{job.equipment_ids.join(', ').toUpperCase()}</td>
                    <td className="py-3 px-4 text-center text-orange-400 font-bold">{job.score}%</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${getPriorityColor(job.priority_level)}`}>
                        {job.priority_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Optimization Algorithms Performance Comparison */}
      {scheduleData && scheduleData.algorithm_comparison && (
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-6">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" /> Scheduling Algorithms Performance Comparison
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-4">Objective Score Comparison</span>
              <SVGCompareChart data={scheduleData.algorithm_comparison} yKey="objective_score" color="#f97316" label="Objective Score" />
            </div>

            <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-4">Execution Runtime (seconds)</span>
              <SVGCompareChart data={scheduleData.algorithm_comparison} yKey="runtime_sec" color="#38bdf8" label="Runtime" />
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[9px]">
                  <th className="py-3 px-4">Optimizer Algorithm</th>
                  <th className="py-3 px-4 text-center">Runtime (s)</th>
                  <th className="py-3 px-4 text-center">Avg Score (%)</th>
                  <th className="py-3 px-4 text-center">Optimality (%)</th>
                  <th className="py-3 px-4 text-center">Resource Usage (%)</th>
                </tr>
              </thead>
              <tbody>
                {scheduleData.algorithm_comparison.map((algo, idx) => (
                  <tr key={idx} className="border-b border-zinc-900 hover:bg-zinc-900/10 transition-all">
                    <td className="py-3 px-4 font-bold text-zinc-200">{algo.algorithm}</td>
                    <td className="py-3 px-4 text-center">{algo.runtime_sec}s</td>
                    <td className="py-3 px-4 text-center font-bold text-orange-400">{algo.objective_score}%</td>
                    <td className="py-3 px-4 text-center">{algo.optimality_pct}%</td>
                    <td className="py-3 px-4 text-center text-sky-400">{algo.resource_usage_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NSGA-II Pareto Frontier Plot */}
      {paretoPoints.length > 0 && (
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-orange-500" /> NSGA-II Pareto Frontier Solutions (Trade-off space)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60">
              <SVGParetoPlot points={paretoPoints} />
            </div>
            <div className="md:col-span-4 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60 font-mono text-xs text-zinc-400 space-y-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Pareto Analysis</span>
              <p className="leading-relaxed">
                The chart plots the trade-off frontier generated by NSGA-II. 
                Solutions to the bottom-left represent repair slots that successfully minimize both weather risks and traffic delays simultaneously.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helpers
const round = (num) => Math.round(num * 10) / 10;
