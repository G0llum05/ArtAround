const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');

function setupSwagger(app) {
  const swaggerJsonPath = path.join(__dirname, '../swagger-output.json');
  if (fs.existsSync(swaggerJsonPath)) {
    const swaggerDocument = require(swaggerJsonPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    console.log('[Swagger] UI available at: /api-docs');
  }
}

module.exports = setupSwagger;
