import Student from "../../../models/Student";
import { ClientSession } from "mongoose";
import { hashPassword } from "../../../utils"
import { login } from "@/controllers/authController";
// import fs from 'fs';
// import path from 'path';

export async function migrateStudentsWithoutGroup(session: ClientSession): Promise<void> {
  try {
    const plainPassword = '123456789';
    
     // Hash passwords asynchronously
     const hashedPassword = await hashPassword(plainPassword);
    // Load student data from JSON file
    //const students = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/students.json'), 'utf-8'));
    const students = [
      {
        email: "student11aaa@example.com",
        name: "Family Guy",
        matricNumber: "18181",
        batch: [{ batch: "23/24" }, { batch: "24/25" }],
        loginAsBatch: "23/24",
        point: 85,
        role: "student",
        password: hashedPassword, // Replace hashedPassword with the actual hashed password
        created_at: new Date(),
      },
      {
        email: "student12aaa@example.com",
        name: "John Good",
        matricNumber: "98985",
        batch: [{ batch: "23/24" }, { batch: "24/25" }],
        loginAsBatch: "23/24",
        point: 85,
        role: "student",
        password: hashedPassword, // Replace hashedPassword with the actual hashed password
        created_at: new Date(),
      }
    ];    

    // Inserting Students
    await Student.insertMany(students, { session });
    console.log("Students without group created : Done!");
  } catch (e) {
    // Customize error message
    let customErrorMessage = `
      Error during Students without ground migration:
      - Reason: Failed to insert student data into the database.
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
