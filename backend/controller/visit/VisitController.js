const VisitService = require('../../service/VisitService');
const VisitMapper = require('../../data/mapper/VisitMapper');
const {
  VisitRequestDTO,
  VisitImageRequestDTO,
  VisitHomePresentationRequestDTO
} = require('../../data/model/dto/VisitDTO');

class VisitController {
  static async getAllVisits(req, res) {
    try {
      const { category } = req.query;
      const visits = await VisitService.getAllVisits(category);
      const visitDTOs = visits.map(visit => VisitMapper.toVisitResponseDTO(visit));
      res.status(200).json(visitDTOs);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving visits', error: error.message });
    }
  }

  static async getMarketplaceFeed(req, res) {
    try {
      const feed = await VisitService.getMarketplaceFeed();
      // Map visits inside each category row to DTOs
      const formattedFeed = feed.map(row => ({
        category: row.category,
        visits: row.visits.map(v => VisitMapper.toVisitResponseDTO(v))
      }));
      res.status(200).json(formattedFeed);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving marketplace feed', error: error.message });
    }
  }

  static async likeVisit(req, res) {
    try {
      const { id } = req.params;
      const { delta } = req.body; // +1 or -1
      const updatedVisit = await VisitService.incrementLikes(id, delta || 1);
      if (!updatedVisit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      res.status(200).json(VisitMapper.toVisitResponseDTO(updatedVisit));
    } catch (error) {
      res.status(500).json({ message: 'Error liking visit', error: error.message });
    }
  }

  static async viewVisit(req, res) {
    try {
      const { id } = req.params;
      const updatedVisit = await VisitService.incrementViews(id);
      if (!updatedVisit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      res.status(200).json(VisitMapper.toVisitResponseDTO(updatedVisit));
    } catch (error) {
      res.status(500).json({ message: 'Error recording view for visit', error: error.message });
    }
  }


  static async getVisitArtworkImages(req, res) {
    try {
      const visitId = req.params.visitId;
      const museumId = req.params.museumId;

      // Normalizzazione Input DTO
      const requestDTO = new VisitImageRequestDTO(museumId, visitId);

      const result = await VisitService.getVisitArtworkImages(requestDTO.visitId, requestDTO.museumId);
      if (!result) {
        return res.status(404).json({ message: 'Visita non trovata' });
      }
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Errore durante la risoluzione delle immagini per la visita', error: error.message });
    }
  }

  static async getVisitArtistImages(req, res) {
    try {
      const visitId = req.params.visitId;
      const museumId = req.params.museumId;

      // Normalizzazione Input DTO
      const requestDTO = new VisitImageRequestDTO(museumId, visitId);

      const result = await VisitService.getVisitArtistImages(requestDTO.museumId, requestDTO.visitId);
      if (!result) {
        return res.status(404).json({ message: 'Visita non trovata' });
      }
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Errore durante la risoluzione delle immagini degli artisti', error: error.message });
    }
  }

  static async getVisitHomePresentation(req, res) {
    try {
      const result = await VisitService.getTopTenVisits();
      if (!result) {
        return res.status(404).json({ message: 'Visite di presentazione non trovata' });
      }

      // Normalizzazione Output con Response DTO
      // Mapper.toVisitHomePresentationList(topVisits);

      // TODO CHECK isVerivied è verified da fixare
      res.status(200).json(result.map(visit => VisitMapper.toTopTenVisitsResponse(visit)));
    } catch (error) {
      res.status(500).json({ message: 'Errore durante la generazione della presentazione home per la visita', error: error.message });
    }
  }


  static async createVisit(req, res) {
    try {
      const request = VisitMapper.createVisit(req.body.museumId, req.body.userId, req.body);
      const newVisitId = await VisitService.createVisit(request);

      res.status(201).json({ visitId: newVisitId });
    } catch (error) {
      res.status(500).json({ message: 'Error creating visit', error: error.message });
    }
  }


}

module.exports = VisitController;
