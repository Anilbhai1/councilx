/**
 * COUNCIL X | THE SYNDICATE
 * MAX-POWER AGENTIC CHAT API BACKEND
 * 
 * 1. ZERO HARDCODED FALLBACKS:
 *    - All mock/static responses and static follow-up question candidate lists nuked.
 *    - Upstream LLM failures return true HTTP error status (500/502/503), NEVER a fake 200.
 * 2. AGENTIC REAL-TIME RAG (Web Search Engine):
 *    - Autonomous live internet search strictly tailored to agent's exact persona (Tavily, Google, Wikipedia, DDG).
 *    - Strict persona isolation: Never mix personas.
 * 3. MAX POWER LLM CONFIGURATION (Deep Research Mode):
 *    - Model Cascade: OpenAI GPT-4o -> Anthropic Claude 3.5 Sonnet -> DeepSeek V3 -> Groq Llama 3.3 70B -> Google Gemini 2.0 Flash / Pro.
 *    - max_tokens: 8192
 *    - temperature: 0.7
 *    - 100% Chat History retention passed on every single turn.
 * 4. STRICT JSON MODE & DYNAMIC FOLLOW-UPS:
 *    - Native JSON schema: { "reply": "...", "follow_ups": ["Q1?", "Q2?", "Q3?"] }
 *    - Follow-ups dynamically synthesized strictly from the immediate topic.
 * 5. THE SOVEREIGN BLUEPRINT:
 *    - Final mandatory section: '### 🏛️ Strategic Blueprint (વ્યૂહાત્મક અમલીકરણ બ્લૂપ્રિન્ટ)'
 *    - 3 actionable, real-world execution steps: 0-72h, 30 days, Moat.
 *    - Professional, eloquent Gujarati.
 */

// Pure Web Standards & Edge compatible (fetch, Request, Response, JSON)

/**
 * Helper to explicitly extract and trim API keys from environment variables, request headers, and client payload
 */
function getApiKeys(req = null, body = {}) {
  const reqHeaders = req?.headers;
  const getHeader = (name) => {
    if (!reqHeaders) return '';
    try {
      if (typeof reqHeaders.get === 'function') {
        return reqHeaders.get(name) || reqHeaders.get(name.toLowerCase()) || '';
      }
      return reqHeaders[name] || reqHeaders[name.toLowerCase()] || '';
    } catch (e) {
      return '';
    }
  };

  // Google Gemini Explicit Mapping
  const geminiApiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    getHeader('x-goog-api-key') ||
    getHeader('X-Goog-Api-Key') ||
    body?.clientApiKey ||
    body?.geminiApiKey ||
    body?.apiKey ||
    ''
  ).trim();

  // OpenAI Explicit Mapping
  const openaiApiKey = (
    process.env.OPENAI_API_KEY ||
    getHeader('x-openai-api-key') ||
    (getHeader('authorization') || '').replace(/^Bearer\s+/i, '') ||
    body?.openaiApiKey ||
    ''
  ).trim();

  // Anthropic Claude Explicit Mapping
  const anthropicApiKey = (
    process.env.ANTHROPIC_API_KEY ||
    process.env.CLAUDE_API_KEY ||
    getHeader('x-anthropic-api-key') ||
    body?.anthropicApiKey ||
    ''
  ).trim();

  // Groq Explicit Mapping
  const groqApiKey = (
    process.env.GROQ_API_KEY ||
    getHeader('x-groq-api-key') ||
    body?.groqApiKey ||
    ''
  ).trim();

  // DeepSeek Explicit Mapping
  const deepseekApiKey = (
    process.env.DEEPSEEK_API_KEY ||
    getHeader('x-deepseek-api-key') ||
    body?.deepseekApiKey ||
    ''
  ).trim();

  // Tavily Explicit Mapping
  const tavilyApiKey = (
    process.env.TAVILY_API_KEY ||
    getHeader('x-tavily-api-key') ||
    body?.tavilyApiKey ||
    ''
  ).trim();

  return {
    geminiApiKey,
    openaiApiKey,
    anthropicApiKey,
    groqApiKey,
    deepseekApiKey,
    tavilyApiKey
  };
}

/**
 * 1. AGENTIC REAL-TIME RAG: PERSONA-ALIGNED LIVE SEARCH ENGINE
 * Autonomously fetches real-world intelligence strictly aligned with the Agent's persona
 * (e.g. Elon Musk's latest business moves, or verified historical facts about Shri Krishna).
 * Never mixes personas.
 */
