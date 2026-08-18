import { ImageSchema } from "./subModels/image.model";
export type Gender = 'f' | 'm' | 'other' | string;

export interface UserRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
  gender?: Gender;
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
  gender?: Gender;
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
  gender?: Gender;
  role: 'guest' | 'student' | 'teacher' | 'museumstaff' | 'admin';
  assets?: {
    profilePicture?: ImageSchema;
  };
  // TODO CHECK devono ritornare anche questi campi
  // roleStatus?: 'approved' | 'pending';
  // requestedRole?: 'teacher' | 'museumstaff' | null;
  // purchasedVisits?: string[];
  // preferences?: Record<string, string>;
  // likedVisits?: string[];
}

export interface AuthResponse {
  userId: string;
  name: string;
  surname: string;
  email: string;
  gender?: Gender;
  role: 'guest' | 'student' | 'teacher' | 'museumstaff' | 'admin';
  assets?: {
    profilePicture?: ImageSchema;
  };
  accessToken: string;
  refreshToken: string;
  type?: 'success' | 'warning' | 'error';
  message?: string;
}

export interface AuthFeedback {
  type: 'good' | 'bad';
  message: string;
}

export interface ApiResponse<T = any> {
  type?: 'success' | 'warning' | 'error';
  message?: string;
  data?: T;
}
