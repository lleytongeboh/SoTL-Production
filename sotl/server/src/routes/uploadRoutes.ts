import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import requireAuth from "../middlewares/authMiddleware";

const router = Router();
export const uploadsDir = path.resolve(process.cwd(), "uploads");

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post(
  "/evidence",
  requireAuth([], false),
  upload.single("file"),
  (req, res) => {
    const f = (req as any).file;
    if (!f) return res.status(400).json({ message: "No file uploaded" });
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return res.json({ url: `/uploads/${f.filename}`, absoluteUrl: `${baseUrl}/uploads/${f.filename}` });
  }
);

export default router;
