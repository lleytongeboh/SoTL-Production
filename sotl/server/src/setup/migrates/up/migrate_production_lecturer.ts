import Lecturer from '../../../models/Lecturer';
import { ClientSession } from 'mongoose';
import { hashPassword } from '../../../utils';

export async function migrateProductionLecturer(session: ClientSession): Promise<void> {
  try {
    const plainPassword = '123456789';
    
     // Hash passwords asynchronously
     const hashedPassword = await hashPassword(plainPassword);
    // Load lecturer data from JSON file
    const lecturers = [
      {
        email: 'jnurfauza@gmail.com',
        name: 'TS Nurfauza Jali',
        designation: 'Senior Lecturer',
        company: 'University Malaysia Sarawak',
        role: 'lecturer',
        password: hashedPassword,
        created_at: new Date(),
      }
    ];

    // Inserting Lecturers
    await Lecturer.insertMany(lecturers, { session});
    console.log('Lecturers created : Done!');
  } catch (e: unknown) {
    // Customize error message
    const customErrorMessage = `
      Error during Lecturers migration:
      - Reason: Failed to insert lecturer data into the database.
      - Original Error: ${(e as Error).message}
      - Stack Trace: ${(e as Error).stack}
    `;

    throw new Error(customErrorMessage); // Rethrow with customized message
  }
}