/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DefectDetails, DefectType, SurfaceType } from '../types';
import { Ruler, MapPin, Pickaxe, Info, Activity } from 'lucide-react';

import LocationPicker from './LocationPicker';

interface DefectFormProps {
  onSubmit: (details: DefectDetails) => void;
}

export default function DefectForm({ onSubmit }: DefectFormProps) {
  const [details, setDetails] = useState<DefectDetails>({
    location: '',
    type: DefectType.POTHOLE,
    size: { length: 0.5, width: 0.5, depth: 10 },
    surfaceMaterial: SurfaceType.ASPHALT,
    severity: 'medium'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(details);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
      <div className="space-y-6">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-orange-500" />
            Location Reference
          </label>
          <input
            required
            type="text"
            placeholder="e.g. Sector 4, Highway A-12"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
            value={details.location}
            onChange={e => setDetails({ ...details, location: e.target.value })}
          />
        </div>

        <LocationPicker 
          onLocationSelect={(lat, lng, address) => setDetails({ 
            ...details, 
            coordinates: { lat, lng },
            location: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          })} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
            <Info className="w-4 h-4 text-orange-500" />
            Defect Type
          </label>
          <select
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none"
            value={details.type}
            onChange={e => setDetails({ ...details, type: e.target.value as DefectType })}
          >
            {Object.values(DefectType).map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
            <Pickaxe className="w-4 h-4 text-orange-500" />
            Material
          </label>
          <select
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none"
            value={details.surfaceMaterial}
            onChange={e => setDetails({ ...details, surfaceMaterial: e.target.value as SurfaceType })}
          >
            {Object.values(SurfaceType).map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
          <Ruler className="w-4 h-4 text-orange-500" />
          Dimensions
        </label>
        <div className="grid grid-cols-3 gap-3">
          <DimensionInput 
            label="Length (m)" 
            value={details.size.length} 
            onChange={v => setDetails({ ...details, size: { ...details.size, length: v }})} 
          />
          <DimensionInput 
            label="Width (m)" 
            value={details.size.width} 
            onChange={v => setDetails({ ...details, size: { ...details.size, width: v }})} 
          />
          <DimensionInput 
            label="Depth (cm)" 
            value={details.size.depth} 
            onChange={v => setDetails({ ...details, size: { ...details.size, depth: v }})} 
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
          Severity Level
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'medium', 'high'] as const).map(lev => (
            <button
              key={lev}
              type="button"
              onClick={() => setDetails({ ...details, severity: lev })}
              className={`py-2 rounded-lg text-xs font-medium uppercase tracking-widest transition-all ${
                details.severity === lev 
                  ? lev === 'high' ? 'bg-red-500 text-white' : lev === 'medium' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
              }`}
            >
              {lev}
            </button>
          ))}
        </div>
      </div>


      <button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
      >
        <Activity className="w-5 h-5" />
        Analyze Repair Requirement
      </button>
    </form>
  );
}

function DimensionInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5 text-center">
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-center text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
      />
      <span className="text-[10px] text-zinc-600 uppercase font-mono">{label}</span>
    </div>
  );
}
