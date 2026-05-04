import React, { Dispatch, SetStateAction, createContext } from 'react';
import ErrorPopup from '../components/ErrorPopup';
import LoadingPopup from '../components/LoadingPopup';
import SuccessPopup from '../components/SuccessPopup';
import { Outlet } from "react-router-dom";

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

export type BaseFeedbackDialogProps = {
    loading: LoadingType;
    setLoadingPane: Dispatch<SetStateAction<LoadingType>>;
    error: ErrorType;
    setError: Dispatch<SetStateAction<ErrorType>>
    success: SuccessType;
    setSuccess: Dispatch<SetStateAction<SuccessType>>
};

const FeedbackDialogContext = createContext<any>(null);

export const useFeedbackDialog = () => {
    const context = React.useContext(FeedbackDialogContext);
    if (!context) {
        throw new Error('useFeedbackDialog must be used within an FeedbackDialogProvider');
    }
    return context;
};

export const FeedbackDialogProvider: React.FC = () => {
    const [loading, setLoadingPane] = React.useState<LoadingType>(SET_LOADING_STATUS_FALSE);
    const [error, setError] = React.useState<ErrorType>(SET_ERROR_STATUS_FALSE);
    const [success, setSuccess] = React.useState<SuccessType>(SET_SUCCESS_STATUS_FALSE);
 
    return (
        <FeedbackDialogContext.Provider value={{ loading, setLoadingPane, error, setError, success, setSuccess }}>
            <ErrorPopup content={error.message ?? ''} open={error.status} onClose={() => setError(SET_ERROR_STATUS_FALSE)} />
            <LoadingPopup content={loading.message ?? ''} open={loading.status} onClose={() => setLoadingPane(SET_LOADING_STATUS_FALSE)} />
            <SuccessPopup content={success.message ?? ''} open={success.status} onClose={() => setSuccess(SET_SUCCESS_STATUS_FALSE)} />
            <Outlet />
        </FeedbackDialogContext.Provider>
    );
}