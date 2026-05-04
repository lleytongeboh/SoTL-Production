import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "./groupRole";

/**
 * Requires:
 * - attachGroupRole already ran
 * - req.user.role is set (Leader/Member)
 * - req.projectId is set
 */
export function requireProjectLeader(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const requestedProjectId = String(req.query.projectId || "");

    if (!requestedProjectId || !mongoose.isValidObjectId(requestedProjectId)) {
      return res
        .status(400)
        .json({ message: "projectId is required and must be a valid ObjectId" });
    }

    // attachGroupRole sets this
    const activeProjectId = String((req as any).projectId || "");

    if (!activeProjectId) {
      return res.status(403).json({ message: "You are not assigned to any project group" });
    }

    // Project scoping: must match
    if (String(activeProjectId) !== String(requestedProjectId)) {
      return res.status(403).json({
        message:
          "Project mismatch. You are not allowed to access tasks for this project.",
      });
    }

    // Role check
    if (req.user?.role !== "Leader") {
      return res.status(403).json({ message: "Leader permission required" });
    }

    next();
  } catch (err) {
    next(err);
  }
}
