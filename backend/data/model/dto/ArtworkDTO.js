// RESPONSES
class ArtworkResponseDTO {
    constructor(id, title, description, startYear, endYear, artists, museum, location, dimensions, artisticCurrents, details, copyOf, falsificationOf, isActive, isPrivate, qrCode, images, items) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.startYear = startYear;
        this.endYear = endYear;
        this.artists = artists; // can be IDs or populated objects
        this.museum = museum; // can be ID or populated object
        this.location = location;
        this.dimensions = dimensions;
        this.artisticCurrents = artisticCurrents;
        this.details = details;
        this.copyOf = copyOf;
        this.falsificationOf = falsificationOf;
        this.isActive = isActive;
        this.isPrivate = isPrivate;
        this.qrCode = qrCode;
        this.images = images;
        this.items = items;
    }
}

// REQUESTS
class ArtworkRequestDTO {
    constructor(title, description, startYear, endYear, artists, museum, location, dimensions, artisticCurrents, details, copyOf, falsificationOf, isActive, isPrivate, qrCode, images, items) {
        this.title = title;
        this.description = description;
        this.startYear = startYear;
        this.endYear = endYear;
        this.artists = artists; // Array of IDs
        this.museum = museum; // ID
        this.location = location; // Object { room, floor, building }
        this.dimensions = dimensions; // Object { height, width, depth, unit }
        this.artisticCurrents = artisticCurrents; // Array of strings
        this.details = details; // Object { subjects, colors, ... }
        this.copyOf = copyOf; // ID
        this.falsificationOf = falsificationOf; // ID
        this.isActive = isActive;
        this.isPrivate = isPrivate;
        this.qrCode = qrCode;
        this.images = images;
        this.items = items; // Array of Item IDs
    }
}

module.exports = {
    ArtworkResponseDTO,
    ArtworkRequestDTO
};
