import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";
import { Project } from "../models";

export const getProjectCall = async (projectId: string): Promise<Project> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/project/get/${projectId}`, "GET", true);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Project;
    } catch (error) {
        throw error;
    }
};