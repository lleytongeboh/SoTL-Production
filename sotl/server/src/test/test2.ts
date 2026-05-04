import Student from "../models/Student";
import mongoose, { ClientSession, isValidObjectId } from "mongoose";
import connectDB from "../database";
import { GroupService } from "../services/GroupService";
import * as NotificationService from "../services/NotificationService";
import { TodoService } from "../services/TodoService";
import { AssessmentService } from "../services/AssessmentService";
import { AssessmentResultService } from "../services/AssessmentResultService";
import { errorResponse, successResponse } from "../utils/response";
import _ from "lodash";
import * as fs from "fs";
import * as path from "path";
import { todo } from "node:test";

type TodoObjectIds = {
  sprintIds: mongoose.Types.ObjectId[];
  sprintToDoIds: mongoose.Types.ObjectId[];
  todoIds: mongoose.Types.ObjectId[];
  todoTasksIds: mongoose.Types.ObjectId[];
  taskContentIds: mongoose.Types.ObjectId[];
  commentIds: mongoose.Types.ObjectId[];
};

const removeStudent = async ({
  id,
  batch,
  confirmDelete,
}: {
  id: string;
  batch: string;
  confirmDelete: boolean;
}) => {
  connectDB();
  console.time("removeStudent"); // Start timing
  const session = await mongoose.startSession(); // Start a session
  session.startTransaction(); // Begin transaction

  try {
    let warningMessage: string[] = [];

    if (!id || !isValidObjectId(id)) {
      throw new Error("Invalid student id");
    }

    // Find the student within the transaction
    const student = await Student.findOne({
      _id: id,
      batch: { $elemMatch: { batch: batch } },
    })
      .session(session)
      .read("primary");
    if (!student) {
      throw new Error("Student not found");
    }

    // get Group
    const group = await GroupService.getGroup(
      new mongoose.Types.ObjectId(id),
      batch
    );

    if (!confirmDelete) {
      // Check Notification
      if (
        await NotificationService.isHaveNotification(
          new mongoose.Types.ObjectId(id)
        )
      ) {
        warningMessage.push("notification");
      }

      // if student is the last member of the group, notify the user, delete the group and project
      if (group) {
        warningMessage.push("group");
      }

      // Check the comment that have assigned to this student
      TodoService.isHaveComment(group, warningMessage);

      // Check todo that have assigned to this student
      TodoService.isHaveTodo(group, warningMessage);

      // Check Assessment
      if (
        await AssessmentService.isHaveAssessment(
          new mongoose.Types.ObjectId(id)
        )
      ) {
        warningMessage.push("assessment");
      }

      // Check Assessment Result
      if (
        await AssessmentResultService.isHaveAssessmentResult(
          new mongoose.Types.ObjectId(id)
        )
      ) {
        warningMessage.push("assessment result");
      }
    } else {
      const todoObjectIds: TodoObjectIds = {
        sprintIds: [],
        sprintToDoIds: [],
        todoIds: [],
        todoTasksIds: [],
        taskContentIds: [],
        commentIds: [],
      };

      TodoService.extractCommentIds(group, todoObjectIds.commentIds);
      console.log("check todoObjectIds.commentIds:", todoObjectIds.commentIds);

      await TodoService.extractToDoObjectIdByStudent(
        new mongoose.Types.ObjectId(id),
        group,
        todoObjectIds,
        session
      );
      console.log(
        "check todoObjectIds.taskContentIds:",
        todoObjectIds.taskContentIds
      );

      console.log("check todoObjectIds.sprintIds:", todoObjectIds.sprintIds);

      console.log(
        "check todoObjectIds.sprintToDoIds:",
        todoObjectIds.sprintToDoIds
      );

      console.log("check todoObjectIds.todoIds:", todoObjectIds.todoIds);

      console.log(
        "check todoObjectIds.todoTasksIds:",
        todoObjectIds.todoTasksIds
      );
      // remove todo
      await TodoService.removeTodoStudent(
        new mongoose.Types.ObjectId(id),
        batch,
        todoObjectIds,
        session
      );

      // remove assessment
      await AssessmentService.removeUserFromAssessment(
        new mongoose.Types.ObjectId(id),
        batch,
        session
      );

      // remove assessment result
      await AssessmentResultService.removeStudentAssessmentResult(
        new mongoose.Types.ObjectId(id),
        batch,
        session
      );

      // remove group
      const groupRemove = await GroupService.removeStudentFromGroup(new mongoose.Types.ObjectId(id), batch, session);
      console.log("groupRemove:", groupRemove);

      if (student.batch.length === 1) {
        await NotificationService.removeNotificationByUserId(
          new mongoose.Types.ObjectId(id),
          session
        );
        await student.deleteOne({ session });
      } else {
        student.batch = student.batch.filter(
            (item) => item.batch !== batch
        );

        student.loginAsBatch = student.batch[0].batch;
        await student.save({ session });
      }
    }

    // Commit the transaction
    await session.commitTransaction();
    if (!confirmDelete) {
      console.log(
        successResponse(
          `Are you sure want to delete this student? Have data with ${warningMessage.join(
            ","
          )}!!!`,
          "Warning"
        )
      );
    } else {
      console.log(successResponse(true, "Student removed successfully"));
    }
  } catch (error: any) {
    await session.abortTransaction(); // Abort transaction on error
    console.log(errorResponse(error.message));
  } finally {
    session.endSession(); // End the session
    console.timeEnd("removeStudent"); // End timing
    process.exit(0);
  }
};

removeStudent({
  id: "6740a9588d899f440b028750",
  batch: "24/25",
  confirmDelete: true,
});
