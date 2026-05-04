import mongoose, { ClientSession, Types } from "mongoose"; // Import ClientSession from mongoose
import Assessment, { IAssessment } from "../../../models/Assessment"; // Import the Assessment model
import Quiz from "../../../models/Quiz"; // Import the Quiz model
import Student from "../../../models/Student"; // Import the Student model
import Client, { IClient } from "../../../models/Client"; // Import the Client model
import Category, { ICategory } from '../../../models/Category';
import AssessmentResult, { IAssessmentResult } from "../../../models/AssessmentResult"; // Import the AssessmentResult model
import { response } from "express";
import assert from 'node:assert';
import Group, { IGroup } from "@/models/Group";
import { getQuestions, genCompletedPages, genCompletedResponses, getRandomStartEndDate } from "./migrate_assessments";
import { AssessmentResultService } from "../../../services/AssessmentResultService";

// Define the migration function
export async function migrateAssessmentClient(
  session: ClientSession,
  batch: ICategory,
  groups: IGroup[]
): Promise<void> {
  try {
    // Retrive quiz
    const quizClient = await Quiz.findOne({ type: 2 })
      .session(session)
      .read("primary");

    // Check if quiz exists
    if (!quizClient) {
      throw new Error("Quiz Client Evaluation not found");
    }

    const clientEvaluation = {
      type: 2,
      quiz_assigned: quizClient._id,
      title: "Client Evaluation",
      description: "Evaluation for the project team performance",
      start_at: new Date("2024-09-01T08:00:00Z"),
      ended_at: new Date("2024-09-15T17:00:00Z"),
      public: true,
      items_assigned: quizClient.items,
      shuffle: { questions: false, options: false },
      isBackNavigationAllowed: true,
      isPublicForReview: true,
      maxQuestionLimitPerPage: 0,
      batch: batch._id as Types.ObjectId,
      batch_assign_all: true,
      endedAndMarked: true
    } as IAssessment;

    const assessment_created = await Assessment.insertMany(clientEvaluation, {
      session,
    });

    // Retrieve the client data
    const projectIds = groups.map((group) => group.project);
    const clients = await Client.find({ project: { $in: projectIds } }).select({ _id: 1, project: 1 } as { [k in keyof Partial<IClient>]: 1 }).session(session).read(mongoose.mongo.ReadPreference.PRIMARY).lean();

    // Check if client exists
    if (clients.length === 0) {
      throw new Error("Clients not found");
    }

    // Prepare Client Evaluation Result data
    const questions = await getQuestions(clientEvaluation.items_assigned, session);
    const responses = await genCompletedResponses(questions);

    const clientEvaluationResults = [];

    for (const client of clients) {
      const startedAt = getRandomStartEndDate(clientEvaluation.start_at, clientEvaluation.ended_at);
      let clientEvaluationResult: Partial<IAssessmentResult> = {
        evaluator: {
          type: 2,
          evaluator_id: client._id,
          access_code: crypto.randomUUID()
        },
        evaluatee: groups.find((group) => group.project!.equals(client.project))!._id as string,
        assessment: assessment_created[0]._id as Types.ObjectId,
        completed: true,
        pages: await genCompletedPages(questions, responses, clientEvaluation),
        startedAt: startedAt,
        endedAt: getRandomStartEndDate(startedAt, clientEvaluation.ended_at),
      };

      clientEvaluationResults.push(clientEvaluationResult);
    }

    await AssessmentResult.insertMany(clientEvaluationResults, { session });

    console.log("Client Evaluation created : Done!");
  } catch (e) {
    // Customize error message
    let customErrorMessage = `
      Error during Assessments migration:
      - Reason: Failed to insert assessment data into the database.
    `;

    if (e instanceof Error) {
      customErrorMessage += `
        - Original Error: ${e.message}
        - Stack Trace: ${e.stack}
      `;
    } else {
      customErrorMessage += `
        - Original Error: ${String(e)}
      `;
    }

    throw new Error(customErrorMessage); // Rethrow with customized message
  }
}
