import mongoose from "mongoose";
import JobModel from "../models/Job";

namespace JobService {
  export const updateBatchNameOnJob = async (
    oldBatchName: string,
    newBatchName: string,
    session: mongoose.ClientSession
  ) => {
    try {
      await JobModel.updateMany(
        { batch: oldBatchName },
        { $set: { batch: newBatchName } },
        { session }
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  };
}

export { JobService };