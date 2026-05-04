import { useState } from 'react';
import { QuizService } from '../../services/quizService';
import { IQuiz } from '@models/Quiz';
import { handleError } from '../../../../utils/error';
import { ApiResponse } from '@models/index';

export const quizHooks = () => {
    const [error, setError] = useState<string | null>(null);

    const getAssessmentList = async (): Promise<any> => {
        try {
            const response = await QuizService.getQuizListCall();
            setError(null);
            return response;
        } catch (error) {
            handleError(error, setError);
            throw error;
        }
    }

    const getQuizList = async (): Promise<any> => {
        try {
            const response = await QuizService.getQuizListCall();
            setError(null);
            return response;
        } catch (error) {
            handleError(error, setError);
            throw error;
        }
    }

    const getQuizQuestionList = async (_id: string): Promise<any> => {
        try {
            const response = await QuizService.getQuizQuestionListCall(_id);
            setError(null);
            return response;
        } catch (error) {
            handleError(error, setError);
            throw error;
        }
    }

    const getQuiz = async (quizId: string, clone?: boolean): Promise<IQuiz> => {
        try {
            const response = await QuizService.getQuizCall(quizId, clone);
            setError(null);
            return response;
        } catch (error) {
            handleError(error, setError);
            throw error;
        }
    }

    const createQuiz = async (quiz: any): Promise<ApiResponse<any>> => {
        try {
            const response = await QuizService.createQuizCall(quiz);
            setError(null);
            return response;
        } catch (error) {
            handleError(error, setError);
            throw error;
        }
    }

    const updateQuiz = async (quiz: any): Promise<ApiResponse<any>> => {
        try {
            const response = await QuizService.updateQuizCall(quiz);
            setError(null);
            return response;
        } catch (error) {
            handleError(error, setError);
            throw error;
        }
    }

    const deleteQuiz = async (quizId: string): Promise<any> => {
        try {
            const response = await QuizService.deleteQuizCall(quizId);
            setError(null);
            return response;
        } catch (error) {
            handleError(error, setError);
            throw error;
        }
    }

    return { getQuizList, getQuizQuestionList, getQuiz, createQuiz, updateQuiz, deleteQuiz, error, setError };
};
