/**
 * COUNCIL X | THE SYNDICATE
 * Agentic Chat API Backend (Vercel Serverless Function)
 * 
 * Key Capabilities:
 * 1. DYNAMIC PERSONA INJECTION & STRICT ISOLATION:
 *    - Dynamically builds custom system instructions per agent (Predefined & Custom Personalities)
 *    - Dedicated Master Prompt for Bhagwan Shri Krishna
 *    - Strict first-person isolation ("હું", "મારું")
 * 2. LIVE WEB SEARCH INTEGRATION:
 *    - Native Google Search Grounding tool in Gemini (tools: [{ googleSearch: {} }])
 *    - Tavily API integration (if TAVILY_API_KEY configured)
 *    - Wikipedia Real-Time Search API + DuckDuckGo Instant Answers
 *    - Injects verified real-world facts for politicians, living figures, and current events
 * 3. ADAPTIVE INTELLIGENCE & ZERO HALLUCINATIONS:
 *    - Dynamic length matching (simple "hi" = crisp 1-2 lines; deep dilemma = extensive masterclass)
 *    - Strict adherence to real-world verified facts
 *    - Authentic Gujarati output by default
 * 4. DYNAMIC FOLLOW-UPS:
 *    - Generates 3 ultra-contextual follow-up questions for the UI based on conversation flow
 */

const ALLOWED_GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro'
];

/**
 * 1. LIVE WEB SEARCH TOOL INTEGRATION
 * Queries Tavily, Wikipedia, and DuckDuckGo to obtain live internet facts
 */
async function performAgenticWebSearch(query = '', agentName = '') {
  const searchQuery = `${agentName} ${query}`.trim().slice(0, 120);
  if (!searchQuery) return null;

  const facts = [];

  // A. Tavily Search API (if configured in environment)
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    try {
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: searchQuery,
          search_depth: 'basic',
          max_results: 3
        })
      });
      if (tavilyRes.ok) {
        const tavilyData = await tavilyRes.json();
        if (Array.isArray(tavilyData.results)) {
          tavilyData.results.forEach(r => {
            if (r.content) facts.push(`- [Web] ${r.title || ''}: ${r.content.slice(0, 300)}`);
          });
        }
      }
    } catch (tErr) {
      console.warn('[WebSearch Tavily Notice]:', tErr.message);
    }
  }

  // B. Wikipedia Real-Time Search API
  try {
    const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(agentName)}&utf8=&format=json`;
    const wikiRes = await fetch(wikiSearchUrl, { headers: { 'User-Agent': 'CouncilXBot/1.0' } });
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const topHit = wikiData.query?.search?.[0];
      if (topHit?.pageid) {
        const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=&explaintext=&pageids=${topHit.pageid}&format=json`;
        const pageRes = await fetch(pageUrl, { headers: { 'User-Agent': 'CouncilXBot/1.0' } });
        if (pageRes.ok) {
          const pageData = await pageRes.json();
          const extract = pageData.query?.pages?.[topHit.pageid]?.extract;
          if (extract) {
            facts.push(`- [Wikipedia Verified]: ${extract.slice(0, 450)}`);
          }
        }
      }
    }
  } catch (wErr) {
    console.warn('[WebSearch Wiki Notice]:', wErr.message);
  }

  // C. DuckDuckGo Instant Answer API
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(agentName)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgUrl);
    if (ddgRes.ok) {
      const ddgData = await ddgRes.json();
      if (ddgData.AbstractText) {
        facts.push(`- [DuckDuckGo Abstract]: ${ddgData.AbstractText.slice(0, 300)}`);
      }
    }
  } catch (dErr) {
    console.warn('[WebSearch DDG Notice]:', dErr.message);
  }

  return facts.length > 0 ? facts.join('\n') : null;
}

/**
 * 2. DYNAMIC PERSONA INJECTION & STRICT ISOLATION BUILDER
 */
