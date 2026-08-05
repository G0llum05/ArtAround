const path = require('path');
const fs = require('fs');
const express = require('express');

function setupStaticAssets(app) {
  const angularDistPath = path.join(__dirname, '../../frontend/dist/bacheca-ui/browser');
  const fallbackDistPath = path.join(__dirname, '../../frontend/dist/index.html');
  const frontendPublicPath = path.join(__dirname, '../../frontend/public');
  const backendAssetsPath = path.join(__dirname, '../assets');

  app.use('/assets', express.static(backendAssetsPath));
  app.use(express.static(angularDistPath));
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.use(express.static(frontendPublicPath));

  // Catch-all handler for Angular client-side routing
  app.get(/(.*)/, (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
      return next();
    }

    if (fs.existsSync(path.join(angularDistPath, 'index.html'))) {
      res.sendFile(path.join(angularDistPath, 'index.html'));
    } else if (fs.existsSync(fallbackDistPath)) {
      res.sendFile(fallbackDistPath);
    } else {
      next();
    }
  });
}

module.exports = setupStaticAssets;
