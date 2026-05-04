// server/src/routes/deadlinesRoutes.ts
import { Router, Response } from "express";
import { attachGroupRole, AuthRequest } from "../middlewares/groupRole";
import requireAuth from "../middlewares/authMiddleware";
import Deliverable from "../models/Deliverables";

// ✅ ADD: Import Project model (adjust path/name to your project)
import Project from "../models/Project";

const router = Router();

/**
 * GET /api/deadlines/next?days=14
 * Returns upcoming deliverables for the logged-in user (scoped by project if available).
 * Auth first (any logged-in user), then attach group role/context.
 */
router.get(
  "/next",
  // If your auth middleware is NOT a factory, replace with just: requireAuth
  requireAuth([]),          // ✅ allow any authenticated user
  attachGroupRole,          // ✅ uses req.user to resolve projectId / group role
  async (req: AuthRequest, res: Response) => {
    try {
      const days = Math.min(Number(req.query.days) || 14, 365);
      const now = new Date();
      const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const projectId = (req as any).projectId || null;
      const role = req.user?.role || "Member";

      // ✅ NEW: Resolve deliverable IDs via Project.deliverables[].deliverable_id
      let deliverableIds: any[] = [];
      if (projectId) {
        const project = await (Project as any)
          .findById(projectId)
          .select("deliverables.deliverable_id")
          .lean();

        deliverableIds = (project?.deliverables || [])
          .map((x: any) => x.deliverable_id)
          .filter(Boolean);
      }

      // Base query: approved + within window (+ scoped to project deliverable IDs if available)
      const q: any = {
        approve: true,
        end_at: { $gte: now, $lte: until },
      };

      // ✅ Instead of q.project = projectId (field doesn't exist), scope by _id list:
      if (deliverableIds.length) q._id = { $in: deliverableIds };

      // Primary window
      let deliverables = await (Deliverable as any)
        .find(q)
        .sort({ end_at: 1 })
        .limit(20)
        .lean();

      // Fallback: show next upcoming if none in window
      if (!deliverables.length) {
        const q2: any = { approve: true, end_at: { $gte: now } };
        if (deliverableIds.length) q2._id = { $in: deliverableIds };

        deliverables = await (Deliverable as any)
          .find(q2)
          .sort({ end_at: 1 })
          .limit(10)
          .lean();
      }

      const results = deliverables.map((d: any) => ({
        id: String(d._id),
        title: d.name,
        dueAt: d.end_at,
        daysLeft: Math.ceil(
          (new Date(d.end_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
        submitted: false, // TODO: join to assessment results if needed
        type: "deliverable",
        visibleTo:
          role === "Leader"
            ? "All group members"
            : "Only this user (member mode)",
      }));

      return res.status(200).json({
        count: results.length,
        role,
        project: projectId,
        deliverableIdsCount: deliverableIds.length, // optional, helpful for debugging
        results,
      });
    } catch (err) {
      console.error("❌ [deadlinesRoutes] Error fetching deadlines:", err);
      return res.status(500).json({ message: "Failed to fetch deadlines" });
    }
  }
);

/**
 * GET /api/deadlines/debug
 * Quick sanity check that the router is mounted.
 */
router.get("/debug", (_req, res) => {
  console.log("✅ /api/deadlines/debug hit successfully");
  res.json({ ok: true, message: "Deadlines route is active" });
});

export default router;
