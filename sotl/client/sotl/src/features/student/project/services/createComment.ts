import { API_BASE_URL } from "../../../../configs/sotl-config";
import { ContentType } from "../../../../pages/project/Todos";
import { standardApi } from "../../../../utils/standardApi";

export const createCommentCall = async (project_id: string, todo_id: string, type: ContentType, comment: string, newImages: string[], parent_id?: string): Promise<void> => {
    try {
        const formData = new FormData();
        formData.append('type', ContentType[type]);
        formData.append('parent_id', parent_id ?? '');
        formData.append('newImages', JSON.stringify(newImages));
        formData.append('comment', comment);
        const response = await standardApi(
            `${API_BASE_URL}/api/todo/createComment/${project_id}/${todo_id}`, 
            'POST', 
            true,
            formData, 
            {}, 
            true);
        if (response.error) {
            throw new Error(response.error);
        }
    } catch (error) {
        throw error;
    }
};