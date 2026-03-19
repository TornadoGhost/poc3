'use client';

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const allAreas = [
  { key: 'UAE', color: '#3b82f6', grad: 'gradUAE' },
  { key: 'KSA', color: '#8b5cf6', grad: 'gradKSA' },
  { key: 'Qatar', color: '#10b981', grad: 'gradQatar' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xl">
      <p className="text-xs font-medium text-slate-900 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500">{entry.name}</span>
          </div>
          <span className="text-slate-900 font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function buildEmptyData(dateFrom, dateTo) {
  const daysDiff = Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000);
  const points = [];

  if (daysDiff <= 31) {
    const cur = new Date(dateFrom);
    const end = new Date(dateTo);
    while (cur <= end) {
      points.push(cur.toISOString().substring(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  } else {
    const from = dateFrom.substring(0, 7);
    const to = dateTo.substring(0, 7);
    let [y, m] = from.split('-').map(Number);
    const [ey, em] = to.split('-').map(Number);
    while (y < ey || (y === ey && m <= em)) {
      points.push(`${y}-${String(m).padStart(2, '0')}`);
      m++;
      if (m > 12) { m = 1; y++; }
    }
  }

  if (points.length === 0) points.push(dateFrom);
  if (points.length === 1) points.push(points[0]);
  return points.map(d => ({ date: d, UAE: 0, KSA: 0, Qatar: 0, _yMax: 50 }));
}

export default function MentionsChart({ data, activeCountry, dateFrom, dateTo }) {
  const isAll = activeCountry === 'All Regions';
  const areas = isAll ? allAreas : allAreas.filter(a => a.key === activeCountry);

  const [visible, setVisible] = useState({ UAE: true, KSA: true, Qatar: true });

  const hasData = useMemo(() => {
    const result = { UAE: false, KSA: false, Qatar: false };
    data.forEach(d => {
      if (d.UAE > 0) result.UAE = true;
      if (d.KSA > 0) result.KSA = true;
      if (d.Qatar > 0) result.Qatar = true;
    });
    return result;
  }, [data]);

  const isEmpty = data.length === 0 || areas.every(a => !hasData[a.key]);
  const chartData = isEmpty ? buildEmptyData(dateFrom, dateTo) : data;
  const tickInterval = Math.max(1, Math.floor(chartData.length / 8)) - 1;

  function toggle(key) {
    if (!hasData[key]) return;
    setVisible(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData} margin={{ top: 5, right: 40, left: -10, bottom: 5 }}>
          <defs>
            {areas.map(a => (
              <linearGradient key={a.grad} id={a.grad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={a.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={a.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            interval={tickInterval}
            padding={{ left: 5, right: 5 }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            domain={[0, 'auto']}
            allowDataOverflow={false}
            padding={{ bottom: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {isEmpty && (
            <Area type="monotone" dataKey="_yMax" stroke="transparent" fill="transparent" />
          )}
          {!isEmpty && areas.map(a => (
            <Area
              key={a.key}
              type="monotone"
              dataKey={a.key}
              stroke={a.color}
              fill={`url(#${a.grad})`}
              strokeWidth={2}
              hide={isAll ? !visible[a.key] || !hasData[a.key] : !hasData[a.key]}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {isAll && !isEmpty && (
        <div className="flex items-center justify-center gap-4 mt-2">
          {allAreas.map(a => (
            <button
              key={a.key}
              onClick={() => toggle(a.key)}
              disabled={!hasData[a.key]}
              className={`flex items-center gap-1.5 text-xs transition-opacity ${
                !hasData[a.key]
                  ? 'opacity-20 cursor-default'
                  : visible[a.key] ? 'opacity-100 cursor-pointer' : 'opacity-40 cursor-pointer'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
              <span className="text-slate-400">{a.key}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
