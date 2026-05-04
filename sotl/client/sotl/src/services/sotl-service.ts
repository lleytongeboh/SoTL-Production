// import * as SotlInterface from '../models/index';
// import * as SotlConfig from '../configs/sotl-config';
// import CryptoJS from 'crypto-js';

// const API_BASE_URL = SotlConfig.API_BASE_URL;

// export const Authenticate = async (data: SotlInterface.LoginRequest): Promise<SotlInterface.LoginResponse | null> => {

//     data.password = CryptoJS.AES.encrypt(data.password, SotlConfig.ENCRYPTION_KEY).toString();

//     try {
//       const { data: responseData, error } = await makeApiRequest<SotlInterface.LoginResponse>(
//         `${API_BASE_URL}/api/login`,
//         'POST',
//         data
//       );
  
//       if (error) {
//         throw new Error(error);
//       }
  
//       if (responseData && responseData.token) {
//         sessionStorage.setItem('token', responseData.token);
//       }
  
//       return responseData;
//     } catch (error) {
//       console.error('Login failed:', (error as Error).message);
//       return null;
//     }
//   };
  

// export const Logout = async (): Promise<boolean> => {
//     try {
//       sessionStorage.removeItem('token');
//       return true; 
//     } catch (error) {
//       console.error(error);
//       return false; 
//     }
//   };


// export const Test = async () => {
//   const token = sessionStorage.getItem('token');
//   const { data: responseData, error } = await makeApiRequest<void>(
//     `${API_BASE_URL}/api/test/admin`,
//     'GET',
//     null,
//     token ?? ""
//   );

//   if (error) {
//     throw new Error(error);
//   }

//   return responseData;
// };

// interface ApiResponse<T> {
//   data: T | null;
//   error: string | null;
// }

// const makeApiRequest = async <T>(
//   endpoint: string,
//   method: 'GET' | 'POST' | 'PUT' | 'DELETE',
//   body?: any,
//   token?: string
// ): Promise<ApiResponse<T>> => {
//   try {
//     const headers: HeadersInit = {
//       'Content-Type': 'application/json',
//     };

//     if (token) {
//       headers['Authorization'] = `Bearer ${token}`;
//     }

//     const response = await fetch(endpoint, {
//       method,
//       headers,
//       body: body ? JSON.stringify(body) : undefined,
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       return { data: null, error: errorData.message || 'Something went wrong' };
//     }

//     const data = await response.json();
//     return { data, error: null };
//   } catch (error) {
//     return { data: null, error: (error as Error).message || 'Something went wrong' };
//   }
// };
