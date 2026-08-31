/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, 
  Zap, 
  LayoutDashboard, 
  History, 
  Cloud, 
  Calendar, 
  GitPullRequest, 
  BarChart, 
  Activity,
  Award,
  Terminal,
  Camera,
  Sun,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';

import Navigation from './components/Navigation';
import DefectForm from './components/DefectForm';
import EnvironmentalPanel from './components/EnvironmentalPanel';
import AnalysisSummary from './components/AnalysisSummary';
import MapPreview from './components/MapPreview';
import WeatherDashboard from './components/WeatherDashboard';
import TrafficDashboard from './components/TrafficDashboard';
import SchedulingDashboard from './components/SchedulingDashboard';
import RoutingDashboard from './components/RoutingDashboard';
import EvaluationDashboard from './components/EvaluationDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CitizenReportsDashboard from './components/CitizenReportsDashboard';
import ResearchReport from './components/ResearchReport';
import HistoryPanel from './components/HistoryPanel';
import ExternalApiTester from './components/ExternalApiTester';

import { analyzeRepair } from './services/mlService';
import { AnalysisResult, DefectDetails, NavigationTab, CitizenReport, SurfaceType } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('plan');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedCitizenDefect, setSelectedCitizenDefect] = useState<DefectDetails | null>(null);
  const [backendHealthy, setBackendHealthy] = useState<boolean>(true);

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const res = await fetch(`http://${host}:8002/api/traffic/current`);
        setBackendHealthy(res.ok);
      } catch (err) {
        setBackendHealthy(false);
      }
    };
    checkHealth();
  }, []);

  // Handler for Active Planning submission
  const handleDefectSubmit = async (details: DefectDetails) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const analysis = await analyzeRepair(details);
      setResult(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please ensure the backend is running on port 8002.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler when user clicks "Auto-Plan with AI" in Citizen Reports
  const handleSelectCitizenReportForPlanning = (report: CitizenReport) => {
    const details: DefectDetails = {
      location: `${report.coordinates.lat}, ${report.coordinates.lng}`,
      coordinates: report.coordinates,
      type: report.type.toLowerCase() as any,
      size: { length: 1, width: 1, depth: report.actualSizeM3 },
      actualSize: { length: 1, width: 1, depth: report.actualSizeM3 },
      repairSize: { length: 1, width: 1, depth: report.repairSizeM3 },
      finalArea: report.repairSizeM3,
      surfaceMaterial: report.roadType || SurfaceType.ASPHALT,
      severity: report.severity.toLowerCase() as any
    };

    setSelectedCitizenDefect(details);
    setActiveTab('plan');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none">
      
      {/* Redesigned Sidebar Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto md:overflow-hidden relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950 to-zinc-950">
        
        {/* Top Executive Header Bar */}
        <header className="h-16 border-b border-zinc-800/80 flex items-center justify-between px-6 sm:px-8 shrink-0 bg-zinc-950/70 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold tracking-[0.2em] text-zinc-100 uppercase italic">
                ROAD INSPECTOR
              </span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                INTELLIGENT REPAIR AI v2.4
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 border-l border-zinc-800 pl-4">
              <div className={`w-2 h-2 rounded-full ${backendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[10px] font-mono text-zinc-400 uppercase">
                {backendHealthy ? 'Backend Engine Online' : 'Engine Standby (Port 8002)'}
              </span>
            </div>
          </div>

          {/* Quick status badges on the right */}
          <div className="flex items-center gap-3">
            {/* Live Weather Indicator */}
            <div className="hidden sm:flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Colombo 27.2°C</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-700/60 font-bold">
                Dry Window
              </span>
            </div>

            {/* Quick action button */}
            {activeTab !== 'plan' && (
              <button
                onClick={() => setActiveTab('plan')}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-xl transition-all shadow-md shadow-orange-600/20 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                Active Planner
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: ACTIVE REPAIR PLANNER */}
              {activeTab === 'plan' && (
                <motion.div
                  key="plan"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8 pb-16"
                >
                  <div className="border-b border-zinc-800/80 pb-4">
                    <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-zinc-100">
                      Active Repair Planning & Environmental Optimization
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Input defect dimensions or select preset scenarios to calculate dynamic ML duration, curing safety & bypass routes
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Input Form */}
                    <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-6">
                      <DefectForm
                        onSubmit={handleDefectSubmit}
                        initialValues={selectedCitizenDefect}
                      />
                    </div>

                    {/* Right Column: Dynamic Results & Map */}
                    <div className="lg:col-span-8 flex flex-col gap-8 min-h-[500px]">
                      {!result && !isAnalyzing ? (
                        <div className="flex-1 border border-zinc-800/80 rounded-3xl flex flex-col items-center justify-center text-center p-12 bg-zinc-900/30 backdrop-blur-md">
                          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 text-orange-400 border border-zinc-800">
                            <Zap className="w-8 h-8" />
                          </div>
                          <h3 className="text-lg font-bold text-zinc-200 mb-2 font-mono uppercase tracking-wider">
                            Intelligent Engine Standby
                          </h3>
                          <p className="text-xs text-zinc-400 max-w-md font-mono leading-relaxed">
                            Select a quick preset or customize defect parameters on the left panel to execute multi-variable repair duration, traffic restriction and weather synchronization models.
                          </p>
                        </div>
                      ) : isAnalyzing ? (
                        <div className="flex-1 border border-zinc-800/80 rounded-3xl flex flex-col items-center justify-center p-12 bg-zinc-900/30 backdrop-blur-md">
                          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-6" />
                          <div className="space-y-2 text-center">
                            <span className="text-xs font-mono uppercase tracking-[0.2em] text-orange-400 animate-pulse font-bold">
                              Executing Multi-Variable ML Pipeline & OSRM Detour
                            </span>
                            <p className="text-[11px] font-mono text-zinc-500">
                              Evaluating 7-day weather forecast, traffic index, and workforce sizing...
                            </p>
                          </div>
                        </div>
                      ) : result && (
                        <div className="space-y-8">
                          {/* Atmospheric and Traffic Environmental Synchronization */}
                          <section className="space-y-3">
                            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 px-1 border-l-2 border-orange-500 font-bold">
                              Environmental & Atmospheric Synchronization
                            </h3>
                            <EnvironmentalPanel data={result.environment} />
                          </section>

                          {/* Logistics & Dynamic Leaflet Detour */}
                          <section className="space-y-3">
                            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 px-1 border-l-2 border-sky-500 font-bold">
                              GIS Work Zone & Dynamic Detour Rerouting
                            </h3>
                            <MapPreview
                              location={result.defect.location}
                              coordinates={result.defect.coordinates}
                              alternateRoute={result.plan.alternateRoute}
                            />
                          </section>

                          {/* Complete AI Optimization Plan */}
                          <section className="space-y-3">
                            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 px-1 border-l-2 border-emerald-500 font-bold">
                              AI Schedule & Resource Allocation Plan
                            </h3>
                            <AnalysisSummary result={result} />
                          </section>
                        </div>
                      )}
                    </div>

                  </div>
                </motion.div>
              )}

              {/* TAB 2: CITIZEN REPORTS & INGESTION */}
              {activeTab === 'citizen' && (
                <motion.div
                  key="citizen"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <CitizenReportsDashboard
                    onSelectForPlanning={handleSelectCitizenReportForPlanning}
                  />
                </motion.div>
              )}

              {/* TAB 3: WEATHER & CURING ENGINE */}
              {activeTab === 'weather' && (
                <motion.div
                  key="weather"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <WeatherDashboard />
                </motion.div>
              )}

              {/* TAB 4: TRAFFIC & YOLO VISION */}
              {activeTab === 'traffic' && (
                <motion.div
                  key="traffic"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <TrafficDashboard />
                </motion.div>
              )}

              {/* TAB 5: SCHEDULING & PARETO */}
              {activeTab === 'scheduling' && (
                <motion.div
                  key="scheduling"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SchedulingDashboard />
                </motion.div>
              )}

              {/* TAB 6: ROUTING & DETOURS */}
              {activeTab === 'routing' && (
                <motion.div
                  key="routing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <RoutingDashboard />
                </motion.div>
              )}

              {/* TAB 7: MONTE CARLO & EVALUATION */}
              {activeTab === 'evaluation' && (
                <motion.div
                  key="evaluation"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <EvaluationDashboard />
                </motion.div>
              )}

              {/* TAB 8: SYSTEM ANALYTICS */}
              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <AnalyticsDashboard />
                </motion.div>
              )}

              {/* TAB 9: RESEARCH COMPLIANCE AUDIT */}
              {activeTab === 'compliance' && (
                <motion.div
                  key="compliance"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ResearchReport />
                </motion.div>
              )}

              {/* TAB 10: CLOUD HISTORY LOGS */}
              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="border-b border-zinc-800/80 pb-4">
                    <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-zinc-100">
                      Historical Repair Records & MongoDB Cloud Sync
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Browse, filter, and inspect past AI optimization runs stored persistently in cloud database
                    </p>
                  </div>
                  <HistoryPanel />
                </motion.div>
              )}

              {/* TAB 11: EXTERNAL API TESTER */}
              {activeTab === 'tester' && (
                <motion.div
                  key="tester"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ExternalApiTester />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* Ambient Glow Gradients */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-orange-500/5 blur-[140px] rounded-full" />
          <div className="absolute bottom-[-15%] left-[20%] w-[40%] h-[40%] bg-sky-500/5 blur-[140px] rounded-full" />
        </div>

      </main>
    </div>
  );
}
