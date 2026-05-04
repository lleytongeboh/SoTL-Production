// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { standardApi } from '../../../utils/standardApi';
import { API_BASE_URL } from "../../../configs/sotl-config";

export type Role = "student" | "lecturer" | "client";

export type Batch = {
  _id: string;
  batch: string;
};

type Group = {
  _id: string;
  name: string;
  description: string;
  project: Project;
  batch: string;
};

type Project = {
  _id: string;
  title: string;
  description: string;
  mark: string;
};

export type StudentProps = {
  _id: string;
  name: string;
  email: string;
  matric: string;
  batch: Batch[];
  loginAsBatch: string;
  createdAt: Date;
  groups: Group[];
}

export type LecturerProps = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  designation: string;
  company: string;
  createdAt: Date;
};

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  role: Role | null;
  setRole: React.Dispatch<React.SetStateAction<Role | null>>
  loading: boolean;
  login: (token: string, role: Role, identity: StudentProps | LecturerProps | null) => void;
  logout: () => void;
  identity: StudentProps | LecturerProps | null;
  setIdentity: React.Dispatch<React.SetStateAction<StudentProps | LecturerProps | null>>;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Function to validate the token with the backend
export const validateToken = async () => {
  try {
    const response = await standardApi<{ role: string, identity: StudentProps | LecturerProps | null }>(
      `${API_BASE_URL}/api/validate-token`, // API endpoint
      'GET', // HTTP method
      true, // Use token for authentication
    );

    if (response.error) {
      console.log('Token validation failed', response.message);
      throw new Error(response.error);
    }

    return { valid: true, role: response.result?.role, identity: response.result?.identity };
  } catch (error) {
    console.error('Token validation failed', error);

    return { valid: false };
  }
};

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [identity, setIdentity] = useState<StudentProps | LecturerProps | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Login function to store token and role
  const login = (authToken: string, userRole: Role, identity: StudentProps | LecturerProps | null) => {
    sessionStorage.setItem('token', authToken);
    sessionStorage.setItem('userRole', userRole);
    setToken(authToken);
    setRole(userRole);
    setIdentity(identity);
    setIsAuthenticated(true);
  };

  // Logout function to clear token and role
  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    setToken(null);
    setRole(null);
    setIdentity(null);
    setIsAuthenticated(false);
  };

  // On component mount, check if token exists and validate it
  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');

    if (storedToken) {
      validateToken().then((result) => {
        if (result.valid) {
          // Token is valid, update state
          setToken(storedToken);
          setRole(result.role as Role || sessionStorage.getItem('userRole'));
          setIdentity(result.identity as StudentProps | LecturerProps | null);
          setIsAuthenticated(true);
        } else {
          // Token is invalid, log out the user
          logout();
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []); // Run on initial load only

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, role, setRole, loading, login, logout, identity, setIdentity }}>
      {children}
    </AuthContext.Provider>
  );
};