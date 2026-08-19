const MuseumService = require('../../service/MuseumService');
const MuseumMapper = require('../../data/mapper/MuseumMapper');
const VisitMapper = require('../../data/mapper/VisitMapper');
const ArtworkMapper = require('../../data/mapper/ArtworkMapper');

class MuseumController {
  static async getAll(req, res) {
    try {
      const museums = await MuseumService.getAllMuseum();
      const museumDTOs = museums.map
      (
        (mus) => {
          return MuseumMapper.toMuseumResponseDTO(mus);
        }
      );
      res.status(200).json(museumDTOs);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async getHomePresentation(req, res) {
    try {
      const museums = await MuseumService.getMuseumHomePresentation();
      const museumDTOs = museums.map
      (
        (m) => {
          return MuseumMapper.toMuseumHomePresentationResponseDTO(m);
        }
      );
      res.status(200).json(museumDTOs);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async getById(req, res) {
    try {
      const id = req.params.id;
      const museum = await MuseumService.getMuseumById(id);
      const museumDTO = MuseumMapper.toMuseumResponseDTO(museum);
      res.status(200).json(museumDTO);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async searchByName(req, res) {
    try {
      const museums = await MuseumService.searchByName(req.body.str);
      const museumDTOs = museums.map
      (
        (m) => {
          return MuseumMapper.toMuseumResponseDTO(m);
        }
      )
      res.status(200).json(museumDTOs);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async getAllMuseumVisits(req, res) {
    try {
      const visits = await MuseumService.getAllMuseumVisits(req.params.id);
      if (!visits) {
        res.status(404).json({ message: "Museum not found"});
      }
      const visitsDTOs = visits.map
      (
        (vis) => {
          return VisitMapper.toVisitResponsePresentation(vis);
        }
      );
      res.status(200).json(visitsDTOs || []);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
  
  static async getAllMuseumArtworks(req, res) {
    try {
      const artworks = await MuseumService.getAllMuseumArtworks(req.params.id);
      if (!artworks) {
        res.status(404).json({ message: "Museum not found"});
      }
      const artworkDTOs = artworks.map
      (
        (art) => {
          return ArtworkMapper.toArtworkForPresentationDTO(art); 
        }
      );
      res.status(200).json(artworkDTOs || []);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async create(req, res) {
    try {
      const museum = await MuseumService.createMuseum(req.body);
      const museumDTO = MuseumMapper.toMuseumResponseDTO(museum);
      res.status(201).json(museumDTO);
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
      const museumDTO = MuseumMapper.toMuseumResponseDTO(updatedMuseum);
      res.json(museumDTO);
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
      const museumDTO = MuseumMapper.toMuseumResponseDTO(deletedMuseum);
      res.json({ message: 'Museum deleted successfully' });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async getVisitPlan(req, res) {
    try {
      const id = req.params.id;
      const museum = await MuseumService.getMuseumVisitPlanById(id);
      if (!museum) {
        res.stauts(404).json({ message: "Museum not found"});
      }
      const museumVisitPlanDTO = MuseumMapper.toMuseumVisitPlanResponseDTO(museum);
      res.status(200).json(museumVisitPlanDTO);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

}

module.exports = MuseumController;
