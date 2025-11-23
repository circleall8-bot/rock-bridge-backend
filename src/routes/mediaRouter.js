// src/routes/mediaRouter.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getMedia, addMedia, deleteMedia } from "../controllers/mediaController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "media");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-").toLowerCase();
    const unique = `${base}-${Date.now()}${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  },
});

const ALLOWED = [
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/mpeg"
];

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MEDIA_FILE_SIZE_LIMIT || `${100 * 1024 * 1024}`, 10) },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type. Allowed: images and common video types"));
  },
});


router.get("/", getMedia);
router.use(requireAuth);
router.post("/", upload.single("file"), addMedia);
router.delete("/:id", deleteMedia);

export default router;
