import { API_BASE_URL } from '../../../../configs/sotl-config';
import { Project } from "../models";
import { standardApi } from "../../../../utils/standardApi";

export const editProjectCall = async (project_id: string, project: Project): Promise<Project> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/project/edit/${project_id}`, 'POST', true, project);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Project;
    } catch (err) {
        throw err;
    }
}