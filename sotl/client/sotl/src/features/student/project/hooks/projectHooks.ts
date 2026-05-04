import { useState } from 'react';
import { Comment, MarkItem, Project, Sprint, TaskContent, ToDoList } from '../models';
import { createProjectCall } from '../services/createProject';
import { checkProjectCall } from '../services/checkProject';
import { editProjectCall } from '../services/editProject';
import { getProjectListCall } from '../services/getProjectList';
import { getProjectCall } from '../services/getProject';
import { markProjectCall } from '../services/markProject';
import { submitDeliverableCall } from '../services/submitDeliverable';
import { downloadDeliverableCall } from '../services/downloadDeliverable';
import { fetchTodoContentCall } from '../services/fetchTodoContent';
import { fetchSprintTodoCall } from '../services/fetchSprintTodo';
import { createTodoCall } from '../services/createTodo';
import { createSprintCall } from '../services/createSprint';
import { ContentType, TaskContentWithChild } from '../../../../pages/project/Todos';
import { fetchSingleTodoCall } from '../services/fetchSingleTodo';
import { editTodoCall } from '../services/editTodo';
import { deleteTodoCall } from '../services/deleteTodo';
import { createCommentCall } from '../services/createComment';
import { fetchGanttCall } from '../services/fetchGanttCall';
import { Task } from 'gantt-task-react';
import { editCommentCall } from '../services/editComment';
import { deleteCommentCall } from '../services/deleteComment';
import { deleteDeliverableCall } from '../services/deleteDeliverable';
import { updateDeliverableStatusCall } from '../services/updateDeliverableStatus';

export const projectHooks = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getProjectList = async (): Promise<Project[]> => {
    try {
      setLoading(true);
      const response = await getProjectListCall();
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const checkProject = async (group_id: string): Promise<Project> => {
    try {
      setLoading(true);
      const response: Project = await checkProjectCall(group_id);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const createProject = async (project: Project, group_id: string): Promise<Project> => {
    try {
      setLoading(true);
      const response = await createProjectCall(project, group_id);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const editProject = async (project_id: string, project: Project): Promise<Project> => {
    try {
      setLoading(true);
      const response = await editProjectCall(project_id, project);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const getProject = async (project_id: string): Promise<Project> => {
    try {
      setLoading(true);
      const response = await getProjectCall(project_id);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const markProject = async (project_id: string, mark_items: MarkItem[]): Promise<Project> => {
    try {
      setLoading(true);
      const response = await markProjectCall(project_id, mark_items);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const submitDeliverable = async (project_id: string, deliverable_id: string, file: File): Promise<Project> => {
    try {
      setLoading(true);
      const response = await submitDeliverableCall(project_id, deliverable_id, file);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const downloadDeliverable = async (project_id: string, deliverable_id: string, fileName: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await downloadDeliverableCall(project_id, deliverable_id, fileName);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteDeliverable = async (project_id: string, deliverable_id: string): Promise<Project> => {
    try {
      setLoading(true);
      const response = await deleteDeliverableCall(project_id, deliverable_id);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateDeliverableStatus = async (project_id: string, deliverable_id: string, status: number, comment?: string): Promise<Project> => {
    try {
      setLoading(true);
      const response = await updateDeliverableStatusCall(project_id, deliverable_id, status, comment);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchTodoContent = async (project_id: string): Promise<{ sprint: Sprint[], toDo: ToDoList[] }> => {
    try {
      setLoading(true);
      const response = await fetchTodoContentCall(project_id);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchSprintTodo = async (sprint_id: string): Promise<TaskContent[]> => {
    try {
      setLoading(true);
      const response = await fetchSprintTodoCall(sprint_id);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async (project_id: string, task_content: TaskContent, tasks: TaskContent[]): Promise<TaskContent> => {
    try {
      setLoading(true);
      const response = await createTodoCall(project_id, task_content, tasks);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createSprint = async (project_id: string, task_content: TaskContent, todos: TaskContentWithChild[]): Promise<TaskContent> => {
    try {
      setLoading(true);
      const response = await createSprintCall(project_id, task_content, todos);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    };
  };

  const fetchSingleTodo = async (project_id: string, todo_id: string, type: ContentType, parent_id?: string): Promise<TaskContentWithChild> => {
    try {
      setLoading(true);
      const response = await fetchSingleTodoCall(project_id, todo_id, type, parent_id);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    };
  };

  // edit all todo component (sprint, todo, tasks)
  const editTodo = async (project_id: string, todo_id: string, parent_id: string, type: ContentType, task_content: TaskContent, child_content?: TaskContent[]): Promise<TaskContent> => {
    try {
      setLoading(true);
      const response = await editTodoCall(project_id, todo_id, parent_id, type, task_content, child_content);
      setError(null);
      return response;
    } catch (error: any) {
      console.log(error.message);
      setError((error as Error).message ?? "An error occurred while editing the todo");
      throw error;
    } finally {
      setLoading(false);
    };
  };

  const deleteTodo = async (project_id: string, todo_id: string, type: ContentType, parent_id?: string): Promise<void> => {
    try {
      setLoading(true);
      await deleteTodoCall(project_id, todo_id, type, parent_id);
      setError(null);
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createComment = async (project_id: string, todo_id: string, type: ContentType, comment: string, parent_id?: string): Promise<void> => {
    try {
      setLoading(true);
      const { newImages } = identifyImages(comment);
      await createCommentCall(project_id, todo_id, type, comment, newImages, parent_id);
      setError(null);
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const editComment = async (comment_id: string, comment: string): Promise<Comment> => {
    try {
      setLoading(true);
      const response = await editCommentCall(comment_id, comment);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (comment_id: string): Promise<void> => {
    try {
      setLoading(true);
      await deleteCommentCall(comment_id);
      setError(null);
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const fetchGantt = async (project_id: string): Promise<Task[]> => {
    try {
      setLoading(true);
      const response = await fetchGanttCall(project_id);
      setError(null);
      return response;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // helper function for image upload
  const identifyImages = (content: string): { existingImages: string[], newImages: string[] } => {
    const images = Array.from(new DOMParser().parseFromString(content, 'text/html').querySelectorAll('img'));
    const [existingImages, newImages] = images.reduce((acc, img) => {
      const src = img.src;
      if (src.includes('data:image')) {
        acc[1].push(src);
      } else {
        acc[0].push(src);
      }
      return acc;
    }, [[], []] as [string[], string[]]);
    return { existingImages, newImages };
  };

  return {
    getProjectList,
    checkProject,
    createProject,
    editProject,
    getProject,
    markProject,
    submitDeliverable,
    downloadDeliverable,
    deleteDeliverable,
    updateDeliverableStatus,
    fetchTodoContent,
    fetchSprintTodo,
    createTodo,
    createSprint,
    fetchSingleTodo,
    editTodo,
    deleteTodo,
    createComment,
    editComment,
    deleteComment,
    fetchGantt,
    identifyImages,
    error,
    loading
  };
};
