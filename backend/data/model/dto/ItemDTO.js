// RESPONSES
class ItemResponseDTO {
    constructor(id, description, tone, length, createdAt, updatedAt) {
        this.id = id;
        this.description = description;
        this.tone = tone;
        this.length = length;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

// REQUESTS
class ItemRequestDTO {
    constructor(description, tone, length) {
        this.description = description;
        this.tone = tone;
        this.length = length;
    }
}

module.exports = {
    ItemResponseDTO,
    ItemRequestDTO
};
