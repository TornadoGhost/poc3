'use client';

import { useState, useRef, useEffect } from 'react';
import { BrainCircuit, X, Send, Sparkles } from 'lucide-react';
import { aiPrompts, generateSmartResponse } from '../../data/dashboardData';

function TypingText({ text, onDone }) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    const speed = Math.max(5, 15 - Math.floor(text.length / 100));
    const timer = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(timer);
        if (onDone) onDone();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayed}<span className="animate-pulse">|</span></span>;
}

function formatResponse(text) {
  return text.split('\n').map((line, i) => {
    let formatted = line
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
      .replace(/•/g, '<span class="text-blue-400 mr-1">•</span>');
    return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: formatted }} />;
  });
}

async function checkGeminiAvailable() {
  try {
    const res = await fetch('/api/chat');
    const data = await res.json();
    return data.hasKey === true;
  } catch {
    return false;
  }
}

async function askGemini(message, history, context) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, context }),
    });
    const data = await res.json();
    if (data.error === 'no_key') return { type: 'no_key' };
    if (data.error) return { type: 'error', detail: data.detail };
    return { type: 'ok', text: data.text };
  } catch {
    return { type: 'error' };
  }
}

export default function AIChat({ dashboardData, dateFrom, dateTo, activeCountry }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [useGemini, setUseGemini] = useState(process.env.NEXT_PUBLIC_HAS_GEMINI === 'true');
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  async function sendMessage(text) {
    setShowPrompts(false);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);

    const history = messages.filter(m => !m.typing).map(m => ({ role: m.role === 'ai' ? 'model' : 'user', text: m.text }));

    const context = dashboardData ? {
      stats: dashboardData.stats,
      mentionsOverTime: dashboardData.mentionsOverTime,
      shareOfVoice: dashboardData.shareOfVoice,
      sentimentData: dashboardData.sentimentData,
      topAuthors: dashboardData.topAuthors,
      trendingTopics: dashboardData.trendingTopics,
      dateFrom, dateTo, activeCountry,
    } : null;

    let responseText;

    if (useGemini) {
      const result = await askGemini(text, history, context);
      if (result.type === 'ok') {
        responseText = result.text;
      } else {
        const detail = result.detail || 'Unknown error';
        try {
          const parsed = JSON.parse(detail);
          responseText = `⚠ Gemini API Error: ${parsed.error?.message || detail}`;
        } catch {
          responseText = `⚠ Gemini API Error: ${detail}`;
        }
      }
    } else {
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
      responseText = generateSmartResponse(text);
    }

    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'ai', text: responseText, typing: true }]);
  }

  function handlePromptClick(prompt) {
    sendMessage(prompt.text);
  }

  function handleTypingDone() {
    setMessages(prev => prev.map(m => ({ ...m, typing: false })));
    setShowPrompts(true);
  }

  function handleReset() {
    setMessages([]);
    setShowPrompts(true);
    setIsTyping(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen
            ? 'bg-slate-400 rotate-90 scale-90'
            : 'bg-gradient-to-br from-blue-500 to-violet-500 hover:scale-110 hover:shadow-blue-500/25'
        }`}
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <BrainCircuit className="w-6 h-6 text-white" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] h-[560px] bg-white border border-[var(--card-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--card-border)] bg-gradient-to-r from-blue-500/10 to-violet-500/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">AI Insights Assistant</h3>
                <p className="text-xs text-slate-500">
                  {useGemini ? 'Powered by Gemini AI' : 'Powered by Social Pulse AI'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Demonstrates how AI can transform raw data into instant executive insights — reducing time-to-decision from days to seconds.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                  <BrainCircuit className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-sm text-slate-700 font-medium">Ask me about your data</p>
                <p className="text-xs text-slate-500 mt-1">Select a question below or type your own</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-slate-50 text-slate-700 rounded-bl-md border border-slate-200'
                }`}>
                  {msg.role === 'ai' && msg.typing ? (
                    <TypingText text={msg.text} onDone={handleTypingDone} />
                  ) : msg.role === 'ai' ? (
                    formatResponse(msg.text)
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-50 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-200">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEnd} />
          </div>

          {showPrompts && (
            <div className="px-4 pb-2 space-y-1.5">
              {aiPrompts
                .filter(p => !messages.some(m => m.role === 'user' && m.text === p.text))
                .map(prompt => (
                  <button
                    key={prompt.id}
                    onClick={() => handlePromptClick(prompt)}
                    disabled={isTyping}
                    className="w-full text-left px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 inline mr-1.5 text-violet-400" />
                    {prompt.text}
                  </button>
                ))}
            </div>
          )}

          <div className="px-4 py-3 border-t border-[var(--card-border)]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about your data..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim() && !isTyping) {
                    const text = e.target.value.trim();
                    e.target.value = '';
                    sendMessage(text);
                  }
                }}
              />
              {messages.length > 0 && (
                <button onClick={handleReset} className="text-xs text-slate-600 hover:text-slate-400 transition-colors px-2">
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
