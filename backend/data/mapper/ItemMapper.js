const { ItemResponseDTO } = require('../model/dto/ItemDTO');

class ItemMapper {
    static toItemResponseDTO(model) {
        if (!model) return null;
        return new ItemResponseDTO(
            model._id,
            model.description,
            model.tone,
            model.length,
            model.createdAt,
            model.updatedAt
        );
    }

    static toItemModel(dto) {
        if (!dto) return null;
        return {
            description: dto.description,
            tone: dto.tone,
            length: dto.length
        };
    }
}

module.exports = ItemMapper;
