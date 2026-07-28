const ItemService = require('../../service/ItemService');
const ItemMapper = require('../../data/mapper/ItemMapper');
const { ItemRequestDTO } = require('../../data/model/dto/ItemDTO');

class ItemController {
    static async getAll(req, res) {
        try {
            const items = await ItemService.getAll();
            const dtos = items.map(item => ItemMapper.toItemResponseDTO(item));
            res.status(200).json(dtos);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const item = await ItemService.getById(req.params.id);
            if (!item) {
                return res.status(404).json({ message: 'Item non trovato' });
            }
            res.status(200).json(ItemMapper.toItemResponseDTO(item));
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async create(req, res) {
        try {
            const dto = new ItemRequestDTO(req.body.title, req.body.description);
            const newItem = await ItemService.create(ItemMapper.toItemModel(dto));
            res.status(201).json(ItemMapper.toItemResponseDTO(newItem));
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const updated = await ItemService.update(req.params.id, req.body);
            if (!updated) {
                return res.status(404).json({ message: 'Item non trovato' });
            }
            res.status(200).json(ItemMapper.toItemResponseDTO(updated));
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const deleted = await ItemService.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ message: 'Item non trovato' });
            }
            res.status(200).json({ message: 'Item eliminato con successo' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = ItemController;
