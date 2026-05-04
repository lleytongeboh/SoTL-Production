import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";
import { MarkItem, Project } from "../models";

export const markProjectCall = async (project_id: string, mark_items: MarkItem[]): Promise<Project> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/project/mark/${project_id}`, 'PATCH', true, { mark_items });
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Project;
    } catch (error) {
        throw error;
    }
};