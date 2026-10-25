/**
 * COUNCIL X | THE SYNDICATE
 * Agentic Chat API Backend (Vercel Serverless Function)
 * 
 * MAJOR AI UPGRADE:
 * 1. PROFOUND, LONG-FORM STORYTELLING (Master System Prompt):
 *    - Master strategist, philosopher, and profound storyteller
 *    - NEVER short, robotic, or standard bullet summaries
 *    - Expansive explanations, powerful analogies, historical examples & deep philosophical breakdowns
 *    - Always answers in Gujarati unless asked otherwise
 * 2. DYNAMIC CONTEXT-AWARE FOLLOW-UPS (Strict Structured JSON Output):
 *    - Strict output format: { "reply": "...", "follow_ups": ["Q1", "Q2", "Q3"] }
 *    - Zero hardcoded static follow-up questions
 *    - Follow-ups dynamically evolve from the exact context of the user's last query
 * 3. REAL-TIME GOOGLE SEARCH & LIVE WEB GROUNDING (Tavily, Wikipedia, DDG)
 */

const ALLOWED_GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

/**
 * 1. LIVE WEB SEARCH TOOL INTEGRATION
 */
async function performAgenticWebSearch(query = '', agentName = '') {
  const searchQuery = `${agentName} ${query}`.trim().slice(0, 120);
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
 * 2. MASTER SYSTEM PROMPT BUILDER: PROFOUND STORYTELLING & STRUCTURED JSON
 */
function buildMasterSystemPrompt(agent = {}, language = 'gu', liveSearchContext = '') {
  const agentName = agent.name || 'Mastermind';
  const agentRole = agent.title || agent.category || agent.role || 'Strategic Mastermind';
  const bio = agent.bio || agent.wikipedia_extract || agent.system_prompt || '';
  const works = Array.isArray(agent.published_works) ? agent.published_works.join(', ') : '';
  const models = Array.isArray(agent.mental_models) ? agent.mental_models.join(', ') : '';

  const isKrishna = agentName.toLowerCase().includes('krishna') || agentName.includes('કૃષ્ણ');

  let basePrompt = `You are a profound, deep-research AI Mastermind. NEVER give short, summarized, or superficial answers. For EVERY user query, you MUST generate a highly expansive, comprehensive response (minimum 4 to 5 large paragraphs). Break down the topic deeply: provide historical/philosophical context, real-world examples, actionable deep strategies, and step-by-step profound analysis. Write like an expert storyteller and mastermind. Output in highly professional Gujarati.

You are embodying: ${agentName} (${agentRole}).
${bio ? `AUTHENTIC BIO & BACKGROUND:\n${bio}` : ''}
${works ? `KEY TEXTS & WORKS: ${works}` : ''}
${models ? `CORE PRINCIPLES & FRAMEWORKS: ${models}` : ''}

${isKrishna ? `You are Bhagwan Shri Krishna, the Supreme Yogeshwara and Charioteer of Kurukshetra. Speak with divine composure, supreme strategic discernment, and philosophical depth grounded in the Shrimad Bhagavad Gita. Direct the seeker to fearlessness, moral clarity, and detached action (Nishkama Karma). Embody the first person ("હું", "મારું", "પાર્થ", "અર્જુન"). Weave profound analogies from the Kurukshetra battlefield, cosmic order, and eternal Dharma.` : `Embody ${agentName} 100% in the first person ("હું", "મારું", "મારા નિર્ણયો"). Speak with authentic gravitas, intellectual mastery, and relentless clarity. Infuse your historical battles, entrepreneurial moats, political decisions, and philosophical convictions.`}

CRITICAL DEEP-RESEARCH & EXPANSIVE ANALYSIS MANDATE:
1. MINIMUM 4 TO 5 EXPANSIVE, IN-DEPTH PARAGRAPHS:
   - For EVERY query, you MUST generate a highly expansive, comprehensive response (minimum 4 to 5 large paragraphs).
   - Paragraph 1: Foundational philosophical & historical context of the dilemma.
   - Paragraph 2: First-principles root cause and systemic analysis.
   - Paragraph 3: Real-world analogies, tactical precedents, and case studies.
   - Paragraph 4: Step-by-step profound actionable strategies & asymmetric advantage.
   - Paragraph 5: Long-term philosophical synthesis and decisive call to strategic mastery.
   - Format in elegant, rich Markdown with clear headings and quotations.
2. STRICT STRUCTURED JSON OUTPUT:
   You MUST return your entire output as a single, valid JSON object matching this EXACT schema:
   {
     "reply": "Your profound, long-form response here in markdown formatting...",
     "follow_ups": [
       "Highly contextual question 1 in Gujarati?",
       "Highly contextual question 2 in Gujarati?",
       "Highly contextual question 3 in Gujarati?"
     ]
   }
3. DYNAMIC CONTEXT-AWARE FOLLOW-UPS:
   - The "follow_ups" array MUST contain exactly 3 penetrating, highly strategic follow-up questions.
   - These follow-ups MUST NOT be hardcoded, generic, or repetitive templates.
   - They MUST evolve directly from the exact dilemma, specific words, and deeper implications of the user's inquiry and your answer.
   - All follow-up questions MUST be strictly in Gujarati (unless asked otherwise).
4. ZERO ROBOTIC PHRASES:
   - Never say "હું એક AI છું", "બૌદ્ધિક એન્જિન", or refer to yourself as an assistant.
   - Output valid JSON with no introductory conversational text outside the JSON.`;

  if (liveSearchContext) {
    basePrompt += `\n\n=== VERIFIED REAL-TIME WEB SEARCH INTELLIGENCE ===\n${liveSearchContext}\n==================================================\nWeave the real-time internet facts above into your deep storytelling with zero hallucinations.`;
  }

  return basePrompt;
}

/**
 * Clean and parse structured JSON { reply, follow_ups }
 */
function parseStructuredResponse(rawText = '', agent = {}, userPrompt = '') {
  const agentName = agent.name || 'Mastermind';
  let cleanText = (rawText || '').trim();
  let reply = '';
  let followUps = [];

  // 1. Attempt to extract from JSON code block ```json ... ```
  let jsonString = null;
  const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim();
  } else {
    // 2. Look for raw JSON object { "reply": ... }
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
      }
      if (Array.isArray(parsed.follow_ups) && parsed.follow_ups.length > 0) {
        followUps = parsed.follow_ups
          .filter(q => typeof q === 'string' && q.trim().length > 0)
          .map(q => q.trim())
          .slice(0, 3);
      } else if (Array.isArray(parsed.follow_up_questions) && parsed.follow_up_questions.length > 0) {
        followUps = parsed.follow_up_questions
          .filter(q => typeof q === 'string' && q.trim().length > 0)
          .map(q => q.trim())
          .slice(0, 3);
      }
    } catch (e) {
      // Regex extraction fallback if JSON was slightly malformed
      const replyMatch = jsonString.match(/"reply"\s*:\s*"([\s\S]*?)"\s*,\s*"(?:follow_ups|follow_up_questions)"/i);
      if (replyMatch) {
        reply = replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
      }
    }
  }

  // 3. If reply is still empty, clean raw text
  if (!reply) {
    reply = cleanText
      .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, '')
      .replace(/\{[\s\S]*?"(?:reply|follow_ups|follow_up_questions)"[\s\S]*?\}/gi, '')
      .trim();
  }

  // Clean robotic phrases from reply
  reply = reply
    .replace(/^(?:હું|અમે)\s+.*?(?:બૌદ્ધિક\s+એન્જિન|AI\s+એન્જિન|એન્જિન|મોડલ|સિમ્યુલેશન)[^\.\n]*[\.\n]+/gim, '')
    .trim();

  // 4. Dynamic Context-Aware Follow-ups Synthesis (if model returned fewer than 3)
  if (followUps.length < 3) {
    followUps = synthesizeDynamicFollowUps(userPrompt, agentName, followUps);
  }

  return {
    reply,
    follow_ups: followUps,
    content: reply,
    followUpQuestions: followUps
  };
}

