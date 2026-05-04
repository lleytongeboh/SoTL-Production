import { standardApi } from "../../../../utils/standardApi";
import { Deliverable } from "../models";
import { API_BASE_URL } from "../../../../configs/sotl-config";

export const editDeliverableCall = async (deliverable: Deliverable): Promise<Deliverable> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/deliverables/edit/${deliverable._id}`, 'PUT', true, deliverable);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Deliverable;
    } catch (error) {
        throw error;
    }
};