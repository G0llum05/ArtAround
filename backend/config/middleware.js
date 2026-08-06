const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const passport = require('./passport');

function setupMiddlewares(app) {
  const nodeEnv = process.env.NODE_ENV || 'production';

  // per Nginx del lab, serve per https
  app.set('trust proxy', 1);

  // header di sicurezza con helmet, escluso CSP per non avere problemi con angular e fonts
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS
  const defaultOrigins = [
    'http://localhost:4200',
    'http://localhost:8000',
    'https://site252623.tw.cs.unibo.it',
    'http://site252623.tw.cs.unibo.it'
  ];
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : defaultOrigins;

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.endsWith('.tw.cs.unibo.it')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Error: Origin ${origin} not allowed`));
      }
    },
    credentials: true
  }));

  // rate limiter
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minuti in millisecondi
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,  // per rimuovere header deprecati
    message: { success: false, error: 'Too many requests, please try again later.' }
  });
  app.use('/api', apiLimiter);

  // log per richieste backend: stampa anche status code e durata
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // body parser per ottenere subito oggetti js. Aumentato anche limite da 100k a 10m
  app.use(express.json({ limit: '10mb' }));

  // per coockie
  app.use(cookieParser());

  // passport
  app.use(passport.initialize());
}

module.exports = setupMiddlewares;
