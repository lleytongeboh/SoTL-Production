import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";

export const downloadDeliverableCall = async (project_id: string, deliverable_id: string, fileName: string): Promise<void> => {
  try {
    const response = await standardApi(`${API_BASE_URL}/api/project/downloadDeliverable/${project_id}/${deliverable_id}`, 'POST', true, {}, {}, false, true);
    if (response.error) {
        throw new Error(response.error.message);
    }
    const fileURL = window.URL.createObjectURL(new Blob([response.result as BlobPart]));
    const fileLink = document.createElement('a');

    fileLink.href = fileURL;
    fileLink.setAttribute('download', fileName);
    document.body.appendChild(fileLink);
    fileLink.click();
    document.body.removeChild(fileLink);
  } catch (error) {
    throw error;
  }
}