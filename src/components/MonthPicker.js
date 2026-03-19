'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function parseYM(val) {
  const [y, m] = val.split('-').map(Number);
  return { year: y, month: m };
}

function formatYM(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function formatDisplay(val) {
  const { year, month } = parseYM(val);
  return `${MONTH_FULL[month - 1]} ${year}`;
}

export default function MonthPicker({ value, min, max, onChange, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const { year: valYear } = parseYM(value);
  const [viewYear, setViewYear] = useState(valYear);
  const ref = useRef(null);

  const minParsed = parseYM(min);
  const maxParsed = parseYM(max);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open) setViewYear(parseYM(value).year);
  }, [open]);

  function isDisabled(year, month) {
    const ym = year * 100 + month;
    return ym < minParsed.year * 100 + minParsed.month || ym > maxParsed.year * 100 + maxParsed.month;
  }

  function isSelected(year, month) {
    const { year: vy, month: vm } = parseYM(value);
    return year === vy && month === vm;
  }

  function handleSelect(month) {
    if (isDisabled(viewYear, month)) return;
    onChange(formatYM(viewYear, month));
    setOpen(false);
  }

  const canPrevYear = viewYear > minParsed.year;
  const canNextYear = viewYear < maxParsed.year;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-slate-400 hover:text-blue-400 transition-colors whitespace-nowrap"
      >
        {formatDisplay(value)}
      </button>

      {open && (
        <div className={`absolute top-8 ${align === 'right' ? 'right-0' : 'left-0'} w-56 bg-white border border-[var(--card-border)] rounded-xl shadow-2xl z-50 p-3`}>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => canPrevYear && setViewYear(viewYear - 1)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${canPrevYear ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-300'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-900">{viewYear}</span>
            <button
              onClick={() => canNextYear && setViewYear(viewYear + 1)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${canNextYear ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-300'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m, i) => {
              const month = i + 1;
              const disabled = isDisabled(viewYear, month);
              const selected = isSelected(viewYear, month);
              return (
                <button
                  key={m}
                  onClick={() => handleSelect(month)}
                  disabled={disabled}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                    ${selected
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : disabled
                        ? 'text-slate-700 cursor-default'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
