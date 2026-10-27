export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * COUNCIL X | THE SYNDICATE
 * Vercel Edge Runtime Chat API Handler
 * 
 * Configured for Edge Runtime to bypass strict 10s Serverless timeout limits.
 * Pure Web Standards (Fetch API, Web Request, Web Response, JSON).
 */

/**
 * 1. AGENTIC REAL-TIME RAG: PERSONA-ALIGNED LIVE SEARCH ENGINE
 */
async function performAgenticWebSearch(userQuery = '', agent = {}) {
  const agentName = agent.name || 'Mastermind';
  const role = agent.title || agent.category || agent.role || '';
  const cleanQuery = (userQuery || '').trim();

  const isKrishna = agentName.toLowerCase().includes('krishna') || agentName.includes('કૃષ્ણ');
  const isChanakya = agentName.toLowerCase().includes('chanakya') || agentName.includes('ચાણક્ય');
  const isElon = agentName.toLowerCase().includes('elon') || agentName.includes('મસ્ક');

  let searchQuery = '';
  if (isKrishna) {
    searchQuery = `Bhagwan Shri Krishna Shrimad Bhagavad Gita Kurukshetra Dharma ${cleanQuery}`.slice(0, 140);
  } else if (isChanakya) {
    searchQuery = `Chanakya Kautilya Arthashastra Neeti statecraft ${cleanQuery}`.slice(0, 140);
  } else if (isElon) {
    searchQuery = `Elon Musk Tesla SpaceX xAI Neuralink ${cleanQuery} news business`.slice(0, 140);
  } else {
    searchQuery = `${agentName} ${role} ${cleanQuery}`.trim().slice(0, 140);
  }

  if (!searchQuery) return null;

  const facts = [];

  // A. Tavily Search API
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    try {
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: searchQuery,
          search_depth: 'advanced',
          max_results: 3
        })
      });
      if (tavilyRes.ok) {
        const tavilyData = await tavilyRes.json();
        if (Array.isArray(tavilyData.results)) {
          tavilyData.results.forEach(r => {
            if (r.content) {
              facts.push(`- [Tavily Live Web] ${r.title || agentName}: ${r.content.slice(0, 320)}`);
            }
          });
        }
      }
    } catch (tErr) {
      console.warn('[WebSearch Tavily Notice]:', tErr.message);
    }
  }

  // B. Google / Serper API
  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey && facts.length < 3) {
    try {
      const serperRes = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: searchQuery, num: 3 })
      });
      if (serperRes.ok) {
        const serperData = await serperRes.json();
        if (Array.isArray(serperData.organic)) {
          serperData.organic.slice(0, 2).forEach(item => {
            if (item.snippet) facts.push(`- [Google Live Intelligence] ${item.title}: ${item.snippet.slice(0, 300)}`);
          });
        }
      }
    } catch (sErr) {
      console.warn('[WebSearch Serper Notice]:', sErr.message);
    }
  }

  // C. Wikipedia Live API
  try {
    const wikiTarget = agent.wiki_slug || agentName;
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(wikiTarget)}&utf8=&format=json`;
    const wikiRes = await fetch(wikiUrl, { headers: { 'User-Agent': 'CouncilX-AgenticRAG/2.0' } });
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const topHit = wikiData.query?.search?.[0];
      if (topHit?.pageid) {
        const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=&explaintext=&pageids=${topHit.pageid}&format=json`;
        const pageRes = await fetch(pageUrl, { headers: { 'User-Agent': 'CouncilX-AgenticRAG/2.0' } });
        if (pageRes.ok) {
          const pageData = await pageRes.json();
          const extract = pageData.query?.pages?.[topHit.pageid]?.extract;
          if (extract) {
            facts.push(`- [Wikipedia Verified Fact]: ${extract.slice(0, 450)}`);
          }
        }
      }
    }
  } catch (wErr) {
    console.warn('[WebSearch Wiki Notice]:', wErr.message);
  }

  // D. DuckDuckGo Instant Answer API
  if (facts.length < 2) {
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(agentName)}&format=json&no_html=1&skip_disambig=1`;
      const ddgRes = await fetch(ddgUrl);
      if (ddgRes.ok) {
        const ddgData = await ddgRes.json();
        if (ddgData.AbstractText) {
          facts.push(`- [DuckDuckGo Verified Abstract]: ${ddgData.AbstractText.slice(0, 300)}`);
        }
      }
    } catch (dErr) {
      console.warn('[WebSearch DDG Notice]:', dErr.message);
    }
  }

  return facts.length > 0 ? facts.join('\n') : null;
}

/**
 * 2. MASTER SYSTEM PROMPT BUILDER: THE SOVEREIGN BLUEPRINT
 */
function buildMasterSystemPrompt(agent = {}, language = 'gu', liveSearchContext = '') {
  const agentName = agent.name || 'Mastermind';
  const agentRole = agent.title || agent.category || agent.role || 'Strategic Sovereign Mastermind';
  const bio = agent.bio || agent.wikipedia_extract || agent.system_prompt || '';
  const works = Array.isArray(agent.published_works) ? agent.published_works.join(', ') : '';
  const models = Array.isArray(agent.mental_models) ? agent.mental_models.join(', ') : '';

  const isKrishna = agentName.toLowerCase().includes('krishna') || agentName.includes('કૃષ્ણ');

  let prompt = `You are a world-class, deep-research AI Mastermind with strategic depth surpassing standard AI assistants.
