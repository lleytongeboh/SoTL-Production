import { Response } from "express";
import dotenv from 'dotenv';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/authMiddleware';
import Project from "../models/Project";
import Group from "../models/Group";
import _ from 'lodash';
import Student from "../models/Student";
import { PROJECT_MARKING_SCHEME } from "../utils/constants";
import { MulterRequest } from "../middlewares/multerMiddleware";
import Deliverables from "../models/Deliverables";
import mime from 'mime-types';
import fs from 'fs';
import { updateProjectBadge } from "../services/GamificationService";
import { createNewNotification } from "../services/NotificationService";

dotenv.config();

// # Lecturer
const getProjectList = async (req: AuthRequest, res: Response) => {
    const checkStudentsMarked = async (studentIds: string[], batch: string) => {
        return await Promise.all(_.map(studentIds, async (studentId) => {
            const student = await Student.findById(studentId);
            const mark = student!.mark.find((mark) => mark.batch === batch);
            return mark && mark.mark_items && mark.mark_items.length > 0;
        }));
    };

    try {
        const markingScheme = PROJECT_MARKING_SCHEME;
        const projectList = await Project.find();
        const transformedProjects = await Promise.all(_.map(projectList, async (project) => {
            const group = await Group.findOne({ project: project._id });
            if (!group) {
                throw new Error('Group not found');
            }
            const overall_mark = _.reduce(project.mark_items, (sum, mark) => {
                const markItem = markingScheme.find((item) => item.deliverable_type === mark.deliverables_type);
                if (!markItem) {
                    throw new Error('Marking scheme not found');
                }
                return sum + (mark.overall_mark * markItem.weightage / markItem.total_mark);
            }, 0);
            const isMarked = (project.mark_items && project.mark_items.length > 0 && (await checkStudentsMarked(_.map(group!.team_members, e => e.student_id.toString()), group.batch)).every(e => e === true));
            return { ...project.toObject(), group_name: group!.name, group_id: group._id, batch: group!.batch, marked: isMarked, overall_mark };
        }));
        res.json(successResponse(transformedProjects, 'Project list fetched successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student
const checkProject = async (req: AuthRequest, res: Response) => {
    try {
        const { group_id } = req.params;
        const group = await Group.findById(group_id);
        if (!group) {
            res.status(404).json({ message: 'Group not found' });
            return;
        } else {
            const project = await Project.findById(group.project);
            if (!project) {
                res.json(successResponse(null, 'Project not found'));
                return;
            }
            res.json(successResponse(_.omit(project.toObject(), ['mark_items']), 'Project fetched successfully'));
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// # Student
const createProject = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, deliverables, mark_items, to_do_list, group_id } = req.body;
        const newProject = new Project({ title, description, deliverables, mark_items, to_do_list });
        const projectId = (await newProject.save())._id;
        await Group.findByIdAndUpdate(group_id, { project: projectId });
        res.json(successResponse(newProject, 'Project created successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student, Lecturer
const editProject = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id } = req.params;
        const { title, description, deliverables } = req.body;
        const project = await Project.findById(project_id);
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        project.title = title;
        project.description = description;
        project.deliverables = deliverables;
        res.json(successResponse(await project.save(), 'Project updated successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// # Lecturer
const getProject = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id } = req.params;
        const project = await Project.findById(project_id);
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        res.json(successResponse(project, 'Project fetched successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Lecturer
const markProject = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id } = req.params;
        const { mark_items } = req.body;
        const project = await Project.findById(project_id);
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        project.mark_items = mark_items;
        res.json(successResponse(await project.save(), 'Project marked successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student
const submitDeliverable = async (req: MulterRequest, res: Response) => {
    try {
        const { project_id, deliverable_id } = req.params;

        if (!req.file || !req.file_path_uri || !req.file_created_at) {
            return res.status(400).send('No file uploaded.');
        }

        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        };
        const group = await Group.findOne({ project: project_id });
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        };
        const deliverable = await Deliverables.findById(deliverable_id);
        if (!deliverable) {
            return res.status(404).json({ message: 'Deliverable not found' });
        };

        const newDeliverable = {
            name: req.file.originalname,
            file_path_uri: req.file_path_uri,
            created_at: req.file_created_at,
            status: 0,
            deliverable_id: deliverable_id as any
        };

        project.deliverables.push(newDeliverable);
        await project.save();
        if (deliverable.approve) {
            await createNewNotification({ message: `Group ${group.name} has submitted ${deliverable.name} that needed to be approved.`, type: "info" });
        }
        const newProject = await updateProjectBadge(project.id);
        res.json(successResponse(newProject, 'Deliverable submitted successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student, Lecturer
const downloadDeliverable = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id, deliverable_id } = req.params;
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        };
        const deliverable = project.deliverables.find((d) => d._id!.toString() === deliverable_id);
        if (!deliverable) {
            return res.status(404).json({ message: 'Deliverable not found' });
        };
        const contentType = mime.lookup(deliverable.file_path_uri);
        if (!contentType) {
            res.status(404).json({ message: 'File not found' });
        } else {
            res.setHeader('Content-Type', contentType)
            res.download(deliverable.file_path_uri, (err) => {
                if (err) {
                    res.status(500).json({ message: 'File not found' });
                }
            });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Lecturer
const updateDeliverableStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id, deliverable_id } = req.params;
        const { status, comment }: { status: number, comment: string } = req.body;
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        };
        const group = await Group.findOne({ project: project_id });
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        };
        const existingDeliverable = _.findLast(project.deliverables, d => d._id!.toString() == deliverable_id);
        if (existingDeliverable === undefined) {
            return res.status(404).json({ message: 'Deliverable not found' });
        }
        const deliverable = await Deliverables.findById(existingDeliverable.deliverable_id);
        if (!deliverable) {
            return res.status(404).json({ message: 'Deliverable not found' });
        };
        existingDeliverable.status = status;
        comment && (existingDeliverable.comment = comment);
        await project.save();
        await createNewNotification({ message: `Your ${deliverable.name} has been ${status === 1 ? "approved" : "rejected"}.`, type: "info", group: group.id });
        const newProject = await updateProjectBadge(project.id);
        res.json(successResponse(newProject, 'Deliverable status updated successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student, Lecturer
const deleteDeliverable = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id, deliverable_id } = req.params;
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        };
        const deliverable = project.deliverables.find((d) => d._id!.toString() === deliverable_id);
        if (!deliverable) {
            return res.status(404).json({ message: 'Deliverable not found' });
        };
        project.deliverables = project.deliverables.filter((d) => d._id!.toString() !== deliverable_id);
        if (fs.existsSync(deliverable.file_path_uri)) {
            fs.unlinkSync(deliverable.file_path_uri);
        }
        await project.save();
        const newProject = await updateProjectBadge(project.id);

        res.json(successResponse(newProject, 'Deliverable deleted successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export default {
    getProjectList,
    checkProject,
    createProject,
    editProject,
    getProject,
    markProject,
    submitDeliverable,
    downloadDeliverable,
    deleteDeliverable,
    updateDeliverableStatus,
}