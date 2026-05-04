import Student from "../../../models/Student";
import { ClientSession } from "mongoose";
import { hashPassword } from "../../../utils";

export async function migrateStudents(session: ClientSession): Promise<void> {
  try {
    const plainPassword = "123456789";

    // Hash passwords asynchronously
    const hashedPassword = await hashPassword(plainPassword);
    // Load student data from JSON file
    const studentData = [];
    for (let i = 0; i < 300; i++) {
      let t_batch = [{ batch: i < 150 ? "24/25" : "25/26" }];
      if (i % 2 === 0 && i < 150) t_batch.push({ batch: "25/26" });
      studentData.push({
        email: `student${i}@example.com`,
        name: `Student ${i}`,
        matricNumber: `S${i + 10000}`,
        batch: t_batch,
        loginAsBatch: i < 150 ? "24/25" : "25/26",
        point: 80 + i,
        role: "student",
        password: hashedPassword, // Replace hashedPassword with the actual hashed password
        created_at: new Date(),
      });
    }

    // Inserting Students
    await Student.insertMany(studentData, { session });
    console.log("Students created : Done!");
  } catch (e) {
    // Customize error message
    let customErrorMessage = `
      Error during Students migration:
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
