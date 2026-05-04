import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";
import { StudentMarkItem } from '../../group/models';

export const getMembersMarkCall = async (groupId: string): Promise<{ [key: string]: { marked: boolean, items: StudentMarkItem[] } }> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/group/getMembersMark/${groupId}`, 'GET', true);
        if (response.error) {
            throw new Error(response.message);
        }
        return response.result as { [key: string]: { marked: boolean, items: StudentMarkItem[] } };
    } catch (error) {
        throw error;
    }
};