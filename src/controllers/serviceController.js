// src/controllers/serviceController.js
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Service from "../models/Service.js";

// Project-level uploads dir (must match server static serve and multer)
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// helper to build public URL for saved file
const fileUrlFromReq = (req, filename) => {
  if (!filename) return null;
  const host = req.get("host");
  const protocol = req.protocol;
  return `${protocol}://${host}/uploads/${encodeURIComponent(filename)}`;
};

// GET /api/services
export const getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 }).lean();

    const mapped = services.map((s) => {
      const img = s.img || "";
      if (img && /^https?:\/\//i.test(img)) {
        s.img = img;
      } else if (img) {
        const filename = path.basename(img);
        s.img = `${req.protocol}://${req.get("host")}/uploads/${encodeURIComponent(filename)}`;
      } else {
        s.img = "";
      }
      return s;
    });

    res.json(mapped);
  } catch (err) {
    console.error("getServices error:", err);
    res.status(500).json({ message: "Could not retrieve services" });
  }
};

// POST /api/services
// expects multipart/form-data with fields: title_en, title_ar, description_en, description_ar, image
export const addService = async (req, res) => {
  try {
    const { title_en, title_ar, description_en, description_ar } = req.body;

    // require all fields (both languages) per your request
    if (!title_en || !title_ar || !description_en || !description_ar) {
      if (req.file && req.file.path) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(400).json({ message: "All title and description fields (EN + AR) are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "image file is required (field name: image)" });
    }

    const filename = req.file.filename;
    const imgPath = `/uploads/${filename}`;

    const newService = new Service({
      title_en: title_en.trim(),
      title_ar: title_ar.trim(),
      description_en: description_en.trim(),
      description_ar: description_ar.trim(),
      img: imgPath,
    });

    await newService.save();

    const returned = newService.toObject();
    returned.img = fileUrlFromReq(req, filename);

    res.status(201).json({ message: "Service created", service: returned });
  } catch (err) {
    console.error("addService error:", err);
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ message: "Failed to create service" });
  }
};

// DELETE /api/services/:id
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Service id required" });

    // find and delete the document
    const service = await Service.findByIdAndDelete(id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    // attempt to remove local file if stored under uploads
    try {
      const imgVal = service.img || "";
      const filename = path.basename(imgVal);
      const candidate = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(candidate)) {
        fs.unlinkSync(candidate);
      }
    } catch (err) {
      console.warn("Warning: could not delete file for service", err);
      // not fatal
    }

    res.json({ message: "Service deleted" });
  } catch (err) {
    console.error("deleteService error:", err);
    res.status(500).json({ message: "Failed to delete service" });
  }
};
