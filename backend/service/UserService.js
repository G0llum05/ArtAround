const User = require('../data/model/User');
const UserMapper = require('../data/mapper/UserMapper');
const bcrypt = require('bcryptjs');

// Da definire: trattamento password

class UserService {
    static async getAllUsers() {
        return await User.find().lean();
    }

    static async getUserById(id) {
        return await User.findById(id).lean();
    }
    
    static async createUser(userRequestDTO) {
        // Check if user already exists
        const existingUser = await this.getUserByEmail(userRequestDTO.email);
        if (existingUser) {
            throw new Error('Email già in uso');
        }

        const userModel = UserMapper.toUserModel(userRequestDTO);
        
        // Hash password before saving
        if (userModel.password) {
            const salt = await bcrypt.genSalt(10);
            userModel.password = await bcrypt.hash(userModel.password, salt);
        }
        
        const newUser = new User(userModel);
        return await newUser.save();
    }

    static async updateUser(id, updateData) {
        return await User.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    }

    static async purchaseVisit(userId, visitId) {
        return await User.findByIdAndUpdate(
            userId,
            { $addToSet: { purchasedVisits: visitId } },
            { new: true }
        ).lean();
    }

    static async getPurchasedVisits(userId) {
        return await User.findById(userId)
        .populate('purchasedVisits')
        .lean();
    }

    static async deleteUser(id) {
        return await User.findByIdAndDelete(id).lean();
    }
    
    // PRIVATE
    static async getUserByEmail(email) {
        return await User.findOne( {email} ).lean();
    }

}

module.exports = UserService;
