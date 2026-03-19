'use client';

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
