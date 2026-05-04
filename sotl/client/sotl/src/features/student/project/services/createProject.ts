import { API_BASE_URL } from '../../../../configs/sotl-config';
import { Project } from "../models";
import { standardApi } from "../../../../utils/standardApi";

export const createProjectCall = async (project: Project, group_id: string): Promise<Project> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/project/create`, 'POST', true, { ...project, group_id });
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Project;
    } catch (err) {
        throw err;
    }
}