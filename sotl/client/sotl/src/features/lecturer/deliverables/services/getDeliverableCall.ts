import { standardApi } from "../../../../utils/standardApi";
import { Deliverable } from "../models";
import { API_BASE_URL } from "../../../../configs/sotl-config";

export const getDeliverableCall = async (deliverableId: string): Promise<Deliverable> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/deliverables/get/${deliverableId}`, 'GET', true);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Deliverable;
    } catch (error) {
        throw error;
    }
};