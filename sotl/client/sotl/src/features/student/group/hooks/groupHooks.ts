import { useState } from 'react';
import { getGroupListCall } from '../../group/services/getGroupList';
import { joinGroupCall } from '../../group/services/joinGroup';
import { createGroupCall } from '../../group/services/createGroup';
import { Group, StudentMarkItem } from '../../group/models';
import { checkGroupCall } from '../services/checkGroup';
import { editProjectRoleCall } from '../services/editProjectRole';
import { deleteGroupCall } from '../services/deleteGroup';
import { getGroupCall } from '../services/getGroup';
import { editGroupCall } from '../services/editGroup';
import { leaveGroupCall } from '../services/leaveGroup';
import { getMembersMarkCall } from '../services/getMembersMark';
import { markStudentCall } from '../services/markStudent';

export const groupHooks = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Check if the user is in a group
  const checkGroup = async (batch: string): Promise<Group> => {
    try {
      setLoading(true);
      const response = await checkGroupCall(batch);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const getGroupList = async (batch: string): Promise<Group[]> => {
    try {
      setLoading(true);
      const response = await getGroupListCall(batch);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const joinGroup = async (groupId: string, roles: string[]): Promise<Group> => {
    try {
      setLoading(true);
      const response = await joinGroupCall(groupId, roles);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const createGroup = async (group: Group, roles: string[]): Promise<Group> => {
    try {
      setLoading(true);
      const response = await createGroupCall(group, roles);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const editProjectRole = async (groupId: string, role: string[]): Promise<Group> => {
    try {
      setLoading(true);
      const response = await editProjectRoleCall(groupId, role);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const leaveGroup = async (groupId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await leaveGroupCall(groupId);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (groupId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await deleteGroupCall(groupId);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get group and project details for lecturer
  const getGroup = async (groupId: string): Promise<Group> => {
    try {
      setLoading(true);
      const response = await getGroupCall(groupId);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const editGroup = async (groupId: string, group: Group): Promise<Group> => {
    try {
      setLoading(true);
      const response = await editGroupCall(groupId, group);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getMembersMark = async (groupId: string): Promise<{ [key: string]: { marked: boolean, items: StudentMarkItem[] } }> => {
    try {
      setLoading(true);
      const response = await getMembersMarkCall(groupId);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const markStudent = async (studentId: string, batch: string, mark_items: StudentMarkItem[]): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await markStudentCall(studentId, batch, mark_items);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    checkGroup,
    getGroupList,
    joinGroup,
    createGroup,
    editProjectRole,
    leaveGroup,
    deleteGroup,
    getGroup,
    editGroup,
    getMembersMark,
    markStudent,
    error,
    loading
  };
};
