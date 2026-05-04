import { API_BASE_URL } from "../../../../configs/sotl-config";
import { Deliverable } from "../models";
import { standardApi } from "../../../../utils/standardApi";

export const createDeliverableCall = async (deliverable: Deliverable): Promise<Deliverable> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/deliverables/create`, 'POST', true, deliverable);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Deliverable;
    } catch (err) {
        throw err;
    }
};