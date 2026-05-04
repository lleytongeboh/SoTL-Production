import React from 'react';
import { API_BASE_URL } from '../../../configs/sotl-config';
import { standardApi } from '../../../utils/standardApi';
import { EditStudentProfileRequest, EditLecturerProfileRequest } from '../models';
import { StudentProps } from '../../auth/context/AuthContext';

export const useProfileHooks = () => {
    const [hookLoading, setHookLoading] = React.useState<boolean>(false);
    const [hookError, setHookError] = React.useState<string | null>(null);

    const updateStudentProfile = async (payload: EditStudentProfileRequest): Promise<Boolean> => {
        console.log('payload', payload);
        try {
            setHookLoading(true);
            const result = await standardApi(`${API_BASE_URL}/api/profile/student`, 'PUT', true, payload);
            return result.result as Boolean;
        } catch (error: any) {
            setHookError(error.response.data?.message);
            throw new Error(error.response.data?.message);
        } finally {
            setHookLoading(false);
        }
    };

    const updateLecturerProfile = async (payload: EditLecturerProfileRequest): Promise<Boolean> => {
        console.log('payload', payload);
        try {
            setHookLoading(true);
            const result = await standardApi(`${API_BASE_URL}/api/profile/lecturer`, 'PUT', true, payload);
            return result.result as Boolean;
        } catch (error: any) {
            setHookError(error.response.data?.message);
            throw new Error(error.response.data?.message);
        } finally {
            setHookLoading(false);
        }
    };

    const getStudentProfile = async (id: string): Promise<StudentProps> => {
        setHookError(null);
        try {
            setHookLoading(true);
            const result = await standardApi(`${API_BASE_URL}/api/profile/student/${id}`, 'GET', true);
            return result.result as StudentProps;
        } catch(error: any) {
            setHookError(error.response.data?.message);
            throw new Error(error.response.data?.message);
        } finally {
            setHookLoading(false);
        }
    };

    const changeLoginAsBatch = async (batch: string): Promise<Boolean> => {
        setHookError(null);
        try {
            setHookLoading(true);
            const result = await standardApi(`${API_BASE_URL}/api/profile/change-batch`, 'PUT', true, { batch });
            return result.result as Boolean;
        } catch(error: any) {
            setHookError(error.response.data?.message);
            throw new Error(error.response.data?.message);
        } finally {
            setHookLoading(false);
        }
    };

    return {
        updateStudentProfile,
        updateLecturerProfile,
        hookLoading,
        hookError,
        getStudentProfile,
        changeLoginAsBatch
    };
};