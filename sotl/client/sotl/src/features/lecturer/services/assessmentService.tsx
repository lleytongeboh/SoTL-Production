import { AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../../../configs/sotl-config';
import { standardApi } from '../../../utils/standardApi';
import { AssessmentResultService } from './assessmentResultService';

const ASSESSMENT_API_BASE_URL = `${API_BASE_URL}/api/assessments`;

namespace AssessmentService {
  export interface IAssessmentFilter {
    assessmentTypes: AssessmentResultService.IAssessmentResultFilter['filter']['assessment_types'];
    concatLabel?: string;
    assessmentId?: string;
  }
  export const getAssessmentListCall = async (filter?: IAssessmentFilter): Promise<any> => {
    try {
      let config: AxiosRequestConfig | undefined;
      if (filter) {
        // if there is filter, server will return assessments with less properties than when filter is absent
        config = { params: {} };
        config.params = {
          filterTypes: Object.entries(filter.assessmentTypes).filter(([type, isEnabled]) => isEnabled).map(([type, isEnabled]) => type),
          filterLabel: filter.concatLabel ?? '',
          filterId: filter.assessmentId
        };
      }
      const response = await standardApi(ASSESSMENT_API_BASE_URL, 'GET', true, undefined, config);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.result;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  export const getBatchListCall = async (filterQuery?: string): Promise<any> => {
    try {
      let endpoint = `${ASSESSMENT_API_BASE_URL}/batchlist`;
      if (filterQuery) {
        endpoint += `?filter=${encodeURIComponent(filterQuery)}`;
      }
      const response = await standardApi(endpoint, 'GET', true);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.result;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  export const getGroupListCall = async (batch: string, filterQuery?: string): Promise<any> => {
    try {
      let endpoint = `${ASSESSMENT_API_BASE_URL}/grouplist?batch=${batch}`;
      if (filterQuery) {
        endpoint += `&filter=${encodeURIComponent(filterQuery)}`;
      }
      const response = await standardApi(endpoint, 'GET', true);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.result;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  export const getStudentListCall = async (batch: string, filterQuery?: string): Promise<any> => {
    try {
      let endpoint = `${ASSESSMENT_API_BASE_URL}/studentlist?batch=${batch}`;
      if (filterQuery) {
        endpoint += `&filter=${encodeURIComponent(filterQuery)}`;
      }
      const response = await standardApi(endpoint, 'GET', true);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.result;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  export const getAssessmentCall = async (assessmentId: string, clone?: boolean): Promise<any> => {
    try {
      let endpoint = `${ASSESSMENT_API_BASE_URL}/${assessmentId}`;
      if(clone) {
        endpoint += '?clone=true';
      }
      const response = await standardApi(endpoint, 'GET', true);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.result;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  export const createAssessmentCall = async (assessment: any): Promise<any> => {
    try {
      const response = await standardApi(ASSESSMENT_API_BASE_URL, 'POST', true, assessment);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  export const updateAssessmentCall = async (assessment: any): Promise<any> => {
    try {
      const response = await standardApi(`${ASSESSMENT_API_BASE_URL}/${assessment._id}`, 'PUT', true, assessment);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  export const deleteAssessmentCall = async (assessmentId: string): Promise<any> => {
    try {
      const response = await standardApi(`${ASSESSMENT_API_BASE_URL}/${assessmentId}`, 'DELETE', true);
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

export { AssessmentService };