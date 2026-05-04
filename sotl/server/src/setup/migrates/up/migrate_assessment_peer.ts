import mongoose, { ClientSession, Types } from "mongoose"; // Import ClientSession from mongoose
import Assessment, { IAssessment } from "../../../models/Assessment"; // Import the Assessment model
import Quiz from "../../../models/Quiz"; // Import the Quiz model
import Student from "../../../models/Student"; // Import the Student model
import Category, { ICategory } from '../../../models/Category';
import AssessmentResult, { IAssessmentResult } from "../../../models/AssessmentResult"; // Import the AssessmentResult model
import Group, { IGroup } from "../../../models/Group";
import { getQuestions, genCompletedPages, genCompletedResponses, getRandomStartEndDate } from "./migrate_assessments";
import { AssessmentResultService } from "../../../services/AssessmentResultService";

// Define the migration function
export async function migrateAssessmentPeer(
  session: ClientSession,
  batch: ICategory,
  groups: IGroup[]
): Promise<void> {
  try {
    // Retrive quiz
    const quizPeerEvaluation = await Quiz.findOne({ type: 1 })
      .session(session)
      .read("primary");

    // Check if quiz exists
    if (!quizPeerEvaluation) {
      throw new Error("Quiz Peer Evaluation not found");
    }

    const peerEvaluation = {
      type: 1,
      quiz_assigned: quizPeerEvaluation._id,
      title: "Peer Evaluation",
      description: "Evaluation for the project team",
      start_at: new Date("2024-09-01T08:00:00Z"),
      ended_at: new Date("2024-09-15T17:00:00Z"),
      public: true,
      items_assigned: quizPeerEvaluation.items,
      shuffle: { questions: false, options: false },
      isBackNavigationAllowed: true,
      isPublicForReview: true,
      maxQuestionLimitPerPage: 0,
      batch: batch._id,
      batch_assign_all: true,
      endedAndMarked: true
    } as IAssessment;

    const assessment_created = await Assessment.insertMany(peerEvaluation, {
      session,
    });
    console.log("Peer Evaluation created : Done!");

    // Check if student exists
    if (groups.length === 0) {
      throw new Error("Groups not found");
    }

    // Prepare Student Evaluation Result response data
    const questions = await getQuestions(peerEvaluation.items_assigned, session);
    const responses = await genCompletedResponses(questions);

    const studentEvaluationResults = [];

    // Start from group
    for (const group of groups) {
      // Every member can evaluate every other member
      for (const member of group.team_members) {
        const startedAt = getRandomStartEndDate(peerEvaluation.start_at, peerEvaluation.ended_at);
        const endedAt = getRandomStartEndDate(startedAt, peerEvaluation.ended_at);
        for (const sameTeamMember of group.team_members) {
          if (member.student_id == sameTeamMember.student_id) continue; // Skip self evaluation
          
          let studentEvaluationResult: Partial<IAssessmentResult> = {
            evaluator: {
              type: 1,
              evaluator_id: member.student_id,
            },
            evaluatee: sameTeamMember.student_id,
            assessment: assessment_created[0]._id as Types.ObjectId,
            completed: true,
            pages: await genCompletedPages(questions, responses, peerEvaluation),
            startedAt: startedAt,
            endedAt: endedAt,
          };

          studentEvaluationResults.push(studentEvaluationResult);
        }
      }
    }

    await AssessmentResult.insertMany(studentEvaluationResults, { session });
    console.log("Peer Evaluation Result created : Done!");
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
