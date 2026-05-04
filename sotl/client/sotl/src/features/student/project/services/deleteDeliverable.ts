import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";
import { Project } from "../models";

export const deleteDeliverableCall = async (project_id: string, deliverable_id: string): Promise<Project> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/project/deleteDeliverable/${project_id}/${deliverable_id}`, 'DELETE', true);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Project;
    } catch (error: any) {
        throw new Error(error.response.data.message);
    }
}