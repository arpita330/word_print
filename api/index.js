const express = require('express');
const cors = require('cors');
const config = require('../src/config');
const GiftCardBot = require('../src/bot');

const app = express();

// Middleware
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.server.env,
    version: '1.0.0'
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    baseImageUrl: config.giftCard.baseImageUrl,
    maxCodeLength: config.giftCard.maxCodeLength,
    minCodeLength: config.giftCard.minCodeLength,
    features: {
      telegramBot: !!config.telegram.botToken,
      webApp: true
    }
  });
});

// Webhook endpoint
app.use('/webhook', require('./webhook'));

// Save gift image endpoint
app.use('/save-gift-image', require('./save-gift-image'));

// Generate card endpoint
app.use('/api/generate-card', require('./generate-card'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.server.env === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Initialize bot if in polling mode
if (config.telegram.options.polling) {
  const bot = new GiftCardBot();
  bot.launch();
}

// Export for Vercel
module.exports = app;

// Start server if not on Vercel
if (process.env.VERCEL !== '1') {
  const port = config.server.port;
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📱 Web app: http://localhost:${port}`);
    console.log(`🤖 Bot webhook: http://localhost:${port}/webhook`);
  });
}
