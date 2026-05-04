import { SetStateAction } from "react";

export const handleError = (error: any, setError: React.Dispatch<SetStateAction<any>>) => {
    console.error('Error:', error);
    setError((error as Error).message + (error.response?.data?.message ? `:\n${error.response?.data?.message}` : ''));
}