'use client';

import { LayoutDashboard, MessageSquare, BrainCircuit, TrendingUp, Activity } from 'lucide-react';

const navItems = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'mentions', icon: MessageSquare, label: 'Mentions' },
  { id: 'sentiment', icon: BrainCircuit, label: 'Sentiment' },
  { id: 'trends', icon: TrendingUp, label: 'Trends' },
];

export default function Sidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[72px] bg-white border-r border-[var(--card-border)] flex flex-col items-center py-6 z-50">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mb-8">
        <Activity className="w-5 h-5 text-white" />
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group relative
              ${activeSection === item.id
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
        SP
      </div>
    </aside>
  );
}
