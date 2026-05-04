import { useState } from 'react';
import { AssessmentResultService } from '../../services/assessmentResultService';
import { ApiResponse } from '@models/index';
import { handleError } from '../../../../utils/error';

export const assessmentResultHooks = () => {
  const [error, setError] = useState<string | null>(null);

  const getAssessmentResultList = async (filter: AssessmentResultService.IAssessmentResultFilter): Promise<any> => {
    try {
      const response = await AssessmentResultService.getAssessmentResultListCall(filter);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  }


  const deleteAssessmentResult = async (assessmentResultId: string): Promise<any> => {
    try {
      const response = await AssessmentResultService.deleteAssessmentResultCall(assessmentResultId);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  }

  const deleteManyAssessmentResult = async (assessmentResultIds: string[]): Promise<any> => {
    try {
      const response = await AssessmentResultService.deleteManyAssessmentResultCall(assessmentResultIds);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  }

  const sendClientEmail = async (assessmentResultEmailList: AssessmentResultService.IAssessmentResultEmailList): Promise<ApiResponse<any>> => {
    try {
      const response = await AssessmentResultService.sendClientEmail(assessmentResultEmailList);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  }

  const remarkAssessmentResults = async (resultIds: string[]): Promise<ApiResponse<any>> => {
    try {
      const response = await AssessmentResultService.remarkAssessmentResultsCall(resultIds);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  }

  return { getAssessmentResultList, deleteAssessmentResult, deleteManyAssessmentResult, sendClientEmail, remarkAssessmentResults, error };
};
