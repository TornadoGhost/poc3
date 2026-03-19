'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplay(str) {
  const [y, m, d] = str.split('-');
  return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

function CalendarMonth({ year, month, onPrev, onNext, canPrev, canNext, selectedFrom, selectedTo, min, max, onSelect }) {
  const days = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div className="w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onPrev}
          className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${canPrev ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-300'}`}
          disabled={!canPrev}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-semibold text-slate-900">{MONTHS[month]} {year}</span>
        <button
          onClick={onNext}
          className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${canNext ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-300'}`}
          disabled={!canNext}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[9px] text-slate-600 font-medium py-0.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const disabled = dateStr < min || dateStr > max;
          const isFrom = dateStr === selectedFrom;
          const isTo = dateStr === selectedTo;
          const inRange = selectedFrom && selectedTo && dateStr > selectedFrom && dateStr < selectedTo;

          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => onSelect(dateStr)}
              className={`h-7 rounded text-[11px] font-medium transition-all
                ${disabled ? 'text-slate-700 cursor-default' :
                  isFrom || isTo ? 'bg-blue-500 text-white' :
                  inRange ? 'bg-blue-50 text-blue-600' :
                  'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker({ dateFrom, dateTo, min, max, onChange }) {
  const [open, setOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState(dateFrom);
  const [tempTo, setTempTo] = useState(dateTo);
  const [leftYear, setLeftYear] = useState(() => parseInt(dateFrom.substring(0, 4)));
  const [leftMonth, setLeftMonth] = useState(() => parseInt(dateFrom.substring(5, 7)) - 1);
  const [rightYear, setRightYear] = useState(() => parseInt(dateTo.substring(0, 4)));
  const [rightMonth, setRightMonth] = useState(() => parseInt(dateTo.substring(5, 7)) - 1);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    if (open) {
      setTempFrom(dateFrom);
      setTempTo(dateTo);
      setLeftYear(parseInt(dateFrom.substring(0, 4)));
      setLeftMonth(parseInt(dateFrom.substring(5, 7)) - 1);
      setRightYear(parseInt(dateTo.substring(0, 4)));
      setRightMonth(parseInt(dateTo.substring(5, 7)) - 1);
    }
  }, [open]);

  function leftPrev() {
    if (leftMonth === 0) { setLeftYear(leftYear - 1); setLeftMonth(11); }
    else setLeftMonth(leftMonth - 1);
  }
  function leftNext() {
    if (leftMonth === 11) { setLeftYear(leftYear + 1); setLeftMonth(0); }
    else setLeftMonth(leftMonth + 1);
  }
  function rightPrev() {
    if (rightMonth === 0) { setRightYear(rightYear - 1); setRightMonth(11); }
    else setRightMonth(rightMonth - 1);
  }
  function rightNext() {
    if (rightMonth === 11) { setRightYear(rightYear + 1); setRightMonth(0); }
    else setRightMonth(rightMonth + 1);
  }

  const minYM = min.substring(0, 7);
  const maxYM = max.substring(0, 7);
  const leftYM = `${leftYear}-${String(leftMonth + 1).padStart(2, '0')}`;
  const rightYM = `${rightYear}-${String(rightMonth + 1).padStart(2, '0')}`;
  const canLeftPrev = leftYM > minYM;
  const canLeftNext = true;
  const canRightPrev = true;
  const canRightNext = rightYM < maxYM;

  function handleSelectFrom(dateStr) {
    setTempFrom(dateStr);
    if (dateStr > tempTo) setTempTo(dateStr);
  }

  function handleSelectTo(dateStr) {
    setTempTo(dateStr);
    if (dateStr < tempFrom) setTempFrom(dateStr);
  }

  function handleApply() {
    onChange(tempFrom, tempTo);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-slate-500 text-[11px] border border-[var(--card-border)] rounded-lg px-2.5 py-1.5 hover:border-blue-500/30 hover:text-blue-400 transition-all"
      >
        <CalendarDays className="w-3 h-3" />
        <span className="text-slate-400">{formatDisplay(dateFrom)}</span>
        <span className="text-slate-600">—</span>
        <span className="text-slate-400">{formatDisplay(dateTo)}</span>
      </button>

      {open && (
        <div className="absolute top-10 right-0 bg-white border border-[var(--card-border)] rounded-xl shadow-2xl z-50 p-4">
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] text-slate-500 mb-1.5 text-center">Start date</p>
              <CalendarMonth
                year={leftYear} month={leftMonth}
                onPrev={leftPrev} onNext={leftNext}
                canPrev={canLeftPrev} canNext={canLeftNext}
                selectedFrom={tempFrom} selectedTo={tempTo}
                min={min} max={max}
                onSelect={handleSelectFrom}
              />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 mb-1.5 text-center">End date</p>
              <CalendarMonth
                year={rightYear} month={rightMonth}
                onPrev={rightPrev} onNext={rightNext}
                canPrev={canRightPrev} canNext={canRightNext}
                selectedFrom={tempFrom} selectedTo={tempTo}
                min={min} max={max}
                onSelect={handleSelectTo}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--card-border)]">
            <span className="text-[10px] text-slate-500">
              {formatDisplay(tempFrom)} — {formatDisplay(tempTo)}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg text-[11px] text-slate-500 hover:text-slate-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleApply} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
