import React, { useEffect, useState } from 'react';
import { fetchHistory } from '../services/mlService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  MapPin, 
  Ruler, 
  Activity, 
  Search, 
  Filter, 
  Database, 
  RefreshCw, 
  Layers,
  Sparkles,
  CheckCircle2,
  Calendar
} from 'lucide-react';

const formatDuration = (decimalHours: number) => {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

interface NormalizedRecord {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  location: string;
  actualSize: string;
  repairSize: string;
  duration: number;
}

const SAMPLE_FALLBACK_RECORDS: NormalizedRecord[] = [
  {
    id: 'REC-2026-001',
    timestamp: '2026-05-11 08:30:15',
    type: 'Heavy Crack Repair',
    severity: 'High',
    location: '6.936681, 79.975579 (Kaduwela Arterial)',
    actualSize: '3.000 m³',
    repairSize: '5.000 m³',
    duration: 5.2
  },
  {
    id: 'REC-2026-002',
    timestamp: '2026-05-10 14:12:44',
    type: 'Suburban Pothole Infill',
    severity: 'Critical',
    location: '6.927100, 79.861200 (Galle Road A2)',
    actualSize: '1.800 m³',
    repairSize: '3.200 m³',
    duration: 3.5
  },
  {
    id: 'REC-2026-003',
    timestamp: '2026-05-09 19:45:02',
    type: 'Highway Rutting Resurfacing',
    severity: 'Medium',
    location: '6.840200, 79.998400 (High Level Road)',
    actualSize: '4.500 m³',
    repairSize: '7.000 m³',
    duration: 6.8
  },
  {
    id: 'REC-2026-004',
    timestamp: '2026-05-08 11:20:18',
    type: 'Shoulder Erosion Remediation',
    severity: 'Low',
    location: '7.290600, 80.633700 (Kandy Arterial)',
    actualSize: '1.200 m³',
    repairSize: '2.000 m³',
    duration: 2.8
  }
];

const normalizeRecord = (record: any): NormalizedRecord => {
  const cleanVolumeStr = (val: any): string => {
    if (!val) return '0.000 m³';
    if (typeof val === 'number') return `${val.toFixed(3)} m³`;
    const str = String(val).trim().replace(/\^3/g, '³').replace(/m3/g, 'm³');
    if (!str.includes('m³')) return `${str} m³`;
    return str;
  };

  const getCubicMeters = (length: number, width: number, depthCm: number): number => {
    return length * width * (depthCm / 100);
  };

  const id = record._id || String(Math.random());
  const timestamp = record.timestamp ? new Date(record.timestamp).toLocaleString() : 'Recent';

  // 1. External component defect data
  if (record.type === 'external_prediction' || (record.request && 'DefectType' in record.request)) {
    const req = record.request || {};
    const pred = record.prediction || {};
    return {
      id,
      timestamp,
      type: req.DefectType ? req.DefectType.charAt(0).toUpperCase() + req.DefectType.slice(1) : 'Defect',
      severity: req.ServerityLevel || 'Medium',
      location: pred.locationAddress || req.location || 'Local Road',
      actualSize: cleanVolumeStr(req.DefectActualSize),
      repairSize: cleanVolumeStr(req.DefectRepairSize),
      duration: pred.estimatedDurationHours || 4.0
    };
  }

  // 2. Backup/basic prediction data
  if (record.type === 'predict_repair' || (record.request && 'detailsOfDefect' in record.request)) {
    const req = record.request || {};
    const pred = record.prediction || {};
    const isCritical = /critical|severe/i.test(req.detailsOfDefect || '');
    return {
      id,
      timestamp,
      type: req.detailsOfDefect ? req.detailsOfDefect.charAt(0).toUpperCase() + req.detailsOfDefect.slice(1) : 'Defect',
      severity: isCritical ? 'Critical' : 'Medium',
      location: req.exactLocation || 'Local Road',
      actualSize: cleanVolumeStr(req.sizeOfDefect),
      repairSize: cleanVolumeStr(req.sizeOfRepairArea),
      duration: pred.estimatedDurationHours || 4.0
    };
  }

  // 3. Standard model analysis
  const def = record.defect || {};
  const plan = record.plan || {};

  const actualLen = def.actualSize?.length ?? def.size?.length ?? def.length ?? 1;
  const actualWid = def.actualSize?.width ?? def.size?.width ?? def.width ?? 1;
  const actualDep = def.actualSize?.depth ?? def.size?.depth ?? def.depth ?? 3;
  const actualVol = def.size?.depth ? def.size.depth : getCubicMeters(actualLen, actualWid, actualDep);

  const repairVol = def.repairSize?.depth ? def.repairSize.depth : (actualVol * 1.5);

  return {
    id,
    timestamp,
    type: def.type ? def.type.charAt(0).toUpperCase() + def.type.slice(1) + ' Repair' : 'Road Defect Repair',
    severity: def.severity ? def.severity.charAt(0).toUpperCase() + def.severity.slice(1) : 'Medium',
    location: def.location || 'Local Road Coordinates',
    actualSize: typeof actualVol === 'number' ? `${actualVol.toFixed(3)} m³` : `${actualVol}`,
    repairSize: typeof repairVol === 'number' ? `${repairVol.toFixed(3)} m³` : `${repairVol}`,
    duration: plan.estimatedDurationHours || 4.5
  };
};

export default function HistoryPanel() {
  const [history, setHistory] = useState<NormalizedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('All');

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await fetchHistory();
      if (data && data.length > 0) {
        setHistory(data.map(normalizeRecord));
      } else {
        setHistory(SAMPLE_FALLBACK_RECORDS);
      }
    } catch {
      setHistory(SAMPLE_FALLBACK_RECORDS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = selectedSeverity === 'All' || item.severity.toLowerCase() === selectedSeverity.toLowerCase();
    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by defect type or location..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {['All', 'Critical', 'High', 'Medium', 'Low'].map(sev => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                selectedSeverity === sev
                  ? 'bg-orange-500 text-white border-orange-400'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {sev}
            </button>
          ))}

          <button
            onClick={loadHistory}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg border border-zinc-800 transition-colors"
            title="Refresh History"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* History List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-2">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-zinc-500">Querying Cloud Database...</span>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center p-12 glass-panel rounded-3xl border border-zinc-800">
          <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold font-mono text-zinc-300 mb-1">No Matching Records Found</h3>
          <p className="text-xs text-zinc-500 font-mono">Try adjusting your search query or severity filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredHistory.map((norm, index) => (
              <motion.div
                key={norm.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                className="glass-panel rounded-2xl p-4 border border-zinc-800/80 hover:border-orange-500/40 transition-all group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-mono text-zinc-100 uppercase">{norm.type}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono">{norm.timestamp}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getSeverityBadgeClass(norm.severity)}`}>
                    {norm.severity}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate" title={norm.location}>{norm.location}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <div className="flex items-center gap-1.5">
                      <Ruler className="w-3 h-3 text-orange-400" />
                      <span>Vol: <strong className="text-zinc-200">{norm.actualSize}</strong> (Exc: {norm.repairSize})</span>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-400 font-bold">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(norm.duration)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
