import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";
import { Task } from "gantt-task-react";

export const fetchGanttCall = async (project_id: string): Promise<Task[]> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/todo/getGantt/${project_id}`, 'GET', true);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Task[];
    } catch (error) {
        throw error;
    }
};