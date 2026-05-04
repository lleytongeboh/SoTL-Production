import { Response } from "express";
import Student from "../models/Student";
import Lecturer from "../models/Lecturer";
import { isValidObjectId } from "mongoose";
import * as UserManagementService from "../services/UserManagementService";
import { successResponse, errorResponse } from "../utils/response";
import { AuthRequest } from "../middlewares/authMiddleware";

const updateStudentProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, matric } = req.body;
        const studentId = req.user?.userId;
        if (!isValidObjectId(studentId)) {
            throw new Error("Invalid student id");
        }

        const student = await Student.findById(studentId);
        if (!student) {
            throw new Error("Student not found");
        }

        if(name !== undefined) student.name = name;
        if(email !== undefined) student.email = email;
        if(matric !== undefined) student.matricNumber = matric;

        if(name !== undefined || email !== undefined || matric !== undefined) {
            await student.save();
        }

        res.status(200).json(successResponse(true, "Student profile updated successfully"));
    } catch (error: any) {
        res.status(500).json(errorResponse(error.message));
    }
};

const updateLecturerProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, designation, company } = req.body;
        const lecturerId = req.user?.userId;
        if (!isValidObjectId(lecturerId)) {
            throw new Error("Invalid lecturer id");
        }

        const lecturer = await Lecturer.findById(lecturerId);
        if (!lecturer) {
           throw new Error("Lecturer not found");
        }

        if(name !== undefined) lecturer.name = name;
        if(email !== undefined) lecturer.email = email;
        if(designation !== undefined) lecturer.designation = designation;
        if(company !== undefined) lecturer.company = company;

        if(name !== undefined || email !== undefined || designation !== undefined || company !== undefined) {
            await lecturer.save();
        }

        res.status(200).json(successResponse(true, "Lecturer profile updated successfully"));
    } catch (error: any) {
        res.status(500).json(errorResponse(error.message));
    }
};

const getStudentProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { studentId } = req.params;

        if (!isValidObjectId(studentId)) {
            throw new Error("Invalid student id");
        }

        const studentProfile = await UserManagementService.getStudentIdentity(studentId);

        res.status(200).json(successResponse(studentProfile, "Student profile retrieved successfully"));
    } catch (error: any) {
        res.status(500).json(errorResponse(error.message));
    }
};

const changeLoginAsBatch = async (req: AuthRequest, res: Response) => {
    try {
        const { batch } = req.body;
        const studentId = req.user?.userId;
        if (!isValidObjectId(studentId)) {
            throw new Error("Invalid student id");
        }

        const student = await Student.findById(studentId);
        if (!student) {
            throw new Error("Student not found");
        }

        student.loginAsBatch = batch;
        await student.save();

        res.status(200).json(successResponse(true, "Student batch updated successfully"));
    } catch (error: any) {
        res.status(500).json(errorResponse(error.message));
    }
};

export default {
    updateStudentProfile,
    updateLecturerProfile,
    getStudentProfile,
    changeLoginAsBatch
};