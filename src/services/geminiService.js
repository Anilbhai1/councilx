/**
 * COUNCIL X | THE SYNDICATE
 * Elite AI Engine Frontend Client Service
 * 
 * 1. NUKE ALL HARDCODED FALLBACKS:
 *    - All mock/static simulated responses deleted.
 *    - Upstream failures propagate as true errors to the UI.
 * 2. REAL-TIME AGENTIC RAG & MAX-POWER DISPATCH:
 *    - Primary transport: /api/chat with full live web intelligence (Tavily, Wikipedia, Google).
 * 3. MAX POWER DEEP RESEARCH:
 *    - Model config: max_tokens: 8192, temperature: 0.7, native JSON mode.
 * 4. STRICT DYNAMIC JSON FOLLOW-UPS:
 *    - Parses { reply, follow_ups } returned directly from LLM function calling / JSON mode.
 * 5. THE SOVEREIGN BLUEPRINT:
 *    - Mandates '### 🏛️ Strategic Blueprint (વ્યૂહાત્મક અમલીકરણ બ્લૂપ્રિન્ટ)' with 3 actionable steps.
 */

import { i18n, getFullLanguageName } from '../utils/i18n.js';

const getApiKey = () =>
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  '';

const GEMINI_PROXY_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL || ''}/api/gemini`;
const CHAT_API_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL || ''}/api/chat`;

const MODEL_CASCADES = {
  flash: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  pro: ['gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash']
};

const MASTER_STORYTELLING_DIRECTIVE = `You are a world-class, deep-research AI Mastermind with strategic depth surpassing standard AI assistants.
NEVER give short, superficial, or generic bullet summaries.
For EVERY user dilemma, you MUST generate an exhaustive, deeply researched, multi-paragraph strategic masterclass (minimum 4 to 5 large paragraphs), concluding with the sovereign 'Strategic Blueprint'. Output must be in highly professional Gujarati.`;

const JSON_SCHEMA_INSTRUCTION = `
CRITICAL STRUCTURED OUTPUT MANDATE:
You MUST respond with a single, strictly valid raw JSON object. Do not output any conversational preamble, markdown code ticks, or text outside of the JSON.

Exact Schema:
{
  "reply": "Extremely detailed, deep-researched multi-paragraph response concluding with the Strategic Blueprint...",
  "follow_ups": [
    "Dynamic follow-up question 1 in Gujarati highly specific to the immediate dilemma?",
    "Dynamic follow-up question 2 in Gujarati exploring a hidden risk or counter-move?",
    "Dynamic follow-up question 3 in Gujarati focusing on long-term scaling or mastery?"
  ]
}

RULES:
1. THE SOVEREIGN BLUEPRINT: The reply MUST conclude with:
   ### 🏛️ Strategic Blueprint (વ્યૂહાત્મક અમલીકરણ બ્લૂપ્રિન્ટ)
   • ૧. **તાત્કાલિક પગલું (૦ થી ૭૨ કલાક - Immediate Execution)**
   • ૨. **મધ્યમ ગાળાની સ્થિરતા (૩૦ દિવસ - Systemic Fortification)**
   • ૩. **સ્થાયી સુરક્ષા અને અજેય કિલ્લો (Moat & Unassailable Monopoly)**
2. DYNAMIC FOLLOW-UPS: The "follow_ups" array MUST contain exactly 3 penetrating, highly strategic follow-up questions in Gujarati. NEVER use generic templates. They must strictly evolve from the exact dilemma just answered.
3. LANGUAGE: Eloquent, highly professional Gujarati.
`;

/**
 * Universal Gemini API Cascade Caller with Structured JSON Mode (Client Fallback)
 */
