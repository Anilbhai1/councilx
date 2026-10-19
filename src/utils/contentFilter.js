/**
 * COUNCIL X | THE SYNDICATE
 * Two-Layer Zero-Tolerance Adult / NSFW / Explicit Content Filter
 * Layer 1: Explicit Name & Keyword Blocklist (English, Gujarati, Hindi)
 * Layer 2: Automatic Wikipedia Biography & Description Scanner
 */

const EXPLICIT_KEYWORDS = [
  // Known adult film / explicit figures
  'sunny leone',
  'સની લિયોની',
  'સની લિયોન',
  'सनी लियोनी',
  'mia khalifa',
  'મિયા ખલીફા',
  'મૈયા ખલીફા',
  'मिया खलीफा',
  'johnny sins',
  'lana rhoades',
  'dani daniels',
  'abigail mac',
  'angela white',
  'eva elfie',
  'riley reid',
  'kendra lust',
  'brandi love',
  'lisa ann',
  'sasha grey',
  'alexis texas',
  'poonam pandey',
  'sherlyn chopra',
  'sofia ansari',
  'gehana vasisth',
  'abha paul',

  // Explicit industry & adult keywords
  'onlyfans',
  'porn',
  'porno',
  'pornography',
  'pornographic',
  'xxx',
  'x-rated',
  'nsfw',
  'sex',
  'sexy',
  'nude',
  'nudity',
  'erotic',
  'erotica',
  'adult star',
  'adult film',
  'adult actress',
  'adult actor',
  'adult model',
  'playboy',
  'penthouse',
  'sex worker',
  'stripper',
  'striptease',
  'fetish',
  'camgirl',
  'webcam model',
  'kamasutra',
  'hardcore',
  'softcore',
  'brazzers',
  'xhamster',
  'xvideos',
  'pornhub',

  // Gujarati explicit terms
  'અશ્લીલ',
  'સેક્સ',
  'નગ્ન',
  'કામવાસના',
  'કામસૂત્ર',
  'પોર્ન',

  // Hindi explicit terms
  'अश्लील',
  'सेक्स',
  'नग्न',
  'पोर्न',
  'कामसूत्र',
  'कामवासना'
];

const ADULT_BIO_INDICATORS = [
  'pornographic',
  'porn star',
  'porn actress',
  'porn actor',
  'adult film',
  'adult entertainment',
  'adult actress',
  'adult actor',
  'adult model',
  'erotic model',
  'erotic film',
  'playboy playmate',
  'penthouse pet',
  'sex worker',
  'stripper',
  'fetish model',
  'camgirl',
  'webcam model',
  'hardcore pornography',
  'softcore pornography'
];

export const WARNING_MESSAGES = {
  gu: '⚠️ પ્રતિબંધિત નામ: કાઉન્સિલ એક્સ પ્લેટફોર્મ માત્ર ઉચ્ચ જ્ઞાન, બિઝનેસ, રાજનીતિ, યુદ્ધ અને મહાપુરુષોના માર્ગદર્શન માટે છે. અશ્લીલ, એડલ્ટ કે NSFW નામો અહીં સખત પ્રતિબંધિત છે.',
  hi: '⚠️ प्रतिबंधित नाम: काउंसिल एक्स केवल उच्च ज्ञान, व्यापार, राजनीति और महापुरुषों के मार्गदर्शन के लिए समर्पित है। अश्लील, एडल्ट या NSFW नाम यहाँ पूरी तरह प्रतिबंधित हैं।',
  en: '⚠️ Restricted Figure: Council X is strictly dedicated to wisdom, statecraft, business, and leadership. Adult film stars or NSFW figures are strictly prohibited.'
};

export const contentFilter = {
  /**
   * Layer 1: Check if input name or keyword contains prohibited terms
   */
  isNameBlocked(rawName = '') {
    if (!rawName) return false;
    const clean = rawName.trim().toLowerCase();
    return EXPLICIT_KEYWORDS.some((kw) => clean.includes(kw.toLowerCase()));
  },

  /**
   * Layer 2: Inspect Wikipedia biography / extract / description for adult industry indicators
   */
  isBioExplicit(extract = '', description = '') {
    const combined = `${extract} ${description}`.toLowerCase();
    if (!combined.trim()) return false;

    // Check against direct adult indicators
    const hasExplicitBio = ADULT_BIO_INDICATORS.some((term) =>
      combined.includes(term.toLowerCase())
    );

    // Also check against explicit keywords
    const hasExplicitKeywords = EXPLICIT_KEYWORDS.some((kw) =>
      combined.includes(kw.toLowerCase())
    );

    return hasExplicitBio || hasExplicitKeywords;
  },

  /**
   * Complete validation check
   * Returns: { blocked: boolean, reason: string | null }
   */
  validateCandidate({ name, extract = '', description = '', lang = 'gu' }) {
    if (this.isNameBlocked(name)) {
      return {
        allowed: false,
        blocked: true,
        reason: WARNING_MESSAGES[lang] || WARNING_MESSAGES.gu
      };
    }

    if (this.isBioExplicit(extract, description)) {
      return {
        allowed: false,
        blocked: true,
        reason: WARNING_MESSAGES[lang] || WARNING_MESSAGES.gu
      };
    }

    return { allowed: true, blocked: false, reason: null };
  },

  getWarning(lang = 'gu') {
    return WARNING_MESSAGES[lang] || WARNING_MESSAGES.gu;
  }
};

export const validateCandidate = (params) => contentFilter.validateCandidate(params);
export const isNameBlocked = (name) => contentFilter.isNameBlocked(name);
export const isBioExplicit = (extract, desc) => contentFilter.isBioExplicit(extract, desc);
export default contentFilter;
