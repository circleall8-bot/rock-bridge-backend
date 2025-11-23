// src/controllers/mediaController.js
import path from "path";
import fs from "fs";
import Media from "../models/Media.js";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "media");

const fileUrlFromReq = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get("host")}/uploads/media/${encodeURIComponent(filename)}`;
};

// GET /api/media
export const getMedia = async (req, res) => {
  try {
    const list = await Media.find().sort({ createdAt: -1 }).lean();
    const mapped = list.map((m) => {
      const url = m.mediaUrl || "";
      if (url && /^https?:\/\//i.test(url)) {
        m.mediaUrl = url;
      } else if (url) {
        const filename = path.basename(url);
        m.mediaUrl = `${req.protocol}://${req.get("host")}/uploads/media/${encodeURIComponent(filename)}`;
      } else {
        m.mediaUrl = "";
      }
      return m;
    });
    res.json(mapped);
  } catch (err) {
    console.error("getMedia error:", err);
    res.status(500).json({ message: "Could not retrieve media" });
  }
};

// POST /api/media
// expects multipart/form-data with file field "file" and fields:
// title_en, title_ar, description_en, description_ar
export const addMedia = async (req, res) => {
  try {
    const { title_en = "", title_ar = "", description_en = "", description_ar = "" } = req.body;

    // require at least a title and description in one language
    if (!(title_en.trim() || title_ar.trim()) || !(description_en.trim() || description_ar.trim())) {
      if (req.file && req.file.path) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(400).json({ message: "Please provide title (en or ar) and description (en or ar)" });
    }

    if (!req.file) return res.status(400).json({ message: "file is required (field name: file)" });

    const filename = req.file.filename;
    const relPath = `/uploads/media/${filename}`;
    const mime = req.file.mimetype || "";
    const size = req.file.size || 0;
    const mediaType = mime.startsWith("video/") ? "video" : "image";

    const newItem = new Media({
      title_en: title_en.trim(),
      title_ar: title_ar.trim(),
      description_en: description_en.trim(),
      description_ar: description_ar.trim(),
      mediaUrl: relPath,
      mediaType,
      size,
      mimeType: mime,
      // uploadedBy: req.userId (if you have auth)
    });

    await newItem.save();

    const returned = newItem.toObject();
    returned.mediaUrl = fileUrlFromReq(req, filename);

    res.status(201).json({ message: "Media uploaded", media: returned });
  } catch (err) {
    console.error("addMedia error:", err);
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ message: "Failed to upload media" });
  }
};

// DELETE /api/media/:id
export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Media id required" });

    // find and delete
    const media = await Media.findByIdAndDelete(id);
    if (!media) return res.status(404).json({ message: "Media not found" });

    // remove file if exists
    try {
      const filename = path.basename(media.mediaUrl || "");
      const candidate = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(candidate)) fs.unlinkSync(candidate);
    } catch (err) {
      console.warn("could not delete media file", err);
    }

    res.json({ message: "Media deleted" });
  } catch (err) {
    console.error("deleteMedia error:", err);
    res.status(500).json({ message: "Failed to delete media" });
  }
};
