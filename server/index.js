require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initDb } = require('./db');

const { router: authRouter } = require('./routes/auth');
const productsRouter = require('./routes/products');
const reviewsRouter = require('./routes/reviews');
const cartRouter = require('./routes/cart');
const checkoutRouter = require('./routes/checkout');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure public/uploads directory exists on boot
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware with custom size limits for video uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Input Sanitization Middleware to prevent NoSQL/SQL and Script injection
const sanitizePayload = (req, res, next) => {
  const sanitizeValue = (val) => {
    if (typeof val === 'string') {
      return val.replace(/<[^>]*>/g, '') // Strip HTML tags
                .replace(/[$\{\}]/g, '')  // Prevent key injection characters
                .trim();
    }
    if (Array.isArray(val)) {
      return val.map(sanitizeValue);
    }
    if (typeof val === 'object' && val !== null) {
      const cleaned = {};
      for (let k in val) {
        cleaned[k] = sanitizeValue(val[k]);
      }
      return cleaned;
    }
    return val;
  };

  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);
  next();
};

app.use(sanitizePayload);

// Serve static uploaded media files
app.use('/uploads', express.static(uploadDir));

// Initialize Database Schema on boot
initDb()
  .then(() => {
    // API Routes
    app.use('/api/auth', authRouter);
    app.use('/api/products', productsRouter);
    app.use('/api/reviews', reviewsRouter);
    app.use('/api/cart', cartRouter);
    app.use('/api/checkout', checkoutRouter);

    // Healthcheck
    app.get('/api/health', (req, res) => {
      res.json({ status: 'healthy', database: 'connected' });
    });

    // Start Server
    app.listen(PORT, () => {
      console.log(`DreamNest Express Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database schema, server aborted.', err);
  });
