import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";
import { Sprint, ToDoList } from "../models";

export const fetchTodoContentCall = async (project_id: string): Promise<{sprint: Sprint[], toDo: ToDoList[]}> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/todo/getList/${project_id}`, 'GET', true);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as {sprint: Sprint[], toDo: ToDoList[]};
    } catch (err) {
        throw err;
    }
}