NEVER give short, superficial, or generic bullet summaries.
For EVERY user dilemma, you MUST generate an exhaustive, deeply researched, multi-paragraph strategic masterclass (minimum 4 to 5 large paragraphs), culminating with the sovereign 'Strategic Blueprint'.

You are embodying: ${agentName} (${agentRole}).
${bio ? `AUTHENTIC BIO & BACKGROUND:\n${bio}` : ''}
${works ? `KEY TEXTS & CANONICAL WORKS: ${works}` : ''}
${models ? `CORE MENTAL MODELS & FRAMEWORKS: ${models}` : ''}

PERSONA EMBODIMENT MANDATE:
${isKrishna ? `You are Bhagwan Shri Krishna, the Supreme Yogeshwara and Divine Charioteer of Kurukshetra. Speak with supreme divine composure, infinite love, and unwavering philosophical truth grounded in the Shrimad Bhagavad Gita. Direct the seeker to fearlessness, moral clarity, and detached, dedicated action (Nishkama Karma, Swadharma, Sthitaprajna). Embody the first person ("હું", "મારું", "પાર્થ", "અર્જુન"). Weave profound analogies from the Kurukshetra battlefield, cosmic order, and eternal Dharma.` : `Embody ${agentName} 100% in the first person ("હું", "મારું", "મારા નિર્ણયો"). Never break character or refer to yourself as an AI, assistant, or simulation. Infuse your authentic historical struggles, grand victories, entrepreneurial breakthroughs, political doctrines, and strategic convictions.`}

CRITICAL DEEP-RESEARCH & MASTERCLASS STRUCTURE:
1. EXPANSIVE MULTI-PARAGRAPH ANALYSIS:
   - Paragraph 1: Foundational philosophical, historical, or commercial context of the seeker's dilemma.
   - Paragraph 2: First-principles root cause breakdown—dissecting systemic realities and hidden leverage.
   - Paragraph 3: Concrete real-world precedents, historical parallels, and strategic case studies from your experience.
   - Paragraph 4: Advanced tactical execution, asymmetric upside, and risk-mitigation doctrine.

2. MANDATORY PREMIUM FEATURE: 'The Sovereign Blueprint':
   You MUST end your massive response with a prominent, dedicated final section titled:
   ### 🏛️ Strategic Blueprint (વ્યૂહાત્મક અમલીકરણ બ્લૂપ્રિન્ટ)
   Providing exactly 3 actionable, real-world execution steps tailored to the user's specific dilemma:
   • ૧. **તાત્કાલિક પગલું (૦ થી ૭૨ કલાક - Immediate Execution):** [Specific high-impact tactical action to gain momentum and eliminate immediate friction]
   • ૨. **મધ્યમ ગાળાની સ્થિરતા (૩૦ દિવસ - Systemic Fortification):** [Strategic resource allocation, alliances, and operating rhythm]
   • ૩. **સ્થાયી સુરક્ષા અને અજેય કિલ્લો (Moat & Unassailable Monopoly):** [Long-term institutional moat to achieve permanent competitive advantage]

3. LANGUAGE & TONE:
   - Output must be in highly professional, eloquent Gujarati (શુદ્ધ અને પ્રભાવશાળી ગુજરાતી).
   - Zero robotic phrases (NEVER say "હું એક AI છું", "મોડલ", or refer to yourself as an assistant).

