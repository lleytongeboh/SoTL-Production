import { Response, NextFunction } from "express";
import mongoose from 'mongoose';
import {AuthRequest} from '../middlewares/authMiddleware';
import { errorResponse } from "../utils/response";
import { GroupService } from "../services/GroupService";
import { TodoService } from "../services/TodoService";

export enum DocumentCheckString {
    PROJECT = 'project',
    GROUP = 'group',
    SPRINT = 'sprint',
    COMMENT = 'comment'
};

const forbiddenMiddleware = (documentCheck: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (req.user?.role === 'student') {
                switch (documentCheck) {
                    case DocumentCheckString.PROJECT:
                        const isVerified = await GroupService.isProjectBelongedToStudent(new mongoose.Types.ObjectId(req.params.project_id), req.user.userId);
                        if(!isVerified) {
                            throw new Error('You are unauthorized to perform this operation.');
                        }
                        break;
                    case DocumentCheckString.GROUP:
                        const isGroupVerified = await GroupService.isGroupBelongedToStudent(new mongoose.Types.ObjectId(req.params.group_id), req.user.userId);
                        if(!isGroupVerified) {
                            throw new Error('You are unauthorized to perform this operation.');
                        }
                        break;
                    case DocumentCheckString.SPRINT:
                        const isSprintVerified = await TodoService.isSprintBelongedToStudent(new mongoose.Types.ObjectId(req.params.sprint_id), req.user.userId);
                        if(!isSprintVerified) {
                            throw new Error('You are unauthorized to perform this operation.');
                        }
                        break;
                    case DocumentCheckString.COMMENT:
                        const isCommentVerified = await TodoService.isCommentBelongedToStudent(new mongoose.Types.ObjectId(req.params.comment_id), req.user.userId);
                        if(!isCommentVerified) {
                            console.log('isCommentVerified', isCommentVerified);
                            throw new Error('You are unauthorized to perform this operation.');
                        }
                        break;
                    default:
                        break;
                };
            }
            next();
        }catch (error:any) {
            res.status(401).json(errorResponse('You are unauthorized to perform this operation.', error.message));
        }   
    };
};

export default forbiddenMiddleware;