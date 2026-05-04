import { standardApi } from "../../../../utils/standardApi";
import { TaskContent } from "../models";
import { API_BASE_URL } from "../../../../configs/sotl-config";
import { ContentType } from "../../../../pages/project/Todos";

export const editTodoCall = async (project_id: string, todo_id: string, parent_id: string, type: ContentType, task_content: TaskContent, child_content?: TaskContent[]): Promise<TaskContent> => {
    try {
        const formData = new FormData();
        formData.append('type', ContentType[type]);
        formData.append('parent_id', parent_id ?? '');
        formData.append('task_content', JSON.stringify(task_content));
        formData.append('child_content', JSON.stringify(child_content));
        const response = await standardApi(
            `${API_BASE_URL}/api/todo/editTodo/${project_id}/${todo_id}`,
            'PUT',
            true,
            formData,
            {}, true
        );
        if (response.error) {
            console.log("sdfdsf");
            throw new Error(response.message);
        }
        return response.result as TaskContent;
    } catch (error : any) {
        throw new Error(error.response.data.message);
    }
};