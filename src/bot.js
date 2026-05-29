const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const config = require('./config');

class GiftCardBot {
  constructor() {
    this.bot = new Telegraf(config.telegram.botToken);
    this.setupMiddleware();
    this.setupCommands();
    this.setupActions();
    this.setupErrorHandler();
  }

  setupMiddleware() {
    // Logging middleware
    this.bot.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      console.log(`Response time: ${ms}ms - ${ctx.updateType}`);
    });

    // Admin middleware
    this.bot.use(async (ctx, next) => {
      if (ctx.from && config.security.adminUserIds.includes(ctx.from.id)) {
        ctx.isAdmin = true;
      }
      await next();
    });
  }

  setupCommands() {
    // Start command
    this.bot.start(async (ctx) => {
      const welcomeMessage = `
🎁 *Welcome to Gift Card Generator Bot!*

I can help you create beautiful gift cards with custom codes.

*Available Commands:*
/start - Show this welcome message
/generate <code> - Generate a gift card
/help - Show help information
/stats - View statistics (Admin only)
/webapp - Open gift card generator web app

Just send me a code or use /generate command!
      `;

      await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ['/generate', '/help'],
          ['/webapp', '/stats']
        ]).resize()
      });
    });

    // Help command
    this.bot.help(async (ctx) => {
      const helpMessage = `
🔍 *Help & Instructions*

*How to use:*
1. Send /generate followed by your code
   Example: \`/generate GIFT2024\`
2. Or just send me a code directly
3. Use the WebApp for more options

*Code Rules:*
• Length: 3-50 characters
• Allowed: A-Z, 0-9, hyphens, underscores
• Case sensitive

*Need Support?*
Contact: @admin_username
      `;

      await ctx.reply(helpMessage, {
        parse_mode: 'Markdown'
      });
    });

    // Generate command
    this.bot.command('generate', async (ctx) => {
      const code = ctx.message.text.split(' ')[1];

      if (!code) {
        return ctx.reply('❌ Please provide a code!\nExample: /generate GIFT2024');
      }

      await this.generateGiftCard(ctx, code);
    });

    // Webapp command
    this.bot.command('webapp', async (ctx) => {
      const webAppUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

      await ctx.reply('🎨 Open Gift Card Generator:', 
        Markup.inlineKeyboard([
          [Markup.button.url('Open Web App', webAppUrl)]
        ])
      );
    });

    // Stats command (Admin only)
    this.bot.command('stats', async (ctx) => {
      if (!ctx.isAdmin) {
        return ctx.reply('⛔ This command is for admins only!');
      }

      const stats = {
        users: 0,
        cardsGenerated: 0,
        uptime: process.uptime()
      };

      const statsMessage = `
📊 *Bot Statistics*

👥 Total Users: ${stats.users}
🎴 Cards Generated: ${stats.cardsGenerated}
⏱ Uptime: ${Math.floor(stats.uptime / 3600)}h ${Math.floor((stats.uptime % 3600) / 60)}m
      `;

      await ctx.reply(statsMessage, { parse_mode: 'Markdown' });
    });
  }

  setupActions() {
    // Handle text messages (for direct code input)
    this.bot.on('text', async (ctx) => {
      // Ignore commands
      if (ctx.message.text.startsWith('/')) return;

      const code = ctx.message.text.trim();
      await this.generateGiftCard(ctx, code);
    });
  }

  async generateGiftCard(ctx, code) {
    try {
      // Validate code
      if (code.length < config.giftCard.minCodeLength || 
          code.length > config.giftCard.maxCodeLength) {
        return ctx.reply(`❌ Code must be between ${config.giftCard.minCodeLength} and ${config.giftCard.maxCodeLength} characters!`);
      }

      if (!config.giftCard.allowedCodePattern.test(code)) {
        return ctx.reply('❌ Code can only contain letters, numbers, hyphens, and underscores!');
      }

      // Send processing message
      const processingMsg = await ctx.reply('🎨 Generating your gift card...');

      // Generate card using the web API
      const webAppUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${config.server.port}`;

      const response = await axios.post(`${webAppUrl}/api/generate-card`, {
        code: code,
        userId: ctx.from.id
      }, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      // Send the generated card
      await ctx.replyWithPhoto(
        { source: Buffer.from(response.data) },
        {
          caption: `🎁 *Gift Card Generated!*\nCode: \`${code}\``,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [Markup.button.url('🔄 Generate Another', `${webAppUrl}?code=${code}`)]
            ]
          }
        }
      );

      // Delete processing message
      await ctx.deleteMessage(processingMsg.message_id).catch(() => {});

    } catch (error) {
      console.error('Error generating gift card:', error);
      await ctx.reply('❌ Sorry, there was an error generating your gift card. Please try again.');
    }
  }

  setupErrorHandler() {
    this.bot.catch((err, ctx) => {
      console.error(`Error for ${ctx.updateType}:`, err);
      ctx.reply('❌ An unexpected error occurred. Please try again later.').catch(() => {});
    });
  }

  async launch() {
    try {
      if (config.telegram.options.polling) {
        console.log('Starting bot in polling mode...');
        await this.bot.launch();
      } else {
        console.log('Setting up webhook...');
        await this.bot.telegram.setWebhook(config.telegram.webhookUrl);
      }
      console.log('✅ Bot is running!');
    } catch (error) {
      console.error('Failed to launch bot:', error);
      process.exit(1);
    }
  }

  getBot() {
    return this.bot;
  }
}

module.exports = GiftCardBot;
