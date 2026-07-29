const ArtworkService = require('../../service/ArtworkService');
const ArtworkMapper = require('../../data/mapper/ArtworkMapper');
const { ArtworkRequestDTO } = require('../../data/model/dto/ArtworkDTO');

class ArtworkController {
  static async getAllArtworks(req, res) {
    try {
      const artworks = await ArtworkService.getAllArtworks();
      const artworkDTOs = artworks.map(artwork => ArtworkMapper.toArtworkResponseDTO(artwork));
      res.status(200).json(artworkDTOs);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving artworks', error: error.message });
    }
  }

  static async getArtworkById(req, res) {
    try {
      const artwork = await ArtworkService.getArtworkById(req.params.id);
      if (!artwork) {
        return res.status(404).json({ message: 'Artwork not found' });
      }
      res.status(200).json(ArtworkMapper.toArtworkResponseDTO(artwork));
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving artwork', error: error.message });
    }
  }

  static async createArtwork(req, res) {
    try {
      const artworkRequestDTO = new ArtworkRequestDTO(
        req.body.title,
        req.body.description,
        req.body.startYear,
        req.body.endYear,
        req.body.artists,
        req.body.museum,
        req.body.location,
        req.body.dimensions,
        req.body.artisticCurrents,
        req.body.details,
        req.body.copyOf,
        req.body.falsificationOf,
        req.body.isActive,
        req.body.isPrivate,
        req.body.qrCode,
        req.body.images,
        req.body.items
      );

      const artworkData = ArtworkMapper.toArtworkModel(artworkRequestDTO);
      const newArtwork = await ArtworkService.createArtwork(artworkData);
      res.status(201).json(ArtworkMapper.toArtworkResponseDTO(newArtwork));
    } catch (error) {
      res.status(400).json({ message: 'Error creating artwork', error: error.message });
    }
  }

  static async updateArtwork(req, res) {
    try {
      // Per l'update possiamo passare direttamente il body o mappare anche qui
      const updatedArtwork = await ArtworkService.updateArtwork(req.params.id, req.body);
      if (!updatedArtwork) {
        return res.status(404).json({ message: 'Artwork not found' });
      }
      res.status(200).json(ArtworkMapper.toArtworkResponseDTO(updatedArtwork));
    } catch (error) {
      res.status(400).json({ message: 'Error updating artwork', error: error.message });
    }
  }

  static async deleteArtwork(req, res) {
    try {
      const deletedArtwork = await ArtworkService.deleteArtwork(req.params.id);
      if (!deletedArtwork) {
        return res.status(404).json({ message: 'Artwork not found' });
      }
      res.status(200).json({ message: 'Artwork deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting artwork', error: error.message });
    }
  }
}

module.exports = ArtworkController;
