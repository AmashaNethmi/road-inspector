import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Video, 
  Gauge, 
  Car, 
  Truck, 
  Bike, 
  Bus,
  RefreshCw,
  Sliders,
  Sparkles,
  BarChart2,
  ShieldAlert
} from 'lucide-react';

interface VehicleDetection {
  id: number;
  type: 'Car' | 'Bus' | 'Truck' | 'Motorcycle';
  confidence: number;
  speedKmh: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function TrafficDashboard() {
  const [selectedRoad, setSelectedRoad] = useState<string>('Galle Road (A2 Arterial)');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [activeModel, setActiveModel] = useState<'YOLOv8 + LightGBM' | 'LSTM Recurrent' | 'Prophet' | 'Historical Baseline'>('YOLOv8 + LightGBM');
  const [currentFlow, setCurrentFlow] = useState<number>(1420); // vehicles/hr
  const [congestionIndex, setCongestionIndex] = useState<number>(68); // 0-100%
  const [avgSpeed, setAvgSpeed] = useState<number>(32); // km/h
  const [detectedVehicles, setDetectedVehicles] = useState<VehicleDetection[]>([
    { id: 1, type: 'Car', confidence: 0.94, speedKmh: 42, x: 20, y: 35, width: 22, height: 18 },
    { id: 2, type: 'Bus', confidence: 0.91, speedKmh: 28, x: 55, y: 25, width: 30, height: 26 },
    { id: 3, type: 'Truck', confidence: 0.88, speedKmh: 24, x: 15, y: 65, width: 28, height: 24 },
    { id: 4, type: 'Motorcycle', confidence: 0.96, speedKmh: 45, x: 75, y: 60, width: 14, height: 16 },
  ]);

  // Live simulation loop for vision detection
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      // Jitter metrics slightly to feel truly alive
      setCurrentFlow(prev => Math.min(2200, Math.max(600, prev + Math.floor((Math.random() - 0.48) * 40))));
      setAvgSpeed(prev => Math.min(65, Math.max(15, prev + Math.floor((Math.random() - 0.5) * 3))));
      setCongestionIndex(prev => Math.min(95, Math.max(20, prev + Math.floor((Math.random() - 0.5) * 2))));

      // Update bounding boxes
      setDetectedVehicles(prev => prev.map(v => ({
        ...v,
        x: (v.x + (Math.random() * 4 - 2) + 100) % 85,
        speedKmh: Math.max(15, Math.min(65, v.speedKmh + Math.floor((Math.random() - 0.5) * 2)))
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // 24-hour hourly traffic data
  const hourlyData = [
    { hour: '00:00', actual: 320, predicted: 310, yolo: 325 },
    { hour: '02:00', actual: 180, predicted: 190, yolo: 185 },
    { hour: '04:00', actual: 240, predicted: 260, yolo: 245 },
    { hour: '06:00', actual: 890, predicted: 850, yolo: 910 },
    { hour: '08:00', actual: 1950, predicted: 1880, yolo: 1920 }, // Peak
    { hour: '10:00', actual: 1450, predicted: 1420, yolo: 1460 },
    { hour: '12:00', actual: 1380, predicted: 1400, yolo: 1390 },
    { hour: '14:00', actual: 1510, predicted: 1490, yolo: 1530 },
    { hour: '16:00', actual: 1820, predicted: 1790, yolo: 1840 },
    { hour: '18:00', actual: 2150, predicted: 2090, yolo: 2120 }, // Evening Peak
    { hour: '20:00', actual: 1420, predicted: 1390, yolo: 1410 },
    { hour: '22:00', actual: 780, predicted: 750, yolo: 770 },
  ];

  // Custom SVG 24h curve generator
  const renderHourlyChart = () => {
    const width = 600;
    const height = 180;
    const padding = 25;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;
    const maxVal = 2400;

    const actualPoints = hourlyData.map((d, i) => {
      const x = padding + (i / (hourlyData.length - 1)) * chartW;
      const y = height - padding - (d.actual / maxVal) * chartH;
      return { x, y, val: d.actual, label: d.hour };
    });

    const predPoints = hourlyData.map((d, i) => {
      const x = padding + (i / (hourlyData.length - 1)) * chartW;
      const y = height - padding - (d.predicted / maxVal) * chartH;
      return { x, y, val: d.predicted };
    });

    const actualPath = actualPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
    const predPath = predPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
    const areaPath = `${actualPath} L ${actualPoints[actualPoints.length - 1].x} ${height - padding} L ${actualPoints[0].x} ${height - padding} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
        <defs>
          <linearGradient id="trafficAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[500, 1000, 1500, 2000].map(v => {
          const y = height - padding - (v / maxVal) * chartH;
          return (
            <g key={v}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
              <text x={padding - 4} y={y + 3} fill="#71717a" fontSize="8" textAnchor="end" className="font-mono">{v}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#trafficAreaGrad)" />

        {/* Forecast / Predicted Curve */}
        <path d={predPath} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="4 4" />

        {/* Actual Observed Curve */}
        <path d={actualPath} fill="none" stroke="#f97316" strokeWidth="2.5" />

        {/* Data points & X Labels */}
        {actualPoints.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#f97316" className="hover:scale-150 transition-transform" />
            <text x={p.x} y={height - 8} fill="#71717a" fontSize="8" textAnchor="middle" className="font-mono">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-100 font-mono uppercase">
              Traffic Dynamics & YOLOv8 Computer Vision Analytics
            </h2>
            <p className="text-xs text-zinc-400">
              Real-time vehicle classification, hourly volume forecasting & work zone restriction corridors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRoad}
            onChange={(e) => setSelectedRoad(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500"
          >
            <option value="Galle Road (A2 Arterial)">Galle Road (A2 Arterial, Colombo)</option>
            <option value="High Level Road (A4)">High Level Road (A4, Maharagama)</option>
            <option value="Kandy Arterial (A1)">Kandy Road (A1, Peliyagoda)</option>
            <option value="Colombo-Katunayake Expressway">E03 Expressway Interchange</option>
          </select>

          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all flex items-center gap-1.5 ${
              isSimulating 
                ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-400' 
                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Live Feed Active' : 'Simulation Paused'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-zinc-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Live Traffic Flow</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">{currentFlow} <span className="text-xs text-zinc-500 font-normal">veh/hr</span></div>
          <span className="text-[10px] text-amber-400 font-mono">Level of Service: LOS D</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-zinc-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Congestion Index</span>
            <Gauge className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{congestionIndex}%</div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${congestionIndex > 70 ? 'bg-rose-500' : 'bg-amber-500'}`}
              style={{ width: `${congestionIndex}%` }}
            />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-zinc-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Average Corridor Speed</span>
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400">{avgSpeed} <span className="text-xs text-zinc-500 font-normal">km/h</span></div>
          <span className="text-[10px] text-zinc-400 font-mono">Free Flow Speed: 50 km/h</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-zinc-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Recommended Work Window</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">21:00 - 05:30</div>
          <span className="text-[10px] text-emerald-400/80 font-mono">Avoid 07:30-09:30 & 16:30-19:00</span>
        </div>
      </div>

      {/* Main Grid: Computer Vision Live Cam & 24h Forecasting */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Simulated Computer Vision Feed */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                  YOLOv8 Edge Vision Detector (CCTV Feed #4)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE 30 FPS
              </span>
            </div>

            {/* Simulated Video Canvas with Bounding Boxes */}
            <div className="relative aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center">
              {/* Background Road Image */}
              <img
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Traffic Camera"
                className="absolute inset-0 w-full h-full object-cover opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-zinc-950/50" />

              {/* Grid scanning overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />

              {/* Simulated YOLO Detection Bounding Boxes */}
              {detectedVehicles.map(veh => (
                <div
                  key={veh.id}
                  className="absolute border-2 border-emerald-400 bg-emerald-500/10 rounded transition-all duration-700 flex flex-col justify-between p-1"
                  style={{
                    left: `${veh.x}%`,
                    top: `${veh.y}%`,
                    width: `${veh.width}%`,
                    height: `${veh.height}%`,
                  }}
                >
                  <div className="bg-emerald-500 text-zinc-950 text-[9px] font-mono font-bold px-1 py-0.2 rounded w-max flex items-center gap-1">
                    {veh.type} {(veh.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="bg-zinc-950/90 text-emerald-400 text-[8px] font-mono px-1 rounded w-max border border-emerald-500/40">
                    {veh.speedKmh} km/h
                  </div>
                </div>
              ))}

              {/* Road metadata tag */}
              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800">
                Segment: {selectedRoad}
              </div>
            </div>

            {/* Classification Breakdown */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                <Car className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                <span className="text-[10px] text-zinc-500 block">Cars</span>
                <span className="font-bold text-zinc-200">58%</span>
              </div>
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                <Bus className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-[10px] text-zinc-500 block">Buses</span>
                <span className="font-bold text-zinc-200">18%</span>
              </div>
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                <Truck className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                <span className="text-[10px] text-zinc-500 block">Heavy Trucks</span>
                <span className="font-bold text-zinc-200">12%</span>
              </div>
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                <Bike className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="text-[10px] text-zinc-500 block">Bikes</span>
                <span className="font-bold text-zinc-200">12%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 24h Hourly Traffic Predictive Curve */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                  24-Hour Traffic Volume Forecast & Model Curve
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">Comparing Observed Volume vs AI Prediction</span>
              </div>
              
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-orange-400">
                  <span className="w-2 h-2 rounded-full bg-orange-400" /> Observed
                </span>
                <span className="flex items-center gap-1 text-sky-400">
                  <span className="w-2 h-2 rounded-full bg-sky-400" /> AI Forecast
                </span>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="pt-2">
              {renderHourlyChart()}
            </div>

            {/* Model Comparison Table */}
            <div className="pt-2 border-t border-zinc-800/60">
              <h4 className="text-[10px] font-mono uppercase text-zinc-500 mb-2">Multi-Model Accuracy Benchmarks</h4>
              <div className="grid grid-cols-4 gap-2 text-[11px] font-mono text-center">
                <div className="bg-zinc-900/60 p-2 rounded-lg border border-orange-500/30">
                  <span className="text-[9px] text-orange-400 block font-bold">YOLOv8 + LightGBM</span>
                  <span className="text-zinc-200 font-bold">R² 0.982</span>
                  <span className="text-[9px] text-zinc-500 block">MAE: 32.4</span>
                </div>
                <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                  <span className="text-[9px] text-zinc-400 block">LSTM Recurrent</span>
                  <span className="text-zinc-200">R² 0.965</span>
                  <span className="text-[9px] text-zinc-500 block">MAE: 46.1</span>
                </div>
                <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                  <span className="text-[9px] text-zinc-400 block">Facebook Prophet</span>
                  <span className="text-zinc-200">R² 0.941</span>
                  <span className="text-[9px] text-zinc-500 block">MAE: 62.8</span>
                </div>
                <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                  <span className="text-[9px] text-zinc-400 block">Naive Historical</span>
                  <span className="text-zinc-200">R² 0.884</span>
                  <span className="text-[9px] text-zinc-500 block">MAE: 110.2</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
