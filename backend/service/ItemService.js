const Item = require('../data/model/Item');

class ItemService {
    static async getAll() {
        return await Item.find();
    }

    static async getById(id) {
        return await Item.findById(id);
    }

    static async create(data) {
        const item = new Item(data);
        return await item.save();
    }

    static async update(id, data) {
        return await Item.findByIdAndUpdate(id, data, { new: true });
    }

    static async delete(id) {
        return await Item.findByIdAndDelete(id);
    }
}

module.exports = ItemService;
