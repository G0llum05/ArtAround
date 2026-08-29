const { UserResponseDTO, UserRequestDTO, TransporterRequestDTO } = require('../model/dto/UserDTO');

class UserMapper {
    static toUserResponseDTO(userModel) {
        if (!userModel) return null;
        const propicUrl = userModel.assets?.profilePicture?.url;
        const validUrl = propicUrl && !propicUrl.includes('default.jpeg') ? propicUrl : null;
        const assets = {
            profilePicture: {
                url: validUrl,
                orientation: userModel.assets?.profilePicture?.orientation || 'square'
            }
        };
        const purchasedVisits = (userModel.purchasedVisits || []).map(v => (v && (v._id || v.id)) ? (v._id || v.id).toString() : (v ? v.toString() : ''));
        return new UserResponseDTO(
            userModel._id,
            userModel.name,
            userModel.surname,
            userModel.email,
            userModel.role,
            purchasedVisits,
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

