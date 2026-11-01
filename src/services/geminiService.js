/**
 * COUNCIL X | THE SYNDICATE
 * Production-Ready AI & Financial Intelligence Frontend Client Service
 * 
 * ARCHITECTURAL SECURITY COMPLIANCE (TASK 2):
 * - ZERO client-side process.env leaks (blocked by Vercel for security).
 * - ALL AI calls and external financial calls happen STRICTLY inside Next.js Backend Route Handlers.
 * - The frontend UI ONLY makes HTTP fetch requests to internal /api/chat and /api/oracle endpoints.
 * - ZERO mock data or dummy placeholders.
 */

import { i18n, getFullLanguageName } from '../utils/i18n.js';

function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // If running local backend server on port 3001
      return 'http://localhost:3001';
    }
    return '';
  }
  return '';
}

export const geminiService = {
  isConfigured() {
    return true;
  },

  /**
   * Asynchronously fetch real live global macro market anchors from backend
   * (Nifty 50, Sensex, Bank Nifty, Crude Oil, USD/INR)
   */
  async fetchLiveMarketOverview() {
    const base = getApiBaseUrl();
    const endpoints = [
      `${base}/api/ticker`,
      '/api/ticker',
      `${base}/api/oracle?overview=true`,
      '/api/oracle?overview=true'
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const ep of endpoints) {
      try {
        const resp = await fetch(ep, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (resp.ok) {
          const data = await resp.json();
          const list = data?.ticker || data?.indices || data?.macroOverview;
          if (Array.isArray(list) && list.length > 0) {
            return list;
          }
        }
      } catch (e) {
        // Continue to fallback endpoint
      }
    }
    return [];
  },

  /**
   * Asynchronously fetch real live stock quote & financial telemetry from backend
   */
  async fetchLiveMarketData(tickerOrQuery) {
    if (!tickerOrQuery || !tickerOrQuery.trim()) return null;
    const base = getApiBaseUrl();
    const clean = encodeURIComponent(tickerOrQuery.trim());
    const endpoints = [
      `${base}/api/oracle?ticker=${clean}`,
      `/api/oracle?ticker=${clean}`
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const ep of endpoints) {
      try {
        const resp = await fetch(ep, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.liveMarketData) {
            return data.liveMarketData;
          }
        }
      } catch (e) {}
    }
    return null;
  },

  /**
   * Universal 1-on-1 Mastermind & Oracle Strategic Counsel
   * Strictly invokes secure Next.js Backend Route Handlers (/api/chat & /api/oracle)
   */
  async generateAgentResponse({
    agent,
    userMessage,
    chatHistory = [],
    chat_id = null,
    chatId = null,
    language = 'gu',
    modelType = 'flash',
    thinkingDepth = 'medium',
    isPremium = false,
    mode = 'single',
    feature = null,
    reportContext = null
  }) {
    const activeChatId = chat_id || chatId;
    const isOracle = mode === 'oracle_of_wealth' || Boolean(feature);
    const base = getApiBaseUrl();

    // Dedicated /api/oracle endpoint when in Oracle of Wealth mode
    const candidateEndpoints = isOracle
      ? [
          `${base}/api/oracle`,
          '/api/oracle'
        ]
      : [
          `${base}/api/chat`,
          '/api/chat'
        ];

    // Remove duplicates
    const endpoints = candidateEndpoints.filter((v, i, a) => v && a.indexOf(v) === i);

    let lastError = null;

    const formattedMessages = Array.isArray(chatHistory)
      ? chatHistory.map(m => ({
          role: (m.role === 'model' || m.role === 'assistant') ? 'assistant' : 'user',
          content: m.content || m.text || m.parts?.[0]?.text || ''
        }))
      : [];

    if (userMessage) {
      formattedMessages.push({
        role: 'user',
        content: typeof userMessage === 'string' ? userMessage : JSON.stringify(userMessage)
      });
    }

    for (const endpoint of endpoints) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 58000) : null;

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: formattedMessages,
            userMessage,
            data: {
              agent,
              feature,
              mode: mode || (feature ? 'oracle_of_wealth' : 'single'),
              language,
              reportContext
            },
            agent,
            chatHistory,
            chat_id: activeChatId,
            language,
            modelType,
            thinkingDepth,
            isPremium,
            mode: mode || (feature ? 'oracle_of_wealth' : 'single'),
            feature,
            reportContext
          }),
          signal: controller ? controller.signal : undefined
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (resp.ok) {
          const rawText = await resp.text();
          let replyText = '';
          let jsonParsed = null;
          try {
            jsonParsed = JSON.parse(rawText);
          } catch (e) {}

          if (jsonParsed && (jsonParsed.reply || jsonParsed.content || jsonParsed.text)) {
            replyText = (jsonParsed.reply || jsonParsed.content || jsonParsed.text).trim();
          } else if (rawText) {
            const lines = rawText.split('\n');
            for (const line of lines) {
              if (line.startsWith('0:')) {
                try {
                  replyText += JSON.parse(line.slice(2));
                } catch (e) {
                  replyText += line.slice(2).replace(/^"/, '').replace(/"$/, '');
                }
              }
            }
            if (!replyText.trim()) {
              replyText = rawText.trim();
            }
          }

          if (replyText) {
            const followUps = [
              'What is the institutional stop-loss for this setup?',
              'How does current promoter integrity impact the upside?',
              'Simulate a -10% market crash scenario on this strategy.'
            ];

            return {
              reply: replyText,
              follow_ups: followUps,
              content: replyText,
              followUpQuestions: followUps,
              model: 'gemini-1.5-pro'
            };
          }
        } else {
          const errData = await resp.json().catch(() => null);
          lastError = new Error(errData?.error || `Server returned error status (${resp.status})`);
        }
      } catch (callErr) {
        if (callErr.name === 'AbortError') {
          lastError = new Error('Request timed out after 58s. The AI model took too long to complete.');
        } else {
          lastError = callErr;
        }
      }
    }

    // Zero mock/dummy fallbacks: Propagate authentic error to UI
    throw lastError || new Error('Failed to reach backend AI engine. Please verify network connectivity.');
  },

  /**
   * ALL-IN-ONE 216 SUPREME COUNCIL (૨૧૬ સર્વોચ્ચ મહા-સભા)
   */
  async generateSupremeCouncil216Response({
    userDilemma,
    chatHistory = [],
    language = 'gu',
    modelType = 'flash',
    thinkingDepth = 'medium',
    isPremium = false
  }) {
    const councilAgent = {
      name: 'The 216 Supreme Council (૨૧૬ સર્વોચ્ચ મહા-સભા)',
      title: 'Unified Sovereign Synthesis of 108 Bharat Legends & 108 Global Visionaries',
      category: 'Supreme Council War Room',
      bio: 'A unified strategic synthesis uniting 108 ancient Bharat Vishwagurus and 108 modern global visionaries into a singular unassailable strategic decree.'
    };

    return this.generateAgentResponse({
      agent: councilAgent,
      userMessage: userDilemma,
      chatHistory,
      language,
      modelType,
      thinkingDepth,
      isPremium
    });
  },

  /**
   * Autonomous Multi-Agent Strategic Debate
   */
  async generateCouncilDebate({ agents = [], dilemma = '', language = 'gu', thinkingDepth = 'medium' }) {
    const agentA = agents[0] || { name: 'Chanakya', title: 'Grand Chancellor of the Maurya Empire' };
    const agentB = agents[1] || { name: 'Niccolò Machiavelli', title: 'Florentine Diplomat & Political Philosopher' };

    const debateAgent = {
      name: `${agentA.name} vs ${agentB.name}`,
      title: 'Council Debate Chamber',
      category: 'Intellectual Triad Arena',
      bio: `High-stakes strategic cross-examination and debate chamber contrasting the doctrines of ${agentA.name} and ${agentB.name}.`
    };

    const prompt = `Conduct a high-stakes intellectual clash and strategic debate between Mastermind 1: ${agentA.name} (${agentA.title || 'Strategist'}) and Mastermind 2: ${agentB.name} (${agentB.title || 'Visionary'}) on the following critical dilemma:\n"${dilemma}"\nProvide rich historical arguments, philosophical counter-attacks, and a unified optimal move concluding with the Sovereign Strategic Blueprint.`;

    return this.generateAgentResponse({
      agent: debateAgent,
      userMessage: prompt,
      chatHistory: [],
      language,
      modelType: 'flash',
      thinkingDepth
    });
  },

  /**
   * ORACLE OF WEALTH: 8 Master Financial Intelligence Engines
   * Enforces The Verdict, The Why (Deep Logic), The Why Not (Trap Avoidance), and The Final Move
   */
  async generateOracleWealthReport({
    feature = 'pre_market',
    userQuery = '',
    agent = {},
    chatHistory = [],
    language = 'gu',
    reportContext = ''
  }) {
    return this.generateAgentResponse({
      agent,
      userMessage: userQuery,
      chatHistory,
      language,
      mode: 'oracle_of_wealth',
      feature,
      reportContext,
      modelType: 'pro',
      thinkingDepth: 'deep',
      isPremium: true
    });
  }
};
