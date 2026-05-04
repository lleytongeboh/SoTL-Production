import { useState } from "react";
import { standardApi } from "../../../../utils/standardApi";
import { API_BASE_URL } from "../../../../configs/sotl-config";
import {
  BatchStudents,
  AddStudentWithPasswordPayload,
  AddStudentPayload,
  EditStudentPayload,
  AddClientPayload,
  EditClientPayload,
  Student,
  BatchStudent,
  StudentLogProps,
  ClientProps,
  GroupProject,
  ClientIdentityProps,
  Batch,
  StudentFromLecturerViewProps,
  RemoveStudentPayload,
  SelfAssessmentResult,
  PeerAssessmentResult,
} from "../models";

export const batchStudentHooks = () => {
  const [hookLoading, setHookLoading] = useState<boolean>(false);
  const [hookError, setHookError] = useState<string | null>(null);

  const getAllBatchStudents = async (): Promise<BatchStudents> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/batch-student/all`,
        "GET",
        true
      );
      setHookError(null);
      return response.result as BatchStudents;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const editBatchVisibleMark = async (
    batchId: string,
    visible: boolean
  ): Promise<boolean> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/category/${batchId}/visible-mark`,
        "PATCH",
        true,
        { visibleMark: visible }
      );
      setHookError(null);
      return response.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const getBatchList = async (): Promise<Batch[]> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/batch-list`,
        "GET",
        true
      );

      return response.result as Batch[];
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const addBatchCategory = async (batchName: string): Promise<BatchStudent> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/batch`,
        "POST",
        true,
        { name: batchName }
      );
      setHookError(null);
      return response.result as BatchStudent;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const addCustomCategory = async (name: string): Promise<boolean> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/custom-category`,
        "POST",
        true,
        { name }
      );
      setHookError(null);
      return response.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const editCategoryName = async (
    id: string,
    name: string
  ): Promise<boolean> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/category/${id}`,
        "PATCH",
        true,
        { name }
      );
      setHookError(null);
      return response.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const removeCategory = async (id: string): Promise<boolean> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/category/${id}`,
        "DELETE",
        true
      );
      setHookError(null);
      return response.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const addStudentManually = async (
    data: AddStudentWithPasswordPayload
  ): Promise<Student> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/student`,
        "POST",
        true,
        data
      );
      setHookError(null);
      return response.result as Student;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const addStudentsBulk = async (
    studentsPayload: AddStudentPayload[]
  ): Promise<boolean> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/students/bulk`,
        "POST",
        true,
        { students: studentsPayload }
      );
      setHookError(null);
      return response.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const getStudent = async (
    studentId: string
  ): Promise<StudentFromLecturerViewProps> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/lecturer/student/${studentId}`,
        "GET",
        true
      );
      setHookError(null);
      return response.result as StudentFromLecturerViewProps;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const editStudent = async (
    studentId: string,
    data: EditStudentPayload
  ): Promise<boolean> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/student/${studentId}`,
        "PUT",
        true,
        data
      );
      setHookError(null);
      return response.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const removeStudent = async (
    studentId: string,
    payload: RemoveStudentPayload
  ): Promise<boolean | string> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/student/${studentId}`,
        "DELETE",
        true,
        payload
      );
      setHookError(null);
      return response.result as boolean | string;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const sendClientEvaluationLink = async (
    clientId: string
  ): Promise<boolean> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/client/${clientId}/evaluation-link`,
        "GET",
        true
      );
      setHookError(null);
      return response.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const addClient = async (data: AddClientPayload): Promise<boolean> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/client`,
        "POST",
        true,
        data
      );
      setHookError(null);
      return response.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const removeClient = async (clientId: string): Promise<boolean> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/client/${clientId}`,
        "DELETE",
        true
      );
      return response.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const editClient = async (
    clientId: string,
    data: EditClientPayload
  ): Promise<boolean> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/client/${clientId}`,
        "PUT",
        true,
        data
      );
      return response.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const fetchStudentLogData = async (
    batchId: string
  ): Promise<StudentLogProps[]> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/category/${batchId}/bulk/log`,
        "GET",
        true
      );

      return response.result as StudentLogProps[];
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const removeStudentLogData = async (jobId: string): Promise<boolean> => {
    setHookError(null);
    try {
      setHookLoading(true);
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/student/bulk/${jobId}`,
        "DELETE",
        true
      );

      return response.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const getClientList = async (): Promise<ClientProps[]> => {
    setHookError(null);
    try {
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/client`,
        "GET",
        true
      );

      return response.result as ClientProps[];
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const getGroupProjectList = async (): Promise<GroupProject[]> => {
    setHookError(null);
    try {
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/group-info`,
        "GET",
        true
      );

      return response.result as GroupProject[];
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const getClientIdentity = async (
    clientId: string
  ): Promise<ClientIdentityProps> => {
    setHookError(null);
    try {
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/client/${clientId}`,
        "GET",
        true
      );

      return response.result as ClientIdentityProps;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const resendStudentEmail = async (studentId: string): Promise<boolean> => {
    setHookError(null);
    try {
      const response = await standardApi(
        `${API_BASE_URL}/api/user-management/student/${studentId}/email-resend`,
        "GET",
        true
      );

      return response.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const getSelfAssessmentResult = async (
    studentId: string,
    batch: string
  ): Promise<SelfAssessmentResult[]> => {
    setHookError(null);
    try {
      const result = await standardApi(
        `${API_BASE_URL}/api/user-management/student/${studentId}/self-assessment`,
        "POST",
        true,
        { batch: batch }
      );

      return result.result as SelfAssessmentResult[];
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const getPeerAssessmentResult = async (
    studentId: string,
    batch: string
  ): Promise<PeerAssessmentResult[]> => {
    setHookError(null);
    try {
      const result = await standardApi(
        `${API_BASE_URL}/api/user-management/student/${studentId}/peer-assessment`,
        "POST",
        true,
        { batch: batch }
      );

      return result.result as PeerAssessmentResult[];
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } finally {
      setHookLoading(false);
    }
  };

  const getClientEvaluationResult = async (groupId: string, batch: string): Promise<PeerAssessmentResult[]> => {
    setHookError(null);
    try {
      const result = await standardApi(
        `${API_BASE_URL}/api/user-management/group/${groupId}/client-evaluation`,
        "POST",
        true,
        { batch: batch }
      );

      return result.result as PeerAssessmentResult[];
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    }finally {
      setHookLoading(false);
    }
  };

  const removeAssessmentResult = async (assessmentId: string): Promise<boolean> => {
    setHookError(null);
    try {
      const result = await standardApi(
        `${API_BASE_URL}/api/user-management/assessmentResult/${assessmentId}`,
        "DELETE",
        true
      );

      return result.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    }finally {
      setHookLoading(false);
    }
  };

  return {
    hookLoading,
    hookError,
    getAllBatchStudents,
    editBatchVisibleMark,
    addBatchCategory,
    addCustomCategory,
    editCategoryName,
    removeCategory,
    addStudentManually,
    addStudentsBulk,
    getStudent,
    editStudent,
    removeStudent,
    sendClientEvaluationLink,
    addClient,
    removeClient,
    editClient,
    fetchStudentLogData,
    removeStudentLogData,
    getClientList,
    getGroupProjectList,
    getClientIdentity,
    getBatchList,
    resendStudentEmail,
    getSelfAssessmentResult,
    getPeerAssessmentResult,
    getClientEvaluationResult,
    removeAssessmentResult
  };
};