async function executeGeminiCascade({ systemInstruction, contents, modelType = 'flash', thinkingDepth = 'medium' }) {
  const modelsToTry = MODEL_CASCADES[modelType] || MODEL_CASCADES.flash;
  const apiKey = getApiKey();

  const baseConfig = {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 8192,
    responseMimeType: "application/json"
  };

  let lastError = null;

  for (const model of modelsToTry) {
    // 1. Attempt via Serverless Proxy with tools & JSON mode
    try {
      const payloadWithTools = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        tools: [{ googleSearch: {} }],
        generationConfig: baseConfig
      };

      const resp = await fetch(GEMINI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, payload: payloadWithTools })
      });

      if (resp.ok) {
        const data = await resp.json();
        const textParts = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').filter(Boolean).join('\n');
        const text = data.content || textParts || data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text;
        }
      }
    } catch (e) {
      console.warn(`[GeminiCascade Proxy tools error on ${model}]:`, e.message);
    }

    // 2. Attempt via Serverless Proxy without tools & JSON mode
    try {
      const payloadWithoutTools = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: baseConfig
      };

      const resp = await fetch(GEMINI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, payload: payloadWithoutTools })
      });

      if (resp.ok) {
        const data = await resp.json();
        const textParts = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').filter(Boolean).join('\n');
        const text = data.content || textParts || data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text;
        }
      }
    } catch (e) {
      console.warn(`[GeminiCascade Proxy fallback error on ${model}]:`, e.message);
    }

    // 3. Direct Google Generative Language API endpoint
    if (apiKey && !apiKey.includes('your_gemini_api_key')) {
      try {
        const directEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payloadDirect = {
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: baseConfig
        };

        const resp = await fetch(directEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(payloadDirect)
        });

        if (resp.ok) {
          const data = await resp.json();
          const textParts = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').filter(Boolean).join('\n');
          const text = textParts || data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim().length > 0) {
            return text;
          }
        } else {
          const errText = await resp.text();
          lastError = new Error(`Direct API status ${resp.status}: ${errText.slice(0, 160)}`);
        }
      } catch (directErr) {
        lastError = directErr;
      }
    }
  }

  throw lastError || new Error('All Gemini cascade models failed');
}

