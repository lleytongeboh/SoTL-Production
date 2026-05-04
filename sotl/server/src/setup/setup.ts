import mongoose, { ClientSession } from "mongoose";
import connectDB from "../database";
import { migrateStudents } from "../setup/migrates/up/migrate_student";
import { migrateLecturers } from "../setup/migrates/up/migrate_lecturer";
import { migrateClients } from "../setup/migrates/up/migrate_client";
import { migrateToDoLists } from "../setup/migrates/up/migrate_todolist";
import { migrateProjects } from "../setup/migrates/up/migrate_project";
import { migrateGroups } from "../setup/migrates/up/migrate_group";
import { migrateQuizzes } from "../setup/migrates/up/migrate_quiz";
import { migrateAssessments } from "./migrates/up/migrate_assessments";
import { migrateNotification } from "./migrates/up/migrate_notification";
import { migrateDeliverables } from "./migrates/up/migrate_deliverable";
import { migrateStudentsWithoutGroup } from "./migrates/up/migrate_student_without_group";
import { migrateCategory } from "./migrates/up/migrate_category";
import { migrateBadges } from "./migrates/up/migrate_badge";

async function setupApp() {
  await connectDB(); // Ensure the database is connected

  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    // Migrate Students
    await migrateStudents(session);

    // Migrate Lecturers
    await migrateLecturers(session);

    // Migrate Deliverables
    await migrateDeliverables(session);

    // Migrate group
    await migrateGroups(session);

    // Migrate projects
    await migrateProjects(session);

    // Migrate Clients
    await migrateClients(session);

    // Migrate to_do_list
    await migrateToDoLists(session);

    // migrate quiz
    await migrateQuizzes(session);
    
    // migrate category
    await migrateCategory(session);

    // Migrate Students without group
    await migrateStudentsWithoutGroup(session);

    // migrate assessment for Client, Peer, and Individual
    await migrateAssessments(session);

    // migrate notification
    await migrateNotification(session);

    // Migrate Badges
    await migrateBadges(session);

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

setupApp();
