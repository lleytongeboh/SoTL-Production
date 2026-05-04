import { useState } from 'react';
import { AssessmentService } from '../../services/assessmentService';
import { handleError } from '../../../../utils/error';

export const assessmentHooks = () => {
  const [error, setError] = useState<string | null>(null);

  const getAssessmentList = async (filter?: AssessmentService.IAssessmentFilter): Promise<any> => {
    try {
      const response = await AssessmentService.getAssessmentListCall(filter);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  }

  const getBatchList = async (filterQuery?: string): Promise<any> => {
    try {
      const response = await AssessmentService.getBatchListCall(filterQuery);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  }

  const getGroupList = async (batch: string, filterQuery?: string): Promise<any> => {
    try {
      const response = await AssessmentService.getGroupListCall(batch, filterQuery);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  }

  const getStudentList = async (batch: string, filterQuery?: string): Promise<any> => {
    try {
      const response = await AssessmentService.getStudentListCall(batch, filterQuery);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  }

  const getAssessment = async (assessmentId: string, clone?: boolean): Promise<any> => {
    try {
      const response = await AssessmentService.getAssessmentCall(assessmentId, clone);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  }

  const createAssessment = async (assessment: any): Promise<any> => {
    try {
      const response = await AssessmentService.createAssessmentCall(assessment);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  }

  const updateAssessment = async (assessment: any): Promise<any> => {
    try {
      const response = await AssessmentService.updateAssessmentCall(assessment);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  }

  const deleteAssessment = async (assessmentId: string): Promise<any> => {
    try {
      const response = await AssessmentService.deleteAssessmentCall(assessmentId);
      setError(null);
      return response;
    } catch (error) {
      handleError(error, setError);
      throw error;
    }
  }

  return { getAssessmentList, getBatchList, getGroupList, getStudentList, getAssessment, createAssessment, updateAssessment, deleteAssessment, error, setError };
};
