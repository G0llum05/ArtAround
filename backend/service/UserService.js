const User = require('../data/model/User');
const UserMapper = require('../data/mapper/UserMapper');

// Da definire: trattamento password

class UserService {
    static async getAllUsers() {
        return await User.find().lean();
    }

    static async getUserById(id) {
        return await User.findById(id).lean();
    }
    
    static async createUser(userRequestDTO) {
        const userModel = UserMapper.toUserModel(userRequestDTO);
        // Password should be hashed here before saving
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
    static async getUserByMail(mail) {
        return await User.findOne( {mail} ).lean();
    }

}

module.exports = UserService;
