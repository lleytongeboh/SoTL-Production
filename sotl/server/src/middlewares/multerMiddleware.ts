import multer from 'multer';
import { AuthRequest } from './authMiddleware';
import { NextFunction, Response } from 'express';
import Project from '../models/Project';
import Deliverables from '../models/Deliverables';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export interface MulterRequest extends AuthRequest {
    file_path_uri?: string;
    file_created_at?: Date;
};

const sanatizeFileName = (fileName: string) => {
    return fileName.replace(/[<>:"/\\|?*.]/g, '-');
};

const multerMiddleware = (fileSize?: number, customDestination?: string) => {
    return async (req: MulterRequest, res: Response, next: NextFunction) => {
        try {
            const { project_id, deliverable_id } = req.params;

            const project = await Project.findById(project_id);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }
            const deliverable = await Deliverables.findById(deliverable_id);
            if (!deliverable) {
                return res.status(404).json({ message: 'Deliverable not found' });
            }

            const des = customDestination ?? ('public/' + sanatizeFileName(deliverable.batch) + '/' + sanatizeFileName(project.title) + '/');
            fs.mkdirSync(des, { recursive: true });

            const createdTime = Date.now();

            req.file_created_at = new Date(createdTime);

            const storage = multer.diskStorage({
                destination: function (_, __, cb) {
                    cb(null, des);
                },
                filename: function (_, file, cb) {
                    const fileName = `${sanatizeFileName(deliverable.name)}-${createdTime}${path.extname(file.originalname)}`;
                    req.file_path_uri = des + fileName;
                    cb(null, fileName);
                }
            });

            const upload = multer({
                storage: storage,
                limits: { fileSize: fileSize ?? 20 * 1024 * 1024 },
                fileFilter: function (_, file, cb) {
                    console.log(file.mimetype, path.extname(file.originalname).toLowerCase());
                    const filetypes = /pdf|docx|doc|zip|rar|txt|text\/plain/;
                    const mimetype = filetypes.test(file.mimetype);
                    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

                    if (mimetype && extname) {
                        return cb(null, true);
                    } else {
                        cb(new Error('Only pdf, docx, doc, zip, rar, and txt files are allowed!'));
                    }
                }
            });
            upload.single('file')(req, res, (err) => {
                if (err) {
                    return res.status(400).json({ message: 'File upload failed', error: err.message });
                }
                next();
            });

        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    };
};

export default multerMiddleware;