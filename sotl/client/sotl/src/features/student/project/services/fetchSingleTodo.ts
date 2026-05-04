import { standardApi } from "../../../../utils/standardApi";
import { ContentType, TaskContentWithChild } from "../../../../pages/project/Todos";
import { API_BASE_URL } from "../../../../configs/sotl-config";

export const fetchSingleTodoCall = async (project_id: string, todo_id: string, type: ContentType, parent_id?: string): Promise<TaskContentWithChild> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/todo/getSingleTodo/${project_id}/${todo_id}?t=${ContentType[type]}&p_id=${parent_id}`, 'GET', true);
        if (response.error) {
        throw new Error(response.error);
        }
        return response.result as TaskContentWithChild;
    } catch (error) {
        throw error;
    }
};