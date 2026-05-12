import React, { useEffect, useState } from 'react';
import { fetchHistory } from '../services/geminiService';
import { motion } from 'motion/react';
import { Clock, MapPin, Ruler, Activity } from 'lucide-react';

export default function HistoryPanel() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      const data = await fetchHistory();
      setHistory(data);
      setIsLoading(false);
    };
    loadHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center p-12 bg-zinc-900/50 rounded-3xl border border-zinc-800">
        <Clock className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-zinc-400 mb-1">No Historical Records</h3>
        <p className="text-sm text-zinc-600">Complete an analysis to see historical records here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((record, index) => (
        <motion.div
          key={record._id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 hover:border-orange-500/30 transition-all group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100">{record.defect.type}</h4>
                <p className="text-[10px] text-zinc-500 font-mono">{new Date(record.timestamp).toLocaleString()}</p>
              </div>
            </div>
            <div className="px-2 py-1 bg-zinc-800 rounded text-[9px] font-mono text-orange-400 uppercase">
              {record.defect.severity}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-zinc-800/50 pt-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[10px] text-zinc-400 truncate max-w-[120px]">{record.defect.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[10px] text-zinc-400">{record.defect.length}m x {record.defect.width}m</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[10px] text-zinc-400">{record.plan.estimatedDurationHours} Hrs</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
