import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import tweetsRaw from '../../../../docs/data/x_tweets.json';
import queriesRaw from '../../../../docs/data/x_search_queries.json';

// Build query lookup map
const queryMap = {};
queriesRaw.forEach(q => { queryMap[q.id] = q; });

// Country mapping (same logic as dashboardData.js)
function getCountry(tweet) {
  const q = queryMap[tweet.query_id];
  if (!q) return 'Other';
  if (q.country === 'UAE') return 'UAE';
  if (q.country === 'Saudi') return 'KSA';
  return 'Qatar';
}

// Sentiment analysis (same logic as dashboardData.js)
const positiveWords = ['growth', 'success', 'achieve', 'launch', 'award', 'innovation', 'empower',
  'progress', 'improve', 'opportunity', 'celebrate', 'partnership', 'advance', 'milestone',
  'sustainable', 'support', 'excellence', 'vision', 'boost', 'leading', 'win', 'record',
  'transform', 'invest', 'prosper', 'thrive', 'pioneer', 'landmark', 'proud'];

const negativeWords = ['crisis', 'fail', 'ban', 'attack', 'threat', 'corruption', 'decline',
  'risk', 'concern', 'warn', 'penalty', 'violation', 'drop', 'loss', 'problem', 'issue',
  'challenge', 'dispute', 'conflict', 'delay', 'shortage', 'protest', 'controversy'];

function getSentiment(text) {
  if (!text) return 'Neutral';
  const lower = text.toLowerCase();
  let posScore = 0, negScore = 0;
  positiveWords.forEach(w => { if (lower.includes(w)) posScore++; });
  negativeWords.forEach(w => { if (lower.includes(w)) negScore++; });
  if (posScore > negScore && posScore > 0) return 'Positive';
  if (negScore > posScore && negScore > 0) return 'Negative';
  return 'Neutral';
}

// Enrich all tweets once at startup
const allTweets = tweetsRaw.map(t => {
  const q = queryMap[t.query_id];
  return {
    date: t.date_published.substring(0, 10),
    month: t.date_published.substring(0, 7),
    country: getCountry(t),
    theme: q ? q.theme : null,
    sentiment: getSentiment(t.post_text),
    author: t.author,
    likes: t.likes_count,
    retweets: t.retweets_count,
    replies: t.replies_count,
    views: t.views_count,
  };
});

// Pre-build compact data string for the system prompt (computed once)
let compactData = '';

// 1. Daily aggregates by country
const dailyAgg = {};
allTweets.forEach(t => {
  const key = `${t.date}|${t.country}`;
  if (!dailyAgg[key]) dailyAgg[key] = { date: t.date, country: t.country, mentions: 0, likes: 0, retweets: 0, replies: 0, views: 0, pos: 0, neu: 0, neg: 0, authors: new Set() };
  const d = dailyAgg[key];
  d.mentions++;
  d.likes += t.likes;
  d.retweets += t.retweets;
  d.replies += t.replies;
  d.views += t.views;
  if (t.sentiment === 'Positive') d.pos++;
  else if (t.sentiment === 'Negative') d.neg++;
  else d.neu++;
  d.authors.add(t.author);
});

compactData += 'DAILY DATA (date|country|mentions|likes|retweets|replies|views|positive|neutral|negative|unique_authors):\n';
Object.values(dailyAgg)
  .sort((a, b) => a.date.localeCompare(b.date) || a.country.localeCompare(b.country))
  .forEach(d => {
    compactData += `${d.date}|${d.country}|${d.mentions}|${d.likes}|${d.retweets}|${d.replies}|${d.views}|${d.pos}|${d.neu}|${d.neg}|${d.authors.size}\n`;
  });

// 2. Theme aggregates by country
const themeAgg = {};
allTweets.forEach(t => {
  if (!t.theme) return;
  const key = `${t.theme}|${t.country}`;
  if (!themeAgg[key]) themeAgg[key] = { theme: t.theme, country: t.country, volume: 0, likes: 0, retweets: 0 };
  themeAgg[key].volume++;
  themeAgg[key].likes += t.likes;
  themeAgg[key].retweets += t.retweets;
});

compactData += '\nTHEME DATA (theme|country|volume|likes|retweets):\n';
Object.values(themeAgg)
  .sort((a, b) => b.volume - a.volume)
  .forEach(d => {
    compactData += `${d.theme}|${d.country}|${d.volume}|${d.likes}|${d.retweets}\n`;
  });

// 3. Author aggregates
const authorAgg = {};
allTweets.forEach(t => {
  if (!authorAgg[t.author]) authorAgg[t.author] = { author: t.author, tweets: 0, likes: 0, retweets: 0, views: 0, countries: new Set(), dateMin: t.date, dateMax: t.date };
  const a = authorAgg[t.author];
  a.tweets++;
  a.likes += t.likes;
  a.retweets += t.retweets;
  a.views += t.views;
  a.countries.add(t.country);
  if (t.date < a.dateMin) a.dateMin = t.date;
  if (t.date > a.dateMax) a.dateMax = t.date;
});

compactData += '\nAUTHOR DATA (author|tweets|likes|retweets|views|countries|first_post|last_post):\n';
Object.values(authorAgg)
  .sort((a, b) => b.tweets - a.tweets)
  .forEach(d => {
    compactData += `${d.author}|${d.tweets}|${d.likes}|${d.retweets}|${d.views}|${[...d.countries].join(',')}|${d.dateMin}|${d.dateMax}\n`;
  });

// 4. Per-tweet detail for unique author counting across any date range
// Build a compact author-date-country list
const authorDateCountry = {};
allTweets.forEach(t => {
  const key = `${t.author}|${t.date}|${t.country}`;
  if (!authorDateCountry[key]) authorDateCountry[key] = true;
});