async function performAgenticWebSearch(userQuery = '', agent = {}, tavilyKeyParam = '', feature = '') {
  const agentName = agent.name || 'Mastermind';
  const role = agent.title || agent.category || agent.role || '';
  const cleanQuery = (userQuery || '').trim();

  let searchQuery = '';

  // Feature-specific intelligent search formulations for Oracle of Wealth
  if (feature === 'pre_market' || feature === 'PreMarketProphecy') {
    searchQuery = `GIFT Nifty Indian stock market Asian markets crude oil FII DII global cues ${cleanQuery}`.slice(0, 140);
  } else if (feature === 'syndicate_xray' || feature === 'SyndicateXRay') {
    searchQuery = `${cleanQuery} IPO GMP subscription valuation financials promoter holding balance sheet`.slice(0, 140);
  } else if (feature === 'fo_deathmatch' || feature === 'FODeathmatch') {
    searchQuery = `${cleanQuery} option chain open interest PCR max pain call put strike whale buildup`.slice(0, 140);
  } else if (feature === 'doomsday' || feature === 'DoomsdaySimulator') {
    searchQuery = `${cleanQuery} market crash crisis stress test debt geopolitical risk liquidity shock`.slice(0, 140);
  } else if (feature === 'karmic_future' || feature === 'KarmicFutureScanner') {
    searchQuery = `${cleanQuery} 5 year CAGR secular trend ethical ESG corporate governance moat`.slice(0, 140);
  } else if (feature === 'ceo_interrogator' || feature === 'CEOInterrogator') {
    searchQuery = `${cleanQuery} earnings concall transcript management guidance cash flow forensic reality check`.slice(0, 140);
  } else if (feature === 'redemption' || feature === 'RedemptionEngine') {
    searchQuery = `${cleanQuery} overvalued high PE undervalued alternatives peer comparison low PE high ROCE`.slice(0, 140);
  } else if (feature === 'shadow_dossier' || feature === 'ShadowDossier') {
    searchQuery = `${cleanQuery} institutional block deals bulk deals promoter pledge dark pool insider activity`.slice(0, 140);
  } else {
    const isKrishna = agentName.toLowerCase().includes('krishna') || agentName.includes('કૃષ્ણ');
    const isChanakya = agentName.toLowerCase().includes('chanakya') || agentName.includes('ચાણક્ય');
    const isElon = agentName.toLowerCase().includes('elon') || agentName.includes('મસ્ક');
    const isBuffett = agentName.toLowerCase().includes('buffett') || agentName.includes('બફેટ');
    const isJhunjhunwala = agentName.toLowerCase().includes('jhunjhunwala') || agentName.includes('ઝુનઝુનવાલા');

    if (isKrishna) {
      searchQuery = `Bhagwan Shri Krishna Shrimad Bhagavad Gita Kurukshetra Dharma ${cleanQuery}`.slice(0, 140);
    } else if (isChanakya) {
      searchQuery = `Chanakya Kautilya Arthashastra Neeti statecraft ${cleanQuery}`.slice(0, 140);
    } else if (isElon) {
      searchQuery = `Elon Musk Tesla SpaceX xAI Neuralink ${cleanQuery} news business`.slice(0, 140);
    } else if (isBuffett) {
      searchQuery = `Warren Buffett Berkshire Hathaway value investing moat ${cleanQuery}`.slice(0, 140);
    } else if (isJhunjhunwala) {
      searchQuery = `Rakesh Jhunjhunwala Dalal Street Indian stock market portfolio ${cleanQuery}`.slice(0, 140);
    } else {
      searchQuery = `${agentName} ${role} ${cleanQuery}`.trim().slice(0, 140);
    }
  }

  if (!searchQuery) return null;

  const facts = [];

  // A. Tavily Search API (Deep live internet search)
  const tavilyKey = tavilyKeyParam || process.env.TAVILY_API_KEY;
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

  // B. Google Custom Search / Serper (if configured)
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

  // C. Wikipedia Live API (Strict historical & factual grounding)
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
 * 2. MASTER SYSTEM PROMPT BUILDER: DEEP RESEARCH & THE SOVEREIGN BLUEPRINT & A-TO-Z MASTERCLASS
 */
function buildMasterSystemPrompt(agent = {}, language = 'gu', liveSearchContext = '', options = {}) {
  const agentName = agent.name || 'Mastermind';
  const agentRole = agent.title || agent.category || agent.role || 'Strategic Sovereign Mastermind';
  const bio = agent.bio || agent.wikipedia_extract || agent.system_prompt || '';
  const works = Array.isArray(agent.published_works) ? agent.published_works.join(', ') : '';
  const models = Array.isArray(agent.mental_models) ? agent.mental_models.join(', ') : '';

  const isKrishna = agentName.toLowerCase().includes('krishna') || agentName.includes('કૃષ્ણ');
  const feature = options.feature || '';
  const mode = options.mode || (feature ? 'oracle_of_wealth' : 'single');
  const reportContext = options.reportContext || '';

  const isOracleOfWealth = mode === 'oracle_of_wealth' || 
    Boolean(feature) || 
    agent.category === 'Wealth' || 
    agent.category === 'Stock Market' || 
    agent.category === 'Finance' || 
    agentName.toLowerCase().includes('oracle') ||
    agentName.toLowerCase().includes('wealth');

  let prompt = `You are a world-class, deep-research AI Mastermind with strategic depth surpassing standard AI assistants.
NEVER give short, superficial, or generic bullet summaries.
For EVERY dilemma or financial scan, you MUST generate an exhaustive, deeply researched, multi-paragraph strategic masterclass, concluding with the sovereign 'Strategic Blueprint'.

You are embodying: ${agentName} (${agentRole}).
${bio ? `AUTHENTIC BIO & BACKGROUND:\n${bio}` : ''}
${works ? `KEY TEXTS & CANONICAL WORKS: ${works}` : ''}
${models ? `CORE MENTAL MODELS & FRAMEWORKS: ${models}` : ''}

PERSONA EMBODIMENT MANDATE:
${isKrishna ? `You are Bhagwan Shri Krishna, the Supreme Yogeshwara and Divine Charioteer of Kurukshetra. Speak with supreme divine composure, infinite love, and unwavering philosophical truth grounded in the Shrimad Bhagavad Gita. Direct the seeker to fearlessness, moral clarity, and detached, dedicated action (Nishkama Karma, Swadharma, Sthitaprajna). Embody the first person ("હું", "મારું", "પાર્થ", "અર્જુન"). Weave profound analogies from the Kurukshetra battlefield, cosmic order, and eternal Dharma.` : `Embody ${agentName} 100% in the first person ("હું", "મારું", "મારા નિર્ણયો"). Never break character or refer to yourself as an AI, assistant, or simulation. Infuse your authentic historical struggles, grand victories, market insights, and strategic convictions.`}`;

  if (isOracleOfWealth) {
    prompt += `

=== THE 'A-TO-Z MASTERCLASS' ORACLE OF WEALTH MANDATE ===
You are delivering institutional, billionaire-level market intelligence powered by the Council of 216 Masterminds.
The user is NOT looking for a superficial summary or an indecisive opinion.
Explain the underlying market microstructure, liquidity mechanics, and psychological traps so thoroughly from A to Z that it permanently settles into the user's mind.

You MUST structure your initial intelligence report into these 4 EXACT MANDATORY SECTIONS:

### ⚡ The Verdict (આખરી ચુકાદો)
- State the clear, bold, and brutal truth without sugarcoating.
- Examples: "This is an Operator Trap", "Asymmetric Compounding Moat", "Exit Liquidity Liquidation Event", "Institutional Accumulation Zone".
- Give a ruthless, high-conviction assessment immediately in the first 2 sentences.

### 🧠 The 'Why' (Deep Logic & Market Truth - ગહન તર્ક અને ઊંડું વિશ્લેષણ)
- Step-by-step logical breakdown of WHY this will unfold using real-world data and market psychology.
- Walk the seeker through the entire causal chain from first principles so the logic settles into their subconscious mind.
- Deconstruct the mass retail psychology, operator behavior, valuation multiples, balance sheet realities, and smart money order flow.

### 🚫 The 'Why Not' (Trap Avoidance - શા માટે સામાન્ય લોભમાં ન ફસાવું)
- Explicitly explain why the user should NOT do the obvious retail action (e.g., 'Why you shouldn't average down right now', 'Why buying OTM calls is capital suicide', 'Why promoter PR is masking debt distress').
- Protect the seeker's capital by exposing the hidden risk factors retail traders ignore.

### 🎯 The Final Strategic Move (નિર્ણાયક વ્યૂહાત્મક પગલું)
- A concrete, actionable execution step.
- Clear posture: Entry criteria, allocation sizing (e.g. max 3% portfolio), stop-loss invalidation rules, or immediate capital relocation.

### 🏛️ Strategic Blueprint (વ્યૂહાત્મક અમલીકરણ બ્લૂપ્રિન્ટ)
- ૧. **તાત્કાલિક પગલું (૦ થી ૭૨ કલાક - Immediate Execution):** [Tactical risk-off or entry checklist]
- ૨. **મધ્યમ ગાળાની સ્થિરતા (૩૦ દિવસ - Systemic Fortification):** [Earnings reaction & stop-loss trailing strategy]
- ૩. **સ્થાયી સુરક્ષા અને અજેય કિલ્લો (Moat & Unassailable Monopoly):** [Multi-year valuation upside or capital protection fortress]

=== INTERACTIVE FOLLOW-UP CHAT PROTOCOL ===
If the user asks follow-up questions (e.g., 'What if the government changes this policy?', 'What about crude spikes?', 'Should I buy puts?'):
- Maintain 100% continuous context of the initial report, the stock/market ticker, and the specific Council personas (${agentName}).
- Directly answer the counter-argument, policy change, or edge case with the exact same ruthless, deep-logic market rigor.
- Never reset the persona or deliver generic disclaimers. Speak like a senior billionaire boardroom chair.`;
  } else {
    prompt += `

CRITICAL DEEP-RESEARCH & MASTERCLASS STRUCTURE:
1. EXPANSIVE MULTI-PARAGRAPH ANALYSIS:
   - Paragraph 1: Foundational philosophical, historical, or commercial context of the seeker's dilemma.
   - Paragraph 2: First-principles root cause breakdown—dissecting systemic realities and hidden leverage.
   - Paragraph 3: Concrete real-world precedents, historical parallels, and strategic case studies from your experience.
   - Paragraph 4: Advanced tactical execution, asymmetric upside, and risk-mitigation doctrine.

2. MANDATORY PREMIUM FEATURE: 'The Sovereign Blueprint':
   ### 🏛️ Strategic Blueprint (વ્યૂહાત્મક અમલીકરણ બ્લૂપ્રિન્ટ)
   • ૧. **તાત્કાલિક પગલું (૦ થી ૭૨ કલાક - Immediate Execution):** [Specific high-impact tactical action]
   • ૨. **મધ્યમ ગાળાની સ્થિરતા (૩૦ દિવસ - Systemic Fortification):** [Strategic resource allocation and operating rhythm]
   • ૩. **સ્થાયી સુરક્ષા અને અજેય કિલ્લો (Moat & Unassailable Monopoly):** [Long-term institutional moat]`;
  }

  prompt += `

3. LANGUAGE & TONE:
   - Output must be in highly professional, eloquent Gujarati (શુદ્ધ અને પ્રભાવશાળી ગુજરાતી) or the seeker's chosen language.
   - Zero robotic phrases (NEVER say "હું એક AI છું", "મોડલ", or refer to yourself as an assistant).

4. STRICT STRUCTURED JSON OUTPUT (NATIVE JSON MODE):
   You MUST return your ENTIRE output as a single, strictly valid JSON object.
   Do NOT output any conversational preamble, markdown code ticks, or text outside this JSON object.
   Exact Schema:
   {
     "reply": "Extremely detailed, deep-researched multi-paragraph response with The Verdict, The Why, The Why Not, The Final Strategic Move, and Strategic Blueprint...",
     "follow_ups": [
       "Dynamic follow-up question 1 specific to this exact dilemma/market setup?",
       "Dynamic follow-up question 2 exploring an edge-case risk or macro shock?",
       "Dynamic follow-up question 3 challenging a core assumption or tactical entry?"
     ]
   }

5. DYNAMIC FOLLOW-UPS MANDATE:
   - Exactly 3 penetrating, highly strategic follow-up questions.
   - Zero generic or repetitive templates.`;

  if (reportContext) {
    prompt += `\n\n=== INITIAL REPORT CONTEXT BEING CROSS-EXAMINED ===\n${reportContext}\n====================================================`;
  }

  if (liveSearchContext) {
    prompt += `\n\n=== VERIFIED REAL-TIME SEARCH INTELLIGENCE (${agentName}) ===\n${liveSearchContext}\n============================================================\nIntegrate the verified real-time internet facts above into your deep narrative with zero hallucinations. Never mix personas.`;
  }

  return prompt;
}

/**
 * 3. STRICT JSON RESPONSE PARSER
 * Parses model output into { reply, follow_ups } with zero static hardcoded fallbacks
 */
function parseStructuredResponse(rawText = '') {
  let cleanText = (rawText || '').trim();
  let reply = '';
  let followUps = [];

  // A. Check for ```json ... ``` code block
  let jsonString = null;
  const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim();
  } else {
    // B. Check for raw JSON object { ... }
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
      // Regex extraction fallback if JSON was slightly malformed
      const replyMatch = jsonString.match(/"reply"\s*:\s*"([\s\S]*?)(?:",\s*"(?:follow_ups|follow_up_questions)"|\s*"\}|$)/i);
      if (replyMatch) {
        reply = replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
      }
    }
  }

  // C. If reply is still empty, clean raw text
  if (!reply) {
    reply = cleanText
      .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, '')
      .replace(/\{[\s\S]*?"(?:reply|follow_ups)"[\s\S]*?\}/gi, '')
      .trim();
    if (!reply) reply = cleanText;
  }

  // Clean robotic phrases from reply
  reply = reply
    .replace(/^(?:હું|અમે)\s+.*?(?:બૌદ્ધિક\s+એન્જિન|AI\s+એન્જિન|એન્જિન|મોડલ|સિમ્યુલેશન)[^\.\n]*[\.\n]+/gim, '')
    .trim();

  // If follow-ups were not provided in JSON array, extract any strategic questions dynamically from the reply
  // ZERO static hardcoded lists
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
 * 4. UNIVERSAL MULTI-MODEL LLM DISPATCHER (MAX POWER CONFIGURATION)
 * Tries: OpenAI GPT-4o -> Claude 3.5 Sonnet -> DeepSeek -> Groq Llama 3.3 70B -> Gemini 2.0 Flash / Pro
 * Sets max_tokens: 8192, temperature: 0.7, native JSON mode.
 * Passes 100% full chat history.
 */
