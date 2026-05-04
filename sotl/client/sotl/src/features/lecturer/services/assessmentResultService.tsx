import { AssessmentType, IAssessment } from '@models/Assessment';
import { API_BASE_URL } from '../../../configs/sotl-config';
import { standardApi } from '../../../utils/standardApi';
import { ApiResponse } from '@models/index';

const ASSESSMENT_RESULT_API_BASE_URL = `${API_BASE_URL}/api/assessmentresults`;

namespace AssessmentResultService {
  export interface IAssessmentResultFilter {
    filter: {
      assessment_types: { [key in AssessmentType as `${key}`]: boolean; };
      assessment_ids: IAssessment[] | string[];
    };
  }

  export interface IAssessmentResultEmailList {
    firstEmailAssessmentResultIds: string[];
    resendEmailAssessmentResultIds: string[];
  }

  export const getAssessmentResultListCall = async (filter: IAssessmentResultFilter): Promise<any> => {
    try {
      const response = await standardApi(ASSESSMENT_RESULT_API_BASE_URL, 'POST', true, filter);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.result;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  export const deleteAssessmentResultCall = async (assessmentResultId: string): Promise<any> => {
    try {
      const response = await standardApi(`${ASSESSMENT_RESULT_API_BASE_URL}/${assessmentResultId}`, 'DELETE', true);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  export const deleteManyAssessmentResultCall = async (assessmentResultIds: string[]): Promise<any> => {
    try {
      const response = await standardApi(`${ASSESSMENT_RESULT_API_BASE_URL}/deleteMany`, 'POST', true, { deleteIds: assessmentResultIds });
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  export const getClientAccessCode = async (clientId: string): Promise<string> => {
    try {
      const response = await standardApi(`${API_BASE_URL}/api/client/${clientId}/access_code`, 'GET', true);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.result as string;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  export const sendClientEmail = async (assessmentResultEmailList: IAssessmentResultEmailList): Promise<ApiResponse<any>> => {
    try {
      const response = await standardApi(`${ASSESSMENT_RESULT_API_BASE_URL}/emails`, 'POST', true, assessmentResultEmailList);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  export const remarkAssessmentResultsCall = async (resultIds: string[]): Promise<ApiResponse<any>> => {
    try {
      const response = await standardApi(`${ASSESSMENT_RESULT_API_BASE_URL}/remark`, 'POST', true, { resultIds: resultIds });
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }
}

export { AssessmentResultService };