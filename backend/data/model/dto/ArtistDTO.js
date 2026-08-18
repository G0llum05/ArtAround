// RESPONSES
class ArtistResponseDTO {
  constructor(id, name, surname, artworks, artisticCurrents, followerOf, teacherOf, assets) {
    this.id = id;
    this.name = name;
    this.surname = surname;
    this.artworks = artworks;
    this.artisticCurrents = artisticCurrents;
    this.followerOf = followerOf;
    this.teacherOf = teacherOf;
    this.assets = assets;
  }
}

// REQUESTS
class ArtistRequestDTO {
  constructor(name, surname, artworks, artisticCurrents, followerOf, teacherOf, assets) {
    this.name = name;
    this.surname = surname;
    this.artworks = artworks; // Array of IDs
    this.artisticCurrents = artisticCurrents; // Array of strings
    this.followerOf = followerOf; // Array of IDs
    this.teacherOf = teacherOf; // Array of IDs
    this.assets = assets;
  }
}

module.exports = {
  ArtistResponseDTO,
  ArtistRequestDTO
};
