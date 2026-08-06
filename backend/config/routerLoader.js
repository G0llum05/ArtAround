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

// Caricare tutte le rotte
function loadRoutes(app) {
  // tutti i router di tutto il back
  const routers = getModuleRouters();
  routers.forEach(({ routePrefix, filePath }) => {
    const router = require(filePath);
    app.use(routePrefix, router);
    console.log(`[AutoRouter] Registered ${routePrefix} -> ${path.relative(path.join(__dirname, '..'), filePath)}`);
  });
}

module.exports = { loadRoutes, getModuleRouters };
