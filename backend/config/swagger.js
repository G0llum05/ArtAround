const path = require('path');
const fs = require('fs');
const swaggerAutogen = require('swagger-autogen')();
const { getModuleRouters } = require('./routerLoader');

const outputFile = path.join(__dirname, '../swagger-output.json');
const tempEntryFile = path.join(__dirname, '.swagger-entry.js');

const tagMapping = {
  auth: 'Authentication',
  role: 'Role Management',
  user: 'User',
  artwork: 'Artwork',
  artist: 'Artist',
  museum: 'Museum',
  visit: 'Visit',
  navigator: 'Navigator',
  upload: 'Upload',
  item: 'Item'
};

const doc = {
  info: {
    title: 'ArtAround Backend API',
    description: 'Documentazione interattiva OpenAPI / Swagger per l\'API REST di ArtAround.',
    version: '1.0.0'
  },
  host: process.env.SWAGGER_HOST || 'localhost:8000',
  basePath: '/',
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Inserisci il token JWT nel formato: Bearer <token>'
    }
  }
};

function formatTagName(modName) {
  if (tagMapping[modName]) return tagMapping[modName];
  return modName.charAt(0).toUpperCase() + modName.slice(1);
}

async function generateSwagger() {
  console.log('[Swagger] Scansione ed estrazione delle rotte API in corso...');
  const routers = getModuleRouters();

  // Genera un entry file temporaneo per consentire a swagger-autogen di rilevare i prefissi delle rotte /api/<modulo>
  const fileLines = [
    "const express = require('express');",
    "const app = express();",
    ""
  ];

  routers.forEach(r => {
    let relativePath = path.relative(__dirname, r.filePath).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    fileLines.push(`app.use('${r.routePrefix}', require('${relativePath}'));`);
  });

  fs.writeFileSync(tempEntryFile, fileLines.join('\n'), 'utf8');

  try {
    await swaggerAutogen(outputFile, [tempEntryFile], doc);

    // Post-processing: Assegna i tag corretti in base al prefisso della rotta se non specificati
    if (fs.existsSync(outputFile)) {
      const rawData = fs.readFileSync(outputFile, 'utf8');
      const swaggerData = JSON.parse(rawData);

      if (swaggerData.paths) {
        Object.keys(swaggerData.paths).forEach(routePath => {
          // Trova il modulo corrispondente per la rotta (es. /api/auth/login -> module auth)
          const matchedRouter = routers.find(r => routePath.startsWith(r.routePrefix));
          const tagName = matchedRouter ? formatTagName(matchedRouter.name) : 'General';

          const methods = swaggerData.paths[routePath];
          Object.keys(methods).forEach(method => {
            if (typeof methods[method] === 'object' && methods[method] !== null) {
              if (!methods[method].tags || methods[method].tags.length === 0) {
                methods[method].tags = [tagName];
              }
            }
          });
        });
      }

      fs.writeFileSync(outputFile, JSON.stringify(swaggerData, null, 2), 'utf8');
    }

    console.log(`[Swagger] File OpenAPI generato con successo: ${outputFile}`);
  } catch (error) {
    console.error('[Swagger] Errore durante la generazione dello schema OpenAPI:', error);
  } finally {
    if (fs.existsSync(tempEntryFile)) {
      fs.unlinkSync(tempEntryFile);
    }
  }
}

if (require.main === module) {
  generateSwagger();
}

module.exports = { generateSwagger, outputFile };
