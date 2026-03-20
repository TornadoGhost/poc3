'use client';

import { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Card from '../components/Card';
import KPICard from '../components/KPICard';
import MentionsChart from '../components/MentionsChart';
import ShareOfVoiceChart from '../components/ShareOfVoiceChart';
import SentimentDonut from '../components/SentimentDonut';
import SentimentTimeline from '../components/SentimentTimeline';
import TrendingTopics from '../components/TrendingTopics';
import TopAuthors from '../components/TopAuthors';
import WordCloud from '../components/WordCloud';
import EngagementHeatmap from '../components/EngagementHeatmap';
import AIChat from '../components/AIChat';
import { tweetsWithSentiment, engagementStats as allStats, mentionsOverTime as allMentions, shareOfVoice as allVoice, sentimentData as allSentiment, sentimentOverTime as allSentimentTime, trendingTopics as allTopics, topAuthors as allAuthors } from '../../data/dashboardData';

function fillGaps(data, dateFrom, dateTo, useDaily, template) {
  const filled = {};
  if (useDaily) {
    const cur = new Date(dateFrom);
    const end = new Date(dateTo);
    while (cur <= end) {
      const key = cur.toISOString().substring(0, 10);
      filled[key] = { date: key, ...template };
      cur.setDate(cur.getDate() + 1);
    }
  } else {
    let [y, m] = dateFrom.substring(0, 7).split('-').map(Number);
    const [ey, em] = dateTo.substring(0, 7).split('-').map(Number);
    while (y < ey || (y === ey && m <= em)) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      filled[key] = { date: key, ...template };
      m++;
      if (m > 12) { m = 1; y++; }
    }
  }
  data.forEach(d => { filled[d.date] = d; });
  return Object.values(filled).sort((a, b) => a.date.localeCompare(b.date));
}

function pctChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function computeFiltered(tweets, country, dateFrom, dateTo) {
  let filtered = tweets;
  if (country !== 'All Regions') filtered = filtered.filter(t => t.country === country);
  if (dateFrom) filtered = filtered.filter(t => t.date_published.substring(0, 10) >= dateFrom);
  if (dateTo) filtered = filtered.filter(t => t.date_published.substring(0, 10) <= dateTo);

  // Previous period (same duration, right before current)
  const daysDiff = Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000);
  const prevTo = new Date(new Date(dateFrom).getTime() - 86400000).toISOString().substring(0, 10);
  const prevFrom = new Date(new Date(prevTo).getTime() - daysDiff * 86400000).toISOString().substring(0, 10);
  let prev = tweets;
  if (country !== 'All Regions') prev = prev.filter(t => t.country === country);
  prev = prev.filter(t => { const d = t.date_published.substring(0, 10); return d >= prevFrom && d <= prevTo; });

  const prevMentions = prev.length;
  const prevViews = prev.reduce((s, t) => s + t.views_count, 0);
  const prevLikes = prev.reduce((s, t) => s + t.likes_count, 0);
  const prevRetweets = prev.reduce((s, t) => s + t.retweets_count, 0);
  const prevReplies = prev.reduce((s, t) => s + t.replies_count, 0);
  const prevAuthors = new Set(prev.map(t => t.author)).size;
  const prevEngRate = prevViews > 0 ? parseFloat((((prevLikes + prevRetweets + prevReplies) / prevViews) * 100).toFixed(2)) : 0;

  // KPI
  const totalMentions = filtered.length;
  const totalViews = filtered.reduce((s, t) => s + t.views_count, 0);
  const totalLikes = filtered.reduce((s, t) => s + t.likes_count, 0);
  const totalRetweets = filtered.reduce((s, t) => s + t.retweets_count, 0);
  const totalReplies = filtered.reduce((s, t) => s + t.replies_count, 0);
  const uniqueAuthors = new Set(filtered.map(t => t.author)).size;
  const engagementRate = totalViews > 0 ? parseFloat((((totalLikes + totalRetweets + totalReplies) / totalViews) * 100).toFixed(2)) : 0;

  // Mentions over time — daily if range <= 31 days, monthly otherwise
  const useDaily = daysDiff <= 31;
  const timeAgg = {};
  filtered.forEach(t => {
    const key = useDaily ? t.date_published.substring(0, 10) : t.date_published.substring(0, 7);
    if (!timeAgg[key]) timeAgg[key] = { date: key, UAE: 0, KSA: 0, Qatar: 0 };
    timeAgg[key][t.country]++;
  });
  const mentionsOverTime = fillGaps(Object.values(timeAgg), dateFrom, dateTo, useDaily, { UAE: 0, KSA: 0, Qatar: 0 });

  // Share of voice
  const vc = { UAE: 0, KSA: 0, Qatar: 0 };
  filtered.forEach(t => vc[t.country]++);
  const shareOfVoice = [
    { name: 'UAE', value: vc.UAE, color: '#3b82f6' },
    { name: 'KSA', value: vc.KSA, color: '#8b5cf6' },
    { name: 'Qatar', value: vc.Qatar, color: '#10b981' },
  ].filter(d => d.value > 0);

  // Sentiment
  const sentTotals = { Positive: 0, Neutral: 0, Negative: 0 };
  filtered.forEach(t => sentTotals[t.sentiment]++);
  const sentimentData = [
    { name: 'Positive', value: sentTotals.Positive, color: '#10b981' },
    { name: 'Neutral', value: sentTotals.Neutral, color: '#64748b' },
    { name: 'Negative', value: sentTotals.Negative, color: '#ef4444' },
  ];

  // Sentiment over time — daily if range <= 31 days, monthly otherwise
  const sentAgg = {};
  filtered.forEach(t => {
    const key = useDaily ? t.date_published.substring(0, 10) : t.date_published.substring(0, 7);
    if (!sentAgg[key]) sentAgg[key] = { date: key, Positive: 0, Neutral: 0, Negative: 0 };
    sentAgg[key][t.sentiment]++;
  });
  const sentimentOverTime = fillGaps(Object.values(sentAgg), dateFrom, dateTo, useDaily, { Positive: 0, Neutral: 0, Negative: 0 });

  // Top authors
  const authorAgg = {};
  filtered.forEach(t => {
    if (!authorAgg[t.author]) authorAgg[t.author] = { tweets: 0, likes: 0, retweets: 0, views: 0 };
    authorAgg[t.author].tweets++;
    authorAgg[t.author].likes += t.likes_count;
    authorAgg[t.author].retweets += t.retweets_count;
    authorAgg[t.author].views += t.views_count;
  });
  const topAuthors = Object.entries(authorAgg).map(([author, d]) => ({ author, ...d })).sort((a, b) => b.tweets - a.tweets).slice(0, 10);

  // Trending topics
  const themeAgg = {};
  filtered.forEach(t => {
    if (t.theme) {
      if (!themeAgg[t.theme]) themeAgg[t.theme] = { volume: 0, likes: 0, retweets: 0 };
      themeAgg[t.theme].volume++;
      themeAgg[t.theme].likes += t.likes_count;
      themeAgg[t.theme].retweets += t.retweets_count;
    }
  });
  const trendingTopics = Object.entries(themeAgg).map(([topic, d], i) => ({
    id: i + 1, topic, volume: d.volume, engagement: d.likes + d.retweets,
    momentum: '+' + Math.round((d.volume / 10) + ((d.likes + d.retweets) % 20)) + '%',
    trend: d.volume > 30 ? 'up' : 'down',
  })).sort((a, b) => b.volume - a.volume);

  // Word cloud
  const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','this','that','these','those','it','its','i','me','my','we','our','you','your','he','she','they','them','their','what','which','who','whom','how','when','where','why','not','no','so','if','as','up','out','about','into','over','after','all','also','than','more','just','only','very','too','such','new','via','amp','rt','https','http','com','co','www','twitter']);
  const wordFreq = {};
  filtered.forEach(t => {
    if (!t.post_text) return;
    t.post_text.toLowerCase().replace(/https?:\/\/\S+/g, '').replace(/[^a-zA-Z\u0600-\u06FF#@\s]/g, '').split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w.replace(/^[#@]/, '')))
      .forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  });
  const wordCloud = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 50).map(([text, value]) => ({ text, value }));

  // Extra stats for section KPIs
  const uniqueMonths = new Set(filtered.map(t => t.date_published.substring(0, 7))).size;
  const postsPerMonth = uniqueMonths > 0 ? Math.round(totalMentions / uniqueMonths) : 0;

  const countryCounts = {};
  filtered.forEach(t => { countryCounts[t.country] = (countryCounts[t.country] || 0) + 1; });
  const topMarket = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0];
  const topMarketName = topMarket ? topMarket[0] : '—';

  const totalSent = sentTotals.Positive + sentTotals.Neutral + sentTotals.Negative;
  const positivePct = totalSent > 0 ? Math.round((sentTotals.Positive / totalSent) * 100) : 0;
  const neutralPct = totalSent > 0 ? Math.round((sentTotals.Neutral / totalSent) * 100) : 0;
  const negativePct = totalSent > 0 ? Math.round((sentTotals.Negative / totalSent) * 100) : 0;
  const sentimentScore = totalSent > 0 ? Math.round(((sentTotals.Positive - sentTotals.Negative) / totalSent + 1) / 2 * 100) : 50;

  // Heatmap: month × day-of-week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const heatmapAgg = {};
  filtered.forEach(t => {
    const d = new Date(t.date_published);
    const month = t.date_published.substring(0, 7);
    const day = dayNames[d.getDay()];
    const key = `${month}|${day}`;
    heatmapAgg[key] = (heatmapAgg[key] || 0) + 1;
  });
  const heatmapData = Object.entries(heatmapAgg).map(([k, count]) => {
    const [month, day] = k.split('|');
    return { month, day, count };
  });

  const totalTopics = trendingTopics.length;
  const hottestTheme = trendingTopics.length > 0 ? trendingTopics[0].topic : '—';
  const avgEngPerTopic = totalTopics > 0 ? Math.round(trendingTopics.reduce((s, t) => s + t.engagement, 0) / totalTopics) : 0;

  // Trends vs previous period
  const trends = {
    mentions: pctChange(totalMentions, prevMentions),
    reach: pctChange(totalViews, prevViews),
    engagement: pctChange(engagementRate * 100, prevEngRate * 100),
    authors: pctChange(uniqueAuthors, prevAuthors),
  };

  return {
    stats: { totalMentions, totalReach: totalViews, totalLikes, totalRetweets, engagementRate, uniqueAuthors,
      postsPerMonth, topMarketName, positivePct, neutralPct, negativePct, positiveCount: sentTotals.Positive, neutralCount: sentTotals.Neutral, negativeCount: sentTotals.Negative, sentimentScore,
      totalTopics, hottestTheme, avgEngPerTopic, trends },
    mentionsOverTime, shareOfVoice, sentimentData, sentimentOverTime, topAuthors, trendingTopics, wordCloud, heatmapData, rawTweets: filtered,
  };
}

