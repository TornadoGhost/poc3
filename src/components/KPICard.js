'use client';

import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function KPICard({ label, value, trend, trendLabel, icon: Icon, businessValue }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipSide, setTooltipSide] = useState('right');
  const btnRef = useRef(null);
  const isPositive = trend === 'up';

  useEffect(() => {
    if (showTooltip && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceLeft = rect.left - 72;
      setTooltipSide(spaceLeft < 280 ? 'extend-right' : 'extend-left');
    }
  }, [showTooltip]);

  return (
    <div className={`card-glass p-5 relative group ${showTooltip ? 'tooltip-open' : ''}`}>
      {/* Title row: label + info button */}
      <div className="flex items-center gap-1.5 mb-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        {businessValue && (
          <div className="relative">
            <button
              ref={btnRef}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400/50 transition-colors"
            >
              <Info className="w-2.5 h-2.5" />
            </button>
            {showTooltip && (
              <div className={`absolute top-7 w-64 bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-600 leading-relaxed z-50 shadow-xl ${tooltipSide === 'extend-right' ? 'left-0' : 'right-0'}`}>
                <p className="text-blue-400 font-medium mb-1">Business Value</p>
                {businessValue}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Value + icon row */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {trendLabel && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendLabel}
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-400" />
          </div>
        )}
      </div>
    </div>
  );
}