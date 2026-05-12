/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cloud, Thermometer, Droplets, Navigation2, Clock } from 'lucide-react';
import { EnvironmentalData } from '../types';
import { motion } from 'motion/react';

export default function EnvironmentalPanel({ data }: { data: EnvironmentalData }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <PanelCard 
        title="Atmospheric" 
        icon={<Cloud className="w-5 h-5 text-sky-400" />}
        active={data.weather.isOptimal}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 font-mono italic">Condition</span>
            <span className="text-sm font-medium text-zinc-100">{data.weather.condition}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 font-mono italic">Temp</span>
            <span className="text-sm font-medium text-zinc-100">{data.weather.temperature}°C</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 font-mono italic">Precipitation</span>
            <span className="text-sm font-medium text-zinc-100">{data.weather.precipitationChance}%</span>
          </div>
        </div>
      </PanelCard>

      <PanelCard 
        title="Traffic Flow" 
        icon={<Navigation2 className="w-5 h-5 text-amber-400 rotate-45" />}
        active={data.traffic.isOptimal}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 font-mono italic">Load</span>
            <span className={`text-sm font-bold uppercase ${
              data.traffic.flowLevel === 'heavy' ? 'text-red-400' : 'text-zinc-100'
            }`}>
              {data.traffic.flowLevel}
            </span>
          </div>
          <div className="pt-2 mt-2 border-t border-zinc-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[10px] text-zinc-600 uppercase font-mono">Avoid Windows</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {data.traffic.peakHours.map(h => (
                <span key={h} className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      </PanelCard>
    </div>
  );
}

function PanelCard({ 
  title, 
  icon, 
  children, 
  active 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden group">
      <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-zinc-800 rounded-lg group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">{title}</h3>
      </div>
      {children}
    </div>
  );
}
