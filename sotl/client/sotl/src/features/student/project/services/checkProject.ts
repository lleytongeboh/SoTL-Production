import { standardApi } from "../../../../utils/standardApi";
import { API_BASE_URL } from "../../../../configs/sotl-config";
import { Project } from "../models";

export const checkProjectCall = async (group_id: string): Promise<Project> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/project/check/${group_id}`, 'GET', true);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Project;
    } catch (err) {
        throw err;
    }
}