'use client';

import { useMemo } from 'react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

export default function WordCloud({ data }) {
  const words = useMemo(() => {
    if (!data || data.length === 0) return [];
    const maxVal = data[0].value;
    const minVal = data[data.length - 1].value;
    const range = maxVal - minVal || 1;

    return data.map((w, i) => {
      const norm = (w.value - minVal) / range;
      const fontSize = 11 + norm * 24;
      const opacity = 0.45 + norm * 0.55;
      const color = COLORS[i % COLORS.length];
      return { ...w, fontSize, opacity, color };
    });
  }, [data]);

  // Shuffle for visual variety but keep it stable
  const shuffled = useMemo(() => {
    const arr = [...words];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (i * 7 + 3) % (i + 1); // deterministic shuffle
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [words]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-4 px-2 min-h-[220px]">
      {shuffled.map((w) => (
        <span
          key={w.text}
          className="inline-block transition-all duration-200 hover:scale-110 cursor-default select-none"
          style={{
            fontSize: `${w.fontSize}px`,
            color: w.color,
            opacity: w.opacity,
            fontWeight: w.fontSize > 25 ? 700 : w.fontSize > 18 ? 600 : 400,
          }}
          title={`${w.text}: ${w.value} mentions`}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
}
