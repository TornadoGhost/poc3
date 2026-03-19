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
        <span className="text-slate-900 font-bold ml-2">{d.value}</span>
      </div>
    </div>
  );
}

export default function ShareOfVoiceChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center">
      <div className="relative w-full sm:w-[60%] h-[220px] sm:h-[280px]">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-slate-500">Total</span>
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
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-slate-600">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-900">{item.value}</span>
              <span className="text-xs text-slate-500 ml-1">({Math.round(item.value / total * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
