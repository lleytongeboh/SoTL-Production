import mongoose from "mongoose";
import Group, { IGroup } from "../models/Group";
import { ProjectService } from "./ProjectService";

namespace GroupService {
  export const getGroup = async (
    userId: mongoose.Types.ObjectId,
    batch: string
  ) => {
    try {
      const group = await Group.aggregate([
        {
          $match:
            /**
             * query: The query in MQL.
             */
            {
              "team_members.student_id": userId,
              batch: batch,
            },
        },
        {
          $lookup: {
            from: "projects",
            localField: "project",
            foreignField: "_id",
            as: "project",
          },
        },
        {
          $unwind: {
            path: "$project",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "todolists",
            localField: "project.to_do_list",
            foreignField: "_id",
            as: "project.to_do_list",
          },
        },
        {
          $unwind: {
            path: "$project.to_do_list",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "taskcontents",
            localField: "project.to_do_list.task_content",
            foreignField: "_id",
            as: "project.to_do_list.task_content",
          },
        },
        {
          $unwind: {
            path: "$project.to_do_list.task_content",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "taskcontents",
            localField: "project.to_do_list.tasks",
            foreignField: "_id",
            as: "project.to_do_list.tasks",
          },
        },
        {
          $group: {
            _id: "$_id",
            batch: {
              $first: "$batch",
            },
            project: {
              $first: {
                _id: "$project._id",
              },
            },
            to_do_list: {
              $push: "$project.to_do_list",
            },
            sprint_list: {
              $first: "$project.sprint_list",
            },
          },
        },
        {
          $lookup: {
            from: "sprints",
            localField: "sprint_list",
            foreignField: "_id",
            as: "sprint_list",
          },
        },
        {
          $lookup: {
            from: "todolists",
            localField: "sprint_list.to_do_list",
            foreignField: "_id",
            as: "sprint_to_do_list",
          },
        },
        {
          $unwind: {
            path: "$sprint_to_do_list",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "taskcontents",
            localField: "sprint_to_do_list.task_content",
            foreignField: "_id",
            as: "sprint_to_do_list.task_content",
          },
        },
        {
          $unwind: {
            path: "$sprint_to_do_list.task_content",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            batch: {
              $first: "$batch",
            },
            project: {
              $first: "$project",
            },
            to_do_list: {
              $first: "$to_do_list",
            },
            sprint_list: {
              $first: "$sprint_list",
            },
            sprint_to_do_list: {
              $push: "$sprint_to_do_list",
            },
          },
        },
        {
          $lookup: {
            from: "taskcontents",
            localField: "sprint_to_do_list.tasks",
            foreignField: "_id",
            as: "sprint_to_do_task_list",
          },
        },
        {
          $lookup: {
            from: "taskcontents",
            localField: "sprint_list.task_content",
            foreignField: "_id",
            as: "sprint_list",
          },
        },
      ]);
      return group[0];
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const isHaveGroup = async (
    userId: mongoose.Types.ObjectId,
    batch: string
  ) => {
    try {
      const group = await Group.find({
        "team_members.student_id": userId,
        batch: batch,
      });
      return group.length > 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const removeStudentFromGroup = async (
    userId: mongoose.Types.ObjectId,
    batch: string,
    session: mongoose.ClientSession
  ) => {
    try {
      const group = await Group.findOne({
        "team_members.student_id": userId,
        batch: batch,
      })
        .session(session)
        .read("primary");
      if (!group) {
        console.log('Group not found');
        return null;
      }

      const groupMembers = group.team_members;
      if (groupMembers.length === 1) {
        // delete project and project related data such as deliverables
        if(group.project !== undefined && group.project !== null) {
          // get project
          const project = await ProjectService.getProject(group.project, session);
          if (!project) {
            throw new Error("Project not found");
          }
          // remove all relevant delete deliverable file
          for (const d of project.deliverables) {
            ProjectService.removeProjectDeliverable(d.file_path_uri);
          }

          // delete project
          await ProjectService.removeProject(group.project, session);
        }

        return await Group.deleteOne({ _id: group._id }, { session });
      } else {
        return await Group.updateOne(
          { _id: group._id },
          { $pull: { team_members: { student_id: userId } } },
          { session }
        );
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const isProjectBelongedToStudent = async (projectId: mongoose.Types.ObjectId, studentId: mongoose.Types.ObjectId) => {
    try {
      const group = await Group.findOne({ 'team_members.student_id': studentId, project: projectId });
      console.log('check group',group);
      return group !== null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const isGroupBelongedToStudent = async (groupId: mongoose.Types.ObjectId, studentId: mongoose.Types.ObjectId) => {
    try {
      const group = await Group.findOne({ _id: groupId, 'team_members.student_id': studentId });
      return group !== null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const getProjectIdsFromStudent = async (studentId: mongoose.Types.ObjectId) => {
    try {
      const group = await Group.find({ 'team_members.student_id': studentId });
      return group.map((g: IGroup) => g.project).filter((p: any) => p !== null && p !== undefined);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const updateBatchNameOnGroup = async (oldBatchName: string, newBatchName: string, session: mongoose.ClientSession) => {
    try {
      return await Group.updateMany({ batch: oldBatchName }, { batch: newBatchName }, { session });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };
}

export { GroupService };
