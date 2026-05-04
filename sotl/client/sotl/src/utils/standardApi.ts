// Utility function without React hooks
import axios, { AxiosRequestConfig } from "axios";
import { ApiResponse } from "../models";
import { getJWToken } from "./getJWToken";

export const standardApi = async <T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  useToken: boolean = false,
  body?: any,
  config?: AxiosRequestConfig,
  multipart: boolean = false,
  blobResponse: boolean = false
): Promise<ApiResponse<T>> => {
  try {
    let token = getJWToken();
    //console.log('api check token:'+ token)
    const headers = {
      "Content-Type": multipart ? 'multipart/form-data' : "application/json",
      ...(useToken && token && { Authorization: "Bearer " + token }),
      ...config?.headers,
    };

    const axiosConfig: AxiosRequestConfig = {
      method,
      url: endpoint,
      headers,
      data: body,
      responseType: blobResponse ? 'blob' : 'json',
      ...config,
    };

    const result = await axios.request<{
      result: T;
      message: string;
      error: string | null;
    }>(axiosConfig);

    return {
      result: blobResponse ? result.data as T : result.data.result,
      message: result.data.message || "Request successful",
      error: result.data.error || null,
    };
  } catch (error: any) {
    console.log("here", error);
    throw error;
  }
};
