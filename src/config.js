require('dotenv').config();

const config = {
  // Telegram Bot Configuration
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    options: {
      polling: process.env.NODE_ENV !== 'production',
      webHook: {
        port: process.env.PORT || 3000
      }
    }
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },

  // Gift Card Configuration
  giftCard: {
    baseImageUrl: 'https://raw.githubusercontent.com/arpita330/word_print/main/IMG_20260215_144053_492.jpg',
    maxCodeLength: 50,
    minCodeLength: 3,
    allowedCodePattern: /^[A-Z0-9-_]+$/i
  },

  // Security
  security: {
    secretKey: process.env.SECRET_KEY || 'default-secret-key-change-in-production',
    adminUserIds: (process.env.ADMIN_USER_IDS || '').split(',').map(id => parseInt(id.trim())),
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },

  // Database (Optional)
  database: {
    url: process.env.DATABASE_URL || null
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  }
};

// Validation
if (!config.telegram.botToken) {
  console.error('TELEGRAM_BOT_TOKEN is required!');
  process.exit(1);
}

module.exports = config;
