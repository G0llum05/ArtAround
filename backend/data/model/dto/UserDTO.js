class UserResponseDTO {
    constructor(id, name, surname, email, role, purchasedVisits, likedVisits, preferences, gender = 'other') {
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.role = role;
        this.purchasedVisits = purchasedVisits;
        this.likedVisits = likedVisits;
        this.preferences = preferences;
        this.gender = gender;
    }
}

class UserRequestDTO {
    constructor(name, surname, email, password, role, preferences, gender = 'other') {
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.password = password;
        this.role = role;
        this.preferences = preferences;
        this.gender = gender;
    }
}

class LoginRequestDTO {
    constructor(email, password) {
        this.email = email;
        this.password = password;
    }
}
module.exports = {
    UserResponseDTO,
    UserRequestDTO,
    LoginRequestDTO
}
