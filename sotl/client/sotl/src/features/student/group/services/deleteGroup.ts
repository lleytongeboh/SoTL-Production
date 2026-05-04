import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";

export const deleteGroupCall = async (groupId: string): Promise<boolean> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/group/delete/${groupId}`, 'DELETE', true);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as boolean;
    } catch (err) {
        throw err;
    }
}