import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";
import { Project } from "../models";

export const updateDeliverableStatusCall = async (project_id: string, deliverable_id: string, status: number, comment?: string): Promise<Project> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/project/updateDeliverableStatus/${project_id}/${deliverable_id}`, 'PATCH', true, { status, comment });
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Project;
    } catch (error) {
        throw error;
    }
};