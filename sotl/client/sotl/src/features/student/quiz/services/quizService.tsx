import { API_BASE_URL } from '../../../../configs/sotl-config';
import { IQuiz } from "../../../../models/Quiz";
import { standardApi } from '../../../../utils/standardApi';

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

    export const createQuizCall = async (quiz: any): Promise<any> => {
        try {
            const response = await standardApi(QUIZ_API_BASE_URL, 'POST', true, quiz);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.result;
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    }
}

export { QuizService };