const MuseumService = require('../../service/MuseumService');

class MuseumController {
  static async getAll(req, res) {
    try {
      const museums = await MuseumService.getAllMuseum();
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

  static async getVisitsByMuseumId(req, res) {
    try {
      const visits = await MuseumService.getVisitsByMuseumId(req.params.id || req.body.id);
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
      const museumVisitPlanDTO = MuseumService.getMuseumVisitPlanById(id);
      res.status(200).json(museumVisitPlanDTO);
    } catch (e) {
      res.status(500).json({ message: e.message});
    }
  }

  static async getHomePresentation(req, res) {
    try {
      const id = req.params.id;
      const museumHomePresentationDTO = MuseumService.getMuseumHomePresentationById(id);
      res.status(200).json(museumHomePresentationDTO);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  } 
}

module.exports = MuseumController;
