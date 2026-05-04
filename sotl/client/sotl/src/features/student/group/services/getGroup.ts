import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";
import { Group } from "../models";

export const getGroupCall = async (groupId: string): Promise<Group> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/group/get/${groupId}`, "GET", true);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Group;
    } catch (error) {
        throw error;
    }
};