export default function Home() {
  const [activeCountry, setActiveCountry] = useState('All Regions');
  const [activeSection, setActiveSection] = useState('overview');
  const [DATA_MIN, DATA_MAX] = useMemo(() => {
    const dates = tweetsWithSentiment.map(t => t.date_published.substring(0, 10)).sort();
    return [dates[0], dates[dates.length - 1]];
  }, []);
  const [datePreset, setDatePreset] = useState('ALL');
  const [dateFrom, setDateFrom] = useState(() => {
    const dates = tweetsWithSentiment.map(t => t.date_published.substring(0, 10)).sort();
    return dates[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    const dates = tweetsWithSentiment.map(t => t.date_published.substring(0, 10)).sort();
    return dates[dates.length - 1];
  });

  function applyPreset(preset) {
    setDatePreset(preset);
    const end = new Date(DATA_MAX);
    let start;
    if (preset === '7D') {
      start = new Date(end); start.setDate(start.getDate() - 7);
    } else if (preset === '30D') {
      start = new Date(end); start.setDate(start.getDate() - 30);
    } else if (preset === '3M') {
      start = new Date(end); start.setMonth(start.getMonth() - 3);
    } else if (preset === '1Y') {
      start = new Date(end); start.setFullYear(start.getFullYear() - 1);
    } else {
      setDateFrom(DATA_MIN);
      setDateTo(DATA_MAX);
      return;
    }
    setDateFrom(start.toISOString().substring(0, 10));
    setDateTo(DATA_MAX);
  }

  function handleDateRangeChange(from, to) {
    setDateFrom(from);
    setDateTo(to);
    setDatePreset(null);
  }

  const data = useMemo(() => computeFiltered(tweetsWithSentiment, activeCountry, dateFrom, dateTo), [activeCountry, dateFrom, dateTo]);

  const t = data.stats.trends;
  function trendProps(pct) {
    if (datePreset === 'ALL') return {};
    if (pct === 0) return { trend: 'up', trendLabel: 'No change vs prev. period' };
    const sign = pct > 0 ? '+' : '';
    return { trend: pct >= 0 ? 'up' : 'down', trendLabel: `${sign}${pct}% vs prev. period` };
  }

  const showSection = (section) => activeSection === 'overview' || activeSection === section;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="ml-[72px]">
        <Header activeCountry={activeCountry} onCountryChange={setActiveCountry} dateFrom={dateFrom} dateTo={dateTo} datePreset={datePreset} onPresetChange={applyPreset} onDateRangeChange={handleDateRangeChange} exportData={data} dataMin={DATA_MIN} dataMax={DATA_MAX} />

        <main className="p-6" key={activeCountry + activeSection + dateFrom + dateTo}>
          {/* KPI Row — section-specific */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {activeSection === 'overview' && (<>
              <div className="animate-fade-in animate-fade-in-delay-1">
                <KPICard label="Total Mentions" value={data.stats.totalMentions.toLocaleString()} {...trendProps(t.mentions)} businessValue="Tracks overall brand visibility across social channels." />
              </div>
              <div className="animate-fade-in animate-fade-in-delay-2">
                <KPICard label="Total Reach" value={data.stats.totalReach >= 1000000 ? (data.stats.totalReach / 1000000).toFixed(1) + 'M' : data.stats.totalReach.toLocaleString()} {...trendProps(t.reach)} businessValue="Measures potential audience exposure." />
              </div>
              <div className="animate-fade-in animate-fade-in-delay-3">
                <KPICard label="Engagement Rate" value={data.stats.engagementRate + '%'} {...trendProps(t.engagement)} businessValue="Key indicator of content resonance." />
              </div>
              <div className="animate-fade-in animate-fade-in-delay-4">
                <KPICard label="Active Authors" value={data.stats.uniqueAuthors.toLocaleString()} {...trendProps(t.authors)} businessValue="Broad author base indicates organic spread." />
              </div>
            </>)}

            {activeSection === 'mentions' && (<>
              <div className="animate-fade-in animate-fade-in-delay-1">
                <KPICard label="Total Mentions" value={data.stats.totalMentions.toLocaleString()} {...trendProps(t.mentions)} businessValue="Overall volume of brand conversations." />
              </div>
              <div className="animate-fade-in animate-fade-in-delay-2">
                <KPICard label="Total Reach" value={data.stats.totalReach >= 1000000 ? (data.stats.totalReach / 1000000).toFixed(1) + 'M' : data.stats.totalReach.toLocaleString()} {...trendProps(t.reach)} businessValue="Potential audience exposed to brand mentions." />
              </div>
              <div className="animate-fade-in animate-fade-in-delay-3">
                <KPICard label="Avg Posts/Month" value={data.stats.postsPerMonth.toLocaleString()} {...trendProps(t.mentions)} businessValue="Tracks sustained conversation frequency over time." />
              </div>
              <div className="animate-fade-in animate-fade-in-delay-4">
                {activeCountry === 'All Regions'
                  ? <KPICard label="Top Market" value={data.stats.topMarketName} trend="up" trendLabel="Highest volume region" businessValue="Identifies the market driving the most conversation." />
                  : <KPICard label="Engagement Rate" value={data.stats.engagementRate + '%'} {...trendProps(t.engagement)} businessValue="Key indicator of content resonance." />
                }
              </div>
            </>)}

            {activeSection === 'sentiment' && (<>
              <div className="animate-fade-in animate-fade-in-delay-1">
                <KPICard label="Positive" value={data.stats.positivePct + '%'} trend="up" trendLabel="Favorable mentions" businessValue="Share of conversations with positive brand perception." />
              </div>
              <div className="animate-fade-in animate-fade-in-delay-2">
                <KPICard label="Neutral" value={data.stats.neutralPct + '%'} trend="up" trendLabel="Informational mentions" businessValue="Factual or neutral brand references." />
              </div>
              <div className="animate-fade-in animate-fade-in-delay-3">
                <KPICard label="Negative" value={data.stats.negativePct + '%'} trend={data.stats.negativePct > 20 ? 'down' : 'up'} trendLabel={data.stats.negativePct > 20 ? 'Requires attention' : 'Within safe range'} businessValue="Critical for early crisis detection." />
              </div>
              <div className="animate-fade-in animate-fade-in-delay-4">
                <KPICard label="Sentiment Score" value={data.stats.sentimentScore + '/100'} trend={data.stats.sentimentScore >= 50 ? 'up' : 'down'} trendLabel={data.stats.sentimentScore >= 60 ? 'Healthy brand perception' : 'Needs monitoring'} businessValue="Composite score — above 60 indicates strong brand health." />
              </div>
            </>)}

            {activeSection === 'trends' && (<>
              <div className="animate-fade-in animate-fade-in-delay-1">
                <KPICard label="Total Topics" value={data.stats.totalTopics.toString()} {...trendProps(t.mentions)} businessValue="Breadth of topics being discussed." />
              </div>
              <div className="animate-fade-in animate-fade-in-delay-2">
                <KPICard label="Hottest Theme" value={data.stats.hottestTheme} trend="up" trendLabel="Highest volume topic" businessValue="The dominant narrative in current conversations." />
              </div>
              <div className="animate-fade-in animate-fade-in-delay-3">
                <KPICard label="Active Authors" value={data.stats.uniqueAuthors.toLocaleString()} {...trendProps(t.authors)} businessValue="Number of unique voices driving trends." />
              </div>
              <div className="animate-fade-in animate-fade-in-delay-4">
                <KPICard label="Avg Engagement/Topic" value={data.stats.avgEngPerTopic.toLocaleString()} {...trendProps(t.engagement)} businessValue="Measures how much each topic resonates with the audience." />
              </div>
            </>)}
          </div>

          {/* Mentions: Mentions Over Time + Share of Voice */}
          {showSection('mentions') && (<>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="animate-fade-in animate-fade-in-delay-3">
                <Card title="Mentions Over Time" businessValue="Track mention velocity to identify emerging trends and PR opportunities across key markets.">
                  <MentionsChart data={data.mentionsOverTime} activeCountry={activeCountry} dateFrom={dateFrom} dateTo={dateTo} />
                </Card>
              </div>
              <div className="animate-fade-in animate-fade-in-delay-4">
                <Card title="Share of Voice" businessValue="Understand market share of conversation to allocate regional marketing budgets effectively.">
                  <ShareOfVoiceChart data={data.shareOfVoice} />
                </Card>
              </div>
            </div>
          </>)}

          {/* Sentiment: Heatmap + Word Cloud, Donut + Timeline */}
          {showSection('sentiment') && (<>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="animate-fade-in animate-fade-in-delay-4">
                <Card title="Activity Heatmap" businessValue="Reveals when your audience is most active — optimize posting schedules to maximize reach and engagement.">
                  <EngagementHeatmap data={data.heatmapData} />
                </Card>
              </div>
              <div className="animate-fade-in animate-fade-in-delay-4">
                <Card title="Keyword Cloud" businessValue="Visual map of the most discussed terms — instantly reveals what the audience cares about and where to focus messaging.">
                  <WordCloud data={data.wordCloud} />
                </Card>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="animate-fade-in animate-fade-in-delay-5">
                <Card title="AI Sentiment Analysis" businessValue="Enables leadership to instantly gauge brand perception and proactively allocate PR resources to mitigate potential crises.">
                  <SentimentDonut data={data.sentimentData} />
                </Card>
              </div>
              <div className="animate-fade-in animate-fade-in-delay-5">
                <Card title="Sentiment Timeline" businessValue="Detect shifts in public opinion early — a sudden rise in negative sentiment signals a potential PR crisis requiring immediate action.">
                  <SentimentTimeline data={data.sentimentOverTime} dateFrom={dateFrom} dateTo={dateTo} />
                </Card>
              </div>
            </div>
          </>)}

          {/* Trends: Topics + Authors */}
          {showSection('trends') && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="animate-fade-in animate-fade-in-delay-5">
                <Card title="Trending Topics — What's Hot" businessValue="Identifies which policy areas and social topics are gaining traction — enables proactive thought-leadership positioning.">
                  <TrendingTopics data={data.trendingTopics} />
                </Card>
              </div>
              <div className="animate-fade-in animate-fade-in-delay-5">
                <Card title="Top Influencers" businessValue="Identify key voices shaping the narrative to inform influencer partnership and outreach strategies.">
                  <TopAuthors data={data.topAuthors} />
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* AI Chat — always available */}
      <AIChat dashboardData={data} dateFrom={dateFrom} dateTo={dateTo} activeCountry={activeCountry} />
    </div>
  );
}
