import mongoose, { ClientSession } from 'mongoose';
import Category from '../../../models/Category'; // Adjust path as needed
import Student from '../../../models/Student'; // Adjust path as needed

// Migration function to insert Deliverables data
export async function migrateCategory(session: ClientSession): Promise<void> {
  try {
    // Get Student from batch 24/25
    const studentsBatch24_25 = await Student.find(
      { batch: { $elemMatch: { batch: '24/25' } } },
      "_id",
      { session }
    ).read("primary");

    // Get Student from batch 25/26
    const studentsBatch25_26 = await Student.find(
      { batch: { $elemMatch: { batch: '25/26' } } },
      "_id",
      { session }
    ).read("primary");

    // Get student from batch 24/25 and 25/26
    const studentsMultipleBatches = await Student.find(
        { 
          batch: { 
            $all: [
              { $elemMatch: { batch: '24/25' } },
              { $elemMatch: { batch: '25/26' } }
            ]
          } 
        },
        "_id",
        { session }
      ).read("primary");

    // Insert the categories into the database within the session
    await Category.insertMany([
        { name: '24/25', belonged: studentsBatch24_25, type: 0, visibleMark: false },
        { name: '25/26', belonged: studentsBatch25_26, type: 0, visibleMark: false },
        { name: '24/25 & 25/26', belonged: studentsMultipleBatches, type: 1, visibleMark: false }
        ], { session });


    console.log('Category migration: Done!');
  } catch (error) {
    let errorMessage = `
      Error during Category migration:
      - Reason: Failed to insert category data into the database.
    `;
    if (error instanceof Error) {
      errorMessage += `
        - Original Error: ${error.message}
        - Stack Trace: ${error.stack}
      `;
    } else {
      errorMessage += `- Error: ${String(error)}`;
    }
    throw new Error(errorMessage);
  }
}