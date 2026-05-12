/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Navigation from './components/Navigation';
import DefectForm from './components/DefectForm';
import EnvironmentalPanel from './components/EnvironmentalPanel';
import AnalysisSummary from './components/AnalysisSummary';
import MapPreview from './components/MapPreview';
import { analyzeRepair, getMockEnvironmentalData } from './services/geminiService';
import { AnalysisResult, DefectDetails } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Zap, LayoutDashboard, History } from 'lucide-react';

import HistoryPanel from './components/HistoryPanel';

export default function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'history'>('plan');

  const handleDefectSubmit = async (details: DefectDetails) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const environment = getMockEnvironmentalData(details.location);
      const analysis = await analyzeRepair(details, environment);
      setResult(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please check the console for details.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <Navigation />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header Strip */}
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-8 shrink-0 bg-zinc-950/50 backdrop-blur-xl z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-100 italic">ROAD INSPECTOR</h1>
            <div className="h-4 w-[1px] bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">System: Operational_v1.4.2_LTS</span>
            </div>
          </div>
          
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <TabButton 
              active={activeTab === 'plan'} 
              onClick={() => setActiveTab('plan')}
              icon={<LayoutDashboard className="w-3.5 h-3.5" />}
              label="Active Planning"
            />
            <TabButton 
              active={activeTab === 'history'} 
              onClick={() => setActiveTab('history')}
              icon={<History className="w-3.5 h-3.5" />}
              label="Historical Data"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <div className="max-w-6xl mx-auto space-y-12 pb-24">
            <div className="grid grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Input Form */}
              <div className="col-span-12 lg:col-span-4 sticky top-0">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold font-mono uppercase tracking-tighter mb-2">Repair Definition</h2>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Enter defect characteristics and resource availability to initialize the optimization engine.
                    </p>
                  </div>
                  <DefectForm onSubmit={handleDefectSubmit} />
                </div>
              </div>

              {/* Right Column: Dashboard & Visualization */}
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-8 min-h-[600px]">
                {activeTab === 'plan' ? (
                  <AnimatePresence mode="wait">
                    {!result && !isAnalyzing ? (
                      <motion.div 
                        key="empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex-1 border border-zinc-900 rounded-3xl flex flex-col items-center justify-center text-center p-12 bg-zinc-950"
                      >
                        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 text-zinc-700">
                          <Zap className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-400 mb-2 font-mono">Engine Standby</h3>
                        <p className="text-sm text-zinc-600 max-w-sm">
                          Deployment logic requires active defect data. Input details on the left to begin scheduling optimization.
                        </p>
                      </motion.div>
                    ) : isAnalyzing ? (
                      <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 border border-zinc-900 rounded-3xl flex flex-col items-center justify-center p-12 bg-zinc-950"
                      >
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-6" />
                        <div className="space-y-2 text-center">
                          <span className="text-xs font-mono uppercase tracking-[0.2em] text-orange-500 animate-pulse">Processing Vector Alignment</span>
                          <div className="flex gap-1 justify-center">
                            {[0, 1, 2].map(i => (
                              <motion.div 
                                key={i}
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                className="w.1.5 h-1.5 bg-zinc-800 rounded-full"
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : result && (
                      <motion.div 
                        key="results"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                      >
                        <section className="space-y-4">
                          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 px-1 border-l-2 border-orange-500">Environmental Synchronization</h2>
                          <EnvironmentalPanel data={result.environment} />
                        </section>

                        <section className="space-y-4">
                          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 px-1 border-l-2 border-sky-500">Logistics Visualization</h2>
                          <MapPreview location={result.defect.location} coordinates={result.defect.coordinates} alternateRoute={result.plan.alternateRoute} />
                        </section>

                        <section className="space-y-4">
                          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 px-1 border-l-2 border-zinc-100">AI Optimization Plan</h2>
                          <AnalysisSummary result={result} />
                        </section>
                      </motion.div>
                    )}
                  </AnimatePresence>
                ) : (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="px-1 border-l-2 border-zinc-100">
                      <h2 className="text-xl font-bold font-mono uppercase tracking-tighter">Repair History</h2>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Synchronized with MongoDB Cloud</p>
                    </div>
                    <HistoryPanel />
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>


      {/* Decorative Gradient Overlays */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-sky-500/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-2 ${
        active 
          ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
          : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {icon}
      <span className="uppercase tracking-wider">{label}</span>
    </button>
  );
}
