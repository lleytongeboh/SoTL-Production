import { standardApi } from "../../../../utils/standardApi";
import { TaskContent } from "../models";
import { API_BASE_URL } from "../../../../configs/sotl-config";

export const fetchSprintTodoCall = async (sprint_id: string): Promise<TaskContent[]> => {
  try {
    const response = await standardApi(`${API_BASE_URL}/api/todo/getSprintTodo/${sprint_id}`, 'GET', true);
    if (response.error) {
        throw new Error(response.error);
    }
    return response.result as TaskContent[];
  } catch (error) {
    throw error;
  }
}