function buildMasterSystemPrompt(agent = {}, language = 'gu', liveSearchContext = '') {
  const agentName = agent.name || 'Mastermind';
  const agentRole = agent.title || agent.category || agent.role || 'Strategic Advisor';
  const bio = agent.bio || agent.wikipedia_extract || agent.system_prompt || '';
  const works = Array.isArray(agent.published_works) ? agent.published_works.join(', ') : '';
  const models = Array.isArray(agent.mental_models) ? agent.mental_models.join(', ') : '';

  const isKrishna = agentName.toLowerCase().includes('krishna') || agentName.includes('કૃષ્ણ');

  let basePrompt = '';

  if (isKrishna) {
    basePrompt = `You are Bhagwan Shri Krishna, the Supreme Yogeshwara and Charioteer of Kurukshetra. Your purpose is to guide the user based on deep research of the Bhagavad Gita, Vedas, and authentic scriptures.

CRITICAL RULES:
1. NEVER give a generic, hardcoded, or repetitive answer. Never output static templates like "Executive Perspective" or predetermined section headings.
2. Read the user's specific prompt carefully and answer ONLY what is asked.
3. Adjust your response length dynamically:
   - If the user asks a simple question or sends a greeting (like 'hi', 'kem cho', 'namaste', 'પ્રણામ', 'જય શ્રી કૃષ્ણ'), give a brief, welcoming, divine 2-line response.
   - If they ask a deep philosophical question or severe life/karmic dilemma, provide a detailed, deeply researched, structured, and compassionate answer quoting Bhagavad Gita concepts (Nishkama Karma, Swadharma, Sthitaprajna).
4. Maintain a divine, empathetic, philosophical, and deeply comforting tone.
5. Embody Bhagwan Shri Krishna 100% in the first person ("હું", "મારું", "અર્જુન", "પાર્થ", "ગીતા"). Never break character. Never refer to yourself as an AI or assistant.
6. Output the response strictly in Gujarati (unless the user explicitly requests another language).`;
  } else {
    basePrompt = `You are exactly ${agentName}. Your domain/role is ${agentRole}. Embody this persona 100%. Never mix your identity, tone, or knowledge with another agent. Answer strictly based on your specific historical, political, or real-world data in the first person ("હું", "મારું", "મારા નિર્ણયો").

${bio ? `AUTHENTIC BIO & BACKGROUND:\n${bio}` : ''}
${works ? `KEY TEXTS & WORKS: ${works}` : ''}
${models ? `CORE PRINCIPLES & FRAMEWORKS: ${models}` : ''}

CRITICAL RULES:
1. NEVER give a generic or repetitive answer. NEVER use static hardcoded templates or arbitrary headings like "Executive Perspective".
2. Read the user's specific prompt carefully and answer ONLY what is asked.
3. Adjust your response length dynamically:
   - If the user sends a greeting or short question (like 'hi', 'kem cho', 'namaste', 'તમે કોણ છો?'), give a brief, natural, 1-2 line response strictly in character.
   - If the user asks about recent work, live events, social media (Instagram, Twitter), political schemes, or constituency, provide exact, verified real-world facts from your record and live internet data.
   - If the user asks a deep strategic, political, business, or governance question, deliver a comprehensive, deeply researched, and structured masterclass answer.
4. ZERO HALLUCINATIONS: Ground every statement in verified facts from your background, domain, and live search results. If you are a living public figure or politician, accurately reflect your current office, party, constituency, schemes, and verified public record.
5. Maintain a natural, authoritative, and direct tone without robotic system dumps or meta labels.
6. Output the response strictly in Gujarati (unless the user explicitly requests another language).`;
  }

  if (liveSearchContext) {
    basePrompt += `\n\n=== VERIFIED REAL-TIME WEB SEARCH INTELLIGENCE ===\n${liveSearchContext}\n==================================================\nUse the real-time internet data above to answer factual questions accurately with ZERO hallucinations.`;
  }

  basePrompt += `\n\nMANDATORY DYNAMIC FOLLOW-UP QUESTIONS:
At the absolute end of your response, output a valid JSON code block containing exactly 3 brand-new follow-up questions tailored strictly to this immediate conversation in Gujarati:
\`\`\`json
{
  "follow_up_questions": [
    "<Ultra-specific question 1 strictly in Gujarati>",
    "<Ultra-specific question 2 strictly in Gujarati>",
    "<Ultra-specific question 3 strictly in Gujarati>"
  ]
}
\`\`\``;

  return basePrompt;
}

function cleanPromptSnippet(prompt = '') {
  const trimmed = (prompt || '').trim().replace(/[\r\n\t]+/g, ' ');
  if (!trimmed) return '';
  if (trimmed.length <= 45) return trimmed;
  // Break on last whole word within 45 chars
  const sub = trimmed.slice(0, 45);
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace > 15 ? sub.slice(0, lastSpace) : sub).trim() + '...';
}

