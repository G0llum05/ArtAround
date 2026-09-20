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
      const visitDTOs = visits.map(visit => VisitMapper.toVisitResponsePresentation(visit));
      res.status(200).json(visitDTOs);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving visits', error: error.message });
    }
  }

  static async getVisitsWithMoreThanTenArtworks(req, res) {
    try {
      const minArtworks = parseInt(req.query.min, 10) || 10;
      const visits = await VisitService.getVisitsWithMoreThanTenArtworks(minArtworks);
      const visitDTOs = visits.map(visit => VisitMapper.toVisitResponsePresentation(visit));
      res.status(200).json(visitDTOs);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving visits with more than 10 artworks', error: error.message });
    }
  }

  // TODO CHECK la risposta ha un modello aggiornato che va allinato qua perchè i dati probabilmente non lo sono e le immagini anche che in getALL non sono implementate
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

  static async getVisitById(req, res) {
    try {
      const visitId = req.params.id
      if (!visitId) {
        return res.status(404).json({ message: 'Manca id visita' });
      }
      const visit = await VisitService.getVisitById(visitId);
      const visitDTO = VisitMapper.toVisitResponseDTO(visit);
      res.status(200).json(visitDTO);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving visit', error: error.message });
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
      res.status(200).json(result.map(visit => VisitMapper.toVisitResponsePresentation(visit)));
    } catch (error) {
      res.status(500).json({ message: 'Errore durante la generazione della presentazione home per la visita', error: error.message });
    }
  }


  static async purchaseVisit(req, res) {
    try {
      const visitId = req.params.id;
      const { userId } = req.body;
      if (!visitId || !userId) {
        return res.status(400).json({ message: 'visitId and userId are required' });
      }
      const UserService = require('../../service/UserService');
      const UserMapper = require('../../data/mapper/UserMapper');
      const updatedUser = await UserService.purchaseVisit(userId, visitId);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({
        message: 'Visita acquistata con successo',
        user: UserMapper.toUserResponseDTO(updatedUser)
      });
    } catch (error) {
      res.status(500).json({ message: 'Error purchasing visit', error: error.message });
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

  static async getVisitsByCreator(req, res) {
    try {
      const userId = req.params.userId || req.params.id;
      const visits = await VisitService.getVisitsByCreator(userId);
      res.status(200).json(visits.map(v => VisitMapper.toVisitResponsePresentation(v)));
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving visits by creator', error: error.message });
    }
  }

  static async deleteVisit(req, res) {
    try {
      const visitId = req.params.id;
      const deletedVisit = await VisitService.deleteVisit(visitId);
      if (!deletedVisit) {
        return res.status(404).json({ message: 'Visita non trovata' });
      }
      res.status(200).json({ message: 'Visita eliminata con successo', id: visitId });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting visit', error: error.message });
    }
  }
}

module.exports = VisitController;