compactData += '\nAUTHOR ACTIVITY (author|date|country) — for unique author counting:\n';
Object.keys(authorDateCountry).sort().forEach(k => {
  compactData += k + '\n';
});

// Compute data boundaries
const allDates = allTweets.map(t => t.date).sort();
const DATA_MIN = allDates[0];
const DATA_MAX = allDates[allDates.length - 1];

const FULL_DATA = compactData;

export async function GET() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({ hasKey });
}

function buildSystemPrompt(context) {
  let prompt = `You are an AI analytics assistant for a Social Media Analytics Dashboard focused on UAE, KSA, and Qatar markets.

RULES:
- Answer ONLY based on the data provided below. Do not make up numbers.
- Keep responses concise (3-6 sentences). Use bullet points for lists.
- Format numbers in bold with **. Use % where relevant.
- Be professional, business-oriented, and insightful.
- When explaining peaks or trends, reference specific dates and numbers from the data.
- If the user asks something not covered by the data, say so honestly.
- Answer in the same language the user writes in.

CRITICAL — DATE RANGE LOGIC:
The dashboard has data from ${DATA_MIN} to ${DATA_MAX}. This is the full available range.
Today's date is ${new Date().toISOString().substring(0, 10)}.

When the user asks for a time period (e.g. "last 3 months", "last 7 days"), calculate it from TODAY's date, just like a calendar would.
Examples:
- "last 3 months" = today minus 3 months → today
- "last 7 days" = today minus 7 days → today
If the calculated range extends beyond available data (${DATA_MIN} to ${DATA_MAX}), only include data that exists and mention this to the user.
If the user explicitly specifies exact dates (e.g. "from January 1 to March 1, 2025"), use those dates as-is.

MANDATORY — ALWAYS CLARIFY THE DATE RANGE:
When the user asks for data for a time period, you MUST always state at the beginning of your response:
- The exact date range you used (from — to)
- How you calculated it: "from today's date" if the user didn't specify exact dates, or "exact dates as requested" if they did
- If the available data doesn't fully cover the requested period, explicitly say so (e.g. "You asked for the last 3 months (19.12.2025 — 19.03.2026), but data is available only until ${DATA_MAX}, so the results cover 19.12.2025 — ${DATA_MAX}.")

NOTE: The dashboard's preset buttons (7D, 30D, 3M, 1Y) work differently — they calculate from the last available data date (${DATA_MAX}), not from today. If the user asks why their chat numbers differ from the dashboard preset, explain this difference.

IMPORTANT — METRIC COMPUTATION FORMULAS:
When the user asks about specific metrics, compute them exactly as the dashboard does:

1. FILTERING: Filter data by date range (dateFrom <= date <= dateTo) and country (if not "All Regions").
2. Total Mentions = count of filtered tweets
3. Total Reach = sum of views
4. Total Likes = sum of likes
5. Total Retweets = sum of retweets
6. Engagement Rate = ((likes + retweets + replies) / views) * 100, rounded to 2 decimals
7. Unique Authors = count of distinct authors in filtered data
8. Sentiment Score = ((positive_count - negative_count) / total_count + 1) / 2 * 100, rounded to integer
9. Positive% = round(positive / total * 100), Neutral% = round(neutral / total * 100), Negative% = round(negative / total * 100)
10. Share of Voice = mentions count per country in filtered data
11. Top Market = country with most mentions
12. Posts/Month = total_mentions / number_of_unique_months
13. Trending Topics: sorted by volume descending, engagement = likes + retweets
14. Top Authors: sorted by tweet count descending, top 10
15. Country mapping: database "UAE" → "UAE", "Saudi" → "KSA", null → "Qatar"

CURRENTLY DISPLAYED ON DASHBOARD:
`;

  if (context) {
    const { dateFrom, dateTo, activeCountry, stats } = context;
    prompt += `Date range: ${dateFrom} to ${dateTo}\n`;
    prompt += `Region filter: ${activeCountry}\n`;
    if (stats) {
      prompt += `Displayed KPIs: Mentions=${stats.totalMentions}, Reach=${stats.totalReach}, Likes=${stats.totalLikes}, Retweets=${stats.totalRetweets}, EngRate=${stats.engagementRate}%, Authors=${stats.uniqueAuthors}\n`;
      prompt += `Sentiment: Pos ${stats.positivePct}%, Neu ${stats.neutralPct}%, Neg ${stats.negativePct}%, Score=${stats.sentimentScore}/100\n`;
    }
  } else {
    prompt += `No filter applied.\n`;
  }

  prompt += `\n--- FULL DATABASE (all tweets, all dates, all countries) ---\n`;
  prompt += FULL_DATA;
  prompt += `--- END DATA ---\n`;
  prompt += `\nYou have access to ALL data in the database above. You can compute metrics for ANY date range or country, not just what's currently displayed on the dashboard. When the user asks for data outside the current dashboard filter, compute it from the full dataset using the formulas above. Your numbers MUST match the dashboard exactly when the same filters are applied.\n`;

  return prompt;
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'no_key' }, { status: 200 });
  }

  try {
    const { message, history, context } = await request.json();

    const client = new Anthropic({ apiKey });

    const messages = [];
    if (history && history.length > 0) {
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text,
        });
      });
    }
    messages.push({ role: 'user', content: message });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: buildSystemPrompt(context),
      messages,
    });

    const text = response.content?.[0]?.text || 'No response generated.';
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: 'api_error', detail: e.message }, { status: 200 });
  }
}
