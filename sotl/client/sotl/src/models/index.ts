export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string
}

// Define the response interface
export interface ApiResponse<T> {
  result?: T;
  message: string;
  error?: any;
}