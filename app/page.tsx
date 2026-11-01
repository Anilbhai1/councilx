'use client';

import React, { useState, useEffect } from 'react';

interface TickerItem {
  symbol: string;
  name: string;
  price: string | number;
  change: string | number;
  changePercent?: string | number;
  isPositive: boolean;
}

const FEATURE_PRESETS = [
  { id: 'pre_market', title: 'PreMarket Prophecy', prompt: 'Analyze GIFT Nifty, US tech futures, crude oil, and FII flows for today\'s opening stance.' },
  { id: 'syndicate_xray', title: 'Syndicate X-Ray', prompt: 'Perform a forensic audit on Reliance Industries valuation, debt load, and growth moats.' },
  { id: 'fo_deathmatch', title: 'F&O Deathmatch', prompt: 'Audit Nifty 50 option chain max pain, PCR ratio, and institutional call resistance.' },
  { id: 'doomsday', title: 'Doomsday Simulator', prompt: 'Stress-test an Indian equity portfolio against a 15% global crash and USD/INR spike to 87.' },
  { id: 'karmic_future', title: 'Karmic Future', prompt: 'Identify 5-year secular compounding opportunities in India defense and solar infrastructure.' }
];

const MASTERMINDS = [
  { name: 'Chanakya', era: 'Ancient Bharat', role: 'Grand Chancellor of the Maurya Empire', field: 'Geopolitics & Statecraft' },
  { name: 'Warren Buffett', era: 'Modern Global', role: 'Oracle of Omaha', field: 'Value Investing & Moats' },
  { name: 'Jim Simons', era: 'Modern Global', role: 'Founder, Renaissance Technologies', field: 'Quantitative Arbitrage' },
  { name: 'Chatrapati Shivaji Maharaj', era: 'Bharat Vishwaguru', role: 'Sovereign Guerrilla Strategist', field: 'Asymmetric Warfare' },
  { name: 'Vikram Sarabhai', era: 'Modern Bharat', role: 'Father of Indian Space Program', field: 'Technological Sovereignty' },
  { name: 'Niccolò Machiavelli', era: 'Renaissance Global', role: 'Florentine Diplomat', field: 'Pragmatic Power Dynamics' }
];

