import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./database";
import deadlinesRoutes from './routes/deadlinesRoutes';
import chatTasksRoutes from "./routes/chatTasksRoutes";
import { uploadsDir } from "./routes/uploadRoutes";

import Routes, {
  NotificationRouter,
  GroupRouter,
  ProjectRouter,
  DeliverablesRouter,
  TodoListRouter,
  UserManagementRouter,
  EmailRouter,
  ProfileRouter,
  GamificationRouter,
  QuizRouter,
  AssessmentRouter,
  AssessmentResultRouter,
  ClientRouter,
  uploadRoutes,
} from "./routes/index";
import listRoutes from "express-list-routes";
// import { initializeMainWorker } from "./queue/initializeMainWorker"; // ❌ disable while Redis is down
import { createServer } from "http";

dotenv.config();

// --- Optional dev flags (add these to .env if you like) ---
const SKIP_DB = process.env.SKIP_DB === "1";
const SKIP_QUEUE = process.env.SKIP_QUEUE === "1";

// Mongo connection (guarded)
if (!SKIP_DB) {
  try {
    connectDB();
  } catch (e: any) {
    console.warn("⚠️ DB connect failed but continuing (dev):", e?.message || e);
  }
} else {
  console.warn("⚠️ SKIP_DB=1 → skipping MongoDB connection");
}

const app: Express = express();
const port = Number(process.env.BACKEND_PORT || 5000);
const http = createServer(app);

app.set("trust proxy", 1);

app.use(
  cors({
    origin: "*", // dev only
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

// ✅ Mount combined routes under /api (includes /api/llm/* from routes/index.ts)
app.use("/api", Routes);

app.use("/api/chat-tasks", chatTasksRoutes);

// Other feature routers
app.use("/api/notifications", NotificationRouter);
app.use("/api/group", GroupRouter);
app.use("/api/project", ProjectRouter);
app.use("/api/deliverables", DeliverablesRouter);
app.use("/api/todo", TodoListRouter);
app.use("/api/user-management", UserManagementRouter);
app.use("/api/email", EmailRouter);
app.use("/api/profile", ProfileRouter);
app.use("/api/gamification", GamificationRouter);

app.use('/api/deadlines', deadlinesRoutes);

app.use("/uploads", express.static(uploadsDir));
app.use("/api/uploads", uploadRoutes);

// Evaluation module routers
app.use("/api/quizzes", QuizRouter);
app.use("/api/assessments", AssessmentRouter);
app.use("/api/assessmentresults", AssessmentResultRouter);
app.use("/api/client", ClientRouter);

// Root + simple route list
app.get("/", (_req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/api/routes", (_req, res) => {
  res.send(
    (app as any)._router.stack
      .filter((r: any) => r.route)
      .map((r: any) => r.route.path)
  );
});

// Console dump of routes (pretty)
listRoutes(app);

// Redis/queue (guarded)
if (!SKIP_QUEUE) {
  try {
    // initializeMainWorker();
  } catch (e: any) {
    console.warn("⚠️ Queue init failed but continuing (dev):", e?.message || e);
  }
} else {
  console.warn("⚠️ SKIP_QUEUE=1 → skipping Redis worker");
}

http.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

http.on("clientError", (err, socket) => {
  console.error("Client error:", err);
  socket.destroy();
});
