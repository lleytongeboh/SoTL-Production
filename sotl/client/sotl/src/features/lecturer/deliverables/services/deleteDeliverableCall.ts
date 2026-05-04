import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";

export const deleteDeliverableCall = async (deliverableId: string): Promise<boolean> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/deliverables/delete/${deliverableId}`, 'DELETE', true);
        if (response.error) {
            throw new Error(response.error);
        }
        return true;
    } catch (error) {
        throw error;
    }
};