import { useState, useEffect } from 'react';
import axios, { AxiosRequestConfig } from 'axios';

// Define the backend response interface
interface ApiResponse {
  result: any;
  message: string;
  error?: any;
}

// Custom hook for making API requests with backend response format
const useFormatApi = (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: any,
  config?: AxiosRequestConfig
): [ApiResponse | null, () => void] => {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [fetchData, setFetchData] = useState<boolean>(false);

  useEffect(() => {
    const fetchDataFromApi = async () => {
      try {
        const headers: any = {
          'Content-Type': 'application/json',
          ...config?.headers,
        };

        if (config?.headers?.Authorization) {
          headers['Authorization'] = config.headers.Authorization;
        }

        const axiosConfig: AxiosRequestConfig = {
          method,
          url: endpoint,
          headers,
          data: body,
          ...config,
        };

        // Making the API request
        const result = await axios.request<ApiResponse>(axiosConfig);

        // Directly map the response from the backend
        setResponse(result.data);
      } catch (error: any) {
        const formattedError: ApiResponse = {
          result: null,
          message: 'Something went wrong',
          error: error.response?.data || error.message,
        };
        setResponse(formattedError);
      }
    };

    if (fetchData) {
      fetchDataFromApi();
      setFetchData(false); // Reset fetchData to prevent repeated requests
    }
  }, [fetchData, endpoint, method, body, config]);

  return [response, () => setFetchData(true)];
};

export default useFormatApi;