import { useState, useEffect } from 'react';
import axios, { AxiosRequestConfig } from 'axios';

// Define the response interface
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Custom hook for making API requests
const useApi = <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: any,
  config?: AxiosRequestConfig
): [ApiResponse<T>, () => void] => {
  const [response, setResponse] = useState<ApiResponse<T>>({ data: null, error: null });
  const [fetchData, setFetchData] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
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

        const result = await axios.request<T>(axiosConfig);

        setResponse({ data: result.data, error: null });
      } catch (error) {
        setResponse({ data: null, error: (error as Error).message || 'Something went wrong' });
      }
    };

    if (fetchData) {
      fetchData();
    }
  }, [fetchData, endpoint, method, body, config]);

  return [response, () => setFetchData(true)];
};


export default useApi;