import mongoose, { ConnectOptions, mongo } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    // const mongoURI = process.env.MONGO_URI as string;
    const mongoURI: string = process.env.MONGO_URI as string;
    if (!mongoURI) {
      throw new Error("Mongo URI is not defined");
    }
    await mongoose.connect(mongoURI, {
      readPreference: 'secondaryPreferred', // Reads from secondary if possible
       dbName: 'sotl', // Database name
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;