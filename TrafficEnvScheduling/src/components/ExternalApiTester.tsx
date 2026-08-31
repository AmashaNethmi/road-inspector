import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Send, 
  Code, 
  Copy, 
  Check, 
  Clock, 
  Navigation, 
  AlertTriangle, 
  CheckCircle2, 
  Server,
  Layers,
  Sparkles
} from 'lucide-react';

export default function ExternalApiTester() {
  const [formData, setFormData] = useState({
    location: '6.936681, 79.975579',
    DefectType: 'crack',
    RoadType: 'asphalt',
    DefectActualSize: '3m³',
    DefectRepairSize: '5m³',
    ServerityLevel: 'High'
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [responseJson, setResponseJson] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeEndpoint, setActiveEndpoint] = useState<'/predict_external' | '/predict_repair'>('/predict_external');

  const samplePresets = [
    {
      name: 'Colombo Heavy Crack (User Case)',
      data: {
        location: '6.936681, 79.975579',
        DefectType: 'crack',
        RoadType: 'asphalt',
        DefectActualSize: '3m³',
        DefectRepairSize: '5m³',
        ServerityLevel: 'High'
      }
    },
    {
      name: 'Highway Large Pothole (Critical)',
      data: {
        location: '6.938122, 79.979044',
        DefectType: 'pothole',
        RoadType: 'asphalt',
        DefectActualSize: '2.5m³',
        DefectRepairSize: '4.2m³',
        ServerityLevel: 'High'
      }
    },
    {
      name: 'Suburban Erosion Shoulder',
      data: {
        location: '7.290600, 80.633700',
        DefectType: 'erosion',
        RoadType: 'concrete',
        DefectActualSize: '1.2m³',
        DefectRepairSize: '2.0m³',
        ServerityLevel: 'Medium'
      }
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlurSize = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const trimmed = value.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^([-+]?\d*\.?\d+)/);
    if (match) {
      setFormData(prev => ({ ...prev, [name]: `${match[1]}m³` }));
    }
  };

  const handleExecuteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseJson(null);

    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const url = `http://${host}:8002${activeEndpoint}`;

    try {
      let bodyData: any = formData;
      if (activeEndpoint === '/predict_repair') {
        bodyData = {
          detailsOfDefect: `${formData.DefectType} (${formData.ServerityLevel} severity)`,
          sizeOfDefect: formData.DefectActualSize,
          sizeOfRepairArea: formData.DefectRepairSize,
          typeOfRoad: formData.RoadType,
          interruptNotes: "Automated test dispatch",
          exactLocation: formData.location
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setResponseJson(data);
    } catch (err: any) {
      setResponseJson({
        error: true,
        message: err.message || "Failed to execute external prediction request.",
        note: "Ensure backend is running on port 8002."
      });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (!responseJson) return;
    navigator.clipboard.writeText(JSON.stringify(responseJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <Server className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-100 font-mono uppercase">
              External Component Defect Ingestion & API Simulator
            </h2>
            <p className="text-xs text-zinc-400">
              Test drone/sensor webhook payloads and third-party AI integration endpoints
            </p>
          </div>
        </div>
      </div>

      {/* Endpoint Selector & Preset Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveEndpoint('/predict_external')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              activeEndpoint === '/predict_external'
                ? 'bg-orange-500 text-white border-orange-400 font-bold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            POST /predict_external
          </button>
          <button
            onClick={() => setActiveEndpoint('/predict_repair')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              activeEndpoint === '/predict_repair'
                ? 'bg-orange-500 text-white border-orange-400 font-bold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            POST /predict_repair
          </button>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase text-zinc-500">Presets:</span>
          {samplePresets.map(preset => (
            <button
              key={preset.name}
              onClick={() => setFormData(preset.data)}
              className="px-2.5 py-1 bg-zinc-900/80 hover:bg-zinc-800 text-[11px] font-mono text-zinc-300 rounded border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Left, JSON Response Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleExecuteRequest} className="glass-panel p-6 rounded-2xl border border-zinc-800/80 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 border-b border-zinc-800/60 pb-2">
              Request Payload Parameters
            </h3>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Location Coordinates / Road Name</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Defect Type</label>
                <select
                  name="DefectType"
                  value={formData.DefectType}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="crack">Crack</option>
                  <option value="pothole">Pothole</option>
                  <option value="rutting">Rutting</option>
                  <option value="erosion">Erosion</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Road Surface Type</label>
                <select
                  name="RoadType"
                  value={formData.RoadType}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="asphalt">Asphalt</option>
                  <option value="concrete">Concrete</option>
                  <option value="gravel">Gravel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Actual Defect Volume</label>
                <input
                  type="text"
                  name="DefectActualSize"
                  value={formData.DefectActualSize}
                  onChange={handleInputChange}
                  onBlur={handleBlurSize}
                  placeholder="e.g. 3m³"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Excavation Repair Volume</label>
                <input
                  type="text"
                  name="DefectRepairSize"
                  value={formData.DefectRepairSize}
                  onChange={handleInputChange}
                  onBlur={handleBlurSize}
                  placeholder="e.g. 5m³"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Defect Severity Level</label>
              <select
                name="ServerityLevel"
                value={formData.ServerityLevel}
                onChange={handleInputChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-mono text-xs uppercase font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Executing Prediction...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Test Payload
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: JSON Response Viewer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-zinc-800/80 space-y-4 flex flex-col h-full min-h-[420px]">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                  Response Payload Viewer
                </h3>
              </div>

              {responseJson && (
                <button
                  onClick={copyResponse}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono rounded border border-zinc-700 transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </button>
              )}
            </div>

            {/* Response Display Box */}
            <div className="flex-1 bg-zinc-950 rounded-xl p-4 border border-zinc-800/80 overflow-y-auto font-mono text-xs text-zinc-300 max-h-[380px]">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2 py-16">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <span>Awaiting ML Engine Response...</span>
                </div>
              ) : responseJson ? (
                <pre className="text-zinc-300 leading-relaxed overflow-x-auto">
                  {JSON.stringify(responseJson, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2 py-16 text-center">
                  <Server className="w-8 h-8 text-zinc-700" />
                  <p>Send a payload from the left panel to inspect the raw JSON response.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
