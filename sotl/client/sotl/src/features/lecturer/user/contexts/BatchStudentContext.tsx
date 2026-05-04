import React, { createContext, useState, useReducer, useContext, ReactNode, Dispatch, SetStateAction } from 'react';
import { initialState } from '../models';
import { batchStudentReducer } from '../hooks/BatchStudentReducer';
import { BatchStudents, BatchStudentAction } from '../models';

export type LoadingType = {
  status: boolean;
  message: string | null;
};

export type ErrorType = {
  status: boolean;
  message: string | null;
};

export type SuccessType = {
  status: boolean;
  message: string | null;
};

export const SET_ERROR_STATUS_FALSE: ErrorType = { status: false, message: null };
export const SET_LOADING_STATUS_FALSE: LoadingType = { status: false, message: null };
export const SET_SUCCESS_STATUS_FALSE: SuccessType = { status: false, message: null };

export type BaseStudentContextProps = { 
  batchStudent: BatchStudents; 
  batchStudentDispatch: Dispatch<BatchStudentAction>; 
  loading: LoadingType; 
  setLoading: Dispatch<SetStateAction<LoadingType>>; 
  error: ErrorType; 
  setError: Dispatch<SetStateAction<ErrorType>> 
  success: SuccessType;  
  setSuccess: Dispatch<SetStateAction<SuccessType>>
}

// Create the context
const BatchStudentContext = createContext<any>(null);

// Custom hook to use the GroupContext
export const useBatchStudent = () => useContext(BatchStudentContext);

// Provider component
export const BatchStudentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [batchStudent, batchStudentDispatch] = useReducer(batchStudentReducer, initialState);
  const [loading, setLoading] = useState<LoadingType>({ status: true, message: null });
  const [error, setError] = useState<ErrorType>(SET_ERROR_STATUS_FALSE);
  const [success, setSuccess] = useState<SuccessType>(SET_SUCCESS_STATUS_FALSE);

  return (
    <BatchStudentContext.Provider value={{ batchStudent, batchStudentDispatch, loading, setLoading, error, setError, success, setSuccess }}>
      {children}
    </BatchStudentContext.Provider>
  );
};