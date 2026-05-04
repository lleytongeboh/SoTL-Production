import { QuestionModel } from "../../../models/QuizItem"; // Import the Question model
import Quiz from "../../../models/Quiz"; // Import the Quiz model
import { ClientSession } from "mongoose"; // Import ClientSession from mongoose
import fs from "fs";
import path from "path";

// Define the migration function
export async function migrateQuizzes(session: ClientSession): Promise<void> {
  try {
    // Define the dummy quiz data
    const quizClient = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "./quiz/quiz_client.json"),
        "utf-8"
      )
    );

    const quizPeerEvaluation = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "./quiz/quiz_peer_evaluation.json"),
        "utf-8"
      )
    );

    const quizIndividualAssessment = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "./quiz/quiz_assessment.json"),
        "utf-8"
      )
    );

    // Insert the question data into the database
    let items = await QuestionModel.insertMany(quizClient.items, { session });
    quizClient.items = items.map((quizItem) => quizItem._id);
    console.log("Questions created for client evaluation: Done!");

    items = await QuestionModel.insertMany(quizPeerEvaluation.items, { session });
    quizPeerEvaluation.items = items.map((quizItem) => quizItem._id);
    console.log("Questions created for peer evaluation: Done!");

    items = await QuestionModel.insertMany(quizIndividualAssessment.items, { session });
    quizIndividualAssessment.items = items.map((quizItem) => quizItem._id);
    console.log("Questions created for individual assessment: Done!");

    // Insert the quiz data into the database
    await Quiz.insertMany(quizClient, { session });
    console.log("Quizzes created for client evaluation: Done!");

    await Quiz.insertMany(quizPeerEvaluation, { session });
    console.log("Quizzes created for peer evaluation: Done!");

    await Quiz.insertMany(quizIndividualAssessment, { session });
    console.log("Quizzes created for individual assessment: Done!");

  } catch (e) {
    // Customize error message
    let customErrorMessage = `
      Error during Quizzes migration:
      - Reason: Failed to insert quiz data into the database.
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
