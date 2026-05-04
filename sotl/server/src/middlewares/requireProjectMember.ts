import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "./groupRole";

/**
 * Requires:
 * - attachGroupRole ran (sets req.user.role and (req as any).projectId)
 * Allows Member or Leader, but must match requested projectId.
 */
export function requireProjectMember(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const requestedProjectId = String(req.query.projectId || "");

    if (!requestedProjectId || !mongoose.isValidObjectId(requestedProjectId)) {
      return res
        .status(400)
        .json({ message: "projectId is required and must be a valid ObjectId" });
    }

    const activeProjectId = String((req as any).projectId || "");
    if (!activeProjectId) {
      return res.status(403).json({ message: "You are not assigned to any project group" });
    }

    if (String(activeProjectId) !== String(requestedProjectId)) {
      return res.status(403).json({
        message: "Project mismatch. You are not allowed to access tasks for this project.",
      });
    }

    // Member OR Leader is fine here
    next();
  } catch (err) {
    next(err);
  }
}
