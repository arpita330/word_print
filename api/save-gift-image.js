const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware to handle multipart form data
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle GET request - serve the HTML page
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'Gift Card Image Saver API',
      endpoints: {
        POST: '/save-gift-image - Upload gift card image',
        GET: '/save-gift-image - This info'
      }
    });
    return;
  }

  // Handle POST request
  if (req.method === 'POST') {
    try {
      // Process the file upload
      await runMiddleware(req, res, upload.single('image'));

      const { code } = req.body;
      const imageBuffer = req.file?.buffer;

      if (!imageBuffer) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'No gift code provided'
        });
      }

      // Optimize image with sharp
      const optimizedImage = await sharp(imageBuffer)
        .resize(800, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({ quality: 90 })
        .toBuffer();

      // Save to temporary storage (in production, use S3 or similar)
      const filename = `gift_card_${code.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      const filepath = path.join('/tmp', filename);
      
      await fs.promises.writeFile(filepath, optimizedImage);

      // Generate URL (in production, return cloud storage URL)
      const imageUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/tmp/${filename}`;

      // Clean up old files (optional - implement proper cleanup strategy)
      setTimeout(async () => {
        try {
          await fs.promises.unlink(filepath);
        } catch (err) {
          console.error('Failed to delete temp file:', err);
        }
      }, 3600000); // Delete after 1 hour

      res.status(200).json({
        success: true,
        message: 'Image saved successfully',
        data: {
          code: code,
          imageUrl: imageUrl,
          filename: filename,
          size: optimizedImage.length
        }
      });

    } catch (error) {
      console.error('Error saving gift image:', error);
      
      if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type. Only images are allowed.'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to save image',
        message: error.message
      });
    }
  } else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
};

// Export config for multer
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
