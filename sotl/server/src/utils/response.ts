// src/utils/response.ts

interface ApiResponse {
  result: any;
  message: string;
  error?: any;
}

export const successResponse = (
  result: any,
  message: string
): ApiResponse => {
  return {
    result,
    message,
  };
};

export const errorResponse = (
  message: string,
  error?: any
): ApiResponse => {
  return {
    result: null,
    message,
    error,
  };
};
