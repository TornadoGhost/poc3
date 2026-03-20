'use client';

import { useMemo, useState, useRef } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getColor(value, max) {
  if (value === 0) return 'bg-slate-100';
  const ratio = value / max;
  if (ratio > 0.75) return 'bg-blue-500';
  if (ratio > 0.5) return 'bg-blue-500/70';
  if (ratio > 0.25) return 'bg-blue-500/40';
  return 'bg-blue-500/20';
}

export default function EngagementHeatmap({ data }) {
  const { months, grid, max } = useMemo(() => {
    const monthSet = new Set();
    const map = {};
    let maxVal = 0;

    data.forEach(d => {
      monthSet.add(d.month);
      const key = `${d.month}|${d.day}`;
      map[key] = d.count;
      if (d.count > maxVal) maxVal = d.count;
    });

    const sortedMonths = [...monthSet].sort();
    return { months: sortedMonths, grid: map, max: maxVal };
  }, [data]);

  const [hovered, setHovered] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  if (months.length === 0) return <p className="text-xs text-slate-600 text-center py-8">No data for selected range</p>;

  const displayMonths = months.length > 24 ? months.slice(-24) : months;

  const handleMouseEnter = (cellKey, e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const cellRect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: cellRect.left - rect.left + cellRect.width / 2,
      y: cellRect.top - rect.top - 8,
    });
    setHovered(cellKey);
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px] relative" ref={containerRef}>
        {/* Tooltip */}
        {hovered && (
          <div
            style={{
              position: 'absolute',
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: 'translate(-50%, -100%)',
              zIndex: 50,
              pointerEvents: 'none',
            }}
            className="bg-white border border-slate-200 text-slate-900 text-[11px] px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap"
          >
            <span className="font-medium">{hovered.split('|')[0]}, {hovered.split('|')[1]}</span>
            <span className="text-slate-400 ml-1.5">—</span>
            <span className="text-blue-400 font-semibold ml-1.5">{grid[hovered] || 0} posts</span>
          </div>
        )}

        {/* Month labels */}
        <div className="flex mb-1">
          <div className="w-10 shrink-0" />
          <div className="flex gap-[3px]">
            {displayMonths.map((m, i) => {
              const step = Math.max(1, Math.floor(displayMonths.length / 8));
              const show = i % step === 0;
              return (
                <div key={m} style={{ width: '14px', minWidth: '14px' }}>
                  {show ? (
                    <span className="text-[9px] text-slate-600 whitespace-nowrap">{m.substring(2)}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid rows */}
        {DAYS.map(day => (
          <div key={day} className="flex items-center mb-[3px]">
            <div className="w-10 shrink-0 text-[10px] text-slate-600 text-right pr-2">{day}</div>
            <div className="flex gap-[3px]">
              {displayMonths.map(month => {
                const cellKey = `${month}|${day}`;
                const val = grid[cellKey] || 0;
                const isHovered = hovered === cellKey;
                return (
                  <div
                    key={cellKey}
                    className={`aspect-square rounded-sm ${getColor(val, max)} transition-all duration-150`}
                    style={{
                      width: '14px',
                      minWidth: '14px',
                      cursor: 'pointer',
                      outline: isHovered ? '2px solid rgba(255,255,255,0.6)' : 'none',
                      outlineOffset: '-1px',
                      filter: isHovered ? 'brightness(1.4)' : 'none',
                      transform: isHovered ? 'scale(1.15)' : 'none',
                      zIndex: isHovered ? 10 : 'auto',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => handleMouseEnter(cellKey, e)}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-3 pr-1">
          <span className="text-[10px] text-slate-600">Less</span>
          <div className="w-3 h-3 rounded-sm bg-slate-100" />
          <div className="w-3 h-3 rounded-sm bg-blue-500/20" />
          <div className="w-3 h-3 rounded-sm bg-blue-500/40" />
          <div className="w-3 h-3 rounded-sm bg-blue-500/70" />
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-[10px] text-slate-600">More</span>
        </div>
      </div>
    </div>
  );
}
