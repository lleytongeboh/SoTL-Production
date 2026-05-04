import { Router } from "express";
import multer from "multer";
import requireAuth from "../middlewares/authMiddleware";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads"),
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
    return res.json({ url: `/uploads/${f.filename}` });
  }
);

export default router;
