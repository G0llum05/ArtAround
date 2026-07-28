const path = require('path');
const swaggerAutogen = require('swagger-autogen')();
const { getModuleRouters } = require('./routerLoader');

const outputFile = path.join(__dirname, '../swagger-output.json');
const serverFile = path.join(__dirname, '../server.js');

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

async function generateSwagger() {
  console.log('[Swagger] Scansione ed estrazione delle rotte API in corso...');
  const routerFiles = getModuleRouters().map(r => r.filePath);
  const filesToScan = [serverFile, ...routerFiles];

  try {
    await swaggerAutogen(outputFile, filesToScan, doc);
    console.log(`[Swagger] File OpenAPI generato con successo: ${outputFile}`);
  } catch (error) {
    console.error('[Swagger] Errore durante la generazione dello schema OpenAPI:', error);
  }
}

if (require.main === module) {
  generateSwagger();
}

module.exports = { generateSwagger, outputFile };
