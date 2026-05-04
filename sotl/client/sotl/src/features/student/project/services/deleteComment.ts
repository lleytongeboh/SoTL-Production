import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";

export const deleteCommentCall = async (comment_id: string): Promise<void> => {
    try {
        const response = await standardApi(
            `${API_BASE_URL}/api/todo/deleteComment/${comment_id}`,
            'DELETE',
            true,
            {}
        );
        if (response.error) {
            throw new Error(response.message);
        }
    } catch (error : any) {
        throw new Error(error.response.data.message);
    }
}