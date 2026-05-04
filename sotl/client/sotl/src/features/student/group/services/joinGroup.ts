import { API_BASE_URL } from '../../../../configs/sotl-config';
import { Group } from "../models";
import { standardApi } from "../../../../utils/standardApi";

export const joinGroupCall = async (group_id: string, roles: string[]): Promise<Group> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/group/join/${group_id}`, 'POST', true, { roles });
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Group;
    } catch (err) {
        throw err;
    }
}