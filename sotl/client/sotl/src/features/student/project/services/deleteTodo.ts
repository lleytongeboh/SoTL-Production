import { API_BASE_URL } from "../../../../configs/sotl-config";
import { ContentType } from "../../../../pages/project/Todos";
import { standardApi } from "../../../../utils/standardApi";

export const deleteTodoCall = async (project_id: string, todo_id: string, type: ContentType, parent_id?: string): Promise<void> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/todo/deleteTodo/${project_id}/${todo_id}?t=${ContentType[type]}&p_id=${parent_id}`, 'DELETE', true);
        if (response.error) {
            throw new Error(response.error);
        }
    } catch (error) {
        throw error;
    }
};