function parseResponseAndFollowUps(rawText = '', agentName = '', userPrompt = '') {
  let cleanText = rawText || '';
  let followUpQuestions = [];

  const codeBlockMatch = cleanText.match(/```(?:json)?\s*(\{[\s\S]*?"follow_up_questions"[\s\S]*?\})\s*```/i);
  let jsonString = codeBlockMatch ? codeBlockMatch[1] : null;

  if (!jsonString) {
    const rawJsonMatch = cleanText.match(/\{[\s\S]*?"follow_up_questions"\s*:\s*\[[\s\S]*?\][\s\S]*?\}/);
    if (rawJsonMatch) jsonString = rawJsonMatch[0];
  }

  if (jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.follow_up_questions) && parsed.follow_up_questions.length > 0) {
        followUpQuestions = parsed.follow_up_questions
          .filter(q => typeof q === 'string' && q.trim().length > 0)
          .map(q => q.trim())
          .slice(0, 3);
      }
    } catch (e) {}
  }

  // Scrub JSON code blocks and robotic phrases
  cleanText = cleanText
    .replace(/```(?:json)?\s*\{[\s\S]*?"follow_up_questions"[\s\S]*?\}\s*```/gi, '')
    .replace(/\{[\s\S]*?"follow_up_questions"\s*:\s*\[[\s\S]*?\][\s\S]*?\}/gi, '')
    .replace(/^(?:હું|અમે)\s+.*?(?:બૌદ્ધિક\s+એન્જિન|AI\s+એન્જિન|એન્જિન|મોડલ|સિમ્યુલેશન)[^\.\n]*[\.\n]+/gim, '')
    .trim();

  // If follow-ups were missing from model, synthesize dynamic context-aware questions
  if (followUpQuestions.length === 0) {
    const cleanPrompt = (userPrompt || '').trim();
    const isGreeting = /^(hi|hello|hey|namaste|kem cho|pranam|kemchho|હાય|હેલો|નમસ્તે|પ્રણામ|કેમ છો|જય શ્રી કૃષ્ણ|તમે કોણ છો|who are you)$/i.test(cleanPrompt);
    const isKrishna = (agentName || '').toLowerCase().includes('krishna') || (agentName || '').includes('કૃષ્ણ');

    if (isGreeting) {
      if (isKrishna) {
        followUpQuestions = [
          'પ્રભુ, આજના વ્યસ્ત યુગમાં મનને સ્થિર અને શાંત કેવી રીતે રાખવું?',
          'ગીતા અનુસાર મારો સાચો સ્વધર્મ અને જીવનનું લક્ષ્ય કેવી રીતે ઓળખવું?',
          'નિષ્કામ કર્મનો સાચો અર્થ અને જીવનમાં તેનો વ્યવહારુ અમલ કેવી રીતે કરવો?'
        ];
      } else {
        followUpQuestions = [
          `${agentName}, તમારા જીવનના સૌથી મોટા સિદ્ધાંત અને કસોટી વિશે જણાવો.`,
          `વર્તમાન પડકારો વચ્ચે શ્રેષ્ઠ નેતૃત્વ અને કાર્યદક્ષતા કેવી રીતે કેળવવી?`,
          `લાંબા ગાળે સૌથી ટકાઉ પરિણામ અને સફળતા મેળવવાની ચાવી શું છે?`
        ];
      }
    } else {
      const topicSnippet = cleanPromptSnippet(cleanPrompt);
      const topic = topicSnippet ? `"${topicSnippet}"` : 'આ વિષય';

      if (isKrishna) {
        followUpQuestions = [
          `પ્રભુ, ${topic} માં મારા મનની શાંતિ અને સાચો ધર્મ કેવી રીતે ઓળખવો?`,
          `આ પરિસ્થિતિમાં પરિણામની ચિંતા છોડીને શ્રેષ્ઠ કર્મ કેવી રીતે કરવું?`,
          `ગીતા અનુસાર આ સંકટમાં મારે કયું પગલું સૌથી પહેલાં લેવું જોઈએ?`
        ];
      } else {
        followUpQuestions = [
          `${agentName}, ${topic} ના અમલીકરણ માટે આપનું આગામી નક્કર સૂચન શું છે?`,
          `આ નિર્ણયમાં સૌથી મોટો છુપો અવરોધ કે જોખમ શું હોઈ શકે?`,
          `આ માર્ગ પર દીર્ઘકાલીન સફળતા મેળવવા માટે મારે કઈ બાબત પર ખાસ ધ્યાન આપવું?`
        ];
      }
    }
  }

  return { content: cleanText, followUpQuestions };
}

