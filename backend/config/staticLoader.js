const path = require('path');
const fs = require('fs');
const express = require('express');

function setupStaticAssets(app) {
  // Setup per angular
  const angularDistPath = path.join(__dirname, '../../frontend/dist/bacheca-ui/browser');
  const fallbackDistPath = path.join(__dirname, '../../frontend/dist/index.html');
  const frontendPublicPath = path.join(__dirname, '../../frontend/public');
  const backendAssetsPath = path.join(__dirname, '../assets');

  // Immagini salvate in backend (es immagini opere)
  app.use('/assets', express.static(backendAssetsPath));

  app.use(express.static(angularDistPath));
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.use(express.static(frontendPublicPath));

  // handler di fallback per routing angular client-side
  app.get(/(.*)/, (req, res, next) => {
    // In questo blocco entrano le rotte back che non hanno fatto match con niente, perchè Express ha già scorso il Router backend
    if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {  // api-docs è la rotta di swagger
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
