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

  static async createOpera(req, res) {
    try {
      const { title, maker, place } = req.body;
      const operaRequestDTO = new OperaRequestDTO(title, maker, place);

      const operaData = OperaMapper.toOperaModel(operaRequestDTO);

      const newOpera = await OperaService.createOpera(operaData);
      const newOperaDTO = OperaMapper.toOperaResponseDTO(newOpera);

      res.status(201).json(newOperaDTO);
    } catch (error) {
      res.status(500).json({ message: 'Error creating opera', error: error.message });
    }
  }
}

module.exports = OperaController;