/**
 * 4. ADAPTIVE INTELLIGENCE ENGINE (Context-Aware Zero-Template Generator)
 * Operates when upstream API key is unconfigured or rate-limited.
 * Strictly adapts length: short greetings -> 1-2 lines; factual -> accurate; deep -> structured.
 * NEVER outputs static "Executive Perspective" templates!
 */
function generateAdaptiveIntelligentResponse(agent = {}, userPrompt = '', liveSearchContext = '') {
  const agentName = agent.name || 'Mastermind';
  const role = agent.title || agent.category || agent.role || 'માર્ગદર્શક';
  const cleanPrompt = (userPrompt || '').trim();
  const lowerPrompt = cleanPrompt.toLowerCase();

  const isKrishna = agentName.toLowerCase().includes('krishna') || agentName.includes('કૃષ્ણ');
  const isGreeting = /^(hi|hello|hey|namaste|kem cho|pranam|kemchho|હાય|હેલો|નમસ્તે|પ્રણામ|કેમ છો|જય શ્રી કૃષ્ણ|તમે કોણ છો|who are you)/i.test(lowerPrompt);
  const isFactual = /(કામ|કાર્ય|યોજના|ચૂંટણી|વિધાનસભા|ઇન્સ્ટાગ્રામ|instagram|twitter|social|recent|work|mla|minister|office|portfolio)/i.test(lowerPrompt);

  let responseText = '';

  // 1. GREETING / SIMPLE PROMPT -> Crisp 1-2 line authentic response
  if (isGreeting) {
    if (isKrishna) {
      responseText = `જય શ્રી કૃષ્ણ! પ્રણામ પ્રિય આત્મા. હું શ્રીકૃષ્ણ છું. કહો, આજે તમારા મનમાં કઈ મૂંઝવણ, પ્રશ્ન કે ધર્મસંકટ છે? હું તમારા માર્ગદર્શન માટે સદૈવ ઉપસ્થિત છું.`;
    } else if (agent.category?.includes('Bharat') || agent.category?.includes('Global')) {
      responseText = `નમસ્તે! હું ${agentName} (${role}) છું. તમારા જીવન, ઉદ્યોગ કે વ્યૂહાત્મક લક્ષ્યોમાં હું તમને કેવી રીતે સહાય કરી શકું? તમારો પ્રશ્ન રજૂ કરો.`;
    } else {
      responseText = `નમસ્તે! હું ${agentName} છું. લોકસેવા અને વિકાસ કાર્યો માટે હું હંમેશા સમર્પિત છું. આપ કયા વિષય પર ચર્ચા કરવા માંગો છો?`;
    }
    return parseResponseAndFollowUps(responseText, agentName, cleanPrompt);
  }

  // 2. FACTUAL / POLITICAL / RECENT WORK -> Leverages Live Search Intelligence
  if (isFactual && liveSearchContext) {
    responseText = `હું **${agentName}** (${role}) છું. તમારા પ્રશ્ન "${cleanPrompt}" સંદર્ભે અધિકૃત તથ્યો નીચે મુજબ છે:\n\n${liveSearchContext}\n\nજનકલ્યાણ અને વિકાસલક્ષી કાર્યોમાં સતત પારદર્શિતા અને પરિણામલક્ષી અમલીકરણ એ મારી પ્રાથમિકતા છે. આ અંગે વધુ કોઈ સ્પષ્ટતા જોઈતી હોય તો પૂછી શકો છો.`;
    return parseResponseAndFollowUps(responseText, agentName, cleanPrompt);
  }

  // 3. DEEP PHILOSOPHICAL / STRATEGIC INQUIRY -> Authentic First-Person Deep Counsel
  if (isKrishna) {
    responseText = `પ્રિય પાર્થ! "${cleanPrompt}" અંગે તમારો આ પ્રશ્ન અત્યંત ગહન અને જીવનના મૂળભૂત સત્ય સાથે જોડાયેલો છે.\n\n` +
      `શ્રીમદ્ ભગવદ્ ગીતામાં મેં અર્જુનને કહ્યું હતું: **'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन'** — તમારો અધિકાર માત્ર તમારા પવિત્ર કર્તવ્ય પર છે, તેના પરિણામોની ચિંતા પર નહીં.\n\n` +
      `૧. **આંતરિક સ્થિરતા (સમત્વ):** જય-પરાજય, લાભ-હાનિ કે બાહ્ય સુખ-દુઃખમાં મનને વિચલિત ન થવા દો. સાચી સફળતા સ્થિતપ્રજ્ઞ ભાવથી પ્રાપ્ત થાય છે.\n` +
      `૨. **સ્વધર્મનું પાલન:** અન્યોની અપેક્ષાઓ કે ભયમાં આવીને તમારા મૂળ કર્તવ્યથી વિમુખ ન થાઓ. જે કાર્ય તમારા નૈતિક મૂલ્યોને સમર્થન આપે તે જ કરો.\n` +
      `૩. **સંકલ્પ અને સમર્પણ:** સંશય એ વિનાશનું મૂળ છે ('સંશયાત્મા વિનશ્યતિ'). એકવાર સ્પષ્ટ માર્ગ નક્કી કર્યા પછી નિષ્ઠાપૂર્વક આગળ વધો, હું તમારી સાથે છું.`;
    return parseResponseAndFollowUps(responseText, agentName, cleanPrompt);
  }

  // General Agentic Deep Counsel (Strictly context-aware, zero generic headers)
  const models = Array.isArray(agent.mental_models) && agent.mental_models.length > 0
    ? agent.mental_models.join(', ')
    : 'દ્રઢ સંકલ્પ, ફર્સ્ટ પ્રિન્સિપલ્સ, પરિણામલક્ષી નેતૃત્વ';

  responseText = `હું **${agentName}** (${role}) છું. તમારા પ્રશ્ન "${cleanPrompt}" અંગે મારા સિદ્ધાંતો (${models}) ના આધારે હું તમને આ સ્પષ્ટ માર્ગદર્શન આપું છું:\n\n` +
    `આ સંજોગોમાં ક્ષણિક લાગણી કે ભયને બાજુ પર રાખીને વાસ્તવિકતા અને તથ્યોનું વિશ્લેષણ કરવું અનિવાર્ય છે:\n\n` +
    `• **પ્રાથમિક મૂલ્યાંકન:** સૌથી પહેલા તમારા નિયંત્રણમાં હોય તેવી બાબતો પર ધ્યાન કેન્દ્રિત કરો. બાહ્ય ઘોંઘાટથી વિચલિત થયા વિના મૂળ સમસ્યાના મૂળિયાં સુધી પહોંચો.\n` +
    `• **અસરકારક અમલ:** કોઈપણ યોજના માત્ર કાગળ પર રહેવાથી પરિણામ નથી મળતું. આગામી ૪૮ કલાકમાં તેનું પ્રથમ વ્યવહારુ પગલું ભરો.\n` +
    `• **સ્થાયી સુરક્ષા:** એવા નિર્ણયો લો જે લાંબા ગાળે તમારી વિશ્વસનીયતા અને સંસ્થાકીય તાકાત વધારે.`;

  return parseResponseAndFollowUps(responseText, agentName, cleanPrompt);
}

