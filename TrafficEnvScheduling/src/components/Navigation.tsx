import React, { useState } from 'react';
import { 
  Construction, 
  LayoutDashboard, 
  Camera, 
  CloudRain, 
  Activity, 
  Calendar, 
  GitPullRequest, 
  BarChart3, 
  TrendingUp, 
  Award, 
  History, 
  Terminal,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Sparkles,
  Layers,
  Radio
} from 'lucide-react';
import { NavigationTab } from '../types';

interface NavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Navigation({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse
}: NavigationProps) {
  const navSections = [
    {
      title: 'Operations',
      items: [
        { id: 'plan' as NavigationTab, label: 'Active Planning', icon: LayoutDashboard, badge: 'Core' },
        { id: 'citizen' as NavigationTab, label: 'Citizen Ingestion', icon: Camera, badge: 'Live' },
      ]
    },
    {
      title: 'Intelligence Engines',
      items: [
        { id: 'weather' as NavigationTab, label: 'Weather & Curing', icon: CloudRain },
        { id: 'traffic' as NavigationTab, label: 'Traffic & YOLO Vision', icon: Activity },
        { id: 'scheduling' as NavigationTab, label: 'Scheduling & Pareto', icon: Calendar },
        { id: 'routing' as NavigationTab, label: 'Routing & Detours', icon: GitPullRequest },
      ]
    },
    {
      title: 'Evaluation & Research',
      items: [
        { id: 'evaluation' as NavigationTab, label: 'Monte Carlo (10k)', icon: BarChart3 },
        { id: 'analytics' as NavigationTab, label: 'System Analytics', icon: TrendingUp },
        { id: 'compliance' as NavigationTab, label: 'Research Compliance', icon: Award },
        { id: 'history' as NavigationTab, label: 'Cloud History Logs', icon: History },
        { id: 'tester' as NavigationTab, label: 'External API Tester', icon: Terminal },
      ]
    }
  ];

  return (
    <aside
      className={`h-auto md:h-screen flex flex-col bg-zinc-950 border-r border-zinc-800/80 shrink-0 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'md:w-20' : 'md:w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 md:p-5 flex items-center justify-between border-b border-zinc-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Construction className="w-5 h-5 text-orange-400" />
            </div>
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-mono font-extrabold text-sm tracking-wider text-zinc-100 uppercase truncate">
                ROAD INSPECTOR
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest truncate">
                Intelligent Repair AI
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {section.title}
              </div>
            )}

            <div className="space-y-1">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono transition-all group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-400 border border-orange-500/40 font-bold shadow-md shadow-orange-500/10'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {/* Active Left indicator pill */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-orange-500 rounded-r" />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-orange-400' : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}
                    />

                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between truncate">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase tracking-tighter ${
                              isActive
                                ? 'bg-orange-500/30 text-orange-300 border border-orange-500/40'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status Strip */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/80">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-mono text-zinc-300 uppercase truncate font-bold">
                FastAPI v2.4 + ML Engine
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase truncate">
                Port 8002 • Connected
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
