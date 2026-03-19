'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const columns = [
  { key: 'tweets', label: 'Posts', align: 'right' },
  { key: 'likes', label: 'Likes', align: 'right' },
  { key: 'retweets', label: 'Retweets', align: 'right' },
  { key: 'views', label: 'Views', align: 'right' },
];

export default function TopAuthors({ data }) {
  const [sortKey, setSortKey] = useState('tweets');
  const [sortDir, setSortDir] = useState('desc');

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = [...data].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === 'desc' ? -diff : diff;
  });

  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="text-xs text-slate-500 uppercase tracking-wider">
            <th className="text-left pb-3 font-medium">#</th>
            <th className="text-left pb-3 font-medium">Author</th>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="text-right pb-3 font-medium cursor-pointer select-none hover:text-slate-700 transition-colors"
              >
                <span className="inline-flex items-center gap-0.5">
                  {col.label}
                  {sortKey === col.key ? (
                    sortDir === 'desc'
                      ? <ChevronDown className="w-3 h-3 text-blue-400" />
                      : <ChevronUp className="w-3 h-3 text-blue-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-30" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((author, i) => (
            <tr key={author.author} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-2.5 text-xs text-slate-600 font-medium">{i + 1}</td>
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < 3 ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {author.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-600">@{author.author}</span>
                </div>
              </td>
              <td className="py-2.5 text-right">
                <span className={`text-sm ${sortKey === 'tweets' ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>{author.tweets}</span>
              </td>
              <td className="py-2.5 text-right">
                <span className={`text-sm ${sortKey === 'likes' ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>{author.likes.toLocaleString()}</span>
              </td>
              <td className="py-2.5 text-right">
                <span className={`text-sm ${sortKey === 'retweets' ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>{author.retweets.toLocaleString()}</span>
              </td>
              <td className="py-2.5 text-right">
                <span className={`text-sm ${sortKey === 'views' ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>{author.views.toLocaleString()}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}