import { StudentProps, LecturerProps } from '../context/AuthContext';

// src/features/auth/models/authModels.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
  identity: StudentProps | LecturerProps;
}
