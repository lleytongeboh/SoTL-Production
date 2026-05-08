import { AuthRequest } from './../middlewares/authMiddleware';
import Group from '../models/Group';
import { Response } from "express";
import dotenv from 'dotenv';
import User from '../models/User';
import _ from 'lodash';
import mongoose, { Types } from 'mongoose';
import { successResponse } from '../utils/response';
import Student from '../models/Student';
import Project from '../models/Project';
import { UserRoles } from '../utils/enums/UserRoles';
import Sprint from '../models/Sprint';
import ToDoList from '../models/ToDoList';
import TaskContent from '../models/TaskContent';
import fs from 'fs';
import Comment from '../models/Comment';

dotenv.config();

// # Student
export const checkGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { batch } = req.params;
        const group = await Group.findOne({ batch: batch, team_members: { $elemMatch: { student_id: req.user!.userId } } });
        if (!group) {
            res.json(successResponse(null, "User not in any group"));
        } else {
            const teamMembers = _.map(group.team_members, (member) => ({ "student_id": member.student_id.toString(), "group_role": member.group_role, "project_role": member.project_role }));
            const users = await Student.find({ _id: { $in: _.map(group.team_members, 'student_id') } });
            const pickedUsers = _.map(users, (user) => ({ "student_id": (user._id as any).toString(), "name": user.name, "email": user.email, "matric": user.matricNumber }));
            const result = _.map(teamMembers, (member) => {
                const user = _.find(pickedUsers, { student_id: member.student_id });
                return { ...member, ...user };
            });
            res.json(successResponse({ _id: group._id, name: group.name, description: group.description, team_members: result, project: group.project, batch: group.batch }, "Group fetched successfully"));
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student, Lecturer
export const getGroupList = async (req: AuthRequest, res: Response) => {
    const transformTeamMemberData = async (student_ids: Types.ObjectId[], leaderId: Types.ObjectId) => {
        let leader: string = "";
        const members = await User.find({ _id: { $in: student_ids } });
        const newMember = _.map(members, (member) => {
            if (member._id == leaderId.toString()) { leader = member.name; }
            return _.pick(member, ['name', '_id']);
        });
        return [newMember, leader];
    }

    try {
        const { batch } = req.params;
        const groupList = await Group.find(req.user?.role === UserRoles.STUDENT ? { batch: batch } : {});
        const result = await Promise.all(groupList.map(async (group) => {
            const memberIds = _.map(group.team_members, 'student_id');
            const leaderId = _.find(group.team_members, { group_role: 'Leader' })!.student_id;
            const [newTeamMembers, leader] = await transformTeamMemberData(memberIds, leaderId);
            return {
                ...(_.pick(group, ['name', '_id', 'batch'])),
                team_members: newTeamMembers,
                leader
            }
        }));
        res.json(successResponse(result, "Group list fetched successfully"));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student
export const createGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, team_members, roles, batch } = req.body;
        team_members.unshift({ student_id: req.user!.userId, group_role: "Leader", project_role: roles });
        const newGroup = new Group({ name, description, team_members, batch }); // hardcoded batch, waiting for batch switching implementation
        const group = await newGroup.save();
        if (group) {
            const teamMembers = _.map(group.team_members, (member) => ({ "student_id": member.student_id.toString(), "group_role": member.group_role, "project_role": member.project_role }));
            const users = await Student.find({ _id: { $in: _.map(group.team_members, 'student_id') } });
            const pickedUsers = _.map(users, (user) => ({ "student_id": (user._id as any).toString(), "name": user.name, "email": user.email, "matric": user.matricNumber }));
            const result = _.map(teamMembers, (member) => {
                const user = _.find(pickedUsers, { student_id: member.student_id });
                return { ...member, ...user };
            });
            res.json(successResponse({ _id: group._id, name: group.name, description: group.description, team_members: result, project: group.project, batch: group.batch }, "Group created successfully"));
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student
export const joinGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { group_id } = req.params;
        const { roles } = req.body;
        const group = await Group.findById(group_id);
        if (!group) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }
        if (group.team_members.some((member) => member.student_id as any == req.user!.userId)) {
            res.status(500).json({ message: 'User already in group' });
            return;
        }
        group.team_members.push({ student_id: req.user!.userId as any, group_role: 'Member', project_role: roles });
        if (group.team_members.length > 7) {
            res.status(500).json({ message: 'Group is full' });
            return;
        }
        const newGroup = await group.save();
        if (newGroup) {
            const teamMembers = _.map(newGroup.team_members, (member) => ({ "student_id": member.student_id.toString(), "group_role": member.group_role, "project_role": member.project_role }));
            const users = await Student.find({ _id: { $in: _.map(newGroup.team_members, 'student_id') } });
            const pickedUsers = _.map(users, (user) => ({ "student_id": (user._id as any).toString(), "name": user.name, "email": user.email, "matric": user.matricNumber }));
            const result = _.map(teamMembers, (member) => {
                const user = _.find(pickedUsers, { student_id: member.student_id });
                return { ...member, ...user };
            });
            res.json(successResponse({ _id: newGroup._id, name: newGroup.name, description: newGroup.description, team_members: result, project: newGroup.project, batch: newGroup.batch }, "Group joined successfully"));
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student
const editProjectRole = async (req: AuthRequest, res: Response) => {
    try {
        const { group_id } = req.params;
        const { role } = req.body;
        const group = await Group.findById(group_id);
        if (!group) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }
        group.team_members.find((member) => member.student_id as any == req.user!.userId)!.project_role = role;
        res.json(successResponse(await group.save(), 'Project role updated successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student
const leaveGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { group_id } = req.params;
        const user = Student.findById(req.user!.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const group = await Group.findById(group_id);
        if (!group) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }
        const isLeader = group.team_members.find((member) => member.student_id as any == req.user!.userId)!.group_role == 'Leader';
        group.team_members = group.team_members.filter((member) => member.student_id as any != req.user!.userId);
        if (group.team_members.length == 0) {
            if (group.project) {
                await Project.findByIdAndDelete(group.project);
            }
            await deleteGroupHelper(Types.ObjectId.createFromHexString(group_id));
            await group.deleteOne();
            res.json(successResponse(true, 'Group left successfully'));
            return;
        }
        if (isLeader) {
            const newLeader = group.team_members[0];
            newLeader.group_role = 'Leader';
        }
        res.json(successResponse(await group.save(), 'Group left successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Lecturer
const deleteGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { group_id } = req.params;
        const group = await Group.findById(group_id);
        if (!group) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }
        await deleteGroupHelper(Types.ObjectId.createFromHexString(group_id));
        await group.deleteOne();
        res.json(successResponse(true, 'Group deleted successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Lecturer
const getGroup = async (req: AuthRequest, res: Response) => {
    const getMemberName = async (studentId: Types.ObjectId) => {
        const student = await Student.findById(studentId);
        return student?.name ?? "Unknown Student";
    };

    try {
        const { group_id } = req.params;
        const group = await Group.findById(group_id);
        if (!group) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }
        const teamMembers = await Promise.all(_.map(group.team_members, async (member) => {
            const name = await getMemberName(member.student_id);
            return { ..._.pick(member, ['group_role', 'project_role', 'student_id']), name };
        }));
        res.json(successResponse({ ..._.pick(group, ['_id', 'name', 'description', 'batch', 'project']), team_members: teamMembers }, 'Group fetched successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student, Lecturer
const editGroup = async (req: AuthRequest, res: Response) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction({ readPreference: 'primary' });

        const { group_id } = req.params;
        const { name, description, team_members } = req.body;
        const teamLeader = (team_members as any[]).find((member: any) => member.group_role === 'Leader');
        const group = await Group.findById(group_id, null, { session });
        if (!group) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }
        if (group.team_members.length == 0) {
            if (group.project) {
                await Project.findByIdAndDelete(group.project, { session });
            }
            await deleteGroupHelper(Types.ObjectId.createFromHexString(group_id), session);
            await group.deleteOne({ session });
            res.json(successResponse(true, 'Group left successfully'));
            return;
        }
        if (teamLeader === undefined) {
            team_members[0].group_role = 'Leader';
        }
        const removedMember = group.team_members.filter((member) => !team_members.some((newMember: any) => newMember.student_id == member.student_id));

        if (group.project != undefined) await Promise.all(removedMember.map(async (member) => await deleteSpecificMemberTodoItem(group.project!, member.student_id, session)));

        group.name = name;
        group.description = description;
        group.team_members = team_members;

        await group.save({ session });

        await session.commitTransaction();

        res.json(successResponse(group, 'Group updated successfully'));
    } catch (error: any) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
};

// # Lecturer
const getMembersMark = async (req: AuthRequest, res: Response) => {
    const defaultMark = [
        {
            type: 1,
            mark_value: 0
        },
        {
            type: 2,
            mark_value: 0
        },
        {
            type: 3,
            mark_value: 0
        }
    ];
    try {
        const { group_id } = req.params;
        const group = await Group.findById(group_id);
        if (!group) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }
        const students = _.map(group.team_members, 'student_id');
        const marks = (await Student.find({ _id: { $in: students } })).reduce((acc, student) => {
            const markItems = student.mark.find(e => e.batch === group.batch);
            const exist = (!!markItems && !!markItems?.mark_items && markItems?.mark_items.length > 0);
            return { ...acc, [student._id as string]: { marked: exist, items: exist ? markItems.mark_items : defaultMark } };
        }, {});
        res.json(successResponse(marks, 'Members mark fetched successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Lecturer
const markStudent = async (req: AuthRequest, res: Response) => {
    try {
        const { student_id } = req.params;
        const { mark_items, batch } = req.body;
        const student = await Student.findById(student_id);
        if (!student) {
            res.status(404).json({ message: 'Student not found' });
            return;
        }
        const markIndex = student.mark.findIndex(e => e.batch === batch);
        if (markIndex === -1) {
            student.mark.push({ batch, mark_items });
        } else {
            student.mark[markIndex].mark_items = mark_items;
        }
        const result = await student.save();
        res.json(successResponse(!!result, 'Student marked successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};


// Helper functions
const deleteGroupHelper = async (group_id: Types.ObjectId, session?: mongoose.ClientSession) => {
    try {
        const group = await Group.findById(group_id, null, { session });
        if (!group) {
            throw new Error('Group not found');
        }
        if (group.project) {
            const project = await Project.findById(group.project, null, { session });
            if (project) {
                const todos = project.to_do_list ?? [];
                const sprints = project.sprint_list ?? [];
                const deliverables = project.deliverables ?? [];
                await Promise.all(sprints.map(async i => await deleteTodoItem('Sprint', i, session)));
                await Promise.all(todos.map(async i => await deleteTodoItem('Todo', i, session)));
                for (let i of deliverables) {
                    if (fs.existsSync(i.file_path_uri)) {
                        fs.unlinkSync(i.file_path_uri);
                    }
                }
                await project.deleteOne();
            }
        };
        await group.deleteOne({ session });
        return true;
    } catch (error: any) {
        throw error;
    }
};

const deleteTodoItem = async (type: string, id: Types.ObjectId, session?: mongoose.ClientSession) => {
    try {
        let taskContentId;
        switch (type) {
            case 'Sprint':
                const sprint = await Sprint.findById(id, null, { session });
                if (!sprint) {
                    throw new Error('Sprint not found');
                }
                const todos = sprint.to_do_list;
                await Promise.all(todos.map(async i => await deleteTodoItem('Todo', i, session)));
                taskContentId = sprint.task_content;
                await sprint.deleteOne({ session });
                break;
            case 'Todo':
                const todo = await ToDoList.findById(id, null, { session });
                if (!todo) {
                    throw new Error('Todo not found');
                }
                const tasks = todo.tasks;
                await Promise.all(tasks.map(async i => await deleteTodoItem('Task', i, session)));
                taskContentId = todo.task_content;
                await todo.deleteOne({ session });
                break;
            case 'Task':
                taskContentId = id;
                break;
            default:
                throw new Error('Invalid type');
        }
        const taskContent = await TaskContent.findById(taskContentId, null, { session });
        if (!taskContent) {
            throw new Error('Task content not found');
        }
        await Comment.deleteMany({ _id: { $in: taskContent.comments ?? [] } }, { session });
        await TaskContent.deleteOne({ _id: taskContentId }, { session });
        return true;
    } catch (error: any) {
        throw error;
    }
}

const deleteSpecificMemberTodoItem = async (project_id: Types.ObjectId, memberId: Types.ObjectId, session?: mongoose.ClientSession) => {
    try {
        const project = await Project.findById(project_id, null, { session });
        if (!project) {
            throw new Error('Project not found');
        }

        const remainingTodos = await deleteSpecificMemberTodos(project.to_do_list ?? [], memberId, session);
        const remainingSprints = await (project.sprint_list ?? []).reduce<Promise<Types.ObjectId[]>>(async (sprintsPromise, i) => {
            const sprintsAcc = await sprintsPromise;
            const sprint = await Sprint.findById(i, null, { session });

            if (!sprint) {
                throw new Error('Sprint not found');
            }

            const content = await TaskContent.findById(sprint?.task_content, null, { session });

            if (!content) {
                throw new Error('Task content not found');
            }

            if (content.creator.equals(memberId) || content.assignee?.equals(memberId)) {
                await deleteTodoItem('Sprint', i, session);
                return sprintsAcc;
            }

            const remainingSprintTodos = await deleteSpecificMemberTodos(sprint.to_do_list, memberId, session);

            sprint.to_do_list = remainingSprintTodos;

            await sprint.save({ session });

            return [...sprintsAcc, i];
        }, Promise.resolve([]));

        project.to_do_list = remainingTodos;
        project.sprint_list = remainingSprints;

        await project.save({ session });
    } catch (error: any) {
        throw error;
    }
};

const deleteSpecificMemberTodos = async (todos: Types.ObjectId[], memberId: Types.ObjectId, session?: mongoose.ClientSession) => {
    return await todos.reduce<Promise<Types.ObjectId[]>>(async (todosPromise, i) => {
        const todosAcc = await todosPromise;
        const todo = await ToDoList.findById(i, null, { session });

        if (!todo) {
            throw new Error('Todo not found');
        }

        const content = await TaskContent.findById(todo.task_content, null, { session });

        if (!content) {
            throw new Error('Task content not found');
        }

        if (content.creator.equals(memberId) || content.assignee?.equals(memberId)) {
            await deleteTodoItem('Todo', i, session);
            return todosAcc;
        }

        const remainingComment = await deleteSpecificMemberComment(content.comments ?? [], memberId, session);
        const remainingTasks = await deleteSpecificMemberTasks(todo.tasks, memberId, session);

        content.comments = remainingComment;
        todo.tasks = remainingTasks;

        await content.save({ session });
        await todo.save({ session });

        return [...todosAcc, i];
    }, Promise.resolve([]));
};

const deleteSpecificMemberTasks = async (tasks: Types.ObjectId[], memberId: Types.ObjectId, session?: mongoose.ClientSession) => {
    return await tasks.reduce<Promise<Types.ObjectId[]>>(async (tasksPromise, i) => {
        const tasksAcc = await tasksPromise;
        const content = await TaskContent.findById(i, null, { session });

        if (!content) {
            throw new Error('Task content not found');
        }

        if (content.creator.equals(memberId) || content.assignee?.equals(memberId)) {
            await deleteTodoItem('Task', i, session);
            return tasksAcc;
        }

        const remainingComment = await deleteSpecificMemberComment(content.comments ?? [], memberId, session);

        content.comments = remainingComment;

        await content.save({ session });
        return [...tasksAcc, i];
    }, Promise.resolve([]));
};

const deleteSpecificMemberComment = async (comments: Types.ObjectId[], memberId: Types.ObjectId, session?: mongoose.ClientSession) => {
    return await comments.reduce<Promise<Types.ObjectId[]>>(async (commentsPromise, i) => {
        const commentsAcc = await commentsPromise;
        const comment = await Comment.findById(i, null, { session });

        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.user.equals(memberId)) {
            await comment.deleteOne({ session });
            return commentsAcc;
        }

        return [...commentsAcc, i];
    }, Promise.resolve([]));
};

export default {
    checkGroup,
    getGroupList,
    createGroup,
    joinGroup,
    editProjectRole,
    leaveGroup,
    deleteGroup,
    getGroup,
    editGroup,
    getMembersMark,
    markStudent,
};
