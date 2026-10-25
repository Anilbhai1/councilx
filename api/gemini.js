/**
 * COUNCIL X | THE SYNDICATE
 * Serverless Backend Function: Gemini Proxy -> Master Agentic Chat Engine
 */

const chatHandler = require('./chat');

module.exports = async function handler(req, res) {
  return chatHandler(req, res);
};
