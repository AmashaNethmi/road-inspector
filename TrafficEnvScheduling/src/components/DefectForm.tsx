import React, { useState, useEffect } from 'react';
import { DefectDetails, DefectType, SurfaceType } from '../types';
import { 
  Zap, 
  MapPin, 
  Layers, 
  Sparkles, 
  Gauge, 
  Ruler, 
  Sliders, 
  AlertTriangle 
} from 'lucide-react';

interface DefectFormProps {
  onSubmit: (details: DefectDetails) => void;
  initialValues?: DefectDetails | null;
}

export default function DefectForm({ onSubmit, initialValues }: DefectFormProps) {
  const [formData, setFormData] = useState({
    location: '6.936681, 79.975579',
    DefectType: 'crack',
    RoadType: 'asphalt',
    DefectActualSize: '3m³',
    DefectRepairSize: '5m³',
    ServerityLevel: 'High'
  });

  useEffect(() => {
    if (initialValues) {
      const locStr = initialValues.coordinates 
        ? `${initialValues.coordinates.lat}, ${initialValues.coordinates.lng}`
        : initialValues.location;
      
      const actSize = initialValues.actualSize?.depth ?? 3.0;
      const repSize = initialValues.repairSize?.depth ?? (actSize * 1.5);

      setFormData({
        location: locStr,
        DefectType: initialValues.type,
        RoadType: initialValues.surfaceMaterial,
        DefectActualSize: `${actSize}m³`,
        DefectRepairSize: `${repSize}m³`,
        ServerityLevel: initialValues.severity.charAt(0).toUpperCase() + initialValues.severity.slice(1)
      });
    }
  }, [initialValues]);

  const presetScenarios = [
    {
      label: 'Colombo Crack (3m³)',
      location: '6.936681, 79.975579',
      type: 'crack',
      road: 'asphalt',
      actual: '3m³',
      repair: '5m³',
      severity: 'High'
    },
    {
      label: 'Galle Pothole (2m³)',
      location: '6.927100, 79.861200',
      type: 'pothole',
      road: 'asphalt',
      actual: '2m³',
      repair: '3.5m³',
      severity: 'Critical'
    },
    {
      label: 'Kandy Rutting (4.5m³)',
      location: '7.290600, 80.633700',
      type: 'rutting',
      road: 'asphalt',
      actual: '4.5m³',
      repair: '7m³',
      severity: 'Medium'
    }
  ];

  const handleApplyPreset = (preset: typeof presetScenarios[0]) => {
    setFormData({
      location: preset.location,
      DefectType: preset.type,
      RoadType: preset.road,
      DefectActualSize: preset.actual,
      DefectRepairSize: preset.repair,
      ServerityLevel: preset.severity
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const trimmed = value.trim();
    if (!trimmed) return;
    
    const numMatch = trimmed.match(/^([-+]?\d*\.?\d+)/);
    if (numMatch) {
      const num = numMatch[1];
      const rest = trimmed.substring(num.length).trim().toLowerCase();
      if (rest === '' || rest === 'm' || rest === 'm3' || rest === 'm^3' || rest === 'm³') {
        setFormData(prev => ({ ...prev, [name]: `${num}m³` }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const coordsParts = formData.location.split(',');
    let coordinates;
    if (coordsParts.length >= 2) {
      const lat = parseFloat(coordsParts[0]);
      const lng = parseFloat(coordsParts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates = { lat, lng };
      }
    }

    const actualVol = parseFloat(formData.DefectActualSize) || 3.0;
    const repairVol = parseFloat(formData.DefectRepairSize) || 5.0;

    const severityMap: Record<string, 'low' | 'medium' | 'high'> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'high',
      'Low': 'low',
      'Medium': 'medium',
      'High': 'high',
      'Critical': 'high'
    };

    const details: DefectDetails = {
      location: formData.location,
      coordinates,
      type: formData.DefectType as DefectType,
      size: { length: 1, width: 1, depth: actualVol },
      actualSize: { length: 1, width: 1, depth: actualVol },
      repairSize: { length: 1, width: 1, depth: repairVol },
      finalArea: repairVol,
      surfaceMaterial: formData.RoadType as SurfaceType,
      severity: severityMap[formData.ServerityLevel] || 'medium'
    };

    onSubmit(details);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-zinc-800/80 space-y-5">
      {/* Preset Buttons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-400" /> Quick Presets:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presetScenarios.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-orange-500/40 transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3.5 pt-2 border-t border-zinc-800/60">
        <div>
          <label className="block text-[10px] uppercase font-mono text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-orange-400" /> Location (GPS Coordinates / Road Name)
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="6.936681, 79.975579"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-mono text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-amber-400" /> Defect Type
            </label>
            <select
              name="DefectType"
              value={formData.DefectType}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="pothole">Pothole</option>
              <option value="crack">Crack</option>
              <option value="rutting">Rutting</option>
              <option value="erosion">Erosion</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono text-zinc-400 font-semibold mb-1">
              Road Surface
            </label>
            <select
              name="RoadType"
              value={formData.RoadType}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="asphalt">Asphalt (Flexible)</option>
              <option value="concrete">Concrete (Rigid)</option>
              <option value="gravel">Gravel</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-mono text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
              <Ruler className="w-3 h-3 text-sky-400" /> Actual Defect Vol
            </label>
            <input
              type="text"
              name="DefectActualSize"
              value={formData.DefectActualSize}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="e.g. 3m³"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
              <Ruler className="w-3 h-3 text-orange-400" /> Repair Excavation
            </label>
            <input
              type="text"
              name="DefectRepairSize"
              value={formData.DefectRepairSize}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="e.g. 5m³"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-mono text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
            <Gauge className="w-3 h-3 text-rose-400" /> Severity Classification
          </label>
          <select
            name="ServerityLevel"
            value={formData.ServerityLevel}
            onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors"
          >
            <option value="Low">Low (Surface spalling &lt; 25mm)</option>
            <option value="Medium">Medium (Depth 25-50mm)</option>
            <option value="High">High (Depth &gt; 50mm with base exposure)</option>
            <option value="Critical">Critical (Structural hazard, high-speed corridor)</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-mono text-xs uppercase font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 mt-2"
      >
        <Zap className="w-4 h-4 fill-current" />
        Execute AI Optimization Plan
      </button>
    </form>
  );
}
