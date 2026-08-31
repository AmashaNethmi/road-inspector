import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Send, 
  Sparkles, 
  Filter, 
  Eye, 
  CheckCircle,
  FileCheck,
  ArrowRight,
  TrendingUp,
  Layers
} from 'lucide-react';
import { CitizenReport, SurfaceType } from '../types';

const INITIAL_REPORTS: CitizenReport[] = [
  {
    id: 'CIT-2026-081',
    user: 'Amila Jayawardena',
    type: 'Pothole',
    location: '6.936681, 79.975579 (Kaduwela Road, Malabe)',
    coordinates: { lat: 6.936681, lng: 79.975579 },
    timestamp: 'Today, 08:35 AM',
    status: 'Pending Review',
    severity: 'High',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
    description: 'Deep hazardous pothole on high-speed lane near junction. Causes dangerous swerving for 2-wheelers and buses during rush hour.',
    actualSizeM3: 3.2,
    repairSizeM3: 5.0,
    roadType: SurfaceType.ASPHALT
  },
  {
    id: 'CIT-2026-082',
    user: 'Kasun Silva',
    type: 'Crack',
    location: '6.927100, 79.861200 (Galle Road, Colombo 03)',
    coordinates: { lat: 6.927100, lng: 79.861200 },
    timestamp: 'Today, 09:40 AM',
    status: 'AI Verified',
    severity: 'Critical',
    image: 'https://images.unsplash.com/photo-1599423300746-b62533397364?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
    description: 'Long longitudinal fatigue crack propagating across 2 lanes with early subsidence. Risk of catastrophic base layer collapse.',
    actualSizeM3: 4.8,
    repairSizeM3: 7.5,
    roadType: SurfaceType.ASPHALT
  },
  {
    id: 'CIT-2026-083',
    user: 'Nimali Fernando',
    type: 'Rutting',
    location: '6.840200, 79.998400 (High Level Road, Maharagama)',
    coordinates: { lat: 6.840200, lng: 79.998400 },
    timestamp: 'Yesterday, 04:15 PM',
    status: 'Scheduled',
    severity: 'Medium',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
    description: 'Wheel path depression from heavy container trucks. Accumulates standing water during rain causing hydroplaning danger.',
    actualSizeM3: 2.1,
    repairSizeM3: 3.8,
    roadType: SurfaceType.ASPHALT
  },
  {
    id: 'CIT-2026-084',
    user: 'Rohan Wickramasinghe',
    type: 'Erosion',
    location: '7.290600, 80.633700 (Peradeniya Arterial, Kandy)',
    coordinates: { lat: 7.290600, lng: 80.633700 },
    timestamp: 'Yesterday, 02:20 PM',
    status: 'Dispatched',
    severity: 'Low',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
    description: 'Edge shoulder washaway due to culvert overflow. Requires asphalt shoulder reinstatement and edge compaction.',
    actualSizeM3: 1.5,
    repairSizeM3: 2.4,
    roadType: SurfaceType.ASPHALT
  }
];

interface CitizenReportsDashboardProps {
  onSelectForPlanning?: (report: CitizenReport) => void;
}

export default function CitizenReportsDashboard({ onSelectForPlanning }: CitizenReportsDashboardProps) {
  const [reports, setReports] = useState<CitizenReport[]>(INITIAL_REPORTS);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [activeReportModal, setActiveReportModal] = useState<CitizenReport | null>(null);

  const filteredReports = selectedFilter === 'All'
    ? reports
    : reports.filter(r => r.status === selectedFilter || r.severity === selectedFilter);

  const handleUpdateStatus = (id: string, newStatus: CitizenReport['status']) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    if (activeReportModal && activeReportModal.id === id) {
      setActiveReportModal({ ...activeReportModal, status: newStatus });
    }
  };

  const getSeverityBadge = (sev: CitizenReport['severity']) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Medium':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  const getStatusBadge = (status: CitizenReport['status']) => {
    switch (status) {
      case 'Pending Review':
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      case 'AI Verified':
        return 'bg-sky-950/60 text-sky-400 border-sky-600/40';
      case 'Scheduled':
        return 'bg-amber-950/60 text-amber-400 border-amber-600/40';
      case 'Dispatched':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-600/40';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <Layers className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-100 font-mono uppercase">
                Citizen Defect Ingestion & Dispatch Pipeline
              </h2>
              <p className="text-xs text-zinc-400">
                Live crowdsourced hazard reports verified with computer vision & automated repair routing
              </p>
            </div>
          </div>
        </div>

        {/* Action / Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {['All', 'Pending Review', 'AI Verified', 'Scheduled', 'Dispatched'].map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                selectedFilter === filter
                  ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/20'
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-zinc-800/80">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Total Ingested</span>
          <div className="text-2xl font-bold font-mono text-zinc-100">{reports.length}</div>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +12% this week
          </span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-zinc-800/80">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Pending Verification</span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {reports.filter(r => r.status === 'Pending Review').length}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Requires review</span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-zinc-800/80">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">AI Verified & Ready</span>
          <div className="text-2xl font-bold font-mono text-sky-400">
            {reports.filter(r => r.status === 'AI Verified').length}
          </div>
          <span className="text-[10px] text-sky-400/80 font-mono">Confidence &gt; 94%</span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-zinc-800/80">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Active Dispatches</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {reports.filter(r => r.status === 'Dispatched').length}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">Crews on-site</span>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredReports.map(report => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel rounded-2xl overflow-hidden border border-zinc-800/80 hover:border-orange-500/40 transition-all flex flex-col group"
            >
              {/* Image & Badges */}
              <div className="relative h-48 w-full overflow-hidden bg-zinc-950">
                <img
                  src={report.image}
                  alt={report.type}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                
                {/* Floating Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${getSeverityBadge(report.severity)}`}>
                    {report.severity} Severity
                  </span>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase border ${getStatusBadge(report.status)}`}>
                    {report.status}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-zinc-300">
                  <span className="font-mono font-bold text-white text-base">{report.type} Defect</span>
                  <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-700">
                    {report.id}
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {report.description}
                </p>

                {/* Metadata List */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate">{report.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>{report.user}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{report.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Repair Estimation Specs */}
                <div className="grid grid-cols-2 gap-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 text-[11px] font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase">Actual Volume</span>
                    <span className="text-zinc-200 font-bold">{report.actualSizeM3} m³</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase">Repair Excavation</span>
                    <span className="text-orange-400 font-bold">{report.repairSizeM3} m³</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (onSelectForPlanning) {
                        onSelectForPlanning(report);
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-mono text-xs uppercase font-bold py-2.5 px-3 rounded-xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Plan with AI
                  </button>

                  {report.status === 'Pending Review' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'AI Verified')}
                      className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-sky-400 text-xs font-mono rounded-xl border border-zinc-700 transition-all flex items-center gap-1.5"
                      title="Verify Defect"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verify
                    </button>
                  )}

                  {report.status === 'AI Verified' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'Dispatched')}
                      className="px-3 py-2.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 text-xs font-mono rounded-xl border border-emerald-700/60 transition-all flex items-center gap-1.5"
                      title="Dispatch Repair Crew"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Dispatch
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
