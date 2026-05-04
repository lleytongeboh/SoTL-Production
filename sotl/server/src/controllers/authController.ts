import { Request, Response } from "express";
import User from "../models/User";
import * as UserManagementService from "../services/UserManagementService";
import * as AuthService from "../services/AuthService";
import * as EmailService from "../services/EmailService";
import generateToken from "../utils/generateToken";
import mongoose from "mongoose";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { AuthRequest } from "../middlewares/authMiddleware";
import { successResponse, errorResponse } from "../utils/response";
import { UserRoles } from "../utils/enums/UserRoles";
import { generateOtp } from "../utils/generateOtp";
import { mainQueue } from "../queue/QueueManager";
import { hashPassword } from "../utils/methods/password_hashing";

dotenv.config();

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    let userIdentity = null;

    if (!user) {
      throw new Error("[Msg]Invalid email.");
    }

    const encryptionKey = process.env.ENCRYPTION_KEY as string;
    if (!encryptionKey) {
      throw new Error("[Msg]ENCRYPTION_KEY is not defined");
    }
    const bytes = CryptoJS.AES.decrypt(
      password,
      process.env.ENCRYPTION_KEY as string
    );
    const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);

    const isMatch = await bcrypt.compare(decryptedPassword, user.password);

    if (!isMatch) throw new Error("[Msg]Invalid password");

    // Get Identity
    switch (user.role) {
      case UserRoles.STUDENT:
        // Do something for students
        const result = await UserManagementService.getStudentIdentity(
          String(user._id)
        );
        userIdentity = result;
        break;
      case UserRoles.LECTURER:
        // Do something for lecturers
        const response = await UserManagementService.getLecturerIdentity(
          user._id as mongoose.Types.ObjectId
        );
        userIdentity = response;
        break;
      default:
        // Do something for other roles
        break;
    }

    const token = generateToken(user._id as mongoose.Types.ObjectId, user.role);

    user.lastLogin = new Date();
    await user.save();

    res.json(
      successResponse(
        {
          token,
          role: user.role,
          identity: userIdentity,
        },
        "Login Successfully"
      )
    );
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

// Validate Token Controller
const validateTokenController = async (req: AuthRequest, res: Response) => {
  // If the request reaches this point, the token has already been validated by the middleware
  try {
    const userRole = req.user?.role; // Extract the role from the token
    const userId = req.user?.userId; // Extract the user ID from the token
    if (userId === undefined || userId === null) {
      throw new Error("User ID is missing from the token");
    }

    let userIdentity = null;
    switch (userRole) {
      case UserRoles.STUDENT:
        // Do something for students
        const result = await UserManagementService.getStudentIdentity(
          String(userId)
        );
        userIdentity = result;
        break;
      case UserRoles.LECTURER:
        // Do something for lecturers
        const response = await UserManagementService.getLecturerIdentity(
          userId
        );
        userIdentity = response;
        break;
      default:
        // Do something for other roles
        break;
    }

    res.status(200).json(
      successResponse(
        {
          role: userRole,
          identity: userIdentity, // Optionally send back the user's role
        },
        "Token is valid"
      )
    );
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

const sendUserOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("User not found");
    }

    const otp = generateOtp();
    await AuthService.storeOtp(String(user._id).toString(), otp);
    // Send OTP to user
    await mainQueue.add("sendOtpEmail", {
      jobType: "sendOtpEmail",
      data: {
        email: user.email,
        otp: otp,
      },
    });

    res.status(200).json(successResponse(true, "OTP sent successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("User not found");
    }

    const isOtpValid = await AuthService.verifyOtp(
      String(user._id).toString(),
      otp
    );

    if (!isOtpValid) {
      throw new Error("Invalid OTP");
    }

    res.status(200).json(successResponse(true, "OTP verified successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const changePassword = async (req: Request, res: Response) => {
  try {
    const { email, password, otp } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
      throw new Error("User not found");
    }

    const isOtpValid = await AuthService.verifyOtpPassword(
      String(user._id).toString(),
      otp
    );

    if (!isOtpValid) {
      throw new Error("Invalid OTP");
    }

    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    await user.save();

    res
      .status(200)
      .json(successResponse(true, "Password changed successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

export default {
  login,
  validateTokenController,
  sendUserOtp,
  verifyOtp,
  changePassword,
};
