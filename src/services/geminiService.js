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
      `${base}/api/oracle?overview=true`,
      '/api/oracle?overview=true',
      '/api/oracle/route?overview=true'
    ];

    for (const ep of endpoints) {
      try {
        const resp = await fetch(ep, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && Array.isArray(data.macroOverview)) {
            return data.macroOverview;
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
      `/api/oracle?ticker=${clean}`,
      `/api/oracle/route?ticker=${clean}`
    ];

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

    // Prefer dedicated /api/oracle endpoint when in Oracle of Wealth mode
    const candidateEndpoints = isOracle
      ? [
          `${base}/api/oracle`,
          '/api/oracle',
          '/api/oracle/route',
          `${base}/api/chat`,
          '/api/chat',
          '/api/chat/route'
        ]
      : [
          `${base}/api/chat`,
          '/api/chat',
          '/api/chat/route',
          `${base}/api/gemini`,
          '/api/gemini'
        ];

    // Remove duplicates
    const endpoints = candidateEndpoints.filter((v, i, a) => v && a.indexOf(v) === i);

    let lastError = null;

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
            agent,
            userMessage,
            chatHistory,
            messages: chatHistory,
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

        const data = await resp.json().catch(() => null);

        if (resp.ok && data && (data.reply || data.content)) {
          const reply = (data.reply || data.content).trim();
          const followUps = Array.isArray(data.follow_ups) && data.follow_ups.length > 0
            ? data.follow_ups
            : (Array.isArray(data.followUpQuestions) ? data.followUpQuestions : []);

          return {
            reply,
            follow_ups: followUps,
            content: reply,
            followUpQuestions: followUps,
            model: data.model,
            liveMarketData: data.liveMarketData || null
          };
        } else if (!resp.ok) {
          if (resp.status === 504) {
            lastError = new Error('Gateway Timeout (504): The deep research analysis exceeded execution timeout.');
          } else if (data && data.error) {
            lastError = new Error(data.error);
          } else {
            lastError = new Error(`Server returned error status (${resp.status})`);
          }
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
