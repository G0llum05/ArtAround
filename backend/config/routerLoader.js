const fs = require('fs');
const path = require('path');

// Prende tutte le rotte dei vari router di ogni componente (La struttura del back deve dunque rimanere fatta in questo modo) e aggangia i sotto-router tra loro (aggiungento il prefisso /api)
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
  // tutti i router di tutto il back
  const routers = getModuleRouters();
  routers.forEach(({ name, routePrefix, filePath }) => {
    const router = require(filePath);
    app.use(routePrefix, router);
    console.log(`[AutoRouter] Registered ${routePrefix} -> ${path.relative(path.join(__dirname, '..'), filePath)}`);
    // Condizione per mettere a disposizione anche la rotta in versione plurale, che può essere invocata anche in questo modo.
    // TODO CHECK: il nome che finische con 's' potrebbe non essere un plurale
    // TODO CHECK: alcuni plurali non sono semplicemente aggiungendo 's' (es. 'category' -> 'categories'), quindi questa logica va rivista in futuro
    if (!name.endsWith('s')) {
      const pluralPrefix = `${routePrefix}s`;
      app.use(pluralPrefix, router);
      console.log(`[AutoRouter] Registered plural alias ${pluralPrefix} -> ${path.relative(path.join(__dirname, '..'), filePath)}`);
    }
  });
}

module.exports = { loadRoutes, getModuleRouters };
