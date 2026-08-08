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

class ItemLLMRequestDTO {
    constructor(description, tone, length, language) {
        this.description = description;
        this.tone = tone;
        this.length = length;
        this.language = language;
    }
}

module.exports = {
    ItemResponseDTO,
    ItemRequestDTO,
    ItemLLMRequestDTO
};
