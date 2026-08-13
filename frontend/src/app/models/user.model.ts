export interface UserRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
}

export interface RoleUpgradeRequest {
  requestedRole: 'teacher' | 'museumstaff';
}

export interface StudentAssignRequest {
  email: string;
  organization?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: 'guest' | 'student' | 'teacher' | 'museumstaff' | 'admin';
  // TODO CHECK devono ritornare anche questi campi
  // roleStatus?: 'approved' | 'pending';
  // requestedRole?: 'teacher' | 'museumstaff' | null;
  // purchasedVisits?: string[];
  // preferences?: Record<string, string>;
  // likedVisits?: string[];
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}
