const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const passport = require('./passport');

function setupMiddlewares(app) {
  const nodeEnv = process.env.NODE_ENV || 'production';

  // Trust proxy for Nginx / Reverse Proxy
  app.set('trust proxy', 1);

  // Helmet HTTP security headers
  app.use(helmet({ contentSecurityPolicy: false }));

  // Dynamic CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:4200'];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || nodeEnv !== 'production' || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Error: Origin ${origin} not allowed`));
      }
    },
    credentials: true
  }));

  // Rate Limiter for API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' }
  });
  app.use('/api', apiLimiter);

  // Structured HTTP Request Logger
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // Body Parsing & Cookies
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Passport Authentication
  app.use(passport.initialize());
}

module.exports = setupMiddlewares;
