const path = require('path');
const fs = require('fs');
const express = require('express');

function getPossibleDistPaths() {
  return [
    path.join(__dirname, '../../frontend/dist/frontend/browser'),
    path.join(__dirname, '../../frontend/dist/browser'),
    path.join(__dirname, '../../frontend/dist/frontend'),
    path.join(__dirname, '../../frontend/dist'),
    path.join(__dirname, '../../../frontend/dist/frontend/browser'),
    path.join(__dirname, '../../../frontend/dist/browser'),
    path.join(__dirname, '../frontend/dist/frontend/browser'),
    path.join(__dirname, '../frontend/dist/browser'),
    path.join(__dirname, '../frontend/dist/frontend'),
    path.join(__dirname, '../frontend/dist'),
    path.join(process.cwd(), '../frontend/dist/frontend/browser'),
    path.join(process.cwd(), '../frontend/dist/browser'),
    path.join(process.cwd(), 'frontend/dist/frontend/browser'),
    path.join(process.cwd(), 'frontend/dist/browser'),
    path.join(process.cwd(), 'frontend/dist/frontend'),
    path.join(process.cwd(), 'frontend/dist'),
    '/home/web/site252623/html/frontend/dist/frontend/browser',
    '/home/web/site252623/html/frontend/dist/browser',
    '/home/web/site252623/html/frontend/dist/frontend',
    '/home/web/site252623/html/frontend/dist'
  ];
}

function findAngularDist() {
  for (const p of getPossibleDistPaths()) {
    if (fs.existsSync(path.join(p, 'index.html'))) {
      return p;
    }
  }
  return null;
}

function setupStaticAssets(app) {
  const backendAssetsPath = path.join(__dirname, '../assets');
  const frontendPublicPath = path.join(__dirname, '../../frontend/public');

  // Immagini salvate in backend (es immagini opere)
  app.use('/assets', express.static(backendAssetsPath));

  // Serve static files from all valid frontend dist candidates
  const distDir = findAngularDist();
  if (distDir) {
    console.log(`[StaticLoader] Serving Angular dist from: ${distDir}`);
    app.use(express.static(distDir));
  } else {
    console.warn('[StaticLoader] Angular index.html non trovato nei percorsi di ricerca dist.');
  }

  // Monta staticamente tutti i percorsi candidati esistenti
  getPossibleDistPaths().forEach(p => {
    if (fs.existsSync(p)) {
      app.use(express.static(p));
    }
  });

  if (fs.existsSync(frontendPublicPath)) {
    app.use(express.static(frontendPublicPath));
  }

  // Handler di fallback per routing SPA Angular (HTML5 pushState)
  app.get(/(.*)/, (req, res, next) => {
    // Escludi rotte backend /api e documentazione swagger /api-docs
    if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
      return next();
    }

    const currentDist = findAngularDist();
    if (currentDist && fs.existsSync(path.join(currentDist, 'index.html'))) {
      return res.sendFile(path.join(currentDist, 'index.html'));
    }

    next();
  });
}

module.exports = setupStaticAssets;