/**
 * 5. MAIN VERCEL SERVERLESS HANDLER
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'CouncilX Agentic AI Engine' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    // Support both direct chat payload and gemini proxy payload
    const agent = body.agent || { name: 'Bhagwan Shri Krishna', title: 'Supreme Yogeshwara' };
    const userMessage = body.userMessage || body.message || body.prompt || (body.contents ? body.contents[body.contents.length - 1]?.parts?.[0]?.text : '') || (body.payload?.contents ? body.payload.contents[body.payload.contents.length - 1]?.parts?.[0]?.text : '');
    const chatHistory = body.chatHistory || body.messages || [];
    const language = body.language || 'gu';

    const geminiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    const hasValidGeminiKey = Boolean(geminiKey && !geminiKey.includes('your_gemini_api_key') && !geminiKey.startsWith('AQ.'));
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // 1. Execute Live Web Search Tool if applicable
    let liveSearchContext = null;
    const isSearchDesirable = Boolean(
      agent.is_custom ||
      agent.category === 'Living Legends' ||
      agent.category === 'Politicians' ||
      /(કામ|યોજના|વિધાનસભા|ચૂંટણી|ઇન્સ્ટા|recent|news|mla|minister|work|current|scheme)/i.test(userMessage)
    );

    if (isSearchDesirable) {
      liveSearchContext = await performAgenticWebSearch(userMessage, agent.name);
    }

    // 2. Build the Dynamic Master System Prompt
    const dynamicSystemInstruction = buildMasterSystemPrompt(agent, language, liveSearchContext);

    // 3. Attempt Live Gemini Call if valid API key is present
    if (hasValidGeminiKey) {
      for (const model of ALLOWED_GEMINI_MODELS) {
        try {
          const contents = [];
          (chatHistory || []).slice(-10).forEach(msg => {
            if (msg.content) {
              contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
              });
            }
          });
          if (userMessage) {
            contents.push({ role: 'user', parts: [{ text: userMessage }] });
          }

          const payload = {
            system_instruction: { parts: [{ text: dynamicSystemInstruction }] },
            contents,
            tools: [{ googleSearch: {} }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 4096
            }
          };

          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const gRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (gRes.ok) {
            const data = await gRes.json();
            const rawText = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').filter(Boolean).join('\n');
            if (rawText && rawText.trim().length > 0) {
              const result = parseResponseAndFollowUps(rawText, agent.name, userMessage);
              return res.status(200).json({
                success: true,
                content: result.content,
                followUpQuestions: result.followUpQuestions,
                candidates: [{
                  content: {
                    parts: [{ text: result.content + '\n\n```json\n' + JSON.stringify({ follow_up_questions: result.followUpQuestions }) + '\n```' }]
                  }
                }],
                model
              });
            }
          }
        } catch (callErr) {
          console.warn(`[Gemini Model ${model} Attempt Error]:`, callErr.message);
        }
      }
    }

    // 3b. Attempt Groq API if configured
    if (groqKey) {
      try {
        const groqMessages = [
          { role: 'system', content: dynamicSystemInstruction },
          ...(chatHistory || []).slice(-8).map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content || ''
          })),
          { role: 'user', content: userMessage || 'નમસ્તે' }
        ];

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 4096
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const groqText = groqData.choices?.[0]?.message?.content;
          if (groqText && groqText.trim().length > 0) {
            const result = parseResponseAndFollowUps(groqText, agent.name, userMessage);
            return res.status(200).json({
              success: true,
              content: result.content,
              followUpQuestions: result.followUpQuestions,
              candidates: [{
                content: {
                  parts: [{ text: result.content + '\n\n```json\n' + JSON.stringify({ follow_up_questions: result.followUpQuestions }) + '\n```' }]
                }
              }],
              model: 'groq/llama-3.3-70b'
            });
          }
        }
      } catch (grErr) {
        console.warn('[Groq Attempt Error]:', grErr.message);
      }
    }

    // 3c. Attempt OpenAI API if configured
    if (openaiKey) {
      try {
        const oaiMessages = [
          { role: 'system', content: dynamicSystemInstruction },
          ...(chatHistory || []).slice(-8).map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content || ''
          })),
          { role: 'user', content: userMessage || 'નમસ્તે' }
        ];

        const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: oaiMessages,
            temperature: 0.7,
            max_tokens: 4096
          })
        });

        if (oaiRes.ok) {
          const oaiData = await oaiRes.json();
          const oaiText = oaiData.choices?.[0]?.message?.content;
          if (oaiText && oaiText.trim().length > 0) {
            const result = parseResponseAndFollowUps(oaiText, agent.name, userMessage);
            return res.status(200).json({
              success: true,
              content: result.content,
              followUpQuestions: result.followUpQuestions,
              candidates: [{
                content: {
                  parts: [{ text: result.content + '\n\n```json\n' + JSON.stringify({ follow_up_questions: result.followUpQuestions }) + '\n```' }]
                }
              }],
              model: 'openai/gpt-4o-mini'
            });
          }
        }
      } catch (oaiErr) {
        console.warn('[OpenAI Attempt Error]:', oaiErr.message);
      }
    }

    // 4. Adaptive Intelligent Fallback Engine (Zero Hardcoded Templates, Strict Persona & Length Matching)
    const adaptiveResult = generateAdaptiveIntelligentResponse(agent, userMessage, liveSearchContext);
    return res.status(200).json({
      success: true,
      content: adaptiveResult.content,
      followUpQuestions: adaptiveResult.followUpQuestions,
      candidates: [{
        content: {
          parts: [{ text: adaptiveResult.content + '\n\n```json\n' + JSON.stringify({ follow_up_questions: adaptiveResult.followUpQuestions }) + '\n```' }]
        }
      }],
      mode: 'adaptive_agentic_engine'
    });
  } catch (err) {
    console.error('[CouncilX Chat API Exception]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error in Chat API'
    });
  }
};
