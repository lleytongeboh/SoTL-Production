// src/controllers/chatTasksController.ts
import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/groupRole";
import { ChatTask } from "../models/ChatTask";
import  Project  from "../models/Project"; 
import Group from "../models/Group";
import User from "../models/User";

/**
 * LEADER: View all tasks they assigned in the selected project
 * GET /api/chat-tasks/team?projectId=...
 */
export async function getTeamTasks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const projectId = String(req.query.projectId || "");
    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({ message: "projectId is required and must be a valid ObjectId" });
    }

    const userId = String(req.user?.userId || "");
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Show all project tasks (both members and leaders can view team progress)
    const tasks = await ChatTask.find({
      projectId,
      status: { $ne: "cancelled" },
    })
      .sort({ dueAt: 1, createdAt: -1 })
      .populate({ path: "assignedTo", select: "name matricNumber email student_id" })
      .select("title status dueAt evidenceLink description assignedTo createdAt updatedAt completedAt")
      .lean();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    return res.json({
      projectId,
      count: tasks.length,
      results: tasks.map((t: any) => ({
        id: String(t._id),
        title: t.title,
        status: t.status,
        dueAt: t.dueAt,
        description: t.description || "",
        createdAt: t.createdAt,
        completedAt: t.completedAt,
        assignedTo: t.assignedTo
          ? {
              id: String(t.assignedTo._id),
              name: t.assignedTo.name,
              matricNumber: t.assignedTo.matricNumber,
              email: t.assignedTo.email,
              student_id: t.assignedTo.student_id,
            }
          : null,
        // ✅ make evidence downloadable
        evidenceLink: t.evidenceLink
          ? (String(t.evidenceLink).startsWith("http")
              ? t.evidenceLink
              : `${baseUrl}${t.evidenceLink}`)
          : "",
      })),
    });
  } catch (err) {
    next(err);
  }
}


