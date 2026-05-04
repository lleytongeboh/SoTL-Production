import { standardApi } from "../../../../utils/standardApi";
import { API_BASE_URL } from "../../../../configs/sotl-config";
import { Project } from "../models";

export const getProjectListCall = async (): Promise<Project[]> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/project/getList`, 'POST', true);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Project[];
    } catch (err) {
        throw err;
    }
}