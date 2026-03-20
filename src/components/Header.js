'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import ExportMenu from './ExportMenu';
import DateRangePicker from './DateRangePicker';

const countries = ['All Regions', 'UAE', 'KSA', 'Qatar'];
const presets = [
  { id: '7D', label: '7D' },
  { id: '30D', label: '30D' },
  { id: '3M', label: '3M' },
  { id: '1Y', label: '1Y' },
  { id: 'ALL', label: 'All' },
];

export default function Header({ activeCountry, onCountryChange, dateFrom, dateTo, datePreset, onPresetChange, onDateRangeChange, exportData, dataMin, dataMax }) {
  const [showPresetInfo, setShowPresetInfo] = useState(false);

  return (
    <header className="h-16 border-b border-[var(--card-border)] bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Social Pulse Analytics</h1>
        <p className="text-xs text-slate-500">AI-Powered Social Intelligence Platform</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          {countries.map(c => (
            <button
              key={c}
              onClick={() => onCountryChange(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${activeCountry === c
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-500 hover:text-slate-700 border border-transparent'
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-[var(--card-border)]" />

        <div className="flex items-center gap-1">
          {presets.map(p => (
            <button
              key={p.id}
              onClick={() => onPresetChange(p.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200
                ${datePreset === p.id
                  ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                  : 'text-slate-500 hover:text-slate-700 border border-transparent'
                }`}
            >
              {p.label}
            </button>
          ))}
          <div className="relative ml-0.5">
            <button
              onMouseEnter={() => setShowPresetInfo(true)}
              onMouseLeave={() => setShowPresetInfo(false)}
              className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400/50 transition-colors"
            >
              <Info className="w-2.5 h-2.5" />
            </button>
            {showPresetInfo && (
              <div className="absolute top-7 right-0 w-72 bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-600 leading-relaxed z-50 shadow-xl">
                <p className="text-blue-400 font-medium mb-1">How date presets work</p>
                Time periods (7D, 30D, 3M, 1Y) are calculated from the most recent data available in the system, not from today's date. This ensures you always see actual data, even if new posts haven't been collected yet. Use the calendar for a custom range.
              </div>
            )}
          </div>
        </div>

        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          min={dataMin}
          max={dataMax}
          onChange={onDateRangeChange}
        />

        <ExportMenu data={exportData} activeCountry={activeCountry} dateFrom={dateFrom} dateTo={dateTo} />
      </div>
    </header>
  );
}
