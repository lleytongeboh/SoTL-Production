import { AuthRequest } from '../middlewares/authMiddleware';
import { Response } from 'express';
import * as dotenv from 'dotenv';
import { errorResponse, successResponse } from '../utils/response';
import Project from '../models/Project';
import ToDoList from '../models/ToDoList';
import TaskContent, { ITaskContent } from '../models/TaskContent';
import Sprint from '../models/Sprint';
import Student from '../models/Student';
import _ from 'lodash';
import mongoose from 'mongoose';
import Comment from '../models/Comment';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

dotenv.config();

// # Student
const getTodosAndSprint = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id } = req.params;
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        };
        const sprintList = await Sprint.find({ _id: { $in: project.sprint_list } });
        const sprintContent = await TaskContent.find({ _id: { $in: sprintList.map((item) => item.task_content) } });
        const sprintDatas = await Promise.all(sprintList.map(async (item) => {
            const content = sprintContent.find((content) => content._id == item.task_content.toString());
            const todos = await ToDoList.find({ _id: { $in: item.to_do_list } });
            const todosProgress = await Promise.all(todos.map(async (todo) => {
                const c = await TaskContent.findById(todo.task_content);
                const t = await TaskContent.find({ _id: { $in: todo.tasks } });
                return (todo.tasks === null || todo.tasks.length === 0) ? c?.status === 2 ? 100 : 0 : Math.round(t.filter((item) => item.status === 2).length / t.length * 100);
            }));
            const progress = todosProgress.reduce((prev, current) => prev + current, 0) / todosProgress.length;
            return {
                ...item.toObject(),
                task_content: {
                    ...content?.toObject(),
                    wrapper_id: item._id,
                    progress,
                    creator: (await Student.findById(content?.creator))!.name,
                    assignee: (await Student.findById(content?.assignee))?.name,
                },
            }
        }));
        const todoList = await ToDoList.find({ _id: { $in: project.to_do_list } });
        const todoContent = await TaskContent.find({ _id: { $in: todoList.map((item) => item.task_content) } });
        const todoDatas = await Promise.all(todoList.map(async (item) => {
            const content = todoContent.find((content) => content._id == item.task_content.toString());
            const tasks = await TaskContent.find({ _id: { $in: item.tasks } });
            const progress = (item.tasks == null || item.tasks.length == 0) ? content?.status === 2 ? 100 : 0 : Math.round(tasks.filter((item) => item.status === 2).length / tasks.length * 100);
            return {
                ...item.toObject(),
                task_content: {
                    ...content?.toObject(),
                    wrapper_id: item._id,
                    progress,
                    creator: (await Student.findById(content?.creator))!.name,
                    assignee: (await Student.findById(content?.assignee))?.name,
                }
            }
        }));
        res.json(successResponse({ sprint: sprintDatas, toDo: todoDatas }, 'Todos and sprint fetched successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student
const getSprintTodo = async (req: AuthRequest, res: Response) => {
    try {
        const { sprint_id } = req.params;
        const sprint = await Sprint.findById(sprint_id);
        if (!sprint) {
            return res.status(404).json({ message: 'Sprint not found' });
        };
        const todoList = await ToDoList.find({ _id: { $in: sprint.to_do_list } });
        const todoDatas = await Promise.all(todoList.map(async (item) => {
            const content = await TaskContent.findById(item.task_content);
            const tasks = await TaskContent.find({ _id: { $in: item.tasks } });
            const progress = (item.tasks === null || item.tasks.length === 0) ? content?.status === 2 ? 100 : 0 : Math.round(tasks.filter((item) => item.status === 2).length / tasks.length * 100);
            return {
                ...content?.toObject(),
                wrapper_id: item._id,
                progress,
                creator: (await Student.findById(content?.creator))!.name,
                assignee: (await Student.findById(content?.assignee))?.name,
            }
        }));
        res.json(successResponse(todoDatas, 'Sprint todo fetched successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    };
};

// # Student
const createTodo = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id } = req.params;
        const { task_content, tasks } = req.body;
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        };
        const content = await TaskContent.create(JSON.parse(task_content));
        const task_ids = await Promise.all(JSON.parse(tasks).map(async (item: any) => {
            const content = await TaskContent.create(item);
            return content._id;
        }));
        const todoList = await ToDoList.create({ tasks: task_ids, task_content: content._id });
        project.to_do_list = [...project.to_do_list ?? [] as any, todoList._id];
        const result = await project.save();
        if (!result) {
            return res.status(500).json({ message: 'Error creating todo' });
        } else {
            res.json(successResponse({ ...todoList.toObject(), task_content: content.toObject() }, 'Todo created successfully}'));
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student
const createSprint = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id } = req.params;
        const { task_content, todos } = req.body;
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        };
        const content = await TaskContent.create(JSON.parse(task_content));
        const todo_ids = await Promise.all(JSON.parse(todos).map(async (item: any) => {
            const content = await TaskContent.create(item);
            const task_ids = await Promise.all((item.childContent ?? []).map(async (child: any) => {
                const content = await TaskContent.create(child);
                return content._id;
            }));
            const todoList = await ToDoList.create({ tasks: task_ids, task_content: content._id });
            return todoList._id;
        }));
        const sprint = await Sprint.create({ task_content: content._id, to_do_list: todo_ids });
        project.sprint_list = [...project.sprint_list ?? [] as any, sprint._id];
        const result = await project.save();
        if (!result) {
            return res.status(500).json({ message: 'Error creating sprint' });
        } else {
            res.json(successResponse({ ...sprint.toObject(), task_content: content.toObject() }, 'Sprint created successfully'));
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

const checkValidId = async (t?: string, p_id?: string, todo_id?: string, sprint_list?: mongoose.Types.ObjectId[] | undefined, to_do_list?: mongoose.Types.ObjectId[] | undefined) => {
    if (t === 'Sprint') {
        return (sprint_list ?? []).find((item) => item.toString() === todo_id);
    } else if (t === 'StandAloneTodo') {
        return (to_do_list ?? []).find((item) => item.toString() === todo_id);
    } else if (t === 'Todo') {
        const sprint = await Sprint.findById(p_id);
        if (!sprint) {
            return false;
        } else {
            return sprint.to_do_list.find((item) => item.toString() === todo_id);
        }
    } else if (t === 'Task') {
        const todo = await ToDoList.findById(p_id);
        if (!todo) {
            return false;
        } else {
            return (todo.tasks ?? []).find((item) => item.toString() === todo_id);
        }
    } else {
        return false;
    }
};

// # Student
const getSingleTodo = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id, todo_id } = req.params;
        const { t, p_id } = req.query;

        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        };
        const validId = await checkValidId(t as string, p_id as string, todo_id, project.sprint_list, project.to_do_list);
        if (!validId) {
            return res.status(404).json({ message: 'Invalid Record' });
        } else {
            const content = await (async () => {
                if (t === 'Sprint') {
                    return TaskContent.findById((await Sprint.findById(todo_id))!.task_content);
                } else if (t === 'StandAloneTodo' || t === 'Todo') {
                    return TaskContent.findById((await ToDoList.findById(todo_id))!.task_content);
                } else {
                    return await TaskContent.findById(todo_id);
                }
            })();
            if (!content) {
                return res.status(404).json({ message: 'Content not found' });
            };
            const comments = await Promise.all((await Comment.find({ _id: { $in: content.comments ?? [] } })).map(async (item) => {
                const student = await Student.findById(item.user);
                return {
                    ...item.toObject(),
                    user: student?.name ?? 'Unknown',
                    user_id: item.user
                }
            }));

            const childContent = await (async () => {
                if (t === 'Sprint') {
                    const todos = await ToDoList.find({ _id: { $in: (await Sprint.findById(todo_id))?.to_do_list ?? [] } });
                    return await Promise.all(todos.map(async (item) => {
                        const tContent = await TaskContent.findById(item.task_content);
                        return {
                            ...tContent!.toObject(),
                            wrapper_id: item._id,
                            creator: tContent!.creator.toString(),
                            assignee: tContent!.assignee?.toString() ?? undefined
                        }
                    }));
                } else if (t === 'StandAloneTodo' || t === 'Todo') {
                    const tasks = await TaskContent.find({ _id: { $in: (await ToDoList.findById(todo_id))?.tasks ?? [] } });
                    return tasks.map((item) => {
                        return {
                            ...item.toObject(),
                            wrapper_id: item._id,
                            creator: item.creator.toString(),
                            assignee: item.assignee?.toString() ?? undefined
                        }
                    });
                } else {
                    return [];
                }
            })();
            res.json(successResponse({
                ...content.toObject(),
                childContent,
                wrapper_id: todo_id,
                comments,
                creator: content.creator.toString(),
                assignee: content.assignee?.toString() ?? undefined,
            }, 'Todo fetched successfully'));
        };
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student
const editTodo = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id, todo_id } = req.params;
        const { type: t, parent_id: p_id, task_content: tc, child_content: cc } = req.body;

        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        };
        const validId = await checkValidId(t as string, p_id as string, todo_id, project.sprint_list, project.to_do_list);
        if (!validId) {
            return res.status(404).json({ message: 'Invalid Record' });
        } else {
            const task_content = JSON.parse(tc);
            const child_content = JSON.parse(cc);
            const earliestDate = new Date(task_content.created_at);
            const latestDate = new Date(task_content.completed_at);

            if (t === 'Sprint') {
                const sprint = await Sprint.findById(todo_id);
                if (!sprint) {
                    throw new Error('Sprint not found');
                };
                const todos = await Promise.all(child_content.map(async (item: any) => {
                    if (item.created_at < earliestDate || item.completed_at > latestDate) {
                        throw new Error('At least one todo has invalid date range');
                    }
                    const tasks = await Promise.all((item.childContent ?? []).map(async (child: any) => {
                        if (child.created_at < earliestDate || child.completed_at > latestDate) {
                            throw new Error('At least one task has invalid date range');
                        }
                        // if has id (aka existing tasks)
                        if (child._id) {
                            const content = await TaskContent.findByIdAndUpdate(child._id, _.omit(child, ['_id']));
                            if (!content) {
                                throw new Error('Error updating todo');
                            }
                            return content._id;
                        } else { // create new tasks
                            const content = await TaskContent.create(child);
                            return content._id;
                        }
                    }));

                    // if has id (aka existing todo)
                    if (item._id) {
                        const content = await TaskContent.findByIdAndUpdate(item._id, _.omit(item, ['_id']));
                        if (!content) {
                            throw new Error('Error updating todo');
                        }
                        const todo = await ToDoList.findById(item.wrapper_id);
                        if (!todo) {
                            throw new Error('Error updating todo');
                        }
                        const tasksToDel = todo.tasks.filter((item) => !tasks.map(e => e.toString()).includes(item.toString()));
                        await Promise.all(tasksToDel.map(async (item) => {
                            await TaskContent.findByIdAndDelete(item);
                        }));
                        todo.tasks = tasks;
                        return (await todo.save())._id;
                    } else { // create new todo
                        const content = await TaskContent.create(item);
                        const todo = await ToDoList.create({ tasks, task_content: content._id });
                        return todo._id;
                    }
                }));
                const content = await TaskContent.findByIdAndUpdate(sprint.task_content, _.omit(task_content, ['_id']), { new: true });
                if (!content) {
                    return res.status(500).json({ message: 'Error updating todo' });
                }
                const todosToDel = sprint.to_do_list.filter((item) => !todos.map(e => e.toString()).includes(item.toString()));
                await Promise.all(todosToDel.map(async (item) => {
                    const todo = await ToDoList.findById(item);
                    if (!todo) {
                        return;
                    }
                    const tasks = await TaskContent.find({ _id: { $in: [...todo.tasks, todo.task_content] } });
                    await Promise.all(tasks.map(async (task) => {
                        await task.deleteOne();
                    }));
                    await todo.deleteOne();
                }));
                sprint.to_do_list = todos;
                res.json(successResponse({ ...(await sprint.save()).toObject(), task_content: content.toObject() }, 'Todo updated successfully'));
            } else if (t === 'Todo' || t === 'StandAloneTodo') {
                const todo = await ToDoList.findById(todo_id);
                if (!todo) {
                    return res.status(404).json({ message: 'Todo not found' });
                };
                const tasks = await Promise.all(child_content.map(async (item: any) => {
                    if (new Date(item.created_at) < earliestDate || new Date(item.completed_at) > latestDate) {
                        throw new Error('At least one task has invalid date range');
                    }
                    // if has id (aka existing tasks)
                    if (item._id) {
                        const content = await TaskContent.findByIdAndUpdate(item._id, _.omit(item, ['_id']));
                        if (!content) {
                            throw new Error('Error updating todo');
                        }
                        return content._id;
                    } else { // create new tasks
                        const content = await TaskContent.create(item);
                        return content._id;
                    }
                }));
                const content = await TaskContent.findByIdAndUpdate(todo.task_content, _.omit(task_content, ['_id']), { new: true });
                if (!content) {
                    return res.status(500).json({ message: 'Error updating todo' });
                }
                const tasksToDel = todo.tasks.filter((item) => !tasks.map(e => e.toString()).includes(item.toString()));
                await Promise.all(tasksToDel.map(async (item) => {
                    await TaskContent.findByIdAndDelete(item);
                }));
                todo.tasks = tasks;
                res.json(successResponse({ ...(await todo.save()).toObject(), task_content: content.toObject() }, 'Todo updated successfully'));
            } else if (t === 'Task') {
                const content = await TaskContent.findByIdAndUpdate(todo_id, _.omit(task_content, ['_id']), { new: true });
                if (!content) {
                    return res.status(500).json({ message: 'Error updating todo' });
                }
                res.json(successResponse(content.toObject(), 'Todo updated successfully'));
            };
        };
    } catch (error: any) {
        console.log(error.message);
        res.status(500).json(errorResponse(error.message, error));
    }
};