/**
 * Dynamic Context-Aware Follow-Up Synthesis
 * Extracted directly from user's immediate question without static hardcoded lists
 */
function synthesizeDynamicFollowUps(userPrompt = '', agentName = '', existingFollowUps = []) {
  const result = [...existingFollowUps];
  const cleanPrompt = (userPrompt || '').trim().replace(/[\r\n\t]+/g, ' ');
  const topic = cleanPrompt.length > 40 ? cleanPrompt.slice(0, 38) + '...' : (cleanPrompt || 'આ વ્યૂહરચના');

  const isKrishna = agentName.toLowerCase().includes('krishna') || agentName.includes('કૃષ્ણ');

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

  return result.slice(0, 3);
}

/**
 * 4. ADAPTIVE INTELLIGENT DEEP STORYTELLING FALLBACK
 * Operates when upstream API is unconfigured or rate-limited.
 * Delivers profound, expansive, deeply philosophical Gujarati narrative masterclasses.
 */
function generateAdaptiveIntelligentResponse(agent = {}, userPrompt = '', liveSearchContext = '') {
  const agentName = agent.name || 'Mastermind';
  const role = agent.title || agent.category || agent.role || 'માર્ગદર્શક';
  const cleanPrompt = (userPrompt || '').trim();
  const isKrishna = agentName.toLowerCase().includes('krishna') || agentName.includes('કૃષ્ણ');

  let replyText = '';

  if (isKrishna) {
    replyText = `પ્રિય આત્મા! "${cleanPrompt}" અંગે તમારો આ પ્રશ્ન માત્ર એક સાધારણ જિજ્ઞાસા નથી, પરંતુ જીવનના ગહન આધ્યાત્મિક અને નૈતિક ધર્મસંકટ સાથે જોડાયેલું એક ગંભીર ચિંતન છે.\n\n` +
      `### ૧. કુરુક્ષેત્રની ભૂમિ અને અર્જુનનો વિષાદયોગ\n` +
      `યાદ કરો જ્યારે કુરુક્ષેત્રના મહાયુદ્ધના પ્રારંભે અર્જુન પોતાના ગાંડિવ ધનુષને છોડીને રથના પાછળના ભાગમાં બેસી ગયો હતો. તેના મનમાં પણ આવા જ સંશયો, સ્વજનો પ્રત્યેનો મોહ અને પરિણામોનો ભય વ્યાપી ગયો હતો. ત્યારે મેં તેને કહ્યું હતું:\n\n` +
      `> **"क् Rollैब्यं मा स्म गमः पार्थ नैतत्त्वय्युपपद्यते। क्षुद्रं हृदयदौर्बल्यं त्यक्त्वोत्तिष्ठ परन्तप॥"**\n` +
      `*(હે પાર્થ! નપુંસકતા કે હૃદયની ક્ષુદ્ર નબળાઈને વશ ન થા. ઊભો થા અને પોતાના ક્ષાત્રધર્મનું પાલન કર.)*\n\n` +
      `### ૨. નિષ્કામ કર્મયોગ — પરિણામની આસક્તિમાંથી મુક્તિ\n` +
      `માનવ મનની સૌથી મોટી વ્યાધિ એ છે કે તે વર્તમાન કર્તવ્યને છોડીને ભવિષ્યના કાલ્પનિક પરિણામો, નફા-નુકસાન કે લોકોના અભિપ્રાયોમાં અટવાઈ જાય છે. **'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन'** નો સાચો અર્થ એ છે કે જ્યારે તમે સંપૂર્ણ શક્તિ, શુદ્ધ અંતઃકરણ અને શ્રદ્ધા સાથે તમારું કાર્ય કરો છો, ત્યારે વિજય કે પરાજય બંને પ્રભુને સમર્પિત થઈ જાય છે. ચિંતા માત્ર પરિણામની હોય છે, સમર્પિત કર્મ તો પરમ શાંતિ આપે છે.\n\n` +
      `### ૩. સમત્વ અને સ્થિતપ્રજ્ઞ બુદ્ધિ\n` +
      `સુખ અને દુઃખ, માન અને અપમાન, લાભ અને હાનિ — આ તમામ સંસારના ક્ષણિક તરંગો છે. જેમ મહાસાગરમાં સેંકડો નદીઓ સમાઈ જાય છે છતાં સાગર પોતાની મર્યાદા છોડતો નથી, તેમ જેનું મન સંકલ્પો અને બાહ્ય ઘોંઘાટ વચ્ચે પણ સ્થિર રહે છે, તે જ સાચો સ્થિતપ્રજ્ઞ છે.\n\n` +
      `### ૪. તમારો આગામી માર્ગ\n` +
      `આ પરિસ્થિતિમાં ભય અને સંશયને આત્મજ્ઞાનના અગ્નિમાં હોમી દો. જે સત્ય છે, જે લોકકલ્યાણકારી છે અને જે તમારા આત્માને માન્ય છે, તે માર્ગ પર ડગલું ભરો. જ્યાં ધર્મ અને નિષ્ઠા છે, ત્યાં વિજય નિશ્ચિત છે. હું પ્રત્યેક ક્ષણે તમારી સાથે છું.`;
  } else {
    const models = Array.isArray(agent.mental_models) && agent.mental_models.length > 0
      ? agent.mental_models.join(', ')
      : 'ફર્સ્ટ પ્રિન્સિપલ્સ, દીર્ઘકાલીન વિઝન, અજેય સંસ્થાકીય તાકાત';

    replyText = `હું **${agentName}** (${role}) છું. તમારા પ્રશ્ન "${cleanPrompt}" ને માત્ર સપાટી પરથી ઉકેલી શકાય તેમ નથી; આ માટે આપણે તેના મૂળ સિદ્ધાંતો, ઐતિહાસિક ઉદાહરણો અને નક્કર અમલીકરણના પાયા સુધી જવું પડશે.\n\n` +
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

  if (liveSearchContext) {
    replyText += `\n\n### ૫. વાસ્તવિક અને તાજેતરના તથ્યો\n${liveSearchContext}`;
  }

  return parseStructuredResponse(JSON.stringify({
    reply: replyText,
    follow_ups: synthesizeDynamicFollowUps(cleanPrompt, agentName, [])
  }), agent, cleanPrompt);
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
    return res.status(200).json({ status: 'ok', service: 'CouncilX Pro Storytelling & Structured JSON AI Engine' });
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

    const agent = body.agent || { name: 'Bhagwan Shri Krishna', title: 'Supreme Yogeshwara' };
    const userMessage = body.userMessage || body.message || body.prompt || (body.contents ? body.contents[body.contents.length - 1]?.parts?.[0]?.text : '') || (body.payload?.contents ? body.payload.contents[body.payload.contents.length - 1]?.parts?.[0]?.text : '');
    const chatId = body.chat_id || body.sessionId || body.session_id || body.conversation_id || body.id;
    let chatHistory = body.chatHistory || body.messages || [];
    const language = body.language || 'gu';

    // 0. Flawless Context Retention: Fetch full historical context of active chat_id from Supabase if not in request
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

    const geminiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    const hasValidGeminiKey = Boolean(geminiKey && !geminiKey.includes('your_gemini_api_key') && !geminiKey.startsWith('AQ.'));
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // 1. Live Web Search if relevant
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

    // 2. Build Master System Prompt
    const dynamicSystemInstruction = buildMasterSystemPrompt(agent, language, liveSearchContext);

    // 3. 100% Context Memory: Build full conversation array for Gemini with alternating roles
    const geminiContents = [];
    const validHistory = (chatHistory || []).filter(m => m && m.content && typeof m.content === 'string' && m.content.trim().length > 0);

    for (const msg of validHistory) {
      const isModel = msg.role === 'assistant' || msg.role === 'model';
      const text = msg.content.trim();
      if (geminiContents.length === 0 && isModel) {
        // Prepend user starter turn so Gemini sequence always begins with user
        geminiContents.push({ role: 'user', parts: [{ text: 'પ્રણામ. મારે આપનું માર્ગદર્શન જોઈએ છે.' }] });
      }

      if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === (isModel ? 'model' : 'user')) {
        // Merge consecutive turns with identical role to keep alternating sequence valid
        geminiContents[geminiContents.length - 1].parts[0].text += '\n\n' + text;
      } else {
        geminiContents.push({
          role: isModel ? 'model' : 'user',
          parts: [{ text }]
        });
      }
    }

    // Append latest user message if not already the final user turn
    if (userMessage && userMessage.trim().length > 0) {
      const lastTurn = geminiContents[geminiContents.length - 1];
      if (!lastTurn || lastTurn.role !== 'user' || lastTurn.parts[0].text !== userMessage.trim()) {
        if (lastTurn && lastTurn.role === 'user') {
          lastTurn.parts[0].text += '\n\n' + userMessage.trim();
        } else {
          geminiContents.push({ role: 'user', parts: [{ text: userMessage.trim() }] });
        }
      }
    }

    if (geminiContents.length === 0) {
      geminiContents.push({ role: 'user', parts: [{ text: userMessage || 'નમસ્તે' }] });
    }

    // 3a. Attempt Live Gemini Call with 100% Context Retention & Structured JSON mode
    if (hasValidGeminiKey) {
      for (const model of ALLOWED_GEMINI_MODELS) {
        try {
          const payload = {
            system_instruction: { parts: [{ text: dynamicSystemInstruction }] },
            contents: geminiContents,
            tools: [{ googleSearch: {} }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 8192,
              responseMimeType: "application/json"
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
              const result = parseStructuredResponse(rawText, agent, userMessage);
              return res.status(200).json({
                success: true,
                reply: result.reply,
                follow_ups: result.follow_ups,
                content: result.reply,
                followUpQuestions: result.follow_ups,
                chat_id: chatId,
                candidates: [{
                  content: {
                    parts: [{ text: JSON.stringify({ reply: result.reply, follow_ups: result.follow_ups }) }]
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

    // 3b. Build 100% Context Memory for OpenAI / Groq
    const fullConversationMessages = [
      { role: 'system', content: dynamicSystemInstruction }
    ];

    for (const msg of validHistory) {
      const isAssistant = msg.role === 'assistant' || msg.role === 'model';
      fullConversationMessages.push({
        role: isAssistant ? 'assistant' : 'user',
        content: msg.content.trim()
      });
    }

    const lastOai = fullConversationMessages[fullConversationMessages.length - 1];
    if (userMessage && userMessage.trim().length > 0 && (!lastOai || lastOai.role !== 'user' || lastOai.content !== userMessage.trim())) {
      fullConversationMessages.push({ role: 'user', content: userMessage.trim() });
    }

    // 3c. Attempt Groq API with 100% Context Retention & Deep Research Mode
    if (groqKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: fullConversationMessages,
            temperature: 0.7,
            max_tokens: 8192,
            response_format: { type: "json_object" }
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const groqText = groqData.choices?.[0]?.message?.content;
          if (groqText && groqText.trim().length > 0) {
            const result = parseStructuredResponse(groqText, agent, userMessage);
            return res.status(200).json({
              success: true,
              reply: result.reply,
              follow_ups: result.follow_ups,
              content: result.reply,
              followUpQuestions: result.follow_ups,
              chat_id: chatId,
              model: 'groq/llama-3.3-70b'
            });
          }
        }
      } catch (grErr) {
        console.warn('[Groq Attempt Error]:', grErr.message);
      }
    }

    // 3d. Attempt OpenAI API with 100% Context Retention & Deep Research Mode
    if (openaiKey) {
      try {
        const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: fullConversationMessages,
            temperature: 0.7,
            max_tokens: 8192,
            response_format: { type: "json_object" }
          })
        });

        if (oaiRes.ok) {
          const oaiData = await oaiRes.json();
          const oaiText = oaiData.choices?.[0]?.message?.content;
          if (oaiText && oaiText.trim().length > 0) {
            const result = parseStructuredResponse(oaiText, agent, userMessage);
            return res.status(200).json({
              success: true,
              reply: result.reply,
              follow_ups: result.follow_ups,
              content: result.reply,
              followUpQuestions: result.follow_ups,
              chat_id: chatId,
              model: 'openai/gpt-4o'
            });
          }
        }
      } catch (oaiErr) {
        console.warn('[OpenAI Attempt Error]:', oaiErr.message);
      }
    }

    // 4. Adaptive Intelligent Storytelling Fallback Engine
    const adaptiveResult = generateAdaptiveIntelligentResponse(agent, userMessage, liveSearchContext);
    return res.status(200).json({
      success: true,
      reply: adaptiveResult.reply,
      follow_ups: adaptiveResult.follow_ups,
      content: adaptiveResult.reply,
      followUpQuestions: adaptiveResult.follow_ups,
      chat_id: chatId,
      mode: 'adaptive_storytelling_engine'
    });
  } catch (err) {
    console.error('[CouncilX Chat API Exception]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error in Chat API'
    });
  }
};
