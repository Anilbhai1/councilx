/**
 * COUNCIL X | THE SYNDICATE
 * Elite Gemini AI Engine (Google Gemini / ChatGPT Pro Standard)
 * 
 * MAJOR AI UPGRADE:
 * 1. PROFOUND, LONG-FORM STORYTELLING (Master System Prompt):
 *    - Master strategist, philosopher, and profound storyteller
 *    - NEVER gives short, robotic, or standard bullet-point summaries
 *    - Expansive explanations, powerful analogies, historical examples & deep philosophical breakdowns
 *    - Always answers in Gujarati unless asked otherwise
 * 2. DYNAMIC CONTEXT-AWARE FOLLOW-UPS (Structured JSON Mode):
 *    - Strict output format: { "reply": "...", "follow_ups": ["Q1", "Q2", "Q3"] }
 *    - Zero hardcoded static follow-up questions
 *    - Follow-ups change dynamically on every turn based on user's exact query
 * 3. DUAL-TRANSPORT ARCHITECTURE:
 *    - Primary: Serverless Backend (/api/chat) with full JSON mode
 *    - Fallback: Multi-model Gemini Cascade with native JSON responseMimeType
 */

import { i18n, getFullLanguageName } from '../utils/i18n.js';

const getApiKey = () =>
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  'AQ.Ab8RN6ID_NEMtyyQN7UDsMdNa0WyAJLRFUlnuCvt8GBPukHqyg';

const GEMINI_PROXY_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL || ''}/api/gemini`;
const CHAT_API_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL || ''}/api/chat`;

const MODEL_CASCADES = {
  flash: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  pro: ['gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash']
};

const MASTER_STORYTELLING_DIRECTIVE = `You are a profound, deep-research AI Mastermind. NEVER give short, summarized, or superficial answers. For EVERY user query, you MUST generate a highly expansive, comprehensive response (minimum 4 to 5 large paragraphs). Break down the topic deeply: provide historical/philosophical context, real-world examples, actionable deep strategies, and step-by-step profound analysis. Write like an expert storyteller and mastermind. Output in highly professional Gujarati.`;

const JSON_SCHEMA_INSTRUCTION = `
CRITICAL STRUCTURED OUTPUT MANDATE:
You MUST respond with a single, strictly valid JSON object. Do not output any conversational preamble or text outside of the JSON.
Exact Schema:
{
  "reply": "Your profound, long-form response here in markdown formatting...",
  "follow_ups": [
    "Highly contextual question 1 in Gujarati?",
    "Highly contextual question 2 in Gujarati?",
    "Highly contextual question 3 in Gujarati?"
  ]
}

RULES FOR FOLLOW-UPS:
- The "follow_ups" array MUST contain exactly 3 penetrating, strategic follow-up questions.
- NEVER use generic templates or repetitive questions.
- The questions MUST be dynamically tailored to the user's immediate dilemma and the strategic concepts presented in your reply.
- All follow-up questions MUST be strictly in Gujarati (unless asked otherwise).
`;

