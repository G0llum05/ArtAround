const fs = require('fs');
const path = require('path');
const { generateSwagger } = require('../config/swagger');

// Helper to convert string formats
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function uncapitalize(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

const rawName = process.argv[2];

if (!rawName) {
  console.log(`
Uso: npm run generate:module <NomeModulo>
Esempio: npm run generate:module Exhibition
`);
  process.exit(1);
}

const PascalName = capitalize(rawName);
const camelName = uncapitalize(rawName);
const lowerDir = rawName.toLowerCase();

const rootDir = path.join(__dirname, '..');
const controllerDir = path.join(rootDir, 'controller', lowerDir);
const modelDir = path.join(rootDir, 'data', 'model');
const dtoDir = path.join(rootDir, 'data', 'model', 'dto');
const mapperDir = path.join(rootDir, 'data', 'mapper');
const serviceDir = path.join(rootDir, 'service');

// Ensure directories exist
[controllerDir, modelDir, dtoDir, mapperDir, serviceDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File definitions
const files = {
  model: {
    path: path.join(modelDir, `${PascalName}.js`),
    content: `const mongoose = require('mongoose');

const ${camelName}Schema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('${PascalName}', ${camelName}Schema);
`
  },
  dto: {
    path: path.join(dtoDir, `${PascalName}DTO.js`),
    content: `class ${PascalName}ResponseDTO {
    constructor(id, title, description) {
        this.id = id;
        this.title = title;
        this.description = description;
    }
}

class ${PascalName}RequestDTO {
    constructor(title, description) {
        this.title = title;
        this.description = description;
    }
}

module.exports = {
    ${PascalName}ResponseDTO,
    ${PascalName}RequestDTO
};
`
  },
  mapper: {
    path: path.join(mapperDir, `${PascalName}Mapper.js`),
    content: `const { ${PascalName}ResponseDTO } = require('../model/dto/${PascalName}DTO');

class ${PascalName}Mapper {
    static to${PascalName}ResponseDTO(model) {
        if (!model) return null;
        return new ${PascalName}ResponseDTO(
            model._id,
            model.title,
            model.description
        );
    }

    static to${PascalName}Model(dto) {
        return {
            title: dto.title,
            description: dto.description
        };
    }
}

module.exports = ${PascalName}Mapper;
`
  },
  service: {
    path: path.join(serviceDir, `${PascalName}Service.js`),
    content: `const ${PascalName} = require('../data/model/${PascalName}');

class ${PascalName}Service {
    static async getAll() {
        return await ${PascalName}.find();
    }

    static async getById(id) {
        return await ${PascalName}.findById(id);
    }

    static async create(data) {
        const item = new ${PascalName}(data);
        return await item.save();
    }

    static async update(id, data) {
        return await ${PascalName}.findByIdAndUpdate(id, data, { new: true });
    }

    static async delete(id) {
        return await ${PascalName}.findByIdAndDelete(id);
    }
}

module.exports = ${PascalName}Service;
`
  },
  controller: {
    path: path.join(controllerDir, `${PascalName}Controller.js`),
    content: `const ${PascalName}Service = require('../../service/${PascalName}Service');
const ${PascalName}Mapper = require('../../data/mapper/${PascalName}Mapper');
const { ${PascalName}RequestDTO } = require('../../data/model/dto/${PascalName}DTO');

class ${PascalName}Controller {
    static async getAll(req, res) {
        try {
            const items = await ${PascalName}Service.getAll();
            const dtos = items.map(item => ${PascalName}Mapper.to${PascalName}ResponseDTO(item));
            res.status(200).json(dtos);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const item = await ${PascalName}Service.getById(req.params.id);
            if (!item) {
                return res.status(404).json({ message: '${PascalName} non trovato' });
            }
            res.status(200).json(${PascalName}Mapper.to${PascalName}ResponseDTO(item));
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async create(req, res) {
        try {
            const dto = new ${PascalName}RequestDTO(req.body.title, req.body.description);
            const newItem = await ${PascalName}Service.create(${PascalName}Mapper.to${PascalName}Model(dto));
            res.status(201).json(${PascalName}Mapper.to${PascalName}ResponseDTO(newItem));
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const updated = await ${PascalName}Service.update(req.params.id, req.body);
            if (!updated) {
                return res.status(404).json({ message: '${PascalName} non trovato' });
            }
            res.status(200).json(${PascalName}Mapper.to${PascalName}ResponseDTO(updated));
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const deleted = await ${PascalName}Service.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ message: '${PascalName} non trovato' });
            }
            res.status(200).json({ message: '${PascalName} eliminato con successo' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = ${PascalName}Controller;
`
  },
  router: {
    path: path.join(controllerDir, `${PascalName}Router.js`),
    content: `const express = require('express');
const ${PascalName}Controller = require('./${PascalName}Controller');

const router = express.Router();

/* #swagger.tags = ['${PascalName}'] */

// GET lista di ${lowerDir}
router.get('/', ${PascalName}Controller.getAll);

// GET ${lowerDir} per ID
router.get('/:id', ${PascalName}Controller.getById);

// CREA un nuovo ${lowerDir}
router.post('/', ${PascalName}Controller.create);

// AGGIORNA un ${lowerDir} per ID
router.patch('/:id', ${PascalName}Controller.update);

// ELIMINA un ${lowerDir} per ID
router.delete('/:id', ${PascalName}Controller.delete);

module.exports = router;
`
  }
};

console.log(`[Generator] Creazione modulo '${PascalName}' in corso...`);

for (const [key, fileObj] of Object.entries(files)) {
  if (fs.existsSync(fileObj.path)) {
    console.log(`  [Skip] ${fileObj.path} esiste già.`);
  } else {
    fs.writeFileSync(fileObj.path, fileObj.content, 'utf-8');
    console.log(`  [Created] ${fileObj.path}`);
  }
}

console.log(`[Generator] Modulo '${PascalName}' creato con successo!`);
console.log(`[Generator] Rigenerazione documentazione Swagger...`);
generateSwagger().then(() => {
  console.log(`[Generator] Completato! La rotta /api/${lowerDir} è montata automaticamente.`);
});
