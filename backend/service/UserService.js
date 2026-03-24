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
        // When updating, you should also handle password hashing if the password is changed.
        // Also consider if you want to map updateData from a DTO.
        return await User.findByIdAndUpdate(id, updateData);
        // return await User.findByIdAndUpdate(id, updateData, { new: true }).lean();
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
