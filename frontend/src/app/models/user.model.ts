export interface UserResponse {
    id: number,
    name: string,
    surname: string,
    email: string,
    role: string
}

export interface UserRequest {
    name: string,
    surname: string,
    email: string,
    password: string,
    role: string
}

export interface LoginRequest {
    email: string,
    password: string
}
