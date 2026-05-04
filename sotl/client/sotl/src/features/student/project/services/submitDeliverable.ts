import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi"
import { Project } from "../models";

export const submitDeliverableCall = async (project_id: string, deliverable_id: string, file: File): Promise<Project> => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await standardApi(`${API_BASE_URL}/api/project/submitDeliverable/${project_id}/${deliverable_id}`, 'POST', true, formData, {}, true);
        if (response.error) {
            throw new Error(response.message);
        };
        return response.result as Project;
    } catch (error) {
        throw error;
    }
};