import { API_BASE_URL } from '../../../../configs/sotl-config';
import { Group } from "../models";
import { standardApi } from "../../../../utils/standardApi";

export const getGroupListCall = async (batch: string): Promise<Group[]> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/group/getList/${encodeURIComponent(batch)}`, 'GET', true);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Group[];
    } catch (err) {
        throw err;
    }
}