import mongoose from "mongoose";
import Sprint from "../models/Sprint";
import ToDoList from "../models/ToDoList";
import TaskContent from "../models/TaskContent";
import Group from "../models/Group";
import Comment from "../models/Comment";
import Project from "../models/Project";
import { GroupService } from "./GroupService";
import { ProjectService } from "./ProjectService";
import _ from "lodash";

namespace TodoService {
  type TodoObjectIds = {
    sprintIds: mongoose.Types.ObjectId[];
    sprintToDoIds: mongoose.Types.ObjectId[];
    todoIds: mongoose.Types.ObjectId[];
    todoTasksIds: mongoose.Types.ObjectId[];
    taskContentIds: mongoose.Types.ObjectId[];
    commentIds: mongoose.Types.ObjectId[];
  };

  const isMoreThanOneItem = (items: any) => {
    return items !== undefined && items !== null && items.length > 0;
  };

  export const extractCommentIds = (
    group: any,
    commentIds: mongoose.Types.ObjectId[]
  ) => {
    if(group === null || group === undefined) {
      return;
    }
    // assign comments id from to do list
    if (
      group.to_do_list !== undefined &&
      group.to_do_list !== null &&
      group.to_do_list.length > 0
    ) {
      for (const t of group.to_do_list) {
        if (
          t.task_content !== undefined &&
          t.task_content.comments !== undefined &&
          t.task_content.comments !== null
        ) {
          commentIds.push(...t.task_content.comments);
        }

        if (t.tasks !== undefined && t.tasks !== null && t.tasks.length > 0) {
          for (const task of t.tasks) {
            if (
              task.comments !== undefined &&
              task.comments !== null &&
              task.comments.length > 0
            ) {
              commentIds.push(...task.comments);
            }
          }
        }
      }
    }

    // assign comments id from sprint list
    if (
      group.sprint_list !== undefined &&
      group.sprint_list !== null &&
      group.sprint_list.length > 0
    ) {
      for (const t of group.sprint_list) {
        if (t.comments !== undefined && t.comments !== null) {
          commentIds.push(...t.comments);
        }
      }
    }

    // assign comments id from sprint to do list
    if (
      group.sprint_to_do_list !== undefined &&
      group.sprint_to_do_list !== null &&
      group.sprint_to_do_list.length > 0
    ) {
      for (const t of group.sprint_to_do_list) {
        if (
          t.task_content !== undefined &&
          t.task_content.comments !== undefined &&
          t.task_content.comments !== null &&
          t.task_content.comments.length > 0
        ) {
          commentIds.push(...t.task_content.comments);
        }
      }
    }

    // assign comments id from sprint to do task list
    if (
      group.sprint_to_do_task_list !== undefined &&
      group.sprint_to_do_task_list !== null &&
      group.sprint_to_do_task_list.length > 0
    ) {
      for (const t of group.sprint_to_do_task_list) {
        if (
          t.comments !== undefined &&
          t.comments !== null &&
          t.comments.length > 0
        ) {
          commentIds.push(...t.comments);
        }
      }
    }
  };