// # Student
const deleteTodo = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id, todo_id } = req.params;
        const { t, p_id } = req.query;

        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        };
        const validId = await checkValidId(t as string, p_id as string, todo_id, project.sprint_list, project.to_do_list);
        if (!validId) {
            return res.status(404).json({ message: 'Invalid Record' });
        } else {
            if (t === 'Sprint') {
                const sprint = await Sprint.findById(todo_id);
                if (!sprint) {
                    return res.status(404).json({ message: 'Sprint not found' });
                };
                const content = await TaskContent.findById(sprint.task_content);
                if (!content) {
                    return res.status(404).json({ message: 'Content not found' });
                };
                const todos = await ToDoList.find({ _id: { $in: sprint.to_do_list } });
                await Promise.all(todos.map(async (item) => {
                    const tasks = await TaskContent.find({ _id: { $in: [...item.tasks, item.task_content] } });
                    await Promise.all(tasks.map(async (task) => {
                        await task.deleteOne();
                    }));
                    await item.deleteOne();
                }));
                await sprint.deleteOne();
                await content.deleteOne();
                project.sprint_list = (project.sprint_list ?? []).filter((item) => item.toString() !== todo_id);
                await project.save();
                res.json(successResponse({}, 'Todo deleted successfully'));
            } else if (t === 'Todo' || t === 'StandAloneTodo') {
                const todo = await ToDoList.findById(todo_id);
                if (!todo) {
                    return res.status(404).json({ message: 'Todo not found' });
                };
                const content = await TaskContent.findById(todo.task_content);
                if (!content) {
                    return res.status(404).json({ message: 'Content not found' });
                };
                const tasks = await TaskContent.find({ _id: { $in: [...todo.tasks, todo.task_content] } });
                await Promise.all(tasks.map(async (task) => {
                    await task.deleteOne();
                }));
                await todo.deleteOne();
                await content.deleteOne();
                if (t === 'Todo') {
                    const sprint = await Sprint.findById(p_id);
                    if (!sprint) {
                        return res.status(404).json({ message: 'Sprint not found' });
                    };
                    sprint.to_do_list = (sprint.to_do_list ?? []).filter((item) => item.toString() !== todo_id);
                    await sprint.save();
                };
                project.to_do_list = (project.to_do_list ?? []).filter((item) => item.toString() !== todo_id);
                await project.save();
                res.json(successResponse({}, 'Todo deleted successfully'));
            } else if (t === 'Task') {
                const content = await TaskContent.findById(todo_id);
                if (!content) {
                    return res.status(404).json({ message: 'Task not found' });
                };
                const todo = await ToDoList.findById(p_id);
                if (!todo) {
                    return res.status(404).json({ message: 'Todo not found' });
                };
                todo.tasks = todo.tasks.filter((item) => item.toString() !== todo_id);
                await todo.save();
                await content.deleteOne();
                res.json(successResponse({}, 'Todo deleted successfully'));
            };
        };
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student
const getGantt = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id } = req.params;
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        };
        const sprint = await Sprint.find({ _id: { $in: project.sprint_list } });
        const todoList = await ToDoList.find({ _id: { $in: project.to_do_list } });

        const ganttTasks = [];

        let projectProgress: number[] = [];
        let projectStart: Date | null = null;
        let projectEnd: Date | null = null;

        await Promise.all(sprint.map(async (s, si) => {
            const content = await TaskContent.findById(s.task_content);

            if (!projectStart || projectStart > content!.created_at) {
                projectStart = content!.created_at;
            }
            if (!projectEnd || projectEnd < content!.completed_at) {
                projectEnd = content!.completed_at;
            }
            const todos = await ToDoList.find({ _id: { $in: s.to_do_list } });
            let todosProgress: number[] = [];
            const todoGantt = await Promise.all(todos.map(async (t, ti) => {
                const todoContent = await TaskContent.findById(t.task_content);
                const tasks = await TaskContent.find({ _id: { $in: t.tasks } });
                const progress = (t.tasks === null || t.tasks.length === 0) ? todoContent?.status === 2 ? 100 : 0 : Math.round(tasks.filter((item) => item.status === 2).length / tasks.length * 100);
                todosProgress.push(progress);
                return {
                    start: todoContent?.created_at,
                    end: todoContent?.completed_at,
                    name: todoContent?.title,
                    id: `Sprint ${si} Todo ${ti}`,
                    type: "task",
                    project: `Sprint ${si}`,
                    isDisabled: true,
                    styles: {
                        backgroundColor: "#aeb8c2",
                        backgroundSelectedColor: "#aeb8c2",
                        progressColor: "#388e3c", // mui success color palette
                        progressSelectedColor: "#81c784",
                    },
                    progress,
                    displayOrder: si + ti + 3
                };
            }));
            const sprintProgress = (s.to_do_list === null || s.to_do_list.length === 0) ? content?.status === 2 ? 100 : 0 : Math.round(todosProgress.reduce((prev, current) => prev + current, 0) / todosProgress.length);
            projectProgress.push(sprintProgress);
            ganttTasks.push({
                start: content?.created_at,
                end: content?.completed_at,
                name: content?.title,
                id: `Sprint ${si}`,
                type: "project",
                project: "Project",
                hideChildren: false,
                isDisabled: true,
                styles: {
                    backgroundColor: "#f57c00", // mui warning color palette
                    backgroundSelectedColor: "#ffb74d",
                    progressColor: "#388e3c",
                    progressSelectedColor: "#81c784",
                },
                progress: sprintProgress,
                displayOrder: si + 2
            }, ...todoGantt);
        }));

        await Promise.all(todoList.map(async (t, ti) => {
            const content = await TaskContent.findById(t.task_content);
            if (!projectStart || projectStart > content!.created_at) {
                projectStart = content!.created_at;
            }
            if (!projectEnd || projectEnd < content!.completed_at) {
                projectEnd = content!.completed_at;
            }
            const standAloneProgress = (t.tasks === null || t.tasks.length === 0) ? content?.status === 2 ? 100 : 0 : Math.round((await TaskContent.find({ _id: { $in: t.tasks } })).filter((item) => item.status === 2).length / t.tasks.length * 100);
            projectProgress.push(standAloneProgress);
            ganttTasks.push({
                start: content?.created_at,
                end: content?.completed_at,
                name: content?.title,
                id: `StandAlone Todo ${ti}`,
                type: "task",
                project: "Project",
                isDisabled: true,
                styles: {
                    backgroundColor: "#aeb8c2",
                    backgroundSelectedColor: "#aeb8c2",
                    progressColor: "#1976d2", // mui primary color palette
                    progressSelectedColor: "#64b5f6",
                },
                progress: standAloneProgress,
                displayOrder: ganttTasks.length + ti + 1
            })
        }));

        ganttTasks.unshift({
            start: projectStart,
            end: projectEnd,
            name: project.title,
            id: "Project",
            type: "project",
            hideChildren: false,
            styles: {
                backgroundColor: "#ab47bc",
                backgroundSelectedColor: "#ce93d8",
                progressColor: "#f57c00",
                progressSelectedColor: "#ffb74d",
            },
            isDisabled: true,
            progress: Math.round(projectProgress.reduce((prev, current) => prev + current, 0) / projectProgress.length),
            displayOrder: 1
        });
        res.json(successResponse(ganttTasks, 'Gantt fetched successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student
const createComment = async (req: AuthRequest, res: Response) => {
    try {
        const { project_id, todo_id } = req.params;
        const { type: t, parent_id: p_id, comment, newImages } = req.body;
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        };
        const validId = await checkValidId(t as string, p_id as string, todo_id, project.sprint_list, project.to_do_list);
        if (!validId) {
            return res.status(404).json({ message: 'Invalid Record' });
        } else {
            const c = await Comment.create({
                content: comment,
                user: req.user?.userId,
                created_at: moment(),
                updated_at: moment()
            });
            if (!c) {
                res.status(500).json({ message: 'Error creating comment' });
            }
            const content = await (async () => {
                if (t === 'Sprint') {
                    const sprint = await Sprint.findById(todo_id);
                    return await TaskContent.findById(sprint!.task_content);
                } else if (t === 'StandAloneTodo' || t === 'Todo') {
                    const todo = await ToDoList.findById(todo_id);
                    return await TaskContent.findById(todo!.task_content);
                } else {
                    return await TaskContent.findById(todo_id);
                }
            })();
            if (!content) {
                return res.status(404).json({ message: 'Content not found' });
            }
            content.comments = [...content.comments as any ?? [], c._id];
            await content.save();
            res.json(successResponse({}, 'Comment created successfully'));
        };
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student
const editComment = async (req: AuthRequest, res: Response) => {
    try {
        const { comment_id } = req.params;
        const { comment } = req.body;
        const c = await Comment.findByIdAndUpdate(comment_id, { content: comment, updated_at: moment() }, { new: true });
        if (!c) {
            res.status(500).json({ message: 'Error updating comment' });
        }
        res.json(successResponse({}, 'Comment updated successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// # Student
const deleteComment = async (req: AuthRequest, res: Response) => {
    try {
        const { comment_id } = req.params;
        const c = await Comment.findByIdAndDelete(comment_id);
        if (!c) {
            res.status(500).json({ message: 'Error deleting comment' });
        }
        res.json(successResponse({}, 'Comment deleted successfully'));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// const replaceImageSrc = (content: string, uuids: string[], root: string): string => {
//     // Counter to track the index of the UUIDs array
//     let index = 0;

//     return content.replace(/<img[^>]+src="([^"]*)"[^>]*>/g, (match) => {
//         // Use the current index to access the corresponding UUID
//         const newSrc = `src="${root}/${uuids[index]}.png"`;
//         index++; // Increment index for the next match
//         return match.replace(/src="[^"]*"/, newSrc);
//     });
// };

export default {
    getTodosAndSprint,
    getSprintTodo,
    createTodo,
    createSprint,
    getSingleTodo,
    createComment,
    editComment,
    deleteComment,
    editTodo,
    deleteTodo,
    getGantt,
};