4. STRICT STRUCTURED JSON OUTPUT (NATIVE JSON MODE):
   You MUST return your ENTIRE output as a single, strictly valid JSON object.
   Do NOT output any conversational preamble, markdown code ticks, or text outside this JSON object.
   Exact Schema:
   {
     "reply": "Extremely detailed, deep-researched multi-paragraph response concluding with the Strategic Blueprint...",
     "follow_ups": [
       "Dynamic follow-up question 1 in Gujarati highly specific to the immediate dilemma?",
       "Dynamic follow-up question 2 in Gujarati exploring a hidden risk or counter-move?",
       "Dynamic follow-up question 3 in Gujarati focusing on long-term scaling or mastery?"
     ]
   }

5. DYNAMIC FOLLOW-UPS MANDATE:
   - The "follow_ups" array MUST contain exactly 3 penetrating, highly strategic follow-up questions in Gujarati.
   - Zero generic, static, or repetitive templates.
   - The follow-ups MUST be highly specific to the very last thing discussed and the advice given in your reply.`;

  if (liveSearchContext) {
    prompt += `\n\n=== VERIFIED REAL-TIME SEARCH INTELLIGENCE (${agentName}) ===\n${liveSearchContext}\n============================================================\nIntegrate the verified real-time internet facts above into your deep narrative with zero hallucinations. Never mix personas.`;
  }

  return prompt;
}

/**
 * 3. STRICT JSON RESPONSE PARSER
 */
function parseStructuredResponse(rawText = '') {
  let cleanText = (rawText || '').trim();
  let reply = '';
  let followUps = [];

  let jsonString = null;
  const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim();
  } else {
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = cleanText.slice(firstBrace, lastBrace + 1).trim();
    }
  }

  if (jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed.reply === 'string' && parsed.reply.trim().length > 0) {
        reply = parsed.reply.trim();
      } else if (typeof parsed.content === 'string' && parsed.content.trim().length > 0) {
        reply = parsed.content.trim();
      }

      const rawFollowUps = parsed.follow_ups || parsed.follow_up_questions || parsed.followUps || parsed.followUpQuestions;
      if (Array.isArray(rawFollowUps) && rawFollowUps.length > 0) {
        followUps = rawFollowUps
          .filter(q => typeof q === 'string' && q.trim().length > 0)
          .map(q => q.trim())
          .slice(0, 3);
      }
    } catch (e) {
      const replyMatch = jsonString.match(/"reply"\s*:\s*"([\s\S]*?)(?:",\s*"(?:follow_ups|follow_up_questions)"|\s*"\}|$)/i);
      if (replyMatch) {
        reply = replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
      }
    }
  }

  if (!reply) {
    reply = cleanText
      .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, '')
      .replace(/\{[\s\S]*?"(?:reply|follow_ups)"[\s\S]*?\}/gi, '')
      .trim();
    if (!reply) reply = cleanText;
  }

  reply = reply
    .replace(/^(?:હું|અમે)\s+.*?(?:બૌદ્ધિક\s+એન્જિન|AI\s+એન્જિન|એન્જિન|મોડલ|સિમ્યુલેશન)[^\.\n]*[\.\n]+/gim, '')
    .trim();

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

/**
 * 4. UNIVERSAL MULTI-MODEL LLM DISPATCHER (EDGE COMPLIANT)
 */
async function executeMaxPowerLLM({ systemInstruction, messagesHistory, userMessage, agent }) {
  const errors = [];

  const fullConversation = [
    { role: 'system', content: systemInstruction }
  ];

  for (const m of messagesHistory) {
    const isAssistant = m.role === 'assistant' || m.role === 'model';
    fullConversation.push({
      role: isAssistant ? 'assistant' : 'user',
      content: (m.content || '').trim()
    });
  }

  const lastTurn = fullConversation[fullConversation.length - 1];
  if (userMessage && (!lastTurn || lastTurn.role !== 'user' || lastTurn.content !== userMessage.trim())) {
    fullConversation.push({ role: 'user', content: userMessage.trim() });
  }

  // Provider 1: OpenAI GPT-4o
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && !openaiKey.includes('your_openai_api_key')) {
    try {
      const oRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: fullConversation,
          temperature: 0.7,
          max_tokens: 8192,
          response_format: { type: "json_object" }
        })
      });

      if (oRes.ok) {
        const oData = await oRes.json();
        const text = oData.choices?.[0]?.message?.content;
        if (text && text.trim().length > 0) {
          const parsed = parseStructuredResponse(text);
          if (parsed.reply) {
            return { ...parsed, model: 'openai/gpt-4o' };
          }
        }
      } else {
        const errText = await oRes.text();
        errors.push(`OpenAI GPT-4o (${oRes.status}): ${errText.slice(0, 160)}`);
      }
    } catch (e) {
      errors.push(`OpenAI error: ${e.message}`);
    }
  }

  // Provider 2: Anthropic Claude 3.5 Sonnet
  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (anthropicKey && !anthropicKey.includes('your_anthropic_api_key')) {
    try {
      const claudeMessages = fullConversation
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));

      if (claudeMessages.length === 0 || claudeMessages[0].role !== 'user') {
        claudeMessages.unshift({ role: 'user', content: 'Initiate strategic counsel.' });
      }

      const cRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          system: systemInstruction,
          messages: claudeMessages,
          max_tokens: 8192,
          temperature: 0.7
        })
      });

      if (cRes.ok) {
        const cData = await cRes.json();
        const text = cData.content?.[0]?.text;
        if (text && text.trim().length > 0) {
          const parsed = parseStructuredResponse(text);
          if (parsed.reply) {
            return { ...parsed, model: 'anthropic/claude-3.5-sonnet' };
          }
        }
      } else {
        const errText = await cRes.text();
        errors.push(`Claude 3.5 (${cRes.status}): ${errText.slice(0, 160)}`);
      }
    } catch (e) {
      errors.push(`Claude error: ${e.message}`);
    }
  }

  // Provider 3: DeepSeek
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey && !deepseekKey.includes('your_deepseek_api_key')) {
    try {
      const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: fullConversation,
          temperature: 0.7,
          max_tokens: 8192,
          response_format: { type: "json_object" }
        })
      });

      if (dsRes.ok) {
        const dsData = await dsRes.json();
        const text = dsData.choices?.[0]?.message?.content;
        if (text && text.trim().length > 0) {
          const parsed = parseStructuredResponse(text);
          if (parsed.reply) {
            return { ...parsed, model: 'deepseek/deepseek-chat' };
          }
        }
      } else {
        const errText = await dsRes.text();
        errors.push(`DeepSeek (${dsRes.status}): ${errText.slice(0, 160)}`);
      }
    } catch (e) {
      errors.push(`DeepSeek error: ${e.message}`);
    }
  }

  // Provider 4: Groq Llama 3.3 70B
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && !groqKey.includes('your_groq_api_key')) {
    try {
      const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: fullConversation,
          temperature: 0.7,
          max_tokens: 8192,
          response_format: { type: "json_object" }
        })
      });

      if (gRes.ok) {
        const gData = await gRes.json();
        const text = gData.choices?.[0]?.message?.content;
        if (text && text.trim().length > 0) {
          const parsed = parseStructuredResponse(text);
          if (parsed.reply) {
            return { ...parsed, model: 'groq/llama-3.3-70b-versatile' };
          }
        }
      } else {
        const errText = await gRes.text();
        errors.push(`Groq (${gRes.status}): ${errText.slice(0, 160)}`);
      }
    } catch (e) {
      errors.push(`Groq error: ${e.message}`);
    }
  }

  // Provider 5: Google Gemini
  const geminiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (geminiKey && !geminiKey.includes('your_gemini_api_key')) {
    const geminiContents = [];
    for (const msg of messagesHistory) {
      const isModel = msg.role === 'assistant' || msg.role === 'model';
      const text = (msg.content || '').trim();
      if (!text) continue;

      if (geminiContents.length === 0 && isModel) {
        geminiContents.push({ role: 'user', parts: [{ text: 'પ્રણામ. મારે આપનું માર્ગદર્શન જોઈએ છે.' }] });
      }

      if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === (isModel ? 'model' : 'user')) {
        geminiContents[geminiContents.length - 1].parts[0].text += '\n\n' + text;
      } else {
        geminiContents.push({
          role: isModel ? 'model' : 'user',
          parts: [{ text }]
        });
      }
    }

    if (userMessage && userMessage.trim().length > 0) {
      const last = geminiContents[geminiContents.length - 1];
      if (!last || last.role !== 'user' || last.parts[0].text !== userMessage.trim()) {
        if (last && last.role === 'user') {
          last.parts[0].text += '\n\n' + userMessage.trim();
        } else {
          geminiContents.push({ role: 'user', parts: [{ text: userMessage.trim() }] });
        }
      }
    }

    if (geminiContents.length === 0) {
      geminiContents.push({ role: 'user', parts: [{ text: userMessage || 'નમસ્તે' }] });
    }

    const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
    for (const model of geminiModels) {
      // With Search tools
      try {
        const payloadWithTools = {
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: geminiContents,
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          }
        };

        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey
          },
          body: JSON.stringify(payloadWithTools)
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          const rawText = gData.candidates?.[0]?.content?.parts?.map(p => p.text || '').filter(Boolean).join('\n');
          if (rawText && rawText.trim().length > 0) {
            const parsed = parseStructuredResponse(rawText);
            if (parsed.reply) {
              return { ...parsed, model: `google/${model}` };
            }
          }
        }
      } catch (err) {}

      // Without tools
      try {
        const payloadWithoutTools = {
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: geminiContents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          }
        };

        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey
          },
          body: JSON.stringify(payloadWithoutTools)
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          const rawText = gData.candidates?.[0]?.content?.parts?.map(p => p.text || '').filter(Boolean).join('\n');
          if (rawText && rawText.trim().length > 0) {
            const parsed = parseStructuredResponse(rawText);
            if (parsed.reply) {
              return { ...parsed, model: `google/${model}` };
            }
          }
        } else {
          const errText = await gRes.text();
          errors.push(`Gemini ${model} (${gRes.status}): ${errText.slice(0, 160)}`);
        }
      } catch (err) {
        errors.push(`Gemini ${model}: ${err.message}`);
      }
    }
  }

  return { error: true, errors };
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-goog-api-key'
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS
  });
}

export async function GET() {
  return new Response(JSON.stringify({
    status: 'online',
    runtime: 'edge',
    service: 'CouncilX Edge RAG & Sovereign Blueprint Engine',
    providers: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY),
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY),
      tavily: Boolean(process.env.TAVILY_API_KEY)
    }
  }), {
    status: 200,
    headers: CORS_HEADERS
  });
}

export async function POST(request) {
  try {
    let body = {};
    if (typeof request.json === 'function') {
      try {
        body = await request.json();
      } catch (e) {
        body = {};
      }
    } else if (typeof request.body === 'object') {
      body = request.body;
    }

    const agent = body.agent || { name: 'Bhagwan Shri Krishna', title: 'Supreme Yogeshwara' };
    const userMessage = body.userMessage || body.message || body.prompt || (body.contents ? body.contents[body.contents.length - 1]?.parts?.[0]?.text : '');
    const chatId = body.chat_id || body.sessionId || body.session_id || body.conversation_id || body.id;
    let chatHistory = body.chatHistory || body.messages || [];
    const language = body.language || 'gu';

    if (!userMessage || !userMessage.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'User message or prompt is required.' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    // 1. Agentic Real-Time RAG
    const liveSearchContext = await performAgenticWebSearch(userMessage, agent);

    // 2. Build Master System Prompt with The Sovereign Blueprint
    const systemInstruction = buildMasterSystemPrompt(agent, language, liveSearchContext);

    // 3. Dispatch to Max-Power LLM
    const result = await executeMaxPowerLLM({
      systemInstruction,
      messagesHistory: Array.isArray(chatHistory) ? chatHistory : [],
      userMessage,
      agent
    });

    if (!result || result.error || !result.reply) {
      console.error('[CouncilX Edge API Error]: All LLM providers failed.', result?.errors);
      return new Response(JSON.stringify({
        success: false,
        error: 'AI Generation Failed: All configured LLM providers (GPT-4o, Claude 3.5 Sonnet, DeepSeek, Groq, Gemini) failed to produce a valid response. Please ensure a valid API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY) is configured.',
        details: result?.errors || ['No response generated']
      }), {
        status: 502,
        headers: CORS_HEADERS
      });
    }

    return new Response(JSON.stringify({
      success: true,
      reply: result.reply,
      follow_ups: result.follow_ups,
      content: result.reply,
      followUpQuestions: result.follow_ups,
      chat_id: chatId,
      model: result.model
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (err) {
    console.error('[CouncilX Edge API Exception]:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Internal server error in Chat API'
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