  export const extractToDoObjectIdByStudent = async (
    studentId: mongoose.Types.ObjectId,
    group: any,
    todoObjectIds: TodoObjectIds,
    session: mongoose.ClientSession
  ) => {
    try {
      if(group === null || group === undefined || group.project === undefined) {
        return null;
      }

      const project = await Project.findById(group.project._id).session(session).read('primary');
      const sprintList = await Sprint.find({_id: {$in: project?.sprint_list}}).session(session).read('primary');
      // assign task content id from to do list (Standalone)
      if (
        group.to_do_list !== undefined &&
        group.to_do_list !== null &&
        group.to_do_list.length > 0
      ) {
        for (const t of group.to_do_list) {
          if (
            t.task_content !== undefined &&
            t.task_content !== null &&
            ( _.isEqual(t.task_content.creator,studentId) || _.isEqual(t.task_content.assignee,studentId) )
          ) {
            todoObjectIds.taskContentIds.push(t.task_content._id);
            todoObjectIds.todoIds.push(t._id);
          }

          if (
            t.tasks !== undefined &&
            t.tasks !== null &&
            t.tasks.length > 0
          ) {
            for (const task of t.tasks) {
              if (
                task.creator !== undefined &&
                task.creator !== null &&
                (_.isEqual(task.creator,studentId) || _.isEqual(task.assignee,studentId))
              ) {
                todoObjectIds.taskContentIds.push(task._id);
                todoObjectIds.todoTasksIds.push(task._id);
              }
            }
          }
        }
      }

      // assign task content id from sprint list
      if (group.sprint_list !== undefined && group.sprint_list !== null && group.sprint_list.length > 0) {
        for (const t of group.sprint_list) {
          if (_.isEqual(t.creator,studentId) || _.isEqual(t.assignee,studentId)) {
            todoObjectIds.taskContentIds.push(t._id);
            // Assign sprint id to todoObjectIds.sprintIds when task content's creator or assignee === studentId
            if(sprintList !== undefined && sprintList !== null && sprintList.length > 0 && sprintList.some((x:any)=>(_.isEqual(x.task_content, t._id)))){
              todoObjectIds.sprintIds.push(t._id)
            }
          }
        }
      }

      // assign task content id from sprint to do list
      if (group.sprint_to_do_list !== undefined && group.sprint_to_do_list !== null && group.sprint_to_do_list.length > 0) {
        for (const t of group.sprint_to_do_list) {
          if (t.task_content !== undefined && t.task_content !== null && (_.isEqual(t.task_content.creator,studentId) || _.isEqual(t.task_content.assignee,studentId))) {
            todoObjectIds.taskContentIds.push(t.task_content._id);
            todoObjectIds.sprintToDoIds.push(t._id);
          }
        }
      }

      if(group.sprint_to_do_task_list !== undefined && group.sprint_to_do_task_list !== null && group.sprint_to_do_task_list.length > 0) {
        for (const t of group.sprint_to_do_task_list) {
          if (_.isEqual(t.creator,studentId) || _.isEqual(t.assignee,studentId)) {
            todoObjectIds.taskContentIds.push(t._id);
            todoObjectIds.todoTasksIds.push(t._id);
          }
        }
      }

      return true;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const extractSprintIdsByStudent = async (
    projectId: mongoose.Types.ObjectId,
    todoObjectIds: TodoObjectIds,
    session: mongoose.ClientSession
  ) => {
    try {
      if (projectId === undefined || projectId === null) {
        return null;
      }
      const project = await Project.findById(projectId)
        .session(session)
        .read("primary");
      if (!project) {
        throw new Error("Project not found");
      }

      if (
        project.sprint_list !== undefined &&
        project.sprint_list !== null &&
        project.sprint_list.length > 0
      ) {
        const sprintList = await Sprint.find({
          _id: { $in: project.sprint_list },
        })
          .session(session)
          .read("primary");
        if (
          sprintList === null ||
          sprintList === undefined ||
          sprintList.length === 0
        ) {
          console.log("Sprint list not found");
          throw new Error("Sprint list not found");
        }

        for (const sprint of sprintList) {
          if (
            todoObjectIds.taskContentIds.some((id) =>
              _.isEqual(sprint.task_content, id)
            )
          ) {
            todoObjectIds.sprintIds.push(sprint._id as mongoose.Types.ObjectId);
          }
        }
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const isHaveTodo = async (group: any, warningMessage: string[]) => {
    try {
      if (
        group === null ||
        group === undefined ||
        group.project === undefined ||
        group.project._id === undefined
      ) {
        return false;
      }

      if (isMoreThanOneItem(group.to_do_list)) {
        warningMessage.push("stand alone todo list");
      }

      if (isMoreThanOneItem(group.to_do_list.tasks)) {
        warningMessage.push("stand alone todo list tasks");
      }

      if (isMoreThanOneItem(group.sprint_list)) {
        warningMessage.push("sprint list");
      }

      if (isMoreThanOneItem(group.sprint_to_do_list)) {
        warningMessage.push("sprint todo list");
      }

      if (isMoreThanOneItem(group.sprint_to_do_task_list)) {
        warningMessage.push("sprint todo list tasks");
      }

      return (
        isMoreThanOneItem(group.to_do_list) ||
        isMoreThanOneItem(group.to_do_list.tasks) ||
        isMoreThanOneItem(group.sprint_list) ||
        isMoreThanOneItem(group.sprint_to_do_list) ||
        isMoreThanOneItem(group.sprint_to_do_task_list)
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const isHaveComment = (group: any, warningMessage: string[]) => {
    try {
      // If no group or group.project is provided === no todo === no comment, return false
      if (
        group === null ||
        group === undefined ||
        group.project === undefined
      ) {
        return false;
      }
      let haveComment = false;
      // todo list comments
      if (group.to_do_list !== undefined && group.to_do_list !== null && group.to_do_list.length > 0) {
        for (const t of group.to_do_list) {
          if (
            t.task_content !== undefined &&
            t.task_content.comments !== undefined &&
            t.task_content.comments !== null &&
            t.task_content.comments.length > 0
          ) {
            warningMessage.push("stand alone todo list comments");
            haveComment = true;
            break;
          }
        }

        if (
          group.to_do_list.tasks !== undefined &&
          group.to_do_list.tasks !== null &&
          group.to_do_list.tasks.length > 0
        ) {
          for (const t of group.to_do_list.tasks) {
            if (
              t.comments !== undefined &&
              t.comments !== null &&
              t.comments.length > 0
            ) {
              warningMessage.push("stand alone todo list tasks comments");
              haveComment = true;
              break;
            }
          }
        }
      }

      // sprint list comments
      if (group.sprint_list !== undefined && group.sprint_list !== null && group.sprint_list.length > 0) {
        for (const t of group.sprint_list) {
          if (
            t.comments !== undefined &&
            t.comments !== null &&
            t.comments.length > 0
          ) {
            warningMessage.push("sprint list comments");
            haveComment = true;
            break;
          }
        }
      }

      // sprint todo list comments
      if (
        group.sprint_to_do_list !== undefined &&
        group.sprint_to_do_list !== null &&
        group.sprint_to_do_list.length > 0
      ) {
        for (const t of group.sprint_to_do_list) {
          if (
            t.task_content !== undefined &&
            t.task_content.comments !== undefined &&
            t.task_content.comments !== null &&
            t.task_content.comments.length > 0
          ) {
            warningMessage.push("sprint todo list comments");
            haveComment = true;
            break;
          }
        }

        if (
          group.sprint_to_do_task_list !== undefined &&
          group.sprint_to_do_task_list !== null &&
          group.sprint_to_do_task_list.length > 0
        ) {
          for (const t of group.sprint_to_do_task_list) {
            if (
              t.comments !== undefined &&
              t.comments !== null &&
              t.comments.length > 0
            ) {
              warningMessage.push("sprint todo list tasks comments");
              haveComment = true;
              break;
            }
          }
        }
      }

      return haveComment;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // remove todo from student according to batch
  export const removeTodoStudent = async (
    studentId: mongoose.Types.ObjectId,
    batch: string,
    todoObjectIds: TodoObjectIds,
    session: mongoose.ClientSession
  ) => {
    try {
      const removeSprintToDo = await Sprint.updateMany(
        { to_do_list: { $in: todoObjectIds.sprintToDoIds } }, // Filter condition
        { $pull: { to_do_list: { $in: todoObjectIds.sprintToDoIds } } }, // Update operation
      )
        .session(session);
      console.log("removeSprintToDo", removeSprintToDo);

      const removeSprint = await Sprint.deleteMany({_id:{ $in: todoObjectIds.sprintIds }}, { session: session });
      console.log("removeSprint", removeSprint);

      const removeTaskFromTodo = await ToDoList.updateMany({tasks: { $in: todoObjectIds.todoTasksIds }}, { $pull: { tasks: { $in: todoObjectIds.todoTasksIds } } }, { session: session }); 
      console.log("removeTaskFromTodo", removeTaskFromTodo);

      const removeTodo = await ToDoList.deleteMany({_id: { $in: todoObjectIds.todoIds }}, { session: session });
      console.log("removeTodo", removeTodo);

      const removeTaskContent = await TaskContent.deleteMany({_id: { $in: todoObjectIds.taskContentIds }}, { session: session });
      console.log("removeTaskContent", removeTaskContent);

      // Remove comments where user matches studentId and id is within commentIds
      const commentRemoveResult = await Comment.deleteMany({
        user: studentId, // Match the user field with the student's ID
        _id: { $in: todoObjectIds.commentIds }, // Match comment IDs within the provided array
      }, { session: session });

      console.log("Comment removed result: ", commentRemoveResult);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const removeSprintAndCascading = async (
    sprintId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession
  ) => {
    try {
      if (sprintId === undefined || sprintId === null) {
        return null;
      }

      const sprint = await Sprint.findById(sprintId)
        .session(session)
        .read("primary");
      if (!sprint) {
        throw new Error("Sprint not found");
      }

      const commentIds = [];
      const todoIds = [];
      const taskIds = [];

      todoIds.push(...sprint.to_do_list);
      taskIds.push(sprint.task_content);

      // remove cascading
      if (todoIds.length > 0) {
        const todoList = await ToDoList.find({ _id: { $in: todoIds } })
          .session(session)
          .read("primary");
        if (
          todoList === null ||
          todoList === undefined ||
          todoList.length === 0
        ) {
          console.log("Todo list not found");
          throw new Error("Todo list not found");
        }

        for (const t of todoList) {
          if (t.tasks !== undefined && t.tasks !== null) {
            taskIds.push(...t.tasks);
          }

          if (t.task_content !== undefined && t.task_content !== null) {
            taskIds.push(t.task_content);
          }
        }
      }

      if (taskIds.length > 0) {
        const taskContents = await TaskContent.find({ _id: { $in: taskIds } })
          .session(session)
          .read("primary");
        if (
          taskContents === null ||
          taskContents === undefined ||
          taskContents.length === 0
        ) {
          console.log("Task content not found");
          throw new Error("Task content not found");
        }

        for (const t of taskContents) {
          if (t.comments !== undefined && t.comments !== null) {
            commentIds.push(...t.comments);
          }
        }
      }

      const commentRemovedResult = await Comment.deleteMany(
        { _id: { $in: commentIds } },
        { session: session }
      );
      const taskContentRemovedResult = await TaskContent.deleteMany(
        { _id: { $in: taskIds } },
        { session: session }
      );
      const deleteTodoResult = await ToDoList.deleteMany(
        { _id: { $in: todoIds } },
        { session: session }
      );
      const deleteSprintResult = await sprint.deleteOne({ session: session });

      console.log("Sprint removed result: ", deleteSprintResult);
      console.log("Todo list removed result: ", deleteTodoResult);
      console.log("Task content removed result: ", taskContentRemovedResult);
      console.log("Comment removed result: ", commentRemovedResult);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Remove standalone todo list and cascading
  export const removeTodoListAndCascading = async (
    todoListId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession
  ) => {
    try {
      if (todoListId === undefined || todoListId === null) {
        return null;
      }

      const todoList = await ToDoList.findById(todoListId)
        .session(session)
        .read("primary");
      if (!todoList) {
        throw new Error("Todo list not found");
      }

      const commentIds = [];
      const taskAndTaskContentIds = [];

      taskAndTaskContentIds.push(...todoList.tasks);
      taskAndTaskContentIds.push(todoList.task_content);

      // remove cascading
      if (taskAndTaskContentIds.length > 0) {
        const taskContent = await TaskContent.find({
          _id: { $in: taskAndTaskContentIds },
        })
          .session(session)
          .read("primary");

        if (
          taskContent === null ||
          taskContent === undefined ||
          taskContent.length === 0
        ) {
          console.log("Task content not found");
          return null;
        }

        // assign comments id from to do list
        for (const t of taskContent) {
          if (t.comments !== undefined && t.comments !== null) {
            commentIds.push(...t.comments);
          }
        }

        // remove tasks and task content
        const taskContentRemovedResult = await TaskContent.deleteMany({
          _id: { $in: taskAndTaskContentIds },
        }).session(session);
        console.log("Task content removed result: ", taskContentRemovedResult);

        // remove comments
        const commentRemovedResult = await Comment.deleteMany({
          _id: { $in: commentIds },
        }).session(session);
        console.log("Comment removed result: ", commentRemovedResult);
      }

      const deleteTodoResult = await todoList.deleteOne({ session: session });
      console.log("Todo list removed result: ", deleteTodoResult);
      return deleteTodoResult.acknowledged;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const isSprintBelongedToStudent = async (sprintId: mongoose.Types.ObjectId, studentId: mongoose.Types.ObjectId) => {
    try {
      const projectIds = await GroupService.getProjectIdsFromStudent(studentId);
      const validProjectIds = projectIds.filter((id): id is mongoose.Types.ObjectId => id !== undefined);
      const isSprintBelongedToProject = await ProjectService.isSprintBelongedToProject(sprintId, validProjectIds);
      return isSprintBelongedToProject;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const isCommentBelongedToStudent = async (commentId: mongoose.Types.ObjectId, studentId: mongoose.Types.ObjectId) => {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new Error("Comment not found");
      }
      console.log('comment get', comment);
      return String(comment.user).toString() === String(studentId).toString();
    } catch (error: any) {
      throw new Error(error.message);
    }
  };
}

export { TodoService };
