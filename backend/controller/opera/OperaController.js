const OperaService = require('../../service/OperaService');
const OperaMapper = require('../../data/mapper/OperaMapper');
const { OperaRequestDTO } = require('../../data/model/dto/OperaDTO');

class OperaController {
  static async getAllOperas(req, res) {
    try {
      const operas = await OperaService.getAllOperas();
      const operaDTOs = operas.map(opera => OperaMapper.toOperaResponseDTO(opera));
      res.status(200).json(operaDTOs);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving operas', error: error.message });
    }
  }

  static async getOperaById(req, res) {
    try {
      const opera = await OperaService.getOperaById(req.params.id);
      if (!opera) {
        return res.status(404).json({ message: 'Opera not found' });
      }
      res.status(200).json(OperaMapper.toOperaResponseDTO(opera));
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving opera', error: error.message });
    }
  }

  static async createOpera(req, res) {
    try {
      const operaRequestDTO = new OperaRequestDTO(
        req.body.title,
        req.body.description,
        req.body.startYear,
        req.body.endYear,
        req.body.artists,
        req.body.location,
        req.body.dimensions,
        req.body.artisticCurrents,
        req.body.details,
        req.body.copyOf,
        req.body.falsificationOf
      );

      const operaData = OperaMapper.toOperaModel(operaRequestDTO);
      const newOpera = await OperaService.createOpera(operaData);
      res.status(201).json(OperaMapper.toOperaResponseDTO(newOpera));
    } catch (error) {
      res.status(400).json({ message: 'Error creating opera', error: error.message });
    }
  }

  static async updateOpera(req, res) {
    try {
      // Per l'update possiamo passare direttamente il body o mappare anche qui
      const updatedOpera = await OperaService.updateOpera(req.params.id, req.body);
      if (!updatedOpera) {
        return res.status(404).json({ message: 'Opera not found' });
      }
      res.status(200).json(OperaMapper.toOperaResponseDTO(updatedOpera));
    } catch (error) {
      res.status(400).json({ message: 'Error updating opera', error: error.message });
    }
  }

  static async deleteOpera(req, res) {
    try {
      const deletedOpera = await OperaService.deleteOpera(req.params.id);
      if (!deletedOpera) {
        return res.status(404).json({ message: 'Opera not found' });
      }
      res.status(200).json({ message: 'Opera deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting opera', error: error.message });
    }
  }
}

module.exports = OperaController;
