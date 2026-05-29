const { createCanvas, loadImage } = require('canvas');
const config = require('../src/config');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code || code.length < 3 || code.length > 50) {
      return res.status(400).json({ error: 'Invalid code format' });
    }

    // Load base image
    const image = await loadImage(config.giftCard.baseImageUrl);
    
    // Create canvas
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Draw image
    ctx.drawImage(image, 0, 0);

    // Configure text style
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 8;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // Draw text
    const x = canvas.width / 2;
    const y = canvas.height * 0.65;
    
    ctx.strokeText(code, x, y);
    ctx.fillText(code, x, y);

    // Convert to buffer
    const buffer = canvas.toBuffer('image/png');

    // Send response
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="gift_card_${code}.png"`);
    res.send(buffer);

  } catch (error) {
    console.error('Error generating card:', error);
    res.status(500).json({ error: 'Failed to generate gift card' });
  }
};
