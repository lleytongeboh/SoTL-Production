import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";
import { StudentMarkItem } from '../../group/models';

export const markStudentCall = async (student_id: string, batch: string, mark_items: StudentMarkItem[]): Promise<boolean> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/group/markStudent/${student_id}`, 'PATCH', true, { mark_items, batch });
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as boolean;
    } catch (error) {
        throw error;
    }
}