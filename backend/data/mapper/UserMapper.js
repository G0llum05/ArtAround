const { UserResponseDTO, UserRequestDTO, TransporterRequestDTO } = require('../model/dto/UserDTO');

class UserMapper {
    static toUserResponseDTO(userModel) {
        if (!userModel) return null;
        const defaultPropicUrl = '/assets/users/default/propic/default.jpeg';
        const assets = {
            profilePicture: {
                url: userModel.assets?.profilePicture?.url || defaultPropicUrl,
                orientation: userModel.assets?.profilePicture?.orientation || 'square'
            }
        };
        return new UserResponseDTO(
            userModel._id,
            userModel.name,
            userModel.surname,
            userModel.email,
            userModel.role,
            userModel.purchasedVisits,
            userModel.likedVisits,
            userModel.preferences,
            userModel.gender,
            assets
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
            preferences: userRequestDTO.preferences,
            gender: userRequestDTO.gender
        }
    }

    static toTransporterRequestDTO(data) {
        if (!data) return null;
        return new TransporterRequestDTO(
            data.clientId,
            data.clientSecret,
            data.refreshToken,
            data.noreplyAddr,
            data.noreplyPass
        );
    }
}

module.exports = UserMapper;

