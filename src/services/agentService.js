/**
 * COUNCIL X | THE SYNDICATE
 * Agent Data Service (216 Supreme Masterminds Directory)
 * 108 Bharat Vishwaguru + 108 Modern Global (Zero Duplicates)
 */

import { DEFAULT_AGENTS, DOMAIN_CATEGORIES, ERAS_TABS } from '../data/defaultAgents';

// Load full 216 Masterminds dataset
let allAgentsDataset = DEFAULT_AGENTS;

try {
  const seed216 = require('../data/agents_seed_1000.json');
  if (Array.isArray(seed216) && seed216.length > 0) {
    allAgentsDataset = seed216;
  }
} catch (e) {
  allAgentsDataset = DEFAULT_AGENTS;
}

export const agentService = {
  /**
   * Get all loaded agents count (216)
   */
  getTotalCount() {
    return allAgentsDataset.length;
  },

  /**
   * Get categories list (9 Domain Categories including Gujarati accents)
   */
  getCategories() {
    return DOMAIN_CATEGORIES;
  },

  /**
   * Get main Era tabs (Bharat Vishwaguru 108 & Modern Visionaries 108)
   */
  getEras() {
    return ERAS_TABS;
  },

  /**
   * Query agents by category, era, and search term
   */
  getAgents({ category = 'All', era = 'All', search = '', limit = 216, offset = 0 } = {}) {
    let filtered = allAgentsDataset;

    // Filter by Category
    if (category && category !== 'All') {
      filtered = filtered.filter(a => a.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by Era Tab (Bharat Vishwaguru vs Modern Visionaries)
    if (era && era !== 'All') {
      filtered = filtered.filter(a => a.era.toLowerCase().includes(era.toLowerCase().replace(/\s*\(.*\)/, '')));
    }

    // Filter by search query (name, title, category, works, or philosophy)
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.core_philosophy.toLowerCase().includes(q) ||
        (a.published_works && a.published_works.some(w => w.toLowerCase().includes(q)))
      );
    }

    return filtered.slice(offset, offset + limit);
  },

  /**
   * Find agent by ID
   */
  getAgentById(id) {
    return allAgentsDataset.find(a => a.id === id) || allAgentsDataset[0];
  },

  /**
   * Find agent by Name
   */
  getAgentByName(name) {
    return allAgentsDataset.find(a => a.name.toLowerCase() === name.toLowerCase()) || allAgentsDataset[0];
  },

  /**
   * 216 Supreme Council Metadata
   */
  getSupremeCouncilInfo() {
    const bharatCount = allAgentsDataset.filter(a => a.era.includes('Bharat')).length;
    const modernCount = allAgentsDataset.filter(a => a.era.includes('Modern')).length;

    return {
      title: 'ALL-IN-ONE 216 SUPREME COUNCIL',
      subTitleGujarati: '૨૧૬ માસ્ટરમાઇન્ડ મહા-સભા',
      totalCount: allAgentsDataset.length,
      bharatCount,
      modernCount,
      description: 'Unified synthesis uniting all 108 Ancient Bharat Vishwagurus and 108 Modern Global Visionaries.'
    };
  }
};
