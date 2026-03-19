'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Check } from 'lucide-react';

const SECTIONS = [
  { id: 'kpis', label: 'KPI Summary' },
  { id: 'mentions', label: 'Mentions Over Time' },
  { id: 'voice', label: 'Share of Voice' },
  { id: 'sentiment', label: 'Sentiment Analysis' },
  { id: 'sentimentTime', label: 'Sentiment Timeline' },
  { id: 'topics', label: 'Trending Topics' },
  { id: 'authors', label: 'Top Influencers' },
  { id: 'keywords', label: 'Keyword Cloud' },
  { id: 'raw', label: 'All Raw Posts' },
];

function buildCSV(selected, data) {
  const blocks = [];

  if (selected.kpis) {
    blocks.push('=== KPI SUMMARY ===');
    blocks.push('Metric,Value');
    blocks.push(`Total Mentions,${data.stats.totalMentions}`);
    blocks.push(`Total Reach,${data.stats.totalReach}`);
    blocks.push(`Engagement Rate,${data.stats.engagementRate}%`);
    blocks.push(`Active Authors,${data.stats.uniqueAuthors}`);
    blocks.push(`Avg Posts/Month,${data.stats.postsPerMonth}`);
    blocks.push('');
  }

  if (selected.mentions) {
    blocks.push('=== MENTIONS OVER TIME ===');
    blocks.push('Month,UAE,KSA,Qatar,Total');
    data.mentionsOverTime.forEach(m => {
      blocks.push(`${m.date},${m.UAE},${m.KSA},${m.Qatar},${m.UAE + m.KSA + m.Qatar}`);
    });
    blocks.push('');
  }

  if (selected.voice) {
    blocks.push('=== SHARE OF VOICE ===');
    blocks.push('Country,Mentions,Percentage');
    const total = data.shareOfVoice.reduce((s, d) => s + d.value, 0);
    data.shareOfVoice.forEach(d => {
      blocks.push(`${d.name},${d.value},${total > 0 ? (d.value / total * 100).toFixed(1) : 0}%`);
    });
    blocks.push('');
  }

  if (selected.sentiment) {
    blocks.push('=== SENTIMENT ANALYSIS ===');
    blocks.push('Sentiment,Count,Percentage');
    const total = data.sentimentData.reduce((s, d) => s + d.value, 0);
    data.sentimentData.forEach(d => {
      blocks.push(`${d.name},${d.value},${total > 0 ? (d.value / total * 100).toFixed(1) : 0}%`);
    });
    blocks.push('');
  }

  if (selected.sentimentTime) {
    blocks.push('=== SENTIMENT TIMELINE ===');
    blocks.push('Month,Positive,Neutral,Negative');
    data.sentimentOverTime.forEach(m => {
      blocks.push(`${m.date},${m.Positive},${m.Neutral},${m.Negative}`);
    });
    blocks.push('');
  }

  if (selected.topics) {
    blocks.push('=== TRENDING TOPICS ===');
    blocks.push('Rank,Topic,Volume,Engagement,Momentum,Trend');
    data.trendingTopics.forEach((t, i) => {
      blocks.push(`${i + 1},"${t.topic}",${t.volume},${t.engagement},${t.momentum},${t.trend}`);
    });
    blocks.push('');
  }

  if (selected.authors) {
    blocks.push('=== TOP INFLUENCERS ===');
    blocks.push('Rank,Author,Posts,Likes,Retweets,Views');
    data.topAuthors.forEach((a, i) => {
      blocks.push(`${i + 1},@${a.author},${a.tweets},${a.likes},${a.retweets},${a.views}`);
    });
    blocks.push('');
  }

  if (selected.keywords) {
    blocks.push('=== KEYWORD CLOUD ===');
    blocks.push('Keyword,Frequency');
    data.wordCloud.forEach(w => {
      blocks.push(`"${w.text}",${w.value}`);
    });
    blocks.push('');
  }

  if (selected.raw) {
    blocks.push('=== RAW POSTS ===');
    blocks.push('Date,Author,Country,Sentiment,Likes,Retweets,Replies,Views,Text');
    data.rawTweets.forEach(t => {
      blocks.push(`${t.date_published},${t.author},${t.country},${t.sentiment},${t.likes_count},${t.retweets_count},${t.replies_count},${t.views_count},"${(t.post_text || '').replace(/"/g, '""')}"`);
    });
    blocks.push('');
  }

  return blocks.join('\n');
}

export default function ExportMenu({ data, activeCountry, dateFrom, dateTo }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState({
    kpis: true, mentions: true, voice: true, sentiment: true,
    sentimentTime: false, topics: true, authors: true, keywords: false, raw: false,
  });
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggle(id) {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function selectAll() {
    const allOn = SECTIONS.every(s => selected[s.id]);
    const val = !allOn;
    const next = {};
    SECTIONS.forEach(s => { next[s.id] = val; });
    setSelected(next);
  }

  function handleDownload() {
    const hasAny = SECTIONS.some(s => selected[s.id]);
    if (!hasAny) return;

    const csv = buildCSV(selected, data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-pulse_${activeCountry.replace(/\s/g, '-')}_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  const selectedCount = SECTIONS.filter(s => selected[s.id]).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-emerald-400 border border-[var(--card-border)] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>

      {open && (
        <div className="absolute top-10 right-0 w-64 bg-white border border-[var(--card-border)] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--card-border)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-900">Export Data</p>
              <button onClick={selectAll} className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                {SECTIONS.every(s => selected[s.id]) ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-0.5">{activeCountry} · {dateFrom} — {dateTo}</p>
          </div>

          <div className="p-2 max-h-[280px] overflow-y-auto">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                  selected[s.id] ? 'text-slate-900 bg-slate-50' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  selected[s.id] ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                }`}>
                  {selected[s.id] && <Check className="w-3 h-3 text-white" />}
                </div>
                {s.label}
              </button>
            ))}
          </div>

          <div className="px-3 py-2.5 border-t border-[var(--card-border)]">
            <button
              onClick={handleDownload}
              disabled={selectedCount === 0}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV ({selectedCount} {selectedCount === 1 ? 'section' : 'sections'})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
