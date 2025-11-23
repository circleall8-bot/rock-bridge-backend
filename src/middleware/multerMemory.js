// middleware/multerMemory.js
import multer from "multer";

const storage = multer.memoryStorage();

export const uploadSingle = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files allowed"));
    } else cb(null, true);
  },
}).single("image"); // form field: image

export const uploadMultiple = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 }, // per-file
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) cb(new Error("Only images allowed"));
    else cb(null, true);
  },
}).array("images", 6); // up to 6 files, field name 'images'
