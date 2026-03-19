'use client';

import { Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Card({ title, businessValue, children, className = '' }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipSide, setTooltipSide] = useState('right');
  const btnRef = useRef(null);

  useEffect(() => {
    if (showTooltip && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceLeft = rect.left - 72; // 72px sidebar
      // If not enough space on the left for tooltip (288px), extend it to the right
      setTooltipSide(spaceLeft < 300 ? 'extend-right' : 'extend-left');
    }
  }, [showTooltip]);

  return (
    <div className={`card-glass p-5 relative ${className} ${showTooltip ? 'tooltip-open' : ''}`}>
      {title && (
        <div className="flex items-center gap-1.5 mb-4">
          <h3 className="text-sm font-medium text-slate-700">{title}</h3>
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
                <div className={`absolute top-7 w-72 bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-600 leading-relaxed z-50 shadow-xl ${tooltipSide === 'extend-right' ? 'left-0' : 'right-0'}`}>
                  <p className="text-blue-400 font-medium mb-1">Business Value</p>
                  {businessValue}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}