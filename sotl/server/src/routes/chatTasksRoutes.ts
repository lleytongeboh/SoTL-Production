import { Router } from "express";
import requireAuth from "../middlewares/authMiddleware";
import { attachGroupRole } from "../middlewares/groupRole";
import { requireProjectLeader } from "../middlewares/requireProjectLeader";
import { requireProjectMember } from "../middlewares/requireProjectMember";
import {
  getTeamTasks,
  createChatTask,
  getMyTasks,
  updateChatTask,
  undoChatTask,
  getProjectMembers,
  listMyProjectsForChat 
} from "../controllers/chatTasksController";

const router = Router();

router.patch(
  "/:id",
  requireAuth([], false),
  attachGroupRole,
  requireProjectMember,   // project match check (member/leader)
  updateChatTask          // BUT controller enforces assignedTo == current user
);

router.post(
  "/:id/undo",
  requireAuth([], false),
  attachGroupRole,
  requireProjectLeader,
  undoChatTask
);
router.get(
  "/projects",
  requireAuth([], false),
  attachGroupRole,
  listMyProjectsForChat
);

router.get("/members", requireAuth([], false), attachGroupRole, requireProjectMember, getProjectMembers);

// Team progress (both members and leaders can view)
router.get("/team", requireAuth([], false), attachGroupRole, requireProjectMember, getTeamTasks);

// Leader only
router.post("/", requireAuth([], false), attachGroupRole, requireProjectLeader, createChatTask);

// Member (and leader can also see their own assigned tasks if needed)
router.get("/my", requireAuth([], false), attachGroupRole, requireProjectMember, getMyTasks);

export default router;
