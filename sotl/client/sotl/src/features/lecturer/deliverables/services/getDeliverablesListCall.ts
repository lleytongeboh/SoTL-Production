import { standardApi } from "../../../../utils/standardApi";
import { Deliverable } from "../models";
import { API_BASE_URL } from "../../../../configs/sotl-config";

export const getDeliverablesListCall = async (batch?: string): Promise<Deliverable[]> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/deliverables/getList?batch=${batch && encodeURIComponent(batch)}`, 'GET', true);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Deliverable[];
    } catch (err) {
        throw err;
    }
};