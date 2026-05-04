import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";

export const leaveGroupCall = async (groupId: string): Promise<boolean> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/group/leave/${groupId}`, 'PATCH', true);
        if (response.error) {
            throw new Error(response.error.message);
        }
        return response.result as boolean;
    } catch (error) {
        throw error;
    }
};