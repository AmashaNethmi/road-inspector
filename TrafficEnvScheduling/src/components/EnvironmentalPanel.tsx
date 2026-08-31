import React from 'react';
import { Cloud, Thermometer, Droplets, Navigation2, Clock, CheckCircle2, AlertTriangle, CloudRain, Sun } from 'lucide-react';
import { EnvironmentalData } from '../types';
import { motion } from 'motion/react';

export default function EnvironmentalPanel({ data }: { data: EnvironmentalData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Atmospheric / Weather Card */}
        <PanelCard 
          title="Atmospheric & Curing Viability" 
          icon={data.weather.precipitationChance > 40 ? <CloudRain className="w-5 h-5 text-sky-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
          active={data.weather.isOptimal}
          badgeText={data.weather.isOptimal ? "Optimal for Curing" : "Weather Constraint Active"}
        >
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-mono">Weather Condition</span>
              <span className="text-xs font-bold text-zinc-100 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                {data.weather.condition}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-mono">Surface Temp</span>
              <span className="text-xs font-bold text-amber-400 font-mono">{data.weather.temperature}°C</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-mono">Precipitation Chance</span>
              <span className={`text-xs font-bold font-mono ${
                data.weather.precipitationChance > 50 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {data.weather.precipitationChance}%
              </span>
            </div>

            {data.weather.rainRule && (
              <div className="pt-2 mt-1 border-t border-zinc-800/80 text-[10px] text-zinc-400 font-mono leading-tight">
                <span className="text-orange-400 font-bold">Rain Rule:</span> {data.weather.rainRule}
              </div>
            )}
          </div>
        </PanelCard>

        {/* Traffic Load Card */}
        <PanelCard 
          title="Traffic Load & Restriction Windows" 
          icon={<Navigation2 className="w-5 h-5 text-orange-400" />}
          active={data.traffic.isOptimal}
          badgeText={data.traffic.isOptimal ? "Low Disruption Corridor" : "Peak Flow Congestion"}
        >
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-mono">Traffic Flow Index</span>
              <span className={`text-xs font-bold uppercase font-mono px-2 py-0.5 rounded border ${
                data.traffic.flowLevel === 'heavy' ? 'bg-rose-950/60 text-rose-400 border-rose-700/60' : 
                data.traffic.flowLevel === 'high' ? 'bg-amber-950/60 text-amber-400 border-amber-700/60' :
                'bg-emerald-950/60 text-emerald-400 border-emerald-700/60'
              }`}>
                {data.traffic.flowLevel}
              </span>
            </div>
            
            <div className="pt-2 border-t border-zinc-800/80">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] text-zinc-400 uppercase font-mono">Restricted Peak Windows (Avoid)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.traffic.peakHours.map(h => (
                  <span key={h} className="text-[10px] px-2 py-0.5 bg-zinc-950 text-zinc-300 rounded-md border border-zinc-800 font-mono">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </PanelCard>

      </div>

      {/* Skipped Rainy Days Notification if present */}
      {data.weather.skippedDays && data.weather.skippedDays.length > 0 && (
        <div className="glass-panel p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs font-mono text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Multi-Day Monsoon Filter:</span> Automatically postponed through {data.weather.skippedDays.length} high-rain day(s) to protect asphalt curing bonding strength.
          </div>
        </div>
      )}
    </div>
  );
}

function PanelCard({ 
  title, 
  icon, 
  children, 
  active,
  badgeText 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  active: boolean;
  badgeText?: string;
}) {
  return (
    <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group border border-zinc-800/80 hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-zinc-900 rounded-xl group-hover:scale-105 transition-transform border border-zinc-800">
            {icon}
          </div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200 font-bold">{title}</h3>
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          {badgeText && (
            <span className={`text-[9px] font-mono uppercase ${active ? 'text-emerald-400' : 'text-amber-400'}`}>
              {badgeText}
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
