import mongoose from "mongoose";
import Category from "../models/Category";

namespace CategoryService {
  export const removeStudentFromCategory = async (studentId: mongoose.Types.ObjectId, batch: string, session: mongoose.ClientSession) => {
    try {
        const studentRemoveFromCategory = await Category.updateOne(
            { "name": batch },
            { $pull: { belonged: studentId } }
            ).session(session);

        console.log('category:', studentRemoveFromCategory);
        return studentRemoveFromCategory.acknowledged;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const getBatchIdByName = async (batchName: string) => {
    try {
      const batch = await Category.findOne({ name: batchName });
      return batch?._id;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };
}

export { CategoryService };
