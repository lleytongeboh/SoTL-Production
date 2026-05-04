import { API_BASE_URL } from '../../../../configs/sotl-config';
import { Group } from "../../group/models";
import { standardApi } from "../../../../utils/standardApi";

export const createGroupCall = async (group: Group, roles: string[]): Promise<Group> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/group/create`, 'POST', true, { ...group, roles });
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Group;
    } catch (err) {
        throw err;
    }
}