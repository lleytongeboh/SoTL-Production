import axios from 'axios';
import CryptoJS from 'crypto-js';
import { LoginRequest, LoginResponse } from '../models';
// import { useSessionStorage } from '@hooks/useSessionStorage';
import { useSessionStorage } from '../../../hooks/useSessionStorage';
import { ENCRYPTION_KEY } from '../config';
import { API_BASE_URL } from '../../../configs/sotl-config';
import { useAuth } from '../context';

const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message || error.message || fallback;
    }

    return error instanceof Error ? error.message : fallback;
};

export const useAuthServices = () => {
    const { login } = useAuth();
    const [token, setToken, removeToken] = useSessionStorage<string>('token', '');

    const authenticate = async (data: LoginRequest): Promise<LoginResponse | null> => {
        data.password = CryptoJS.AES.encrypt(data.password, ENCRYPTION_KEY).toString();
        console.log('encrypted password:', data.password);
        try {
            console.log(data);
            const response = await axios.post(`${API_BASE_URL}/api/login`, data, { headers: { 'Content-Type': 'application/json' } });
            console.log('response:', response.data.result);
            if (response.data.result && response.data.result.token && response.data.result.role && response.data.result.identity) {
                console.log('setting token:', response.data.result.token);
                //setToken(response.data.token);
                setToken(response.data.result.token);
                login(response.data.result.token, response.data.result.role, response.data.result.identity);
            }
            
            return response.data;
        } catch (error) {
            throw new Error(getErrorMessage(error, 'Unable to login. Please try again.'))
        }
    };

    const logout = async (): Promise<boolean> => {
        try {
            removeToken();
            return true;
        } catch (error) {
            console.error('Logout failed:', (error as Error).message);
            return false;
        }
    };

    const fetchTestData = async (): Promise<void> => {
        try {
            const response = await axios.get<void>(`${API_BASE_URL}/api/test/admin`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch test data:', (error as Error).message);
            throw error;
        }
    };

    return { authenticate, logout, fetchTestData };
}
