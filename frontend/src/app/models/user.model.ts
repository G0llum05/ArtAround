export interface UserResponse {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: 'guest' | 'student' | 'teacher' | 'museumstaff' | 'admin';
  roleStatus?: 'approved' | 'pending';
  requestedRole?: 'teacher' | 'museumstaff' | null;
  purchasedVisits?: string[];
  likedVisits?: string[];
  preferences?: Record<string, string>;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
}

export interface UserRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginRequest {
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
