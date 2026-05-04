import mongoose from "mongoose";
import Deliverable from "../models/Deliverables";

namespace DeliverableService {
  export const updateBatchNameOnDeliverable = async (
    oldBatchName: string,
    newBatchName: string,
    session: mongoose.ClientSession
  ) => {
    try {
      await Deliverable.updateMany(
        { batch: oldBatchName },
        { $set: { batch: newBatchName } },
        { session }
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  };
}

export { DeliverableService };
