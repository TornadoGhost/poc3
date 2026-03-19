'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xl">
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.payload.color }} />
        <span className="text-slate-500">{d.name}</span>
        <span className="text-slate-900 font-bold ml-2">{d.value} posts</span>
      </div>
    </div>
  );
}

export default function SentimentDonut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center">
      <div className="relative w-full sm:w-[60%] h-[220px] sm:h-[280px]">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-slate-500">Total Posts</span>
          <span className="text-2xl font-bold text-slate-900">{total.toLocaleString()}</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 w-full sm:w-auto space-y-3">
        {data.map((item) => {
          const pct = Math.round(item.value / total * 100);
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-600">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900">{item.value.toLocaleString()}</span>
                <span className="text-xs text-slate-500 ml-1">({pct}%)</span>
              </div>
            </div>
          );
        })}

        {(() => {
          const posPct = Math.round((data.find(d => d.name === 'Positive')?.value || 0) / total * 100);
          const negPct = Math.round((data.find(d => d.name === 'Negative')?.value || 0) / total * 100);
          const neuPct = Math.round((data.find(d => d.name === 'Neutral')?.value || 0) / total * 100);

          let tone, color, reason;
          if (negPct >= 30) {
            tone = 'Concerning';
            color = 'text-red-400';
            reason = `${negPct}% negative mentions detected — requires attention and response strategy`;
          } else if (negPct >= 15) {
            tone = 'Mixed';
            color = 'text-amber-400';
            reason = `${posPct}% positive vs ${negPct}% negative — sentiment is split, monitor closely`;
          } else if (posPct >= 40) {
            tone = 'Positive';
            color = 'text-emerald-400';
            reason = `${posPct}% positive with only ${negPct}% negative — audience perception is favorable`;
          } else if (neuPct >= 50) {
            tone = 'Neutral';
            color = 'text-slate-400';
            reason = `${neuPct}% neutral mentions dominate — audience is aware but not strongly opinionated`;
          } else {
            tone = 'Positive';
            color = 'text-emerald-400';
            reason = `${posPct}% positive and ${negPct}% negative — overall sentiment leans favorable`;
          }

          return (
            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-500">Overall Tone</p>
              <p className={`text-lg font-bold ${color}`}>{tone}</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{reason}</p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
