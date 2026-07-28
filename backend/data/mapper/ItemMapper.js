const { ItemResponseDTO } = require('../model/dto/ItemDTO');

class ItemMapper {
    static toItemResponseDTO(model) {
        if (!model) return null;
        return new ItemResponseDTO(
            model._id,
            model.title,
            model.description
        );
    }

    static toItemModel(dto) {
        return {
            title: dto.title,
            description: dto.description
        };
    }
}

module.exports = ItemMapper;
