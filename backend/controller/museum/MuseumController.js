const MuseumService = require('../../service/MuseumService');
const MuseumMapper = require('../../data/mapper/MuseumMapper');
const VisitMapper = require('../../data/mapper/VisitMapper');

class MuseumController {
  static async getAll(req, res) {
    try {
      const museums = await MuseumService.getAllMuseum();
      res.status(200).json(museums);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async getHomePresentation(req, res) {
    try {
      const museums = await MuseumService.getMuseumHomePresentation();
      res.status(200).json(museums);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async getById(req, res) {
    try {
      const id = req.params.id;
      const museums = await MuseumService.getMuseumById(id);
      res.status(200).json(museums);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async searchByName(req, res) {
    try {
      const museums = await MuseumService.searchByName(req.body.str);
      res.status(200).json(museums);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async getAllMuseumVisits(req, res) {
    try {
      const visits = await MuseumService.getAllMuseumVisits(req.params.id);
      if (!visits || visits.length === 0) {
        return res.status(404).json({ message: 'No visits found for this museum' });
      }
      res.status(200).json(visits);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async create(req, res) {
    try {
      const museum = await MuseumService.createMuseum(req.body);
      res.status(201).json(museum);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }

  static async update(req, res) {
    try {
      const id = req.params.id || req.body.id;
      const updatedMuseum = await MuseumService.updateMuseum(id, req.body);
      if (!updatedMuseum) {
        return res.status(404).json({ message: 'Museum not found' });
      }
      res.json(updatedMuseum);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }

  static async delete(req, res) {
    try {
      const id = req.params.id || req.body.id;
      const deletedMuseum = await MuseumService.deleteMuseum(id);
      if (!deletedMuseum) {
        return res.status(404).json({ message: 'Museum not found' });
      }
      res.json({ message: 'Museum deleted successfully' });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async getVisitPlan(req, res) {
    try {
      const id = req.params.id;
      const museumVisitPlanDTO = await MuseumService.getMuseumVisitPlanById(id);
      res.status(200).json(museumVisitPlanDTO);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

}

module.exports = MuseumController;
