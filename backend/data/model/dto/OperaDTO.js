// RESPONSES
class OperaResponseDTO {
    constructor(id, title, maker, place) {
        this.id = id;
        this.title = title;
        this.maker = maker;
        this.place = place;
    }
}

class OperaPlaceResponseDTO {
    constructor(id, title, place) {
        this.id = id;
        this.title = title;
        this.place = place;
    }
}

class OperaMakerResponseDTO {
    constructor(id, title, maker) {
        this.id = id;
        this.title = title;
        this.maker = maker;
    }
}


// REQUESTS
class OperaRequestDTO {
    constructor(title, maker, place) {
        this.title = title;
        this.maker = maker;
        this.place = place;
    }
}

module.exports = {
    OperaResponseDTO,
    OperaPlaceResponseDTO,
    OperaMakerResponseDTO,
    OperaRequestDTO
};
