import { NextResponse } from 'next/server';

export async function GET() {
  const hasKey = !!process.env.GEMINI_API_KEY;
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
`;

  if (!context) return prompt;

  const { stats, mentionsOverTime, shareOfVoice, sentimentData, topAuthors, trendingTopics, dateFrom, dateTo, activeCountry } = context;

  prompt += `\n--- CURRENT DASHBOARD STATE ---`;
  prompt += `\nDate range: ${dateFrom} to ${dateTo}`;
  prompt += `\nRegion filter: ${activeCountry}`;

  if (stats) {
    prompt += `\n\nKPI SUMMARY:`;
    prompt += `\n- Total mentions: ${stats.totalMentions}`;
    prompt += `\n- Total reach (views): ${stats.totalReach}`;
    prompt += `\n- Likes: ${stats.totalLikes}, Retweets: ${stats.totalRetweets}`;
    prompt += `\n- Engagement rate: ${stats.engagementRate}%`;
    prompt += `\n- Unique authors: ${stats.uniqueAuthors}`;
    prompt += `\n- Sentiment: Positive ${stats.positivePct}%, Neutral ${stats.neutralPct}%, Negative ${stats.negativePct}%`;
    prompt += `\n- Sentiment score: ${stats.sentimentScore}/100`;
    prompt += `\n- Top market: ${stats.topMarketName}`;
    prompt += `\n- Total topics: ${stats.totalTopics}, Hottest theme: ${stats.hottestTheme}`;
  }

  if (mentionsOverTime && mentionsOverTime.length > 0) {
    prompt += `\n\nMENTIONS OVER TIME (date → UAE/KSA/Qatar):`;
    mentionsOverTime.filter(d => d.UAE > 0 || d.KSA > 0 || d.Qatar > 0).forEach(d => {
      prompt += `\n  ${d.date}: UAE=${d.UAE}, KSA=${d.KSA}, Qatar=${d.Qatar}`;
    });
  }

  if (shareOfVoice && shareOfVoice.length > 0) {
    prompt += `\n\nSHARE OF VOICE:`;
    shareOfVoice.forEach(d => { prompt += `\n  ${d.name}: ${d.value} mentions`; });
  }

  if (sentimentData && sentimentData.length > 0) {
    prompt += `\n\nSENTIMENT BREAKDOWN:`;
    sentimentData.forEach(d => { prompt += `\n  ${d.name}: ${d.value}`; });
  }

  if (topAuthors && topAuthors.length > 0) {
    prompt += `\n\nTOP AUTHORS (top 5):`;
    topAuthors.slice(0, 5).forEach(a => {
      prompt += `\n  @${a.author}: ${a.tweets} posts, ${a.likes} likes, ${a.views} views`;
    });
  }

  if (trendingTopics && trendingTopics.length > 0) {
    prompt += `\n\nTRENDING TOPICS:`;
    trendingTopics.slice(0, 10).forEach(t => {
      prompt += `\n  "${t.topic}": volume=${t.volume}, engagement=${t.engagement}, momentum=${t.momentum}`;
    });
  }

  prompt += `\n--- END DATA ---`;
  return prompt;
}

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'no_key' }, { status: 200 });
  }

  try {
    const { message, history, context } = await request.json();

    const contents = [];
    if (history && history.length > 0) {
      history.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemPrompt(context) }] },
          contents,
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: 'api_error', detail: err }, { status: 200 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: 'server_error', detail: e.message }, { status: 200 });
  }
}
