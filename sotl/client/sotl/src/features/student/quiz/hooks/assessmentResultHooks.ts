import { useEffect, useState } from 'react';
import { AssessmentResultService } from '../services/assessmentResultService';
import { IAssessmentResult, IAssessmentResultMultiple, IAssessmentResultPage, IAssessmentResultWithEvaluatees } from '@models/AssessmentResult';
import { ApiResponse } from '@models/index';
import { handleError } from '../../../../utils/error';

export const assessmentResultHooks = (searchParams: URLSearchParams, clientAccessCode?: string, evaluateeId?: string) => {
  const assessmentResultService = new AssessmentResultService(searchParams, clientAccessCode, evaluateeId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    assessmentResultService.evaluateeId = evaluateeId;
  }, [evaluateeId]);

  const setNewEvaluateeId = (evaluateeId: string) => {
    assessmentResultService.evaluateeId = evaluateeId;
  };

  const getMyAssessmentList = async (batch: string): Promise<any> => {
    try {
      const response = await assessmentResultService.getMyAssessmentListCall(batch);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  };

  const getAssessment = async (assessmentId: string): Promise<IAssessmentResultMultiple> => {
    try {
      const response = await assessmentResultService.getAssessmentCall(assessmentId);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  };

  const startAssessment = async (assessmentId: string): Promise<IAssessmentResult> => {
    try {
      const response = await assessmentResultService.startAssessmentCall(assessmentId);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  };

  const endAssessment = async (assessmentId: string): Promise<ApiResponse<IAssessmentResult>> => {
    try {
      const response = await assessmentResultService.endAssessmentCall(assessmentId);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  };

  const getAssessmentPage = async (assessmentId: string, pageNum: number, reviewMode?: boolean): Promise<any> => {
    try {
      const response = await assessmentResultService.getAssessmentPageCall(assessmentId, pageNum, reviewMode);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  };

  const saveAssessmentPage = async (assessmentId: string, assessmentPage: IAssessmentResultPage, goBack?: boolean): Promise<IAssessmentResult> => {
    try {
      const response = await assessmentResultService.saveAssessmentCall(assessmentId, assessmentPage, goBack);
      setError(null);
      return response.result;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  };

  return { setNewEvaluateeId, assessmentResultService, getMyAssessmentList, getAssessment, getAssessmentPage, startAssessment, endAssessment, saveAssessmentPage, error };
};
