/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Timer, Calendar, MapPin, Users, AlertTriangle, Hammer, Clock, Navigation2, Zap, Info, ExternalLink } from 'lucide-react';
import { AnalysisResult } from '../types';
import { motion } from 'motion/react';

export default function AnalysisSummary({ result }: { result: AnalysisResult }) {
  const { plan } = result;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="grid grid-cols-2 gap-6">
        <MetricCard 
          icon={<Timer className="w-5 h-5" />} 
          label="Est. Duration" 
          value={`${plan.estimatedDurationHours} Hrs`} 
          variant="highlight"
        />
        <MetricCard 
          icon={<Calendar className="w-5 h-5" />} 
          label="Optimal Commencement" 
          value={plan.suggestedStartTime} 
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div variants={item} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
            <Users className="w-5 h-5 text-orange-500" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Crew Deployment</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg">
              <span className="text-sm text-zinc-400 italic font-mono">Headcount</span>
              <span className="text-xl font-bold font-mono text-zinc-100">{plan.crewRecommendation.workers}</span>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Equipment Profile</span>
              <div className="flex flex-wrap gap-2">
                {plan.crewRecommendation.equipment.map(eq => (
                  <span key={eq} className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-[11px] font-medium">
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
            <Navigation2 className="w-5 h-5 text-sky-500" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Logistics & Strategy</h3>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-sky-500/5 border border-sky-500/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span className="text-[10px] uppercase font-mono text-sky-400 tracking-tighter">Alternate Path Recommendation</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed italic">
                "{plan.alternateRoute}"
              </p>
            </div>
            <div className="p-3 bg-zinc-800/30 border border-zinc-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-[10px] uppercase font-mono text-orange-400 tracking-tighter">Timing Strategy</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {plan.bestTimeRationale}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] text-zinc-500 uppercase font-mono">Risk Vectors</span>
              </div>
              <ul className="space-y-1">
                {plan.risks.map((risk, i) => (
                  <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
      
      {plan.automationRecommendation && (
        <motion.div variants={item} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
             <Hammer className="w-32 h-32" />
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-100 font-mono tracking-tighter uppercase">Automation Engine Recommendation</h3>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Verified Against Real-World Datasets</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-600 uppercase font-mono">Optimal Schedule Window</span>
              <div className="text-xl font-bold text-orange-400 font-mono tracking-tight">{plan.automationRecommendation.optimalWindow}</div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
               <Info className="w-4 h-4 text-zinc-500" />
               <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Reference Datasets & Research</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.automationRecommendation.referenceDatasets.map(ds => (
                <a 
                  key={ds.name} 
                  href={ds.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group/link"
                >
                  <span className="text-xs text-zinc-400 group-hover/link:text-zinc-100 truncate pr-4">{ds.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover/link:text-orange-400 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function MetricCard({ icon, label, value, variant = 'default' }: { icon: React.ReactNode, label: string, value: string, variant?: 'default' | 'highlight' }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`p-6 rounded-2xl border transition-all ${
        variant === 'highlight' 
          ? 'bg-orange-500 border-orange-400 shadow-xl shadow-orange-500/20' 
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className={`p-2 w-fit rounded-lg ${variant === 'highlight' ? 'bg-orange-400 text-white' : 'bg-zinc-800 text-orange-500'}`}>
          {icon}
        </div>
        <div>
          <div className={`text-[10px] uppercase font-mono tracking-widest mb-1 ${variant === 'highlight' ? 'text-orange-100' : 'text-zinc-500'}`}>
            {label}
          </div>
          <div className={`text-xl font-bold font-mono tracking-tighter ${variant === 'highlight' ? 'text-white' : 'text-zinc-100'}`}>
            {value}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

