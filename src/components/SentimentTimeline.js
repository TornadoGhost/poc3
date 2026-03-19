'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const lines = [
  { key: 'Positive', color: '#10b981' },
  { key: 'Neutral', color: '#64748b' },
  { key: 'Negative', color: '#ef4444' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xl">
      <p className="text-xs font-medium text-slate-900 mb-2">{label} <span className="text-slate-400">({total} posts)</span></p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500">{entry.name}</span>
          </div>
          <span className="text-slate-900 font-medium">{entry.value} <span className="text-slate-400">({total > 0 ? Math.round(entry.value / total * 100) : 0}%)</span></span>
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
  return points.map(d => ({ date: d, Positive: 0, Neutral: 0, Negative: 0, _yMax: 50 }));
}

export default function SentimentTimeline({ data, dateFrom, dateTo }) {
  const [visible, setVisible] = useState({ Positive: true, Neutral: true, Negative: true });

  const hasData = useMemo(() => {
    const result = { Positive: false, Neutral: false, Negative: false };
    data.forEach(d => {
      if (d.Positive > 0) result.Positive = true;
      if (d.Neutral > 0) result.Neutral = true;
      if (d.Negative > 0) result.Negative = true;
    });
    return result;
  }, [data]);

  const isEmpty = data.length === 0 || lines.every(l => !hasData[l.key]);
  const chartData = isEmpty ? buildEmptyData(dateFrom, dateTo) : data;
  const tickInterval = Math.max(1, Math.floor(chartData.length / 8)) - 1;

  function toggle(key) {
    if (!hasData[key]) return;
    setVisible(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 5, right: 40, left: -10, bottom: 5 }}>
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
            <Line type="monotone" dataKey="_yMax" stroke="transparent" dot={false} />
          )}
          {!isEmpty && lines.map(l => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: l.color }}
              hide={!visible[l.key] || !hasData[l.key]}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {!isEmpty && (
        <div className="flex items-center justify-center gap-4 mt-2">
          {lines.map(l => (
            <button
              key={l.key}
              onClick={() => toggle(l.key)}
              disabled={!hasData[l.key]}
              className={`flex items-center gap-1.5 text-xs transition-opacity ${
                !hasData[l.key]
                  ? 'opacity-20 cursor-default'
                  : visible[l.key] ? 'opacity-100 cursor-pointer' : 'opacity-40 cursor-pointer'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-slate-400">{l.key}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
