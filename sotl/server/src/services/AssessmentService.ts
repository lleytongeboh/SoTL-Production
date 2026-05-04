import mongoose from "mongoose";
import Assessment from "../models/Assessment";
import Category from "../models/Category";

namespace AssessmentService {
  export const isHaveAssessment = async (userId: mongoose.Types.ObjectId) => {
    try {
      const assessments = await Assessment.find({
        $or: [{ students_assigned: userId }, { students_excluded: userId }],
      });

      return assessments.length > 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const removeUserFromAssessment = async (
    userId: mongoose.Types.ObjectId,
    batch: string,
    session: mongoose.ClientSession
  ) => {
    try {
      const batchId = await Category.findOne({ name: batch })
        .session(session)
        .read("primary");

      const assessments = await Assessment.updateMany(
        {
          batch: batchId, // Match the batch ID
          $or: [{ students_assigned: userId }, { students_excluded: userId }],
        },
        {
          $pull: {
            students_assigned: userId,
            students_excluded: userId,
          },
        }
      );

      console.log("Assessments updated:", assessments);

      return assessments.acknowledged;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const getAssessmentByBatch = async (batch: string, session: mongoose.ClientSession) => {
    try {
      const batchGet = await Category.findOne({ name: batch }).session(session).read("primary");
      if (!batchGet) {
        return null;
      }

      const assessments = await Assessment.find({
        batch: batchGet._id,
      }).session(session).read("primary");

      return assessments;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}

export { AssessmentService };
