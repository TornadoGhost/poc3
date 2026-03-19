export const volumeData = [
    { date: 'Mon', UAE: 4000, KSA: 8400, Qatar: 1200 },
    { date: 'Tue', UAE: 3000, KSA: 7398, Qatar: 2210 },
    { date: 'Wed', UAE: 2000, KSA: 9800, Qatar: 2290 },
    { date: 'Thu', UAE: 2780, KSA: 11008, Qatar: 2000 },
    { date: 'Fri', UAE: 1890, KSA: 14800, Qatar: 2181 }, // Spike in KSA
    { date: 'Sat', UAE: 2390, KSA: 13800, Qatar: 2500 },
    { date: 'Sun', UAE: 3490, KSA: 12300, Qatar: 2100 },
];

export const sentimentData = [
    { name: 'Positive', value: 45, color: '#10b981' }, // Emerald 500
    { name: 'Neutral', value: 35, color: '#94a3b8' },  // Slate 400
    { name: 'Negative', value: 20, color: '#ef4444' }, // Red 500
];

export const trendingTopics = [
    { id: 1, topic: '#Vision2030', volume: '124.5K', momentum: '+45%', trend: 'up' },
    { id: 2, topic: 'Dubai Real Estate', volume: '84.2K', momentum: '+12%', trend: 'up' },
    { id: 3, topic: 'Oil Production Cut', volume: '65.1K', momentum: '-5%', trend: 'down' },
    { id: 4, topic: 'Riyadh Season', volume: '42.8K', momentum: '+88%', trend: 'up' },
];

export const aiPrompts = [
    "Why is there a mention spike in KSA on Friday?",
    "Summarize the negative sentiment drivers.",
    "Compare UAE and Qatar engagement rates."
];