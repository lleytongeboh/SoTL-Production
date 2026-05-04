import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";
import { Comment } from "../models";

export const editCommentCall = async (comment_id: string, comment: string): Promise<Comment> => {
    try {
        const formData = new FormData();
        formData.append('comment', comment);
        const response = await standardApi(
            `${API_BASE_URL}/api/todo/editComment/${comment_id}`,
            'PUT',
            true,
            formData,
            {},
            true
        );
        if (response.error) {
            throw new Error(response.message);
        }
        return response.result as Comment;
    } catch (error : any) {
        throw new Error(error.response.data.message);
    }
}