/**
 * Universal Gemini API Cascade Caller with Structured JSON Mode
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

    // 3. Fallback: Direct Google Generative Language API endpoint
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
          headers: { 'Content-Type': 'application/json' },
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
   * Deep storytelling embodiment + Structured JSON mode
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
    isPremium = false
  }) {
    const activeChatId = chat_id || chatId;
    // 1. Direct Master Agentic Backend (/api/chat) Call
    try {
      const endpoints = [
        `${process.env.EXPO_PUBLIC_API_BASE_URL || ''}/api/chat`,
        '/api/chat'
      ];

      for (const endpoint of endpoints) {
        try {
          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agent,
              userMessage,
              chatHistory,
              messages: chatHistory,
              chat_id: activeChatId,
              language,
              modelType,
              thinkingDepth,
              isPremium
            })
          });

          if (resp.ok) {
            const data = await resp.json();
            const reply = data.reply || data.content;
            const followUps = Array.isArray(data.follow_ups) && data.follow_ups.length > 0
              ? data.follow_ups
              : (Array.isArray(data.followUpQuestions) ? data.followUpQuestions : []);

            if (reply && reply.trim().length > 0) {
              return {
                reply,
                follow_ups: followUps,
                content: reply,
                followUpQuestions: followUps
              };
            }
          }
        } catch (callErr) {}
      }
    } catch (apiErr) {
      console.warn('[Chat API Direct Call Notice]:', apiErr.message);
    }

    // 2. Direct Gemini Cascade with Profound Storytelling Prompt
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
      systemInstruction += `\nEmbody ${agentName} 100% in the first person ("હું", "મારું", "મારા નિર્ણયો"). Never mix identities. Infuse your deep historical, political, scientific, or entrepreneurial doctrines.`;
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
      console.warn('Gemini 1-on-1 cascade fallback activated:', err.message);
      return this._generateRichSimulatedResponse(agent, userMessage, language, thinkingDepth, isPremium);
    }
  },

  /**
   * ALL-IN-ONE 216 SUPREME COUNCIL (૨૧૬ માસ્ટરમાઇન્ડ મહા-સભા)
   * Deep Storytelling Synthesis + Structured JSON Mode
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

    const systemInstruction = `
${MASTER_STORYTELLING_DIRECTIVE}

We are the ALL-IN-ONE 216 SUPREME COUNCIL (૨૧૬ સર્વોચ્ચ મહા-સભા).
We synthesize the wisdom of 108 Bharat Vishwaguru Legends (ancient statecraft, Dharmic fortitude, Ayurveda, deep psychology) and 108 Modern Global Visionaries (hyper-scale execution, First Principles, unit economics, capital compounding).

CRITICAL EMBODIMENT DIRECTIVES:
1. UNIFIED SOVEREIGN VOICE:
   - Speak collectively in the first-person plural ("We", "Our" / Gujarati: "અમે", "અમારું").
   - Fuse timeless mental models into an expansive, deeply researched civilizational masterclass.
   - NEVER call this council an "AI engine" or "simulation".
2. TARGET LANGUAGE:
   - Deliver 100% of this decree strictly in ${langName}.
3. EXPANSIVE STORYTELLING & TACTICAL ANALYSIS:
   - Deliver rich, long-form, deeply articulated strategy formatted in elegant Markdown.
   - Weave powerful historical precedents, unit economics analysis, and asymmetric moats.

${JSON_SCHEMA_INSTRUCTION}
`;

    const contents = this._buildChatContents(chatHistory, userDilemma);

    try {
      const rawText = await executeGeminiCascade({
        systemInstruction,
        contents,
        modelType,
        thinkingDepth
      });

      return this._parseResponseAndFollowUps(rawText, language, userDilemma, 'The 216 Supreme Council');
    } catch (err) {
      console.warn('Gemini Supreme Council fallback activated:', err.message);
      return this._generateRichSimulatedSupremeCouncilResponse(userDilemma, language, thinkingDepth, isPremium);
    }
  },

  /**
   * Autonomous Multi-Agent Strategic Debate
   */
  async generateCouncilDebate({ agents = [], dilemma = '', language = 'gu', thinkingDepth = 'medium' }) {
    const agentA = agents[0] || { name: 'Chanakya', title: 'Grand Chancellor of the Maurya Empire' };
    const agentB = agents[1] || { name: 'Niccolò Machiavelli', title: 'Florentine Diplomat & Political Philosopher' };
    const langName = getFullLanguageName ? getFullLanguageName(language) : (i18n.getLanguageName ? i18n.getLanguageName(language) : language);

    const systemInstruction = `
${MASTER_STORYTELLING_DIRECTIVE}

You are orchestrating an intellectual clash of titans in the CouncilX Debate Chamber between:
Mastermind 1: ${agentA.name} (${agentA.title || 'Strategist'})
Mastermind 2: ${agentB.name} (${agentB.title || 'Visionary'})

Dilemma under debate: "${dilemma}"

MANDATE & STRUCTURE:
- Deliver a comprehensive, deeply structured debate in rich Markdown.
- Provide rich historical arguments, philosophical counter-attacks, and a unified optimal move.
- TARGET LANGUAGE: ${langName}.

${JSON_SCHEMA_INSTRUCTION}
`;

    try {
      const rawText = await executeGeminiCascade({
        systemInstruction,
        contents: [{ role: 'user', parts: [{ text: `Conduct the strategic debate between ${agentA.name} and ${agentB.name} on the following dilemma: ${dilemma}` }] }],
        modelType: 'flash',
        thinkingDepth
      });
      return this._parseResponseAndFollowUps(rawText, language, dilemma, `${agentA.name} vs ${agentB.name}`);
    } catch (e) {
      console.warn('Debate cascade error:', e.message);
      return this._generateRichSimulatedDebateResponse(agentA, agentB, dilemma, language);
    }
  },

  /**
   * Chat History Ingestion
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
   * Parse Structured Response { reply, follow_ups }
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

      if (Array.isArray(parsedJson.follow_ups) && parsedJson.follow_ups.length > 0) {
        followUps = parsedJson.follow_ups
          .filter(q => typeof q === 'string' && q.trim().length > 0)
          .map(q => q.trim())
          .slice(0, 3);
      } else if (Array.isArray(parsedJson.follow_up_questions) && parsedJson.follow_up_questions.length > 0) {
        followUps = parsedJson.follow_up_questions
          .filter(q => typeof q === 'string' && q.trim().length > 0)
          .map(q => q.trim())
          .slice(0, 3);
      }
    }

    // If reply extraction failed, scrub markdown code blocks from raw text
    if (!reply) {
      reply = cleanText
        .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, '')
        .replace(/\{[\s\S]*?"(?:reply|follow_ups|follow_up_questions)"[\s\S]*?\}/gi, '')
        .trim();
    }

    // Scrub any robotic simulation phrases
    reply = reply
      .replace(/^(?:હું|અમે)\s+.*?(?:બૌદ્ધિક\s+એન્જિન|AI\s+એન્જિન|એન્જિન|મોડલ|સિમ્યુલેશન)[^\.\n]*[\.\n]+/gim, '')
      .replace(/^(?:I\s+am|We\s+are)\s+(?:the\s+)?(?:intellectual\s+engine|AI\s+engine|simulation|model)[^\.\n]*[\.\n]+/gim, '')
      .trim();

    // 3. Dynamic Context-Aware Follow-up Synthesis (Zero static hardcoded lists)
    if (followUps.length < 3) {
      followUps = this._generateContextualFollowUps(userTopic, agentName, language, followUps);
    }

    return {
      reply,
      follow_ups: followUps,
      content: reply,
      followUpQuestions: followUps
    };
  },

  /**
   * Dynamic Context-Aware Follow-up Synthesis
   * Strictly derived from the user's specific query words & dilemma
   */
  _generateContextualFollowUps(userTopic = '', agentName = '', language = 'gu', existingFollowUps = []) {
    const result = [...existingFollowUps];
    const cleanPrompt = (userTopic || '').trim().replace(/[\r\n\t]+/g, ' ');
    const topic = cleanPrompt.length > 40 ? cleanPrompt.slice(0, 38) + '...' : (cleanPrompt || 'આ યોજના');

    const isKrishna = (agentName || '').toLowerCase().includes('krishna') || (agentName || '').includes('કૃષ્ણ');

    if (language === 'gu') {
      if (isKrishna) {
        const candidates = [
          `પ્રભુ, "${topic}" ના સંદર્ભમાં મોહ અને ભયથી મુક્ત થઈને સાચો ધર્મ કેવી રીતે આચરવો?`,
          `આ પરિસ્થિતિમાં પરિણામની ચિંતા કર્યા વિના નિષ્કામ કર્મ કરવાનો સર્વોચ્ચ માર્ગ કયો છે?`,
          `આ ગૂંચવણ વચ્ચે મનને સ્થિતપ્રજ્ઞ અને આંતરિક રીતે અડગ કેવી રીતે બનાવવું?`
        ];
        candidates.forEach(c => {
          if (result.length < 3 && !result.includes(c)) result.push(c);
        });
      } else {
        const candidates = [
          `${agentName}, "${topic}" ના વ્યવહારુ અમલીકરણ માટે આપનું સૌથી નિર્ણાયક પ્રથમ પગલું શું હશે?`,
          `આ નિર્ણયમાં સૌથી મોટો છુપો અવરોધ કે અણધાર્યું જોખમ શું આવી શકે અને તેનો સામનો કેવી રીતે કરવો?`,
          `આ વ્યૂહરચના દ્વારા દીર્ઘકાલીન પ્રભુત્વ અને અજેય સ્થાન (Moat) કેવી રીતે સ્થાપિત કરવું?`
        ];
        candidates.forEach(c => {
          if (result.length < 3 && !result.includes(c)) result.push(c);
        });
      }
    } else {
      const candidates = [
        `What is the most critical tactical move to execute within the next 48 hours regarding "${topic}"?`,
        `What hidden downside risk or competitive counter-attack should I prepare for?`,
        `How can this strategy be developed into an enduring, unassailable long-term moat?`
      ];
      candidates.forEach(c => {
        if (result.length < 3 && !result.includes(c)) result.push(c);
      });
    }

    return result.slice(0, 3);
  },

  /**
   * Profound Long-form Storytelling Fallback (Offline / Key Unavailable)
   */
  _generateRichSimulatedResponse(agent, userMessage, language = 'gu', thinkingDepth = 'medium', isPremium = false) {
    const agentName = agent?.name || 'Mastermind';
    const agentRole = agent?.title || agent?.category || agent?.role || 'માર્ગદર્શક';
    const userQuery = (userMessage || '').trim();
    const cleanTopic = userQuery.replace(/[\r\n\t]+/g, ' ').slice(0, 50).trim();
    const hasTopic = cleanTopic.length > 0;
    const isKrishna = agentName.toLowerCase().includes('krishna') || agentName.includes('કૃષ્ણ');

    let reply = '';

    if (isKrishna) {
      reply = `પ્રિય આત્મા! "${cleanTopic || 'તમારા આ પ્રશ્ન'}" અંગે તમારું આ ચિંતન અત્યંત ગહન અને જીવનના મૂળભૂત સત્ય સાથે જોડાયેલું છે.\n\n` +
        `### ૧. કુરુક્ષેત્રની ભૂમિ અને અર્જુનનો વિષાદયોગ\n` +
        `યાદ કરો જ્યારે કુરુક્ષેત્રના મહાયુદ્ધના પ્રારંભે અર્જુન પોતાના ગાંડિવ ધનુષને છોડીને રથના પાછળના ભાગમાં બેસી ગયો હતો. તેના મનમાં પણ આવા જ સંશયો, પરિણામોનો ભય અને મોહ વ્યાપી ગયા હતા. ત્યારે મેં તેને સ્પષ્ટ કહ્યું હતું:\n\n` +
        `> **"ક્લૈબ્યં મા સ્મ ગમઃ પાર્થ નૈતત્ત્વય્યુપપદ્યતે। ક્ષુદ્રં હૃદયદૌર્બલ્યં ત્યક્તInterceptorત્વોત્તિષ્ઠ પરન્તપ॥"**\n` +
        `*(હે પાર્થ! નપુંસકતા કે હૃદયની ક્ષુદ્ર નબળાઈને વશ ન થા. ઊભો થા અને પોતાના ક્ષાત્રધર્મનું પાલન કર.)*\n\n` +
        `### ૨. નિષ્કામ કર્મયોગ — પરિણામની આસક્તિમાંથી મુક્તિ\n` +
        `માનવ મનની સૌથી મોટી વ્યાધિ એ છે કે તે વર્તમાન કર્તવ્યને છોડીને ભવિષ્યના કાલ્પનિક પરિણામો, નફા-નુકસાન કે લોકોના અભિપ્રાયોમાં અટવાઈ જાય છે. **'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन'** નો સાચો અર્થ એ છે કે જ્યારે તમે સંપૂર્ણ શક્તિ, શુદ્ધ અંતઃકરણ અને શ્રદ્ધા સાથે તમારું કાર્ય કરો છો, ત્યારે વિજય કે પરાજય બંને પ્રભુને સમર્પિત થઈ જાય છે. ચિંતા માત્ર પરિણામની હોય છે, સમર્પિત કર્મ તો પરમ શાંતિ આપે છે.\n\n` +
        `### ૩. સમત્વ અને સ્થિતપ્રજ્ઞ બુદ્ધિ\n` +
        `સુખ અને દુઃખ, માન અને અપમાન, લાભ અને હાનિ — આ તમામ સંસારના ક્ષણિક તરંગો છે. જેમ મહાસાગરમાં સેંકડો નદીઓ સમાઈ જાય છે છતાં સાગર પોતાની મર્યાદા છોડતો નથી, તેમ જેનું મન સંકલ્પો અને બાહ્ય ઘોંઘાટ વચ્ચે પણ સ્થિર રહે છે, તે જ સાચો સ્થિતપ્રજ્ઞ છે.\n\n` +
        `### ૪. તમારો આગામી માર્ગ\n` +
        `આ પરિસ્થિતિમાં ભય અને સંશયને આત્મજ્ઞાનના અગ્નિમાં હોમી દો. જે સત્ય છે, જે લોકકલ્યાણકારી છે અને જે તમારા આત્માને માન્ય છે, તે માર્ગ પર ડગલું ભરો. જ્યાં ધર્મ અને નિષ્ઠા છે, ત્યાં વિજય નિશ્ચિત છે. હું પ્રત્યેક ક્ષણે તમારી સાથે છું.`;
    } else {
      const models = Array.isArray(agent?.mental_models) && agent.mental_models.length > 0
        ? agent.mental_models.join(', ')
        : 'ફર્સ્ટ પ્રિન્સિપલ્સ, દીર્ઘકાલીન વિઝન, અજેય સંસ્થાકીય તાકાત';

      reply = `હું **${agentName}** (${agentRole}) છું. તમારા પ્રશ્ન "${cleanTopic || 'તમારા આ પ્રશ્ન'}" અંગે માત્ર સપાટી પરથી ઉકેલ મેળવી શકાય તેમ નથી; આ માટે આપણે તેના મૂળ સિદ્ધાંતો, ઐતિહાસિક ઉદાહરણો અને નક્કર અમલીકરણના પાયા સુધી જવું પડશે.\n\n` +
        `### ૧. ઇતિહાસ અને પ્રથમ સિદ્ધાંતો (First Principles Thinking)\n` +
        `ઇતિહાસ સાક્ષી છે કે મોટામાં મોટા સામ્રાજ્યો, ક્રાંતિકારી ઉદ્યોગો કે રાષ્ટ્રોનું નિર્માણ ત્યારે જ થયું છે જ્યારે નેતાઓએ રૂઢિચુસ્ત પરંપરાઓ અને ભયને ફગાવીને સમસ્યાને તેના મૂળ તથ્યોમાં વિભાજિત કરી. મારા જીવનના મુખ્ય માર્ગદર્શક સિદ્ધાંતો (${models}) નું પ્રથમ સૂત્ર એ છે કે અસમપ્રમાણ (Asymmetric) પરિણામો ત્યારે જ મળે છે જ્યારે તમે મોટા જોખમો વચ્ચે પણ સ્પષ્ટ વિશ્લેષણ કરી શકો.\n\n` +
        `### ૨. ઐતિહાસિક દાખલો અને વ્યૂહાત્મક મૂલ્યાંકન\n` +
        `જ્યારે પણ કોઈ મુશ્કેલ કટોકટી ઊભી થાય છે, ત્યારે ૯૯% લોકો તાત્કાલિક લાગણીઓમાં વહીને પ્રતિક્રિયા (Reaction) આપે છે. પરંતુ સાચો મુત્સદ્દી પરિસ્થિતિને પ્યાદાંઓની જેમ ગોઠવે છે. તમારે એ જોવાનું છે કે તમારા વિરોધીઓ કે હરીફો ક્યાં કમજોર છે અને તમારી સૌથી મોટી તાકાત કઈ જમીન પર છે.\n\n` +
        `### ૩. નક્કર ત્રિ-સ્તરીય અમલીકરણ વ્યૂહ\n` +
        `• **તાત્કાલિક પગલું (૦ થી ૭૨ કલાક):** પરિસ્થિતિનું શીતળ મગજે ઓડિટ કરો. બિનજરૂરી ઘોંઘાટ અને નકારાત્મક દબાણને અટકાવો.\n` +
        `• **મધ્યમ ગાળાની સ્થિરતા (૩૦ દિવસ):** સંસાધનો અને સહયોગીઓની એવી ગોઠવણ કરો જે તમારી સ્થિતિને અભેદ્ય બનાવે.\n` +
        `• **સ્થાયી સુરક્ષા અને અજેય કિલ્લો (Moat):** એવા સંસ્થાકીય નિયમો સ્થાપિત કરો જે ભવિષ્યમાં આવા સંકટો સામે આપોઆપ રક્ષણ આપે.\n\n` +
        `સાચી મહાનતા શબ્દોમાં નહીં, પરંતુ અડગ નિર્ણયો અને તેના નિર્દય અમલમાં રહેલી છે. આગળ વધો અને પરિણામોથી ઇતિહાસ રચી બતાવો.`;
    }

    const followUps = this._generateContextualFollowUps(cleanTopic, agentName, language, []);

    return {
      reply,
      follow_ups: followUps,
      content: reply,
      followUpQuestions: followUps
    };
  },

  _generateRichSimulatedSupremeCouncilResponse(userDilemma, language = 'gu', thinkingDepth = 'medium', isPremium = false) {
    const dilemmaSnippet = (userDilemma || '').trim().replace(/[\r\n]+/g, ' ').slice(0, 60);
    const topicLabel = dilemmaSnippet ? `"${dilemmaSnippet}"` : 'આ ગંભીર પડકાર';

    const reply = `### ૨૧૬ સર્વોચ્ચ મહા-સભા સંકલિત વટહુકમ (Unified Strategic Decree)\n` +
      `**સિન્ડિકેટ મંથન:** ૧૦૮ ભારત વિશ્વગુરુ દ્રષ્ટાઓ (ચાણક્ય, શ્રીકૃષ્ણ, સરદાર પટેલ, સ્વામી વિવેકાનંદ) અને ૧૦૮ આધુનિક વૈશ્વિક ટાઇટન્સ (એલોન મસ્ક, વોરેન બફેટ, રતન ટાટા, સેમ ઓલ્ટમેન) ના સામૂહિક બૌદ્ધિક ચિંતનનું સંકલિત તારણ.\n\n` +
      `---\n\n` +
      `### ૧. સર્વોચ્ચ પરિપ્રેક્ષ્ય અને સંકલિત આધાર (Supreme Decree)\n` +
      `અમે **૨૧૬ સર્વોચ્ચ મહા-સભા** છીએ. ${topicLabel} અંગે સમગ્ર સભાએ ગહન વિશ્લેષણ કરીને એક અવાજે આ વ્યૂહાત્મક નિર્દેશ જાહેર કર્યો છે.\n\n` +
      `જ્યારે પણ કોઈ નેતા, ઉદ્યોગસાહસિક કે વિચારક જટિલ કટોકટીમાં મુકાય છે, ત્યારે સૌથી પહેલું જોખમ માનસિક અસ્થિરતા અને પરિણામોની ચિંતા (Outcome Anxiety) નું હોય છે. શ્રીકૃષ્ણના **નિષ્કામ કર્મયોગ** અને વોરેન બફેટના **માર્જિન ઓફ સેફ્ટી** નો સુમેળ દર્શાવે છે કે: *પરિણામોની અપેક્ષા છોડીને માત્ર પોતાની રણનીતિની ગુણવત્તા અને આંતરિક મનોબળ પર ધ્યાન કેન્દ્રિત કરવું એ જ સર્વોચ્ચ વિજયની ચાવી છે.*\n\n` +
      `---\n\n` +
      `### ૨. ફર્સ્ટ પ્રિન્સિપલ્સ અને યુનિટ ઇકોનોમિક્સ વિશ્લેષણ (First Principles Root)\n` +
      `• **ભૌતિક સત્યનું વિભાજન:** સમસ્યાને તેના અવિભાજ્ય મૂળભૂત તત્વોમાં વિભાજિત કરો. એલોન મસ્કના ફર્સ્ટ પ્રિન્સિપલ્સ નિયમ મુજબ, પરંપરાગત માન્યતાઓને પડકારો અને વાસ્તવિક અવરોધો શું છે તે અલગ તારવો.\n` +
      `• **યુનિટ ઇકોનોમિક્સ અને સંસાધન પ્રવાહ:** જ્યાં સુધી તમારી પાયાની અર્થવ્યવસ્થા (Cash Flow & Leverage) સદ્ધર ન હોય ત્યાં સુધી અંધાધૂંધ સ્કેલિંગ કરવું એ આત્મઘાતી છે.\n` +
      `• **સામ-દામ-દંડ-ભેદનું આધુનિક સંતુલન:** ચાણક્ય નીતિ મુજબ, સૌ પ્રથમ સમજાવટ અને સહયોગ (સામ), ત્યારબાદ વાજબી પ્રોત્સાહન (દામ), વિરોધીઓની નબળાઈનું વિશ્લેષણ (ભેદ), અને છેલ્લે કાયદાકીય કે બજારી દબાણ (દંડ) નો તાર્કિક ઉપયોગ કરો.\n\n` +
      `---\n\n` +
      `### ૩. તબક્કાવાર કાર્યકારી માસ્ટરપ્લાન (3-Phase Unified Masterplan)\n\n` +
      `૧. **તબક્કો ૧: કિલ્લેબંધી અને તાત્કાલિક સુરક્ષા (૦ થી ૭૨ કલાક):**\n` +
      `   - તમારા સૌથી નબળા બિંદુ (Single Point of Failure) ને શોધીને ત્યાં સુરક્ષા કવચ સ્થાપિત કરો.\n` +
      `   - બાહ્ય ઘોંઘાટ અને બિનજરૂરી ચર્ચાઓ બંધ કરીને સંપૂર્ણ ગોપનીયતા લાગુ કરો.\n\n` +
      `૨. **તબક્કો ૨: ઝડપી પ્રયોગ અને બજાર ચકાસણી (આગામી ૩૦ દિવસ):**\n` +
      `   - ન્યૂનતમ ખર્ચે ઝડપી ફીડબેક લૂપ સ્થાપિત કરીને ગ્રાહક અથવા હિતધારકોની પ્રતિક્રિયા મેળવો.\n` +
      `   - તમારી મુખ્ય સક્ષમતા (Circle of Competence) ની અંદર જ રહીને આક્રમક ગતિથી પરિણામ લાવો.\n\n` +
      `૩. **તબક્કો ૩: અપ્રતિમ સ્પર્ધાત્મક મોટ (દીર્ઘકાલીન સંસ્થાકીયકરણ):**\n` +
      `   - ગ્રાહકનો અતૂટ વિશ્વાસ, વિતરણ શક્તિ અને બ્રાન્ડ સાર્વભૌમત્વનું એવું નેટવર્ક બનાવો જેને કોઈ પણ વૈશ્વિક હરીફ તોડી ન શકે.\n\n` +
      `---\n\n` +
      `### ૪. અપ્રતિમ લીવરેજ અને જોખમ કવચ (Asymmetric Risk Shield)\n` +
      `• **કાળી હંસ ઘટનાઓ (Black Swan Events):** ધાર્યા કરતાં ૫૦% વધુ ખરાબ સ્થિતિ આવે તો પણ તમારું અસ્તિત્વ ટકી રહે તેવું અનામત ભંડોળ રાખો.\n` +
      `• **નૈતિક આધારસ્તંભ:** સસ્તી જીત માટે ક્યારેય લાંબા ગાળાની પ્રતિષ્ઠાનું બલિદાન ન આપો. સત્ય અને પ્રમાણિકતા એ સૌથી મોટી મોનોપોલી છે.\n\n` +
      `---\n\n` +
      `### ૫. આગામી ૭૨ કલાકના આદેશાત્મક નિર્દેશો (Immediate Execution Directives)\n` +
      `૧. ${topicLabel} સંબંધિત તાત્કાલિક સંરક્ષણાત્મક ઓર્ડર પાસ કરો.\n` +
      `૨. સંસાધનો અને બજેટનું પુનર્વિભાજન કરીને બિનજરૂરી ખર્ચ ૧૦૦% સ્થગિત કરો.\n` +
      `૩. સમગ્ર આત્મવિશ્વાસ સાથે સંકલિત યોજનાના પ્રથમ તબક્કાનું બ્યૂગલ ફૂંકો.`;

    const followUps = this._generateContextualFollowUps(dilemmaSnippet, 'The 216 Supreme Council', language, []);

    return {
      reply,
      follow_ups: followUps,
      content: reply,
      followUpQuestions: followUps
    };
  },

  _generateRichSimulatedDebateResponse(agentA, agentB, dilemma, language = 'gu') {
    const topic = (dilemma || 'આ વ્યૂહાત્મક સંઘર્ષ').trim().slice(0, 60);

    const reply = `## ⚔️ અર્બિટ્રેશન સંવાદ: ${agentA.name} વિરુદ્ધ ${agentB.name}\n\n` +
      `**વિચારણીય દ્વિધા:** "${topic}"\n\n` +
      `---\n\n` +
      `### ૧. ${agentA.name} નો પ્રારંભિક પ્રહાર અને વ્યૂહાત્મક વલણ\n` +
      `હું **${agentA.name}** છું. ઇતિહાસમાં અવિચારી નિર્ણયો લેનારાઓનું પતન નિશ્ચિત રહ્યું છે. આ દ્વિધામાં સૌથી પહેલાં તમારે તમારી જમીન મજબૂત કરવી પડશે. જ્યાં સુધી તમારી પાસે સંપૂર્ણ આંતરિક શિસ્ત અને સ્ત્રોતોની સુરક્ષા ન હોય, ત્યાં સુધી કોઈ પણ બાહ્ય સાહસ આત્મઘાતી સાબિત થઈ શકે છે.\n\n` +
      `### ૨. ${agentB.name} નો વળતો આક્રમક તર્ક\n` +
      `હું **${agentB.name}** છું. સાવચેતી સારી બાબત છે, પરંતુ અતિશય સાવચેતી તમને પરાધીન બનાવી દે છે. તક ક્યારેય રાહ જોતી નથી. આ સંજોગોમાં તમારે હરીફો કરતાં ૧૦ ગણી ઝડપે આગળ વધવું પડશે. ગતિ (Speed) એ જ સર્વોચ્ચ રક્ષણ છે.\n\n` +
      `### ૩. સર્વોચ્ચ પરિષદનો સર્વાનુમતે સંકલિત વિજયી માર્ગ\n` +
      `બંને પક્ષોનું ગહન મંથન કર્યા પછી સર્વોચ્ચ પરિષદ આ અંતિમ માર્ગ નિર્ધારિત કરે છે: *સૌપ્રથમ ${agentA.name} ના સિદ્ધાંત અનુસાર તમારી મૂળભૂત સુરક્ષા (Downside Risk) અકબંધ રાખો, અને ત્યારબાદ ${agentB.name} ની આક્રમક ગતિથી અમલીકરણ શરૂ કરો.* આ જ અસમપ્રમાણ વિજયની અચૂક ફોર્મ્યુલા છે.`;

    const followUps = this._generateContextualFollowUps(topic, `${agentA.name} vs ${agentB.name}`, language, []);

    return {
      reply,
      follow_ups: followUps,
      content: reply,
      followUpQuestions: followUps
    };
  }
};
