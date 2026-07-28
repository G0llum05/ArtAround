class ItemResponseDTO {
    constructor(id, title, description) {
        this.id = id;
        this.title = title;
        this.description = description;
    }
}

class ItemRequestDTO {
    constructor(title, description) {
        this.title = title;
        this.description = description;
    }
}

module.exports = {
    ItemResponseDTO,
    ItemRequestDTO
};