export const geminiService = {
  isConfigured() {
    return true;
  },

  /**
   * 1-on-1 Mastermind Strategic Counsel
   * Primary transport: Serverless /api/chat with agentic RAG and strict JSON mode
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
    let apiError = null;

    // 1. Direct Master Agentic Backend (/api/chat) Call
    const endpoints = [
      CHAT_API_URL,
      '/api/chat',
      '/api/chat/route'
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const endpoint of endpoints) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 55000) : null;

        const clientKey = getApiKey();
        const headers = { 'Content-Type': 'application/json' };
        if (clientKey) {
          headers['x-goog-api-key'] = clientKey;
        }

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers,
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
            clientApiKey: clientKey || undefined,
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
            model: data.model
          };
        } else if (!resp.ok) {
          if (resp.status === 504) {
            apiError = new Error('Gateway Timeout (504): The deep research analysis exceeded execution timeout.');
          } else if (data && data.error) {
            apiError = new Error(data.error);
          } else {
            apiError = new Error(`Server returned error status (${resp.status})`);
          }
        }
      } catch (callErr) {
        if (callErr.name === 'AbortError') {
          apiError = new Error('Request timed out after 55s. The AI model took too long to complete.');
        } else {
          apiError = callErr;
        }
      }
    }

    // 2. Direct Gemini Cascade with Profound Storytelling Prompt (if direct client API key exists)
    const agentName = agent?.name || 'Mastermind';
    const agentRole = agent?.title || agent?.category || agent?.role || 'Strategic Mastermind';
    const bio = agent?.bio || agent?.wikipedia_extract || '';
    const works = Array.isArray(agent?.published_works) ? agent.published_works.join(', ') : '';
    const models = Array.isArray(agent?.mental_models) ? agent.mental_models.join(', ') : '';
    const isKrishna = agentName.toLowerCase().includes('krishna') || agentName.includes('કૃષ્ણ');

    let systemInstruction = `${MASTER_STORYTELLING_DIRECTIVE}\n\nYou are embodying: ${agentName} (${agentRole}).\n${bio ? `AUTHENTIC BIO: ${bio}\n` : ''}${works ? `KEY TEXTS & WORKS: ${works}\n` : ''}${models ? `CORE PRINCIPLES & FRAMEWORKS: ${models}\n` : ''}`;

    if (isKrishna) {
      systemInstruction += `\nYou are Bhagwan Shri Krishna, the Supreme Yogeshwara and Charioteer of Kurukshetra. Speak in the divine first-person ("હું", "મારું", "અર્જુન", "પાર્થ", "ગીતા"). Seamlessly weave deep philosophical verses, cosmic analogies, and the timeless wisdom of Shrimad Bhagavad Gita (Nishkama Karma, Swadharma, Sthitaprajna).`;
    } else {
      systemInstruction += `\nEmbody ${agentName} 100% in the first person ("હું", "મારું", "મારા નિર્ણયો"). Never break character. Infuse your deep historical, political, scientific, or entrepreneurial doctrines.`;
    }

    systemInstruction += `\n${JSON_SCHEMA_INSTRUCTION}`;

    const contents = this._buildChatContents(chatHistory, userMessage);

    try {
      const rawText = await executeGeminiCascade({
        systemInstruction,
        contents,
        modelType,
        thinkingDepth
      });

      return this._parseResponseAndFollowUps(rawText, language, userMessage, agentName);
    } catch (err) {
      // ZERO STATIC FALLBACKS: Throw true error to UI
      throw apiError || err || new Error('Failed to generate AI response. Please check your network and API keys.');
    }
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
    const langName = getFullLanguageName ? getFullLanguageName(language) : (i18n.getLanguageName ? i18n.getLanguageName(language) : language);

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
  },

  /**
   * Chat History Ingestion (100% Context Retention with Alternating Turns)
   */
  _buildChatContents(chatHistory = [], currentMessage = '') {
    const rawTurns = [];
    const sanitizedHistory = (chatHistory || [])
      .filter(m => m && m.content && typeof m.content === 'string' && m.content.trim().length > 0);

    for (const msg of sanitizedHistory) {
      if (msg.role === 'user' && msg.content.trim() === (currentMessage || '').trim()) {
        continue;
      }
      rawTurns.push({
        role: (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user',
        parts: [{ text: msg.content.trim() }]
      });
    }

    if (currentMessage && currentMessage.trim().length > 0) {
      rawTurns.push({
        role: 'user',
        parts: [{ text: currentMessage.trim() }]
      });
    }

    // Ensure valid alternating roles for Gemini (user, model, user, model...)
    const alternating = [];
    for (const turn of rawTurns) {
      if (alternating.length === 0) {
        if (turn.role === 'model') {
          alternating.push({ role: 'user', parts: [{ text: 'પ્રણામ. મારે આપનું માર્ગદર્શન જોઈએ છે.' }] });
        }
        alternating.push({ ...turn });
      } else {
        const prev = alternating[alternating.length - 1];
        if (prev.role === turn.role) {
          prev.parts[0].text += '\n\n' + turn.parts[0].text;
        } else {
          alternating.push({ ...turn });
        }
      }
    }

    return alternating.length > 0 ? alternating : [{ role: 'user', parts: [{ text: currentMessage || 'Initiate counsel.' }] }];
  },

  /**
   * Parse Structured Response { reply, follow_ups } (Zero static hardcoded fallbacks)
   */
  _parseResponseAndFollowUps(rawText, language = 'gu', userTopic = '', agentName = '') {
    let cleanText = (rawText || '').trim();
    let reply = '';
    let followUps = [];

    let parsedJson = null;

    // 1. Check for ```json ... ``` code block
    const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      try {
        parsedJson = JSON.parse(codeBlockMatch[1].trim());
      } catch (e) {}
    }

    // 2. Check for raw JSON object { ... }
    if (!parsedJson) {
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsedJson = JSON.parse(cleanText.slice(firstBrace, lastBrace + 1));
        } catch (e) {}
      }
    }

    if (parsedJson) {
      if (typeof parsedJson.reply === 'string' && parsedJson.reply.trim().length > 0) {
        reply = parsedJson.reply.trim();
      } else if (typeof parsedJson.content === 'string' && parsedJson.content.trim().length > 0) {
        reply = parsedJson.content.trim();
      }

      const rawFollowUps = parsedJson.follow_ups || parsedJson.follow_up_questions || parsedJson.followUps || parsedJson.followUpQuestions;
      if (Array.isArray(rawFollowUps) && rawFollowUps.length > 0) {
        followUps = rawFollowUps
          .filter(q => typeof q === 'string' && q.trim().length > 0)
          .map(q => q.trim())
          .slice(0, 3);
      }
    }

    if (!reply) {
      reply = cleanText
        .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, '')
        .replace(/\{[\s\S]*?"(?:reply|follow_ups)"[\s\S]*?\}/gi, '')
        .trim();
      if (!reply) reply = cleanText;
    }

    // Scrub robotic simulation phrases
    reply = reply
      .replace(/^(?:હું|અમે)\s+.*?(?:બૌદ્ધિક\s+એન્જિન|AI\s+એન્જિન|એન્જિન|મોડલ|સિમ્યુલેશન)[^\.\n]*[\.\n]+/gim, '')
      .replace(/^(?:I\s+am|We\s+are)\s+(?:the\s+)?(?:intellectual\s+engine|AI\s+engine|simulation|model)[^\.\n]*[\.\n]+/gim, '')
      .trim();

    // Dynamically extract any question sentences from the reply if JSON didn't include follow_ups
    // ZERO static candidate lists!
    if (followUps.length === 0 && reply) {
      const questions = reply.match(/([^.?!\n\r]+[?？])/g);
      if (questions && questions.length > 0) {
        followUps = questions
          .map(q => q.trim().replace(/^[-*•\d\.\s]+/, ''))
          .filter(q => q.length >= 12 && q.length <= 130)
          .slice(-3);
      }
    }

    return {
      reply,
      follow_ups: followUps,
      content: reply,
      followUpQuestions: followUps
    };
  }
};
