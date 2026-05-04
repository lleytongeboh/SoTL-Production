import mongoose, { ClientSession } from 'mongoose';
import Deliverables from '../../../models/Deliverables'; // Adjust path as needed

// Define the data to migrate
const deliverablesData = [
  { name: 'Proposal', batch: '24/25', approve: true, isPublic: false },
  { name: 'Proposal Revised', batch: '24/25', approve: true, isPublic: false },
  { name: 'SRS', batch: '24/25', approve: true, isPublic: true },
  { name: 'SRS Revised', batch: '24/25', approve: true, isPublic: true },
  { name: 'SDS', batch: '24/25', approve: false, isPublic: true },
  { name: 'User Manual', batch: '24/25', approve: false, isPublic: true },
  { name: 'Github Link', batch: '24/25', approve: false, isPublic: true },
  { name: 'Proposal', batch: '25/26', approve: true, isPublic: false },
  { name: 'Proposal Revised', batch: '25/26', approve: true, isPublic: false },
  { name: 'SRS', batch: '25/26', approve: true, isPublic: true },
  { name: 'SRS Revised', batch: '25/26', approve: true, isPublic: true },
  { name: 'SDS', batch: '25/26', approve: false, isPublic: true },
  { name: 'User Manual', batch: '25/26', approve: false, isPublic: true },
  { name: 'Github Link', batch: '25/26', approve: false, isPublic: true }
];

// Migration function to insert Deliverables data
export async function migrateDeliverables(session: ClientSession): Promise<void> {
  try {
    // Insert the deliverables into the database within the session
    const insertedDeliverables = await Deliverables.insertMany(
      deliverablesData.map((item) => ({
        ...item,
        start_at: new Date(),
        end_at: new Date(), // Adjust as needed
      })),
      { session }
    );

    console.log('Deliverables migration: Done!');
  } catch (error) {
    let errorMessage = `
      Error during Deliverables migration:
      - Reason: Failed to insert deliverables data into the database.
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