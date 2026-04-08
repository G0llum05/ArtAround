// RESPONSES
class ArtistResponseDTO {
  constructor(id, name, surname, artworks, artisticCurrents, followerOf, teacherOf) {
    this.id = id;
    this.name = name;
    this.surname = surname;
    this.artworks = artworks;
    this.artisticCurrents = artisticCurrents;
    this.followerOf = followerOf;
    this.teacherOf = teacherOf;
  }
}

// REQUESTS
class ArtistRequestDTO {
  constructor(name, surname, artworks, artisticCurrents, followerOf, teacherOf) {
    this.name = name;
    this.surname = surname;
    this.artworks = artworks; // Array of IDs
    this.artisticCurrents = artisticCurrents; // Array of strings
    this.followerOf = followerOf; // Array of IDs
    this.teacherOf = teacherOf; // Array of IDs
  }
}

module.exports = {
  ArtistResponseDTO,
  ArtistRequestDTO
};
