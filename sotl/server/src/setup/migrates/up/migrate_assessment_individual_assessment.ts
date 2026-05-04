import mongoose, { ClientSession, Types } from "mongoose"; // Import ClientSession from mongoose
import Assessment, { IAssessment } from "../../../models/Assessment"; // Import the Assessment model
import Quiz from "../../../models/Quiz"; // Import the Quiz model
import Student from "../../../models/Student"; // Import the Student model
import Client from "../../../models/Client"; // Import the Client model
import Category, { ICategory } from '../../../models/Category';
import AssessmentResult, { IAssessmentResult } from "../../../models/AssessmentResult"; // Import the AssessmentResult model
import assert from 'node:assert';
import { getQuestions, genCompletedPages, genCompletedResponses, getRandomStartEndDate } from "./migrate_assessments";
import { AssessmentResultService } from "../../../services/AssessmentResultService";

// Define the migration function
export async function migrateAssessmentIndividual(
  session: ClientSession,
  batch: ICategory
): Promise<void> {
  try {
    // Retrive quiz
    const quizIndividualAssessment = await Quiz.findOne({
      title: "Flutter Quiz Assessment",
    })
      .session(session)
      .read("primary");

    // Check if quiz exists
    if (!quizIndividualAssessment) {
      throw new Error("Quiz Individual Assessment not found");
    }

    const studentEvaluation = {
      type: 0,
      quiz_assigned: quizIndividualAssessment._id as Types.ObjectId,
      title: "Individual Assessment",
      description: "Evaluation on Knowledge of Flutter Software Development Kit",
      start_at: new Date("2024-09-01T08:00:00Z"),
      ended_at: new Date("2024-11-15T17:00:00Z"),
      public: true,
      items_assigned:  quizIndividualAssessment.items,
      shuffle: {questions: true, options: true},
      isBackNavigationAllowed: false,
      isPublicForReview: true,
      maxQuestionLimitPerPage: 1,
      batch: batch._id,
      batch_assign_all: true,
      endedAndMarked: true
    } as IAssessment;

    const assessment_id = await Assessment.insertMany(studentEvaluation, {
      session,
    });

    // Retrieve the student data
    const students = batch.belonged;

    // Check if student exists
    if (!students) {
      throw new Error("Students not found");
    }

    // Prepare Client Evaluation Result data
    const questions = await getQuestions(studentEvaluation.items_assigned, session);
    const responses = await genCompletedResponses(questions);

    const studenttEvaluationResults = [];

    for (const student of students) {
      const startedAt = getRandomStartEndDate(studentEvaluation.start_at, studentEvaluation.ended_at);      
      let studentEvaluationResult: Partial<IAssessmentResult> = {
        evaluator: {
          type: 1,
          evaluator_id: student._id,
        },
        assessment: assessment_id[0]._id as Types.ObjectId,
        completed: true,
        pages: await genCompletedPages(questions, responses, studentEvaluation),
        startedAt: startedAt,
        endedAt: getRandomStartEndDate(startedAt, studentEvaluation.ended_at),
      };

      studenttEvaluationResults.push(studentEvaluationResult);
    }

    await AssessmentResult.insertMany(studenttEvaluationResults, { session });
    console.log("Individual Assessment Result created : Done!");
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