async function executeMaxPowerLLM({
  systemInstruction,
  messagesHistory = [],
  userMessage = '',
  agent = {},
  keys = {}
}) {
  const errors = [];

  // Prepare full conversation messages array (100% memory)
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
  const openaiKey = keys.openaiApiKey || process.env.OPENAI_API_KEY || '';
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
        errors.push(`OpenAI GPT-4o error (${oRes.status}): ${errText.slice(0, 160)}`);
      }
    } catch (e) {
      errors.push(`OpenAI GPT-4o network error: ${e.message}`);
    }
  }

  // Provider 2: Anthropic Claude 3.5 Sonnet
  const anthropicKey = keys.anthropicApiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';
  if (anthropicKey && !anthropicKey.includes('your_anthropic_api_key')) {
    try {
      const claudeMessages = fullConversation
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));

      // Ensure first message is user
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
        errors.push(`Anthropic Claude 3.5 Sonnet error (${cRes.status}): ${errText.slice(0, 160)}`);
      }
    } catch (e) {
      errors.push(`Anthropic Claude network error: ${e.message}`);
    }
  }

  // Provider 3: DeepSeek V3 / DeepSeek Chat
  const deepseekKey = keys.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '';
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
        errors.push(`DeepSeek error (${dsRes.status}): ${errText.slice(0, 160)}`);
      }
    } catch (e) {
      errors.push(`DeepSeek network error: ${e.message}`);
    }
  }

  // Provider 4: Groq Llama 3.3 70B Versatile
  const groqKey = keys.groqApiKey || process.env.GROQ_API_KEY || '';
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
        errors.push(`Groq Llama 3.3 error (${gRes.status}): ${errText.slice(0, 160)}`);
      }
    } catch (e) {
      errors.push(`Groq network error: ${e.message}`);
    }
  }

  // Provider 5: Google Gemini API (gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash)
  const geminiConfig = {
    apiKey: (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      keys?.geminiApiKey ||
      ''
    ).trim(),
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
  };
  const geminiKey = geminiConfig.apiKey;
  if (geminiKey && !geminiKey.includes('your_gemini_api_key')) {
    // Format messages for Gemini contents array with strictly alternating user and model turns
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
      // Try 1: with Google Search grounding tool & JSON mode
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

        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
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

      // Try 2: without tools & with JSON mode
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

        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
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
          errors.push(`Gemini ${model} error (${gRes.status}): ${errText.slice(0, 160)}`);
        }
      } catch (err) {
        errors.push(`Gemini ${model} error: ${err.message}`);
      }
    }
  } else {
    errors.push('Gemini API key is not configured in environment variables (checked GEMINI_API_KEY, GOOGLE_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, EXPO_PUBLIC_GEMINI_API_KEY).');
  }

  // If ALL providers failed, return null with detailed errors array
  return { error: true, errors };
}