//Member
export async function getMyTasks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const projectId = String(req.query.projectId || "");
    const myId = String(req.user!.userId);

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      return res
        .status(400)
        .json({ message: "projectId is required and must be a valid ObjectId" });
    }

    const tasks = await ChatTask.find({
      projectId,
      assignedTo: myId,
      status: { $ne: "cancelled" },
    })
      .sort({ dueAt: 1, createdAt: -1 })
      .populate({ path: "createdBy", select: "name username email student_id" })
      .select("title status dueAt evidenceLink description createdBy createdAt updatedAt completedAt");

    const results = tasks.map((t: any) => ({
      id: String(t._id),
      title: t.title,
      status: t.status,
      dueAt: t.dueAt,
      description: t.description || "",
      createdBy: t.createdBy
        ? {
            id: String(t.createdBy._id),
            name:
              t.createdBy.name ||
              t.createdBy.username ||
              t.createdBy.email ||
              String(t.createdBy.student_id),
          }
        : null,
      hasEvidence: Boolean(t.evidenceLink && String(t.evidenceLink).trim().length > 0),
      evidenceLink: t.evidenceLink || "",
    }));

    return res.json({
      projectId,
      userId: myId,
      count: results.length,
      results,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateChatTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const taskId = String(req.params.id || "");
    const projectId = String(req.query.projectId || "");
    const userId = String(req.user!.userId);

    if (!taskId || !mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({ message: "Invalid task id" });
    }
    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      return res
        .status(400)
        .json({ message: "projectId is required and must be a valid ObjectId" });
    }

    const { status, evidenceLink = "", note = "" } = req.body || {};

    if (!status || !["in_progress", "done"].includes(String(status))) {
      return res.status(400).json({ message: 'status must be "in_progress" or "done"' });
    }

    // If marking done → evidenceLink REQUIRED
    if (String(status) === "done") {
      const link = String(evidenceLink || "").trim();
      if (!link) {
        return res.status(400).json({ message: "evidenceLink is required when status is done" });
      }
      // Basic link validation (lightweight)
      if (!/^https?:\/\/\S+/i.test(link)) {
        return res.status(400).json({ message: "evidenceLink must be a valid URL" });
      }
    }

    // Fetch task and enforce ownership + project scoping
    const task = await ChatTask.findOne({ _id: taskId, projectId });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Only the assigned member can update
    if (String(task.assignedTo) !== userId) {
      return res.status(403).json({ message: "You can only update tasks assigned to you" });
    }

    // Cannot update cancelled tasks
    if (task.status === "cancelled") {
      return res.status(400).json({ message: "Cannot update a cancelled task" });
    }

    // Apply updates
    task.status = status;

    if (String(note || "").trim().length > 0) {
      task.note = String(note);
    }

    if (status === "in_progress") {
      // Do not force evidence. Keep evidenceLink as-is.
      task.completedAt = null;
    }

    if (status === "done") {
      task.evidenceLink = String(evidenceLink).trim();
      task.completedAt = new Date();
    }

    await task.save();

    return res.json({
      message: "Task updated",
      task: {
        id: String(task._id),
        projectId: String(task.projectId),
        status: task.status,
        dueAt: task.dueAt,
        evidenceLink: task.evidenceLink || "",
        note: task.note || "",
        completedAt: task.completedAt,
        updatedAt: task.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * LEADER: Assign (create) a new chat task
 * POST /api/chat-tasks?projectId=...
 * Body: { assignedTo, title, dueAt, description?, relatedDeliverable? }
 */
export async function createChatTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const projectId = String(req.query.projectId || "");
    const leaderId = String(req.user!.userId);

    const {
      assignedTo, // member userId (ObjectId)
      title,
      dueAt,
      description = "",
      relatedDeliverable = "",
    } = req.body || {};

    // Validate projectId
    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      return res
        .status(400)
        .json({ message: "projectId is required and must be a valid ObjectId" });
    }

    // Validate assignedTo
    if (!assignedTo || !mongoose.isValidObjectId(String(assignedTo))) {
      return res
        .status(400)
        .json({ message: "assignedTo is required and must be a valid ObjectId" });
    }

    // Optional: prevent leader assigning to themselves
    if (String(assignedTo) === leaderId) {
      return res.status(400).json({ message: "Leader cannot assign a chat task to themselves" });
    }

    // Validate title
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "title is required" });
    }

    // Validate dueAt
    if (!dueAt) {
      return res.status(400).json({ message: "dueAt is required" });
    }
    const parsedDue = new Date(dueAt);
    if (isNaN(parsedDue.getTime())) {
      return res.status(400).json({ message: "dueAt must be a valid date (ISO recommended)" });
    }

    // Create task
    const doc = await ChatTask.create({
      projectId,
      createdBy: leaderId,
      assignedTo,

      title: title.trim(),
      description: String(description || ""),
      relatedDeliverable: String(relatedDeliverable || ""),

      status: "assigned",
      dueAt: parsedDue,

      evidenceLink: "",
      note: "",

      completedAt: null,
      cancelledAt: null,
    });

    return res.status(201).json({
      message: "Task assigned",
      task: {
        id: String(doc._id),
        projectId: String(doc.projectId),
        createdBy: String(doc.createdBy),
        assignedTo: String(doc.assignedTo),
        title: doc.title,
        status: doc.status,
        dueAt: doc.dueAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function undoChatTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const taskId = String(req.params.id || "");
    const projectId = String(req.query.projectId || "");
    const leaderId = String(req.user!.userId);

    if (!taskId || !mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({ message: "Invalid task id" });
    }
    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      return res
        .status(400)
        .json({ message: "projectId is required and must be a valid ObjectId" });
    }

    // Only cancel tasks created by this leader, in this project
    const task = await ChatTask.findOne({ _id: taskId, projectId, createdBy: leaderId });
    if (!task) {
      return res.status(404).json({ message: "Task not found (or not created by you)" });
    }

    // Idempotent behavior: if already cancelled, just return OK
    if (task.status === "cancelled") {
      return res.json({
        message: "Task already cancelled",
        task: {
          id: String(task._id),
          status: task.status,
          cancelledAt: task.cancelledAt,
        },
      });
    }

    // Optional rule: do you allow cancelling a done task?
    // If you want to block cancelling completed tasks, uncomment:
    if (task.status === "done") {
       return res.status(400).json({ message: "Cannot cancel a completed task" });
     }

    task.status = "cancelled";
    task.cancelledAt = new Date();

    await task.save();

    return res.json({
      message: "Task cancelled",
      task: {
        id: String(task._id),
        projectId: String(task.projectId),
        status: task.status,
        cancelledAt: task.cancelledAt,
        updatedAt: task.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listMyProjectsForChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = String(req.user!.userId);

    // Step 1: collect all projectIds where this user has tasks
    // - as leader (createdBy)
    // - as member (assignedTo)
    const projectIds = await ChatTask.distinct("projectId", {
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    });

    // If no tasks yet, return empty (frontend can show "no projects")
    if (!projectIds || projectIds.length === 0) {
      return res.json({ count: 0, results: [] });
    }

    // Step 2: fetch project titles
    // ✅ This assumes you have a Project collection with "title" (or "name")
    const projects = await Project.find({ _id: { $in: projectIds } })
      .select("title name") // some schemas use "name"
      .lean();

    // Map back to the ids; keep order stable
    const results = projectIds.map((pid: any) => {
      const p = projects.find((x: any) => String(x._id) === String(pid));
      return {
        id: String(pid),
        title: (p as any)?.title || (p as any)?.name || `Project ${String(pid).slice(0, 6)}`,
      };
    });

    return res.json({
      count: results.length,
      results,
    });
  } catch (err) {
    next(err);
  }
}


export async function getProjectMembers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const projectId = String(req.query.projectId || "");
    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({ message: "projectId must be a valid ObjectId" });
    }

    // 1) Get group + raw team_members (student_id are ObjectIds)
    const group = await Group.findOne({ project: projectId })
      .select("name team_members project")
      .lean();

    if (!group) {
      return res.status(404).json({ message: "Group not found for this project" });
    }

    const teamMembers = (group as any).team_members || [];
    const userIds = teamMembers
      .map((m: any) => m.student_id)
      .filter(Boolean)
      .map((id: any) => String(id));

    // 2) Fetch users in one query
    const users = await User.find({ _id: { $in: userIds } })
      .select("name email matricNumber")
      .lean();

    // 3) Build lookup map: userId -> user
    const userMap = new Map(users.map((u: any) => [String(u._id), u]));

    // 4) Merge names into results
    const results = teamMembers.map((m: any) => {
      const u = userMap.get(String(m.student_id));
      return {
        id: String(m.student_id),
        name: u?.name || "Unknown",
        email: u?.email,
        matricNumber: u?.matricNumber,
        group_role: m.group_role,
        project_role: m.project_role,
      };
    });

    return res.json({
      projectId,
      groupId: String((group as any)._id),
      groupName: (group as any).name,
      count: results.length,
      results,
    });
  } catch (err) {
    next(err);
  }
}