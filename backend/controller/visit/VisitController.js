const VisitService = require('../../service/VisitService');
const VisitMapper = require('../../data/mapper/VisitMapper');
const { VisitRequestDTO } = require('../../data/model/dto/VisitDTO');

class VisitController {
  static async getAllVisits(req, res) {
    try {
      const visits = await VisitService.getAllVisits();
      const visitDTOs = visits.map(visit => VisitMapper.toVisitResponseDTO(visit));
      res.status(200).json(visitDTOs);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving visits', error: error.message });
    }
  }

  static async createVisit(req, res) {
    try {
      const { title, description } = req.body;
      const visitRequestDTO = new VisitRequestDTO(title, description);

      const visitData = VisitMapper.toVisit(visitRequestDTO);
      
      const newVisit = await VisitService.createVisit(visitData);
      const newVisitDTO = VisitMapper.toVisitResponseDTO(newVisit);
      
      res.status(201).json(newVisitDTO);
    } catch (error) {
      res.status(500).json({ message: 'Error creating visit', error: error.message });
    }
  }
}

module.exports = VisitController;
