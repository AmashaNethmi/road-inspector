import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Thermometer, 
  Droplets, 
  Wind, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  HelpCircle,
  TrendingUp,
  History,
  RotateCcw,
  Sliders,
  ChevronDown,
  Info,
  Clock
} from 'lucide-react';
import { Tooltip, CircularProgress } from '@mui/material';

// Custom SVG Chart component for modern aesthetics and compatibility
function SVGLineChart({ 
  data, 
  xKey, 
  yKey, 
  color, 
  yUnit = "" 
}: { 
  data: any[]; 
  xKey: string; 
  yKey: string; 
  color: string; 
  yUnit?: string;
}) {
  if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-xs text-zinc-500">No data</div>;
  
  const values = data.map(d => d[yKey]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const padding = range * 0.1;
  
  const yMin = minVal - padding;
  const yMax = maxVal + padding;
  const yRange = yMax - yMin;
  
  const width = 500;
  const height = 150;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 40) + 20;
    const y = height - ((d[yKey] - yMin) / yRange) * (height - 30) - 15;
    return { x, y, value: d[yKey], label: d[xKey] };
  });
  
  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - 10} L ${points[0].x} ${height - 10} Z`;
  
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible">
        <defs>
          <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        <line x1="20" y1={height - 15} x2={width - 20} y2={height - 15} stroke="#27272a" strokeWidth="1" />
        <line x1="20" y1={15} x2={width - 20} y2={15} stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
        
        {/* Fill Area */}
        <path d={areaD} fill={`url(#grad-${yKey})`} />
        
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Points and labels */}
        {points.map((p, i) => {
          // Render subset of dots to avoid clutter
          const showDot = i % Math.max(1, Math.floor(data.length / 8)) === 0 || i === data.length - 1;
          if (!showDot) return null;
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#09090b" stroke={color} strokeWidth="2" />
              <text x={p.x} y={p.y - 8} fontSize="9" fill="#a1a1aa" textAnchor="middle" className="font-mono">
                {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{yUnit}
              </text>
              <text x={p.x} y={height - 2} fontSize="8" fill="#52525b" textAnchor="middle" className="font-mono">
                {p.label.includes('T') ? p.label.split('T')[1].substring(0, 5) : p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SVGBarChart({ 
  data, 
  xKey, 
  yKey, 
  color, 
  yUnit = "" 
}: { 
  data: any[]; 
  xKey: string; 
  yKey: string; 
  color: string; 
  yUnit?: string;
}) {
  if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-xs text-zinc-500">No data</div>;
  
  const values = data.map(d => d[yKey]);
  const maxVal = Math.max(...values, 1);
  const width = 500;
  const height = 150;
  const chartWidth = width - 40;
  const chartHeight = height - 30;
  
  const barWidth = (chartWidth / data.length) * 0.7;
  const gap = (chartWidth / data.length) * 0.3;
  
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible">
        {/* Baseline */}
        <line x1="20" y1={height - 15} x2={width - 20} y2={height - 15} stroke="#27272a" strokeWidth="1" />
        
        {data.map((d, i) => {
          const x = 20 + i * (barWidth + gap) + gap / 2;
          const barHeight = (d[yKey] / maxVal) * chartHeight;
          const y = height - 15 - barHeight;
          
          return (
            <g key={i}>
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={Math.max(2, barHeight)} 
                fill={color} 
                rx="2"
                opacity={0.85}
                className="hover:opacity-100 transition-opacity"
              />
              <text x={x + barWidth / 2} y={y - 5} fontSize="9" fill="#a1a1aa" textAnchor="middle" className="font-mono">
                {typeof d[yKey] === 'number' ? d[yKey].toFixed(1) : d[yKey]}{yUnit}
              </text>
              <text x={x + barWidth / 2} y={height - 2} fontSize="8" fill="#52525b" textAnchor="middle" className="font-mono">
                {d[xKey]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function WeatherDashboard() {
  const [loading, setLoading] = useState(true);
  const [backtesting, setBacktesting] = useState(false);
  const [lat, setLat] = useState(6.9244); // default Colombo
  const [lng, setLng] = useState(79.9073);
  const [city, setCity] = useState("Colombo, Sri Lanka");
  
  // Custom threshold parameters
  const [duration, setDuration] = useState(4);
  const [curing, setCuring] = useState(4);
  const [tempMin, setTempMin] = useState(15.0);
  const [humidityMax, setHumidityMax] = useState(85.0);
  const [windMax, setWindMax] = useState(25.0);
  const [rainMax, setRainMax] = useState(20.0);
  
  // Data states
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [hourlyForecast, setHourlyForecast] = useState<any[]>([]);
  const [viability, setViability] = useState<any>(null);
  const [recommendedWindows, setRecommendedWindows] = useState<any[]>([]);
  const [historyAnalysis, setHistoryAnalysis] = useState<any>(null);
  const [backtestResults, setBacktestResults] = useState<any>(null);

  const getApiBase = () => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:8002`;
  };
  const API_BASE = getApiBase();

  const fetchWeatherData = async () => {
    setLoading(true);
    try {
      // 1. Fetch forecast (current & hourly)
      const forecastRes = await fetch(`${API_BASE}/api/weather/forecast?lat=${lat}&lng=${lng}`);
      const forecastData = await forecastRes.json();
      setCurrentWeather(forecastData.current);
      setHourlyForecast(forecastData.hourly);
      
      // 2. Fetch repair windows
      const windowRes = await fetch(`${API_BASE}/api/weather/windows?lat=${lat}&lng=${lng}&duration_hours=${duration}&curing_hours=${curing}`);
      const windowData = await windowRes.json();
      setRecommendedWindows(windowData);

      // 3. Fetch current suitability analysis
      const analysisRes = await fetch(`${API_BASE}/api/weather/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          duration_hours: duration,
          curing_hours: curing,
          temp_min_c: tempMin,
          humidity_max_pct: humidityMax,
          wind_max_kmh: windMax,
          rain_max_prob: rainMax
        })
      });
      const analysisData = await analysisRes.json();
      setViability(analysisData);

      // 4. Fetch history analysis
      const historyRes = await fetch(`${API_BASE}/api/weather/history`);
      const historyData = await historyRes.json();
      setHistoryAnalysis(historyData);

      // 5. Fetch latest backtest
      const backtestRes = await fetch(`${API_BASE}/api/weather/backtest`);
      const backtestData = await backtestRes.json();
      setBacktestResults(backtestData.summary);

    } catch (e) {
      console.error("Failed to load weather dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, [lat, lng]);

  const handleRunBacktest = async () => {
    setBacktesting(true);
    try {
      const res = await fetch(`${API_BASE}/api/weather/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_hours: duration,
          curing_hours: curing,
          temp_min_c: tempMin,
          humidity_max_pct: humidityMax,
          wind_max_kmh: windMax,
          rain_max_prob: rainMax
        })
      });
      const data = await res.json();
      setBacktestResults(data.summary);
    } catch (e) {
      console.error("Backtest failed:", e);
    } finally {
      setBacktesting(false);
    }
  };

  const handleRecalculateViability = async () => {
    setLoading(true);
    try {
      const analysisRes = await fetch(`${API_BASE}/api/weather/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          duration_hours: duration,
          curing_hours: curing,
          temp_min_c: tempMin,
          humidity_max_pct: humidityMax,
          wind_max_kmh: windMax,
          rain_max_prob: rainMax
        })
      });
      const analysisData = await analysisRes.json();
      setViability(analysisData);

      const windowRes = await fetch(`${API_BASE}/api/weather/windows?lat=${lat}&lng=${lng}&duration_hours=${duration}&curing_hours=${curing}`);
      const windowData = await windowRes.json();
      setRecommendedWindows(windowData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !currentWeather) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <CircularProgress className="text-orange-500" />
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Initializing Weather Viability Engine...</span>
      </div>
    );
  }

  // Helper for weather icons
  const getWeatherIcon = (code: number) => {
    if (code === 0) return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    return <Cloud className="w-5 h-5 text-zinc-400" />;
  };

  return (
    <div className="space-y-8 pb-24 text-zinc-100">
      
      {/* City & Sync Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-900 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight uppercase flex items-center gap-2">
            <Cloud className="w-6 h-6 text-sky-400" /> Weather Viability Engine
          </h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
            Active coordinates: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E ({city})
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchWeatherData} 
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-mono uppercase px-3 py-1.5 rounded-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Force Sync
          </button>
        </div>
      </div>

      {/* Grid columns: Left settings / current weather, Right viability panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Current Weather & Threshold Configurations */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Threshold Config */}
          <div className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <Sliders className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Viability Thresholds</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Repair Duration</span>
                  <span className="text-orange-400 font-bold">{duration} Hours</span>
                </div>
                <input 
                  type="range" min="1" max="24" value={duration} 
                  onChange={e => setDuration(parseInt(e.target.value))}
                  className="w-full accent-orange-500 bg-zinc-850 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Curing Time Required</span>
                  <span className="text-orange-400 font-bold">{curing} Hours</span>
                </div>
                <input 
                  type="range" min="1" max="24" value={curing} 
                  onChange={e => setCuring(parseInt(e.target.value))}
                  className="w-full accent-orange-500 bg-zinc-850 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Min Temperature</span>
                  <span className="text-sky-400 font-bold">{tempMin}°C</span>
                </div>
                <input 
                  type="range" min="5" max="30" step="0.5" value={tempMin} 
                  onChange={e => setTempMin(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 bg-zinc-850 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Max Relative Humidity</span>
                  <span className="text-sky-400 font-bold">{humidityMax}%</span>
                </div>
                <input 
                  type="range" min="50" max="100" value={humidityMax} 
                  onChange={e => setHumidityMax(parseInt(e.target.value))}
                  className="w-full accent-sky-500 bg-zinc-850 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Max Wind Speed</span>
                  <span className="text-sky-400 font-bold">{windMax} km/h</span>
                </div>
                <input 
                  type="range" min="10" max="60" value={windMax} 
                  onChange={e => setWindMax(parseInt(e.target.value))}
                  className="w-full accent-sky-500 bg-zinc-850 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Max Rain Probability</span>
                  <span className="text-sky-400 font-bold">{rainMax}%</span>
                </div>
                <input 
                  type="range" min="5" max="80" value={rainMax} 
                  onChange={e => setRainMax(parseInt(e.target.value))}
                  className="w-full accent-sky-500 bg-zinc-850 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
            
            <button 
              onClick={handleRecalculateViability}
              className="w-full mt-6 bg-zinc-850 border border-zinc-800 hover:bg-orange-500 hover:text-zinc-950 font-mono text-[11px] uppercase tracking-wider py-2 rounded-xl transition-all"
            >
              Analyze Active Thresholds
            </button>
          </div>

          {/* Current Weather Card */}
          {currentWeather && (
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">Live Weather Metrics</span>
                <span className="text-[9px] font-mono text-zinc-600">Last updated: {currentWeather.last_updated ? currentWeather.last_updated.substring(11, 16) : ""}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">Current Temp</span>
                    <Thermometer className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-2xl font-bold font-mono tracking-tighter">{currentWeather.temperature}°C</span>
                  <span className="text-[9px] text-zinc-600">Apparent: {currentWeather.apparent_temperature}°C</span>
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">Humidity</span>
                    <Droplets className="w-4 h-4 text-sky-400" />
                  </div>
                  <span className="text-2xl font-bold font-mono tracking-tighter">{currentWeather.relative_humidity}%</span>
                  <span className="text-[9px] text-zinc-600">Cond: {currentWeather.weather_code === 0 ? "Clear" : "Cloudy/Wet"}</span>
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">Wind Info</span>
                    <Wind className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-2xl font-bold font-mono tracking-tighter">{currentWeather.wind_speed} <span className="text-xs">km/h</span></span>
                  <span className="text-[9px] text-zinc-600">Direction: {currentWeather.wind_direction}°</span>
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">UV Index</span>
                    <Info className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-2xl font-bold font-mono tracking-tighter">{currentWeather.uv_index !== undefined ? currentWeather.uv_index.toFixed(1) : "N/A"}</span>
                  <span className="text-[9px] text-zinc-600">Precip: {currentWeather.precipitation || 0.0} mm</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Engine Viability Metrics & Recommendations */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Viability Summary Card */}
          {viability && (
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Viability Engine Decisions</h3>
                  <span className="text-[9px] text-zinc-600">Parameters: {duration}h Work | {curing}h Cure</span>
                </div>
                {viability.allowed ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase px-3 py-1 rounded-full flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Repair Allowed
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono uppercase px-3 py-1 rounded-full flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Repair Blocked
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Viability Gauge */}
                <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/40 rounded-2xl border border-zinc-900/40">
                  <div className="relative flex items-center justify-center mb-3">
                    <CircularProgress 
                      variant="determinate" 
                      value={viability.viability_score} 
                      size={80} 
                      thickness={4} 
                      className={viability.viability_score >= 60 ? "text-emerald-500" : "text-red-500"} 
                    />
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-xl font-bold font-mono tracking-tight">{viability.viability_score}%</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Viability Score</span>
                </div>

                {/* Risk Score */}
                <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/40 rounded-2xl border border-zinc-900/40">
                  <div className="relative flex items-center justify-center mb-3">
                    <CircularProgress 
                      variant="determinate" 
                      value={viability.weather_risk_score} 
                      size={80} 
                      thickness={4} 
                      className={viability.weather_risk_score > 40 ? "text-orange-500" : "text-sky-500"} 
                    />
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-xl font-bold font-mono tracking-tight">{viability.weather_risk_score}%</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Weather Risk Score</span>
                </div>

                {/* Repair Confidence */}
                <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/40 rounded-2xl border border-zinc-900/40">
                  <div className="relative flex items-center justify-center mb-3">
                    <CircularProgress 
                      variant="determinate" 
                      value={viability.confidence_score} 
                      size={80} 
                      thickness={4} 
                      className="text-orange-500" 
                    />
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-xl font-bold font-mono tracking-tight">{viability.confidence_score}%</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Confidence Level</span>
                </div>
              </div>

              {/* Explainability Panel */}
              <div className="mt-6 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-900/60">
                <div className="flex items-center gap-1.5 mb-3 text-xs font-mono uppercase text-zinc-400">
                  <Info className="w-3.5 h-3.5 text-orange-500" /> Explainability Summary
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4 text-xs font-mono border-b border-zinc-900 pb-3 mb-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Avg Temp:</span>
                    <span className="text-zinc-100">{viability.parameters.avg_temp}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Max Humidity:</span>
                    <span className="text-zinc-100">{viability.parameters.max_humidity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Max Wind:</span>
                    <span className="text-zinc-100">{viability.parameters.max_wind} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Rain Prob:</span>
                    <span className="text-zinc-100">{viability.parameters.max_rain_prob}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Dry Surface:</span>
                    <span className={viability.parameters.dry_surface ? "text-emerald-400" : "text-red-400"}>
                      {viability.parameters.dry_surface ? "TRUE" : "FALSE"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Uncertainty:</span>
                    <span className="text-orange-400">{viability.uncertainty}%</span>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 font-mono flex justify-between">
                  <span>Confidence Interval Temp:</span>
                  <span className="text-zinc-300">[{viability.confidence_interval.temp_min}°C, {viability.confidence_interval.temp_max}°C]</span>
                </div>
              </div>

              {/* Blocked Reasons list */}
              {viability.blocked_reasons && viability.blocked_reasons.length > 0 && (
                <div className="mt-4 p-4 bg-red-950/10 border border-red-900/30 rounded-2xl">
                  <span className="text-xs font-mono uppercase text-red-400 tracking-wider flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Blocked Constraints
                  </span>
                  <ul className="space-y-1.5 text-xs font-mono text-zinc-400">
                    {viability.blocked_reasons.map((reason: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Recommended Windows Section */}
      <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" /> Optimal Repair Windows Schedule
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[10px]">
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">End Time</th>
                <th className="py-3 px-4">Work / Cure duration</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4">Decision</th>
              </tr>
            </thead>
            <tbody>
              {recommendedWindows.map((win, idx) => (
                <tr key={idx} className="border-b border-zinc-900 hover:bg-zinc-900/20 transition-all">
                  <td className="py-3 px-4 font-bold text-zinc-400">
                    {idx === 0 ? "1st Choice" : idx === 1 ? "2nd Choice" : "3rd Choice"}
                  </td>
                  <td className="py-3 px-4">
                    {win.start_time ? win.start_time.replace('T', ' ').substring(0, 16) : "N/A"}
                  </td>
                  <td className="py-3 px-4">
                    {win.end_time ? win.end_time.replace('T', ' ').substring(0, 16) : "N/A"}
                  </td>
                  <td className="py-3 px-4">
                    {win.duration}h / {win.curing_hours}h
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-orange-400">
                    {win.viability_score}%
                  </td>
                  <td className="py-3 px-4 text-center text-zinc-300">
                    {win.confidence_score}%
                  </td>
                  <td className="py-3 px-4">
                    {win.allowed ? (
                      <span className="text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">Allowed</span>
                    ) : (
                      <span className="text-red-400 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">Blocked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Analysis Card */}
      {viability && (
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" /> Weather Risk Factor Analysis
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <RiskMetric title="Rain Risk" score={viability.risk_analysis.rain_risk} />
            <RiskMetric title="Wind Risk" score={viability.risk_analysis.wind_risk} />
            <RiskMetric title="Humidity Risk" score={viability.risk_analysis.humidity_risk} />
            <RiskMetric title="Temperature Risk" score={viability.risk_analysis.temp_risk} />
            <RiskMetric title="Overall Weather Risk" score={viability.risk_analysis.overall_risk} highlight />
          </div>
        </div>
      )}

      {/* Hourly forecast charts tab */}
      {hourlyForecast && hourlyForecast.length > 0 && (
        <div className="bg-zinc-900/20 border border-zinc-900 rounded-3xl p-6">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" /> 72-Hour Forecast Trends (Sensors & Models)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-4">Temperature Profile (°C)</span>
              <SVGLineChart data={hourlyForecast.slice(0, 24)} xKey="time" yKey="temperature" color="#f97316" yUnit="°" />
            </div>

            <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-4">Humidity Level (%)</span>
              <SVGLineChart data={hourlyForecast.slice(0, 24)} xKey="time" yKey="relative_humidity" color="#38bdf8" yUnit="%" />
            </div>

            <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-4">Wind Speed (km/h)</span>
              <SVGLineChart data={hourlyForecast.slice(0, 24)} xKey="time" yKey="wind_speed" color="#34d399" yUnit="k" />
            </div>

            <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-4">Rain Probability (%)</span>
              <SVGBarChart data={hourlyForecast.slice(0, 24)} xKey="time" yKey="precipitation_probability" color="#f43f5e" yUnit="%" />
            </div>
          </div>
        </div>
      )}

      {/* Historical Analysis Section */}
      {historyAnalysis && (
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" /> Historical Monthly & Seasonal Trends
            </h3>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Years covered: {historyAnalysis.overall.years_covered.join(', ')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-4">Monthly Repair Availability Rate (%)</span>
              <SVGBarChart data={historyAnalysis.monthly_trends} xKey="month_name" yKey="availability_rate" color="#f59e0b" yUnit="%" />
            </div>

            <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60 md:col-span-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-4">Seasonal Comparison</span>
              <div className="space-y-3 pt-2">
                {historyAnalysis.seasonal_trends.map((s: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-300 font-medium">{s.season}</span>
                      <span className="text-orange-400 font-bold">{s.availability_rate}% Availability</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                      <div className="bg-orange-500 h-full rounded-full" style={{ width: `${s.availability_rate}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                      <span>Avg Temp: {s.avg_temperature}°C</span>
                      <span>Total Rain: {s.total_rain} mm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Historical Stats Details */}
          <div className="bg-zinc-950/30 p-4 rounded-2xl border border-zinc-900/40">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-3">Historical Repair Statistics Summary</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-zinc-900/40 p-3 rounded-xl">
                <span className="text-zinc-500 block text-[9px] uppercase">Days Evaluated</span>
                <span className="text-lg font-bold text-zinc-100">{historyAnalysis.historical_repair_stats.total_days_evaluated}</span>
              </div>
              <div className="bg-zinc-900/40 p-3 rounded-xl">
                <span className="text-zinc-500 block text-[9px] uppercase">Available Days</span>
                <span className="text-lg font-bold text-emerald-400">{historyAnalysis.historical_repair_stats.available_days}</span>
              </div>
              <div className="bg-zinc-900/40 p-3 rounded-xl">
                <span className="text-zinc-500 block text-[9px] uppercase">Blocked Days</span>
                <span className="text-lg font-bold text-red-400">{historyAnalysis.historical_repair_stats.blocked_days}</span>
              </div>
              <div className="bg-zinc-900/40 p-3 rounded-xl">
                <span className="text-zinc-500 block text-[9px] uppercase">Success Rate</span>
                <span className="text-lg font-bold text-sky-400">{historyAnalysis.historical_repair_stats.success_rate}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backtesting Simulator Card */}
      <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-500" /> Historical Backtesting Simulator
            </h3>
            <span className="text-[9px] text-zinc-600 block mt-0.5">Simulate active thresholds over all historical data</span>
          </div>
          <button 
            onClick={handleRunBacktest} 
            disabled={backtesting}
            className="bg-rose-600 hover:bg-rose-500 text-zinc-950 font-mono text-[10px] uppercase font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            {backtesting ? "Running..." : "Run Backtest Simulation"}
          </button>
        </div>

        {backtestResults && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 space-y-4">
              <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/60 flex flex-col justify-between h-full">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-4">Backtest Results Summary</span>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Days Evaluated:</span>
                    <span className="text-zinc-100">{backtestResults.total_days_evaluated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Allowed Repair Days:</span>
                    <span className="text-emerald-400 font-bold">{backtestResults.allowed_days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Blocked Days:</span>
                    <span className="text-rose-400 font-bold">{backtestResults.blocked_days}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-900 pt-2 mt-2 font-bold text-sm">
                    <span className="text-zinc-400">Availability:</span>
                    <span className="text-sky-400">{backtestResults.availability_percentage}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-8 bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/60 space-y-4">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Simulated Constraint Violations Breakdown</span>
              <div className="space-y-2">
                {Object.entries(backtestResults.reasons_summary).map(([reason, count]: [string, any], idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">{reason}</span>
                      <span className="text-rose-400 font-bold">{count} Occurrences</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full" 
                        style={{ width: `${backtestResults.total_days_evaluated ? (count / backtestResults.total_days_evaluated * 100) : 0}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function RiskMetric({ title, score, highlight = false }: { title: string; score: number; highlight?: boolean }) {
  // Determine color indicator
  const getColor = (s: number) => {
    if (s > 70) return "bg-red-500/10 border-red-500/30 text-red-400";
    if (s > 35) return "bg-orange-500/10 border-orange-500/30 text-orange-400";
    return "bg-sky-500/10 border-sky-500/30 text-sky-400";
  };
  
  return (
    <div className={`p-4 rounded-xl border flex flex-col justify-between font-mono ${getColor(score)} ${highlight ? 'ring-1 ring-orange-500/40' : ''}`}>
      <span className="text-[9px] uppercase tracking-wider block mb-2">{title}</span>
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold">{score}%</span>
        <span className="text-[9px] font-medium uppercase">
          {score > 70 ? "High" : score > 35 ? "Moderate" : "Low"}
        </span>
      </div>
    </div>
  );
}
