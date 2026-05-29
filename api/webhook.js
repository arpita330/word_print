const GiftCardBot = require('../src/bot');
const config = require('../src/config');

let bot;

// Initialize bot on first request
async function getBot() {
  if (!bot) {
    bot = new GiftCardBot();
    if (!config.telegram.options.polling) {
      await bot.launch();
    }
  }
  return bot.getBot();
}

// Webhook handler
module.exports = async (req, res) => {
  try {
    const bot = await getBot();
    
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body);
      res.status(200).json({ status: 'ok' });
    } else {
      // GET request - show webhook status
      const webhookInfo = await bot.telegram.getWebhookInfo();
      res.status(200).json({
        status: 'active',
        webhook: webhookInfo,
        message: 'Webhook is running. Send POST requests to this endpoint for Telegram updates.'
      });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