/**
 * 5. MAIN VERCEL / SERVERLESS CHAT HANDLER
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key, x-openai-api-key, x-anthropic-api-key, x-groq-api-key');

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const keys = getApiKeys(req, body);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      service: 'CouncilX Max-Power Agentic AI RAG & Sovereign Blueprint Engine',
      providers: {
        gemini: Boolean(keys.geminiApiKey),
        openai: Boolean(keys.openaiApiKey),
        anthropic: Boolean(keys.anthropicApiKey),
        deepseek: Boolean(keys.deepseekApiKey),
        groq: Boolean(keys.groqApiKey),
        tavily: Boolean(keys.tavilyApiKey)
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const agent = body.agent || { name: 'Bhagwan Shri Krishna', title: 'Supreme Yogeshwara' };
    const userMessage = body.userMessage || body.message || body.prompt || (body.contents ? body.contents[body.contents.length - 1]?.parts?.[0]?.text : '') || (body.payload?.contents ? body.payload.contents[body.payload.contents.length - 1]?.parts?.[0]?.text : '');
    const chatId = body.chat_id || body.sessionId || body.session_id || body.conversation_id || body.id;
    let chatHistory = body.chatHistory || body.messages || [];
    const language = body.language || 'gu';

    if (!userMessage || !userMessage.trim()) {
      return res.status(400).json({ success: false, error: 'User message or prompt is required.' });
    }

    // 0. Flawless Context Retention: Fetch full historical context from Supabase if missing from request
    if (chatId && (!Array.isArray(chatHistory) || chatHistory.length === 0)) {
      try {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          const { createClient } = require('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: dbMsgs } = await supabase
            .from('messages')
            .select('role, content, created_at')
            .or(`conversation_id.eq.${chatId},chat_id.eq.${chatId}`)
            .order('created_at', { ascending: true });
          if (dbMsgs && dbMsgs.length > 0) {
            chatHistory = dbMsgs;
          }
        }
      } catch (fetchErr) {
        console.warn('[Fetch DB History Notice]:', fetchErr.message);
      }
    }

    const mode = body.mode || (body.feature ? 'oracle_of_wealth' : 'single');
    const feature = body.feature || '';
    const reportContext = body.reportContext || '';

    // 1. Agentic Real-Time RAG: Persona-aligned Web Search
    const liveSearchContext = await performAgenticWebSearch(userMessage, agent, keys.tavilyApiKey, feature);

    // 2. Build Master System Prompt with The Sovereign Blueprint & A-to-Z Masterclass
    const systemInstruction = buildMasterSystemPrompt(agent, language, liveSearchContext, {
      mode,
      feature,
      reportContext
    });

    // 3. Dispatch to Max Power LLM Configuration
    const result = await executeMaxPowerLLM({
      systemInstruction,
      messagesHistory: Array.isArray(chatHistory) ? chatHistory : [],
      userMessage,
      agent,
      keys
    });

    // 4. Handle Result: If LLM failed, return actual error status. ZERO STATIC FALLBACKS!
    if (!result || result.error || !result.reply) {
      console.error('[CouncilX Chat API Error]: All LLM providers failed.', result?.errors);
      const configuredList = [];
      if (keys.geminiApiKey) configuredList.push('Gemini');
      if (keys.openaiApiKey) configuredList.push('OpenAI');
      if (keys.anthropicApiKey) configuredList.push('Anthropic');
      if (keys.groqApiKey) configuredList.push('Groq');
      if (keys.deepseekApiKey) configuredList.push('DeepSeek');

      const configStatus = configuredList.length > 0
        ? `Configured providers (${configuredList.join(', ')}) failed to return valid response.`
        : 'No API keys detected in server environment. Please set GEMINI_API_KEY (or GOOGLE_API_KEY) in Vercel Project Settings > Environment Variables.';

      return res.status(502).json({
        success: false,
        error: `AI Generation Failed: ${configStatus}`,
        details: result?.errors || ['No response generated']
      });
    }

    // 5. Successful Response with Dynamic Follow-ups
    return res.status(200).json({
      success: true,
      reply: result.reply,
      follow_ups: result.follow_ups,
      content: result.reply,
      followUpQuestions: result.follow_ups,
      chat_id: chatId,
      model: result.model
    });
  } catch (err) {
    console.error('[CouncilX Chat API Exception]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error in Chat API'
    });
  }
};
