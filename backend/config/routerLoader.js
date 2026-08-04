const fs = require('fs');
const path = require('path');

/**
 * Scans the controller directory for all modules and returns their router file paths and route prefixes.
 */
function getModuleRouters() {
  const controllerDir = path.join(__dirname, '../controller');
  if (!fs.existsSync(controllerDir)) return [];

  const modules = fs.readdirSync(controllerDir, { withFileTypes: true });
  const routers = [];

  for (const mod of modules) {
    if (mod.isDirectory()) {
      const dirPath = path.join(controllerDir, mod.name);
      const files = fs.readdirSync(dirPath);
      const routerFile = files.find(f => f.endsWith('Router.js') || f.endsWith('Routes.js'));
      if (routerFile) {
        routers.push({
          name: mod.name,
          filePath: path.join(dirPath, routerFile),
          routePrefix: `/api/${mod.name}`
        });
      }
    }
  }
  return routers;
}

/**
 * Automatically mounts all discovered module routers on express app under /api/<moduleName>
 */
function loadRoutes(app) {
  const routers = getModuleRouters();
  routers.forEach(({ name, routePrefix, filePath }) => {
    const router = require(filePath);
    app.use(routePrefix, router);
    console.log(`[AutoRouter] Registered ${routePrefix} -> ${path.relative(path.join(__dirname, '..'), filePath)}`);
    // 
    if (!name.endsWith('s')) {
      const pluralPrefix = `${routePrefix}s`;
      app.use(pluralPrefix, router);
      console.log(`[AutoRouter] Registered plural alias ${pluralPrefix} -> ${path.relative(path.join(__dirname, '..'), filePath)}`);
    }
  });
}

module.exports = { loadRoutes, getModuleRouters };
