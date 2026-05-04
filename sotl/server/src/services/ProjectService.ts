import mongoose from "mongoose";
import Project from "../models/Project";
import fs from "fs";
import path from "path";

namespace ProjectService {
  export const getProject = async (
    projectId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession
  ) => {
    try {
      const project = await Project.findById(projectId)
        .session(session)
        .read("primary");
      return project;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const removeProjectDeliverable = (filePathUri: string) => {
    try {
      // Check if file exists
      if (!fs.existsSync(filePathUri)) {
        console.log("File not found");
        return false;
      }
      // Delete file
      fs.unlinkSync(filePathUri);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const removeProject = async (
    projectId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession
  ) => {
    try {
      const project = await Project.deleteOne({ _id: projectId }, { session });
      console.log("project removed:", project);
      return project.acknowledged;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const isSprintBelongedToProject = async (
    sprintId: mongoose.Types.ObjectId,
    projectIds: mongoose.Types.ObjectId[]
  ) => {
    try {
      // Validate inputs if necessary
      if (!mongoose.isValidObjectId(sprintId))
        throw new Error("Invalid sprintId");
      if (!projectIds.every(mongoose.isValidObjectId))
        throw new Error("Invalid projectIds");

      const project = await Project.findOne({
        sprint_list: sprintId,
        _id: { $in: projectIds },
      });
      return project !== null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };
}

export { ProjectService };