export default function HomePage() {
  const [ticker, setTicker] = useState<TickerItem[]>([
    { symbol: '^NSEI', name: 'NIFTY 50', price: '24,367.50', change: '+128.40', isPositive: true },
    { symbol: '^BSESN', name: 'SENSEX', price: '80,065.10', change: '+412.30', isPositive: true },
    { symbol: '^NSEBANK', name: 'BANK NIFTY', price: '52,110.80', change: '+245.60', isPositive: true },
    { symbol: 'CL=F', name: 'CRUDE OIL', price: '$71.40', change: '-0.85', isPositive: false },
    { symbol: 'INR=X', name: 'USD/INR', price: '₹84.08', change: '+0.03', isPositive: false },
  ]);

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Welcome to Council X. The 216 Supreme Masterminds are in chamber. Inquire with any market asset, dilemma, or strategic query.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(3);
  const [isPremium, setIsPremium] = useState(false);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);

  // Poll ticker
  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await fetch('/api/ticker');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.ticker) && data.ticker.length > 0) {
            setTicker(data.ticker);
          }
        }
      } catch (e) {}
    };
    fetchTicker();
    const interval = setInterval(fetchTicker, 30000);
    return () => clearInterval(interval);
  }, []);

  // Send Oracle Query
  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || query).trim();
    if (!text || loading) return;

    if (!isPremium && credits <= 0) {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: '⚡ The Council requires an offering. You have 0 Council Credits. Click [ Watch Ad for +3 Credits ] below or upgrade to Sovereign Syndicate for unlimited access.' }
      ]);
      setQuery('');
      return;
    }

    const newMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(newMessages);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          isPremium,
          credits
        })
      });

      if (!res.ok) {
        if (res.status === 403) {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: '⚡ The Council requires an offering. Watch a brief transmission to earn 3 Free Consultations, or upgrade to Sovereign Syndicate.' }
          ]);
          setCredits(0);
          return;
        }
        throw new Error(`Server returned error status: ${res.status}`);
      }

      // Deduct credit locally
      if (!isPremium) {
        setCredits(prev => Math.max(0, prev - 1));
      }

      // Stream text response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantReply = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          // Parse lines
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                assistantReply += JSON.parse(line.slice(2));
              } catch (e) {
                assistantReply += line.slice(2).replace(/^"/, '').replace(/"$/, '');
              }
            } else if (line && !line.startsWith('d:') && !line.startsWith('e:')) {
              assistantReply += line;
            }
          }

          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: assistantReply };
            return updated;
          });
        }
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `⚠️ AI Intelligence Notice: ${err.message || 'Transmission timed out. Please retry.'}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Watch Ad (+3 Credits)
  const handleWatchAd = async () => {
    setRewardLoading(true);
    setRewardMessage('Broadcasting encrypted transmission... (5s)');
    
    setTimeout(async () => {
      try {
        const token = `ad_claim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const res = await fetch('/api/rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'web_session_user',
            verificationToken: token,
            adPlacementId: 'rewarded_home_ad'
          })
        });

        if (res.ok) {
          const data = await res.json();
          setCredits(prev => prev + 3);
          setRewardMessage('✓ Transmission Verified: +3 Council Credits Added to Your Vault!');
        } else {
          setCredits(prev => prev + 3);
          setRewardMessage('✓ +3 Council Credits Added Locally!');
        }
      } catch (e) {
        setCredits(prev => prev + 3);
        setRewardMessage('✓ +3 Council Credits Added Locally!');
      } finally {
        setRewardLoading(false);
        setTimeout(() => setRewardMessage(null), 3500);
      }
    }, 4500);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#E0E0E0' }}>
      
      {/* 1. Live Market Ticker */}
      <div style={{
        backgroundColor: '#0D0D0D',
        borderBottom: '1px solid #1E1E1E',
        padding: '10px 16px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        display: 'flex',
        gap: '24px',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '12px', borderRight: '1px solid #222' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
          <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 800, letterSpacing: '1px' }}>MARKET ANCHORS</span>
        </div>
        {ticker.map((item, index) => (
          <div key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{ color: '#888', fontWeight: 600 }}>{item.name}</span>
            <span style={{ color: '#FFF', fontWeight: 700 }}>{item.price}</span>
            <span style={{ color: item.isPositive ? '#10B981' : '#EF4444', fontWeight: 700 }}>
              {item.isPositive ? '▲' : '▼'} {item.change}
            </span>
          </div>
        ))}
      </div>

      {/* 2. Top Navigation Bar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
        backgroundColor: '#080808'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#161616', border: '1px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontWeight: 900, fontSize: '16px' }}>
            X
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#D4AF37', letterSpacing: '1.5px' }}>COUNCIL X</div>
            <div style={{ fontSize: '10px', color: '#777', letterSpacing: '0.8px' }}>THE 216 SUPREME SYNDICATE</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: '#121212',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#D4AF37',
            fontWeight: 700
          }}>
            ⚡ {isPremium ? '∞ Unlimited' : `${credits} Credits`}
          </div>

          <button
            onClick={handleWatchAd}
            disabled={rewardLoading}
            style={{
              backgroundColor: '#181818',
              border: '1px solid #D4AF37',
              color: '#D4AF37',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {rewardLoading ? 'Receiving Ad...' : '+3 Credits (Watch Ad)'}
          </button>

          <a
            href="/admin"
            style={{
              color: '#888',
              fontSize: '12px',
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #222'
            }}
          >
            Admin God Mode
          </a>
        </div>
      </nav>

      {/* Reward Message Banner */}
      {rewardMessage && (
        <div style={{
          backgroundColor: '#10B98120',
          borderBottom: '1px solid #10B981',
          padding: '10px',
          textAlign: 'center',
          color: '#10B981',
          fontSize: '13px',
          fontWeight: 700
        }}>
          {rewardMessage}
        </div>
      )}

      {/* 3. Hero & Oracle Section */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px 80px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#FFF', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            Oracle of Wealth & Mastermind Syndicate
          </h1>
          <p style={{ color: '#888', fontSize: '15px', maxWidth: '640px', margin: '0 auto', lineHeight: '1.6' }}>
            Real-time financial intelligence, option chains, forensic balance sheet audits, and civilizational strategic counsel powered by 216 historical masterminds.
          </p>
        </div>

        {/* Feature Presets */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
          {FEATURE_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleSend(preset.prompt)}
              style={{
                backgroundColor: '#121212',
                border: '1px solid #2A2A2A',
                color: '#CCC',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              ⚡ {preset.title}
            </button>
          ))}
        </div>

        {/* Interactive Chat Console */}
        <div style={{
          backgroundColor: '#0A0A0A',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          minHeight: '380px',
          maxHeight: '520px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                backgroundColor: m.role === 'user' ? '#1E1A10' : '#121212',
                border: m.role === 'user' ? '1px solid #D4AF3740' : '1px solid #222',
                padding: '14px 18px',
                borderRadius: '10px',
                fontSize: '14px',
                lineHeight: '1.7',
                color: m.role === 'user' ? '#FFF' : '#DDD',
                whiteSpace: 'pre-wrap'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, color: m.role === 'user' ? '#D4AF37' : '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {m.role === 'user' ? 'Inquirer' : 'The 216 Supreme Council'}
              </div>
              {m.content}
            </div>
          ))}
          {loading && (
            <div style={{ color: '#D4AF37', fontSize: '13px', fontStyle: 'italic', padding: '10px' }}>
              ✦ Decrypting financial models & formulating sovereign strategic audit...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Inquire on any stock, strike, balance sheet, or dilemma (e.g. Reliance, Swiggy IPO, Nifty 24500)..."
            style={{
              flex: 1,
              backgroundColor: '#111',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '14px 18px',
              color: '#FFF',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            style={{
              backgroundColor: '#D4AF37',
              color: '#050505',
              border: 'none',
              borderRadius: '8px',
              padding: '0 24px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Consulting...' : 'Inquire'}
          </button>
        </div>

        {/* Masterminds Preview Section */}
        <div style={{ marginTop: '54px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#D4AF37', marginBottom: '16px', letterSpacing: '0.5px' }}>
            The 216 Masterminds In Chamber
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {MASTERMINDS.map((agent, i) => (
              <div key={i} style={{ backgroundColor: '#0E0E0E', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFF' }}>{agent.name}</div>
                  <span style={{ fontSize: '10px', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>{agent.era}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#AAA', marginBottom: '6px' }}>{agent.role}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>Focus: {agent.field}</div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
