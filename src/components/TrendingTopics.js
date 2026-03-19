'use client';

import { TrendingUp, TrendingDown, Flame } from 'lucide-react';

export default function TrendingTopics({ data }) {
  const maxVolume = Math.max(...data.map(d => d.volume));

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={item.id} className="flex items-center gap-3 group">
          <span className={`w-6 text-xs font-bold text-right ${i < 3 ? 'text-amber-400' : 'text-slate-600'}`}>
            {i < 3 ? <Flame className="w-4 h-4 inline" /> : `#${i + 1}`}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-800 truncate font-medium">{item.topic}</span>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <span className="text-xs text-slate-500">{item.volume} posts</span>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${item.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {item.momentum}
                </span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(item.volume / maxVolume) * 100}%`,
                  background: i < 3
                    ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                    : '#cbd5e1',
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
