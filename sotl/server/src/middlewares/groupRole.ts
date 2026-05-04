import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Group from "../models/Group";

export interface AuthUser {
  userId?: string | mongoose.Types.ObjectId;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export async function attachGroupRole(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userIdRaw = req.user?.userId;

    if (!userIdRaw) {
      return res.status(401).json({ message: "Unauthenticated (missing userId)" });
    }

    const uidStr = String(userIdRaw);
    if (!mongoose.isValidObjectId(uidStr)) {
      return res.status(401).json({ message: "Unauthenticated (invalid userId)" });
    }

    const uid = new mongoose.Types.ObjectId(uidStr);

    const group = await (Group as any).findOne({ "team_members.student_id": uid }).lean();

    // ✅ Ensure req.user exists (prevents runtime crash)
    req.user = req.user || {};

    if (!group) {
      req.user.role = "Member";
      (req as any).projectId = null;
      return next();
    }

    const member = (group.team_members || []).find(
      (m: any) => String(m.student_id) === String(uid)
    );

    req.user.role = member?.group_role || "Member";
    (req as any).projectId = group.project || null;

    return next();
  } catch (e) {
    console.error("attachGroupRole error:", e);
    return res.status(500).json({ message: "Failed to resolve group role" });
  }
}
