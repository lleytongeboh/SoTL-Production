import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from 'mongoose';

dotenv.config();

const generateToken = (userId: mongoose.Types.ObjectId, role: string) => {
  const secretKey = process.env.JWT_SECRET;

  console.log("secretKey: ",secretKey)
  if (!secretKey) {
    throw new Error("[Msg]JWT_SECRET is not defined");
  }

  return jwt.sign({ userId, role }, secretKey, { expiresIn: "1d" });
};

export default generateToken;
