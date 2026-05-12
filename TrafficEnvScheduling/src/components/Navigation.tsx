/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Construction, Activity, Settings, User } from 'lucide-react';

export default function Navigation() {
  return (
    <nav className="h-full w-20 flex flex-col items-center py-8 bg-zinc-950 border-r border-zinc-800 shrink-0">
      <div className="p-3 bg-orange-500 rounded-xl mb-12 shadow-lg shadow-orange-500/20">
        <Construction className="w-6 h-6 text-white" />
      </div>
      
      <div className="flex flex-col gap-8 flex-1">
        <NavItem icon={<Activity className="w-5 h-5" />} active />
        <NavItem icon={<Settings className="w-5 h-5" />} />
        <NavItem icon={<User className="w-5 h-5" />} />
      </div>

      <div className="mt-auto">
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700" />
      </div>
    </nav>
  );
}

function NavItem({ icon, active = false }: { icon: React.ReactNode; active?: boolean }) {
  return (
    <button className={`p-3 rounded-xl transition-all ${
      active 
        ? 'bg-zinc-800 text-orange-400 shadow-inner' 
        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
    }`}>
      {icon}
    </button>
  );
}
