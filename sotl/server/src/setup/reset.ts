import connectDB from "../database";
import mongoose from "mongoose";
import Client from "../models/Client";
import Lecturer from "../models/Lecturer";
import Student from "../models/Student";
import ToDoList from "../models/ToDoList";
import Project from "../models/Project";
import Group from "../models/Group";
import Quiz from "../models/Quiz";
import { QuestionModel } from "../models/QuizItem";
import Assessment from "../models/Assessment";
import AssessmentResult from "../models/AssessmentResult";
import Notification from "../models/Notification";
import Deliverables from "../models/Deliverables";
import Category from "../models/Category";
import Badge from "../models/Badge";
import JobModel from "../models/Job";
import Sprint from "../models/Sprint";
import TaskContent from "../models/TaskContent";
import Comment from "../models/Comment";

// Function to delete data with transactions
async function deleteData(): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Perform delete operations within the transaction
    await Student.deleteMany({}, { session });
    console.log(
      "👍 Students Deleted."
    );

    await Lecturer.deleteMany({}, { session });
    console.log(
      "👍 Lecturers Deleted."
    );

    await Deliverables.deleteMany({}, { session });
    console.log(
      "👍 Deliverables Deleted."
    );

    await Group.deleteMany({}, { session });
    console.log(
      "👍 Groups Deleted."
    );

    await Project.deleteMany({}, { session });
    console.log(
      "👍 Projects Deleted."
    );

    await Client.deleteMany({}, { session });
    console.log(
      "👍 Clients Deleted."
    );

    await TaskContent.deleteMany({}, { session });
    console.log(
      "👍 TaskContents Deleted."
    );

    await Sprint.deleteMany({}, { session });
    console.log(
      "👍 Sprints Deleted."
    );

    await ToDoList.deleteMany({}, { session });
    console.log(
      "👍 ToDoLists Deleted."
    );

    await Comment.deleteMany({}, { session });
    console.log(
      "👍 Comments Deleted."
    );

    await Quiz.deleteMany({}, { session });
    console.log(
      "👍 Quizzes Deleted."
    );

    await QuestionModel.deleteMany({}, { session });
    console.log(
      "👍 Quiz items Deleted."
    );

    await AssessmentResult.deleteMany({}, { session });
    console.log(
      "👍 AssessmentResults Deleted."
    );

    await Assessment.deleteMany({}, { session });
    console.log(
      "👍 Assessments Deleted."
    );

    await Notification.deleteMany({}, { session });
    console.log(
      "👍 Notifications Deleted."
    );

    await Category.deleteMany({}, { session });
    console.log(
      "👍 Categories Deleted."
    );

    await Badge.deleteMany({}, { session });
    console.log(
      "👍 Badges Deleted"
    );

    await JobModel.deleteMany({}, { session });
    console.log(
      "👍 Jobs Deleted."
    );

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
  } catch (error) {
    // Abort the transaction on error
    await session.abortTransaction();
    session.endSession();
    console.error("🚫 Error during data deletion:", error);
  }
  process.exit();
}

// Connect to the database
const runReset = async () => {
  try {
    await connectDB(); // Ensure database connection is established

    await deleteData();
    await mongoose.connection.close();
    process.exit();
  } catch (error) {
    console.error("🚫 Error during setup:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runReset();
