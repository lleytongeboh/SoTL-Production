import { Group } from "../../group/models";
import { standardApi } from "../../../../utils/standardApi";
import { API_BASE_URL } from "../../../../configs/sotl-config";
import { Project } from "../../project/models";

export const checkGroupCall = async (batch: string): Promise<Group> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/group/check/${encodeURIComponent(batch)}`, 'GET', true);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as Group;
    } catch (err) {
        throw err;
    }
}

export type ProjectGroup = {
    group: Group;
    project: Project | null;
};

export const getMyProjectGroupsCall = async (batch: string): Promise<ProjectGroup[]> => {
    try {
        const response = await standardApi(`${API_BASE_URL}/api/group/my-projects/${encodeURIComponent(batch)}`, 'GET', true);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.result as ProjectGroup[];
    } catch (err) {
        throw err;
    }
}
