import { ApiResponse } from '@models/index';
import { API_BASE_URL } from '../../../configs/sotl-config';
import { IQuiz } from "../../../models/Quiz";
import { standardApi } from '../../../utils/standardApi';

const QUIZ_API_BASE_URL = `${API_BASE_URL}/api/quizzes`;

namespace QuizService {
    export const getQuizListCall = async (): Promise<any> => {
        try {
            const response = await standardApi(QUIZ_API_BASE_URL, 'GET', true);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.result;
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    }

    export const getQuizQuestionListCall = async (_id: string): Promise<any> => {
        try {
            const response = await standardApi(`${QUIZ_API_BASE_URL}/${encodeURIComponent(_id)}/questions`, 'GET', true);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.result;
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    }

    export const getQuizCall = async (quizId: string, clone?: boolean): Promise<IQuiz> => {
        try {
            let endpoint = `${QUIZ_API_BASE_URL}/${quizId}`;
            if(clone) {
                endpoint += '?clone=true';
            }
            const response = await standardApi(endpoint, 'GET', true);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.result as IQuiz;
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    }

    export const createQuizCall = async (quiz: any): Promise<ApiResponse<any>> => {
        try {
            const response = await standardApi(QUIZ_API_BASE_URL, 'POST', true, quiz);
            if (response.error) {
                throw new Error(response.error);
            }
            return response;
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    }

    export const updateQuizCall = async (quiz: any): Promise<ApiResponse<any>> => {
        try {
            const response = await standardApi(`${QUIZ_API_BASE_URL}/${quiz._id}`, 'PUT', true, quiz);
            if (response.error) {
                throw new Error(response.error);
            }
            return response;
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    }

    export const deleteQuizCall = async (quizId: string): Promise<any> => {
        try {
            const response = await standardApi(`${QUIZ_API_BASE_URL}/${quizId}`, 'DELETE', true);
            if (response.error) {
                throw new Error(response.error);
            }
            return response;
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    }
}

export { QuizService };