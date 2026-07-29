const { UserResponseDTO, UserRequestDTO } = require('../model/dto/UserDTO');

class UserMapper {
    static toUserResponseDTO(userModel) {
        if (!userModel) return null;
        return new UserResponseDTO(
            userModel._id,
            userModel.name,
            userModel.surname,
            userModel.email,
            userModel.role,
            userModel.purchasedVisits,
            userModel.likedVisits,
            userModel.preferences
        );
    }

    static toUserModel(userRequestDTO) {
        if (!userRequestDTO) return null;
        return {
            name: userRequestDTO.name,
            surname: userRequestDTO.surname,
            email: userRequestDTO.email,
            password: userRequestDTO.password,
            role: userRequestDTO.role,
            preferences: userRequestDTO.preferences
        }
    }
}

module.exports = UserMapper;
