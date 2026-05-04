import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";
import { TaskContent } from "../models";

export const createTodoCall = async (project_id: string, task_content: TaskContent, tasks: TaskContent[]): Promise<TaskContent> => {
  try {
    const formData = new FormData();
    formData.append('task_content', JSON.stringify(task_content));
    formData.append('tasks', JSON.stringify(tasks));
    const response  = await standardApi(
      `${API_BASE_URL}/api/todo/createTodo/${project_id}`, 
      'POST', 
      true, 
      formData,
      {},
      true
    );
    if (response.error) {
      throw new Error(response.error);
    }
    return response.result as TaskContent;
  } catch (error) {
    throw error;
  }
}