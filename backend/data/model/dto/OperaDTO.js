// RESPONSES
class OperaResponseDTO {
    constructor(id, title, description, startYear, endYear, makers, museum, location, dimensions, artisticCurrents, details, copyOf, falsificationOf) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.startYear = startYear;
        this.endYear = endYear;
        this.makers = makers; // can be IDs or populated objects
        this.museum = museum; // can be ID or populated object
        this.location = location;
        this.dimensions = dimensions;
        this.artisticCurrents = artisticCurrents;
        this.details = details;
        this.copyOf = copyOf;
        this.falsificationOf = falsificationOf;
    }
}

// REQUESTS
class OperaRequestDTO {
    constructor(title, description, startYear, endYear, makers, museum, location, dimensions, artisticCurrents, details, copyOf, falsificationOf) {
        this.title = title;
        this.description = description;
        this.startYear = startYear;
        this.endYear = endYear;
        this.makers = makers; // Array of IDs
        this.museum = museum; // ID
        this.location = location; // Object { room, floor, building }
        this.dimensions = dimensions; // Object { height, width, depth, unit }
        this.artisticCurrents = artisticCurrents; // Array of strings
        this.details = details; // Object { subjects, colors, ... }
        this.copyOf = copyOf; // ID
        this.falsificationOf = falsificationOf; // ID
    }
}

module.exports = {
    OperaResponseDTO,
    OperaRequestDTO
};
