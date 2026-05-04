import mongoose, { ClientSession } from "mongoose";
import connectDB from "../database";
import { migrateProductionLecturer } from "../setup/migrates/up/migrate_production_lecturer";
import { migrateQuizzes } from "../setup/migrates/up/migrate_quiz";

async function productionSetup() {
  await connectDB(); // Ensure the database is connected

  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    // Migrate Lecturer
    await migrateProductionLecturer(session);

     // migrate quiz
    await migrateQuizzes(session);
        

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    console.log("🥳 Setup completed : Success!");
    await mongoose.connection.close();
    process.exit();
  } catch (e: unknown) {
    // Abort the transaction on error
    await session.abortTransaction();
    session.endSession();

    console.log("\n🚫 Error! The Error info is below");
    console.error(e);
    await mongoose.connection.close();
    process.exit(1);
  }
}

productionSetup();