const paymentHandler = require('./payment');

module.exports = async function handler(req, res) {
  return paymentHandler(req, res);
};
