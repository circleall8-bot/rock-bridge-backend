// src/routes/servicesRouter.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { getServices, addService, deleteService } from "../controllers/serviceController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Use project-level uploads dir (matches controller)
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || "";
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-").toLowerCase();
    const unique = `${base}-${Date.now()}${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.FILE_SIZE_LIMIT || `${20 * 1024 * 1024}`, 10),
  },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext.replace(".", "")) || allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, gif)"));
    }
  },
});
// routes
router.get("/", getServices);
router.use(requireAuth);
router.post("/", upload.single("image"), addService);
router.delete("/:id", deleteService);

export default router;
