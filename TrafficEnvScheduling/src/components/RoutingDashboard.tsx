import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  GitPullRequest, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Info,
  Navigation,
  Eye,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { CircularProgress } from '@mui/material';

// Fix for default Leaflet icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom SVG Chart comparing algorithms
function SVGCompareChart({ data, yKey, color }) {
  if (!data || data.length === 0) return null;
  const width = 480;
  const height = 100;
  const chartHeight = height - 20;
  const barWidth = 70;
  const gap = 60;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
        <line x1="20" y1={height - 15} x2={width - 20} y2={height - 15} stroke="#27272a" strokeWidth="1" />
        {data.map((d, i) => {
          const x = 80 + i * (barWidth + gap);
          const val = d[yKey];
          // avoid divide by zero
          const maxVal = Math.max(...data.map(x => x[yKey]), 0.00001);
          const barHeight = (val / maxVal) * chartHeight;
          const y = height - 15 - barHeight;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill={color} rx="3" opacity={0.8} />
              <text x={x + barWidth / 2} y={y - 5} fontSize="9" fill="#a1a1aa" textAnchor="middle" className="font-mono">
                {typeof val === 'number' && val < 0.1 ? val.toFixed(5) : val}
              </text>
              <text x={x + barWidth / 2} y={height - 2} fontSize="8" fill="#71717a" textAnchor="middle" className="font-mono">
                {d.algorithm}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function RoutingDashboard() {
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  
  // Route selection parameters
  const [startNode, setStartNode] = useState("Fort");
  const [targetNode, setTargetNode] = useState("Bambalapitiya");
  const [blockedRoad, setBlockedRoad] = useState("Galle Rd (Mid)");
  const [trafficCongestion, setTrafficCongestion] = useState(40.0);
  const [weatherRisk, setWeatherRisk] = useState(30.0);
  const [roadClosureState, setRoadClosureState] = useState("fully closed");

  // Output data
  const [routingResult, setRoutingResult] = useState<any>(null);
  const [networkGraph, setNetworkGraph] = useState<any>(null);
  const [registeredClosures, setRegisteredClosures] = useState<any>({});

  const getApiBase = () => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:8002`;
  };
  const API_BASE = getApiBase();

  const loadNetworkGraph = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/routing/network`);
      const data = await res.json();
      setNetworkGraph(data);
    } catch (e) {
      console.error(e);
    }
  };

  const calculateRoute = async () => {
    setComputing(true);
    try {
      // 1. First register the closure state
      if (blockedRoad) {
        await fetch(`${API_BASE}/api/routing/closures`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            road_name: blockedRoad,
            state: roadClosureState
          })
        });
      }

      // 2. Fetch closures list
      const closuresRes = await fetch(`${API_BASE}/api/routing/closures`);
      const closuresData = await closuresRes.json();
      setRegisteredClosures(closuresData);

      // 3. Compute routes
      const routeRes = await fetch(`${API_BASE}/api/routing/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: startNode,
          target: targetNode,
          blocked_road: blockedRoad,
          traffic_congestion_pct: trafficCongestion,
          weather_risk_pct: weatherRisk
        })
      });
      const routeData = await routeRes.json();
      setRoutingResult(routeData);

    } catch (e) {
      console.error(e);
    } finally {
      setComputing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadNetworkGraph();
      await calculateRoute();
      setLoading(false);
    };
    init();
  }, [startNode, targetNode, blockedRoad, roadClosureState]);

  if (loading && !routingResult) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <CircularProgress className="text-orange-500" />
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Initializing Intelligent Routing Solver...</span>
      </div>
    );
  }

  // Get coordinates for path nodes
  const getPathCoords = (path: string[]) => {
    if (!path || !networkGraph) return [];
    return path.map(nodeName => {
      const node = networkGraph.nodes[nodeName];
      return [node.lat, node.lng] as [number, number];
    });
  };

  const getClosureColor = (state) => {
    if (state === "fully closed") return "text-red-500 bg-red-500/5 border-red-500/10";
    if (state === "partially closed") return "text-orange-400 bg-orange-500/5 border-orange-500/10";
    return "text-amber-400 bg-amber-500/5 border-amber-500/10";
  };

  const nodesList = networkGraph ? Object.keys(networkGraph.nodes) : [];
  const edgesList = networkGraph ? networkGraph.edges : [];

  return (
    <div className="space-y-8 text-zinc-100">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-900 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight uppercase flex items-center gap-2">
            <GitPullRequest className="w-6 h-6 text-orange-500" /> Intelligent Routing & Detour Planner
          </h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
            A* short-path optimizer (admissible Haversine heuristic) & dynamic detour engine
          </p>
        </div>
        <button 
          onClick={calculateRoute} 
          disabled={computing}
          className="bg-orange-500 hover:bg-orange-400 text-zinc-950 font-mono text-[10px] uppercase font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
        >
          {computing ? "Re-Routing..." : "Re-Calculate Routes"}
        </button>
      </div>

      {/* Grid: Routing Settings on Left, Route Visualizations on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Router Inputs & Closures */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Router Parameters</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-xs font-mono text-zinc-400">
                <span>Start Intersection</span>
                <select 
                  value={startNode} 
                  onChange={e => setStartNode(e.target.value)}
                  className="bg-zinc-950 text-zinc-200 py-2 px-3 rounded-xl border border-zinc-800 focus:outline-none"
                >
                  {nodesList.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 text-xs font-mono text-zinc-400">
                <span>Destination Intersection</span>
                <select 
                  value={targetNode} 
                  onChange={e => setTargetNode(e.target.value)}
                  className="bg-zinc-950 text-zinc-200 py-2 px-3 rounded-xl border border-zinc-800 focus:outline-none"
                >
                  {nodesList.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-4 space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Mark Temporary Closures
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 text-xs font-mono text-zinc-400">
                  <span>Target Road Link</span>
                  <select 
                    value={blockedRoad} 
                    onChange={e => setBlockedRoad(e.target.value)}
                    className="bg-zinc-950 text-zinc-200 py-2 px-3 rounded-xl border border-zinc-800 focus:outline-none"
                  >
                    <option value="">None (Open Road)</option>
                    {edgesList.map(e => <option key={e.road_name} value={e.road_name}>{e.road_name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 text-xs font-mono text-zinc-400">
                  <span>Closure State</span>
                  <select 
                    value={roadClosureState} 
                    disabled={!blockedRoad}
                    onChange={e => setRoadClosureState(e.target.value)}
                    className="bg-zinc-950 text-zinc-200 py-2 px-3 rounded-xl border border-zinc-800 focus:outline-none disabled:opacity-50"
                  >
                    <option value="fully closed">Fully Closed</option>
                    <option value="partially closed">Partially Closed</option>
                    <option value="under repair">Under Repair</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-zinc-900">
              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Traffic Congestion Multiplier</span>
                  <span className="text-sky-400 font-bold">{trafficCongestion}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={trafficCongestion} 
                  onChange={e => setTrafficCongestion(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Weather Storm Multiplier</span>
                  <span className="text-sky-400 font-bold">{weatherRisk}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={weatherRisk} 
                  onChange={e => setWeatherRisk(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Visual Map & Delay Summary */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Leaflet interactive map */}
          {networkGraph && routingResult && (
            <div className="relative w-full h-[320px] bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-900">
              <MapContainer 
                center={[6.9142, 79.8655]} 
                zoom={13} 
                scrollWheelZoom={false}
                className="h-full w-full z-0"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Draw all roads on the network */}
                {edgesList.map((edge, idx) => {
                  const uNode = networkGraph.nodes[edge.u];
                  const vNode = networkGraph.nodes[edge.v];
                  const color = edge.road_name === blockedRoad 
                    ? (roadClosureState === "fully closed" ? "#ef4444" : "#f97316") 
                    : "#a1a1aa";
                  
                  return (
                    <Polyline 
                      key={idx}
                      positions={[[uNode.lat, uNode.lng], [vNode.lat, vNode.lng]]}
                      pathOptions={{ color, weight: edge.road_name === blockedRoad ? 4 : 2, opacity: 0.6 }}
                    />
                  );
                })}

                {/* Nodes markers */}
                {Object.entries(networkGraph.nodes).map(([name, coords]: [string, any], idx) => (
                  <Marker 
                    key={idx}
                    position={[coords.lat, coords.lng]}
                    icon={L.divIcon({
                      html: `<div class="w-3.5 h-3.5 bg-zinc-900 rounded-full border border-zinc-700 flex items-center justify-center"><div class="w-1.5 h-1.5 rounded-full ${name === startNode ? 'bg-emerald-400' : (name === targetNode ? 'bg-orange-500' : 'bg-zinc-500')}"></div></div>`,
                      className: '',
                      iconSize: [14, 14],
                      iconAnchor: [7, 7]
                    })}
                  >
                    <Popup>
                      <span className="font-mono text-xs text-zinc-950 font-bold">{name}</span>
                    </Popup>
                  </Marker>
                ))}

                {/* Render shortest paths */}
                {routingResult.astar && (
                  <Polyline 
                    positions={getPathCoords(routingResult.astar.path)}
                    pathOptions={{ color: '#0ea5e9', weight: 4, opacity: 0.8 }}
                  />
                )}

                {/* Detour path */}
                {routingResult.detour_analysis && routingResult.detour_analysis.detour && (
                  <Polyline 
                    positions={getPathCoords(routingResult.detour_analysis.detour.path)}
                    pathOptions={{ color: '#ec4899', weight: 3, opacity: 0.8, dashArray: "5, 5" }}
                  />
                )}

              </MapContainer>
            </div>
          )}

          {/* Explainability Summary */}
          {routingResult && (
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider">Detour Decision Summary</span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Risk Score: {routingResult.route_risk_score}%</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-900">
                  <span className="text-zinc-500 block text-[9px] uppercase">Original Time</span>
                  <span className="text-lg font-bold text-zinc-200">
                    {round(routingResult.astar.travel_time_sec / 60)} mins
                  </span>
                </div>
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-900">
                  <span className="text-zinc-500 block text-[9px] uppercase">Detour Time</span>
                  <span className="text-lg font-bold text-zinc-200">
                    {round(routingResult.detour_analysis.detour.travel_time_sec / 60)} mins
                  </span>
                </div>
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-900">
                  <span className="text-zinc-500 block text-[9px] uppercase">Estimated Delay</span>
                  <span className="text-lg font-bold text-rose-400">
                    {round(routingResult.detour_analysis.delay_sec / 60)} mins
                  </span>
                </div>
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-900">
                  <span className="text-zinc-500 block text-[9px] uppercase">Added Distance</span>
                  <span className="text-lg font-bold text-sky-400">
                    {routingResult.detour_analysis.added_distance_m} m
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-950/20 rounded-xl border border-zinc-900 font-mono text-xs text-zinc-400">
                <span className="text-[10px] text-zinc-500 block uppercase mb-1">Explainability rationale</span>
                <p>{routingResult.explainability}</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Algorithms Comparison (Dijkstra vs A*) */}
      {routingResult && (
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-6">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" /> shortest Path Algorithms Comparison
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-4">Expanded Nodes (lower is better)</span>
              <SVGCompareChart data={routingResult.algorithm_comparison} yKey="expanded_nodes" color="#f97316" />
            </div>

            <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-4">Runtime (seconds)</span>
              <SVGCompareChart data={routingResult.algorithm_comparison} yKey="runtime_sec" color="#38bdf8" />
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[9px]">
                  <th className="py-3 px-4">Algorithm</th>
                  <th className="py-3 px-4 text-center">Runtime (s)</th>
                  <th className="py-3 px-4 text-center">Expanded Nodes</th>
                  <th className="py-3 px-4 text-center">Travel Time (s)</th>
                  <th className="py-3 px-4 text-center">Path Length (m)</th>
                  <th className="py-3 px-4 text-center">Memory (bytes)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {routingResult.algorithm_comparison.map((algo, idx) => (
                  <tr key={idx} className={`border-b border-zinc-900 hover:bg-zinc-900/10 transition-all ${algo.algorithm.includes('A*') ? 'bg-orange-500/5' : ''}`}>
                    <td className="py-3 px-4 font-bold text-zinc-200">{algo.algorithm}</td>
                    <td className="py-3 px-4 text-center">{algo.runtime_sec}s</td>
                    <td className="py-3 px-4 text-center">{algo.expanded_nodes}</td>
                    <td className="py-3 px-4 text-center font-bold text-orange-400">{algo.travel_time_sec}s</td>
                    <td className="py-3 px-4 text-center">{algo.path_length_m}m</td>
                    <td className="py-3 px-4 text-center">{algo.memory_bytes}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${algo.is_best ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10' : 'text-zinc-500 bg-zinc-800'}`}>
                        {algo.is_best ? "Optimal Solver" : "Candidate Solver"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

const round = (num) => Math.round(num * 10) / 10;
