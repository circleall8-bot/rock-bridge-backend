// src/models/Media.js
import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    // bilingual titles & descriptions
    title_en: { type: String, trim: true, default: "" },
    title_ar: { type: String, trim: true, default: "" },
    description_en: { type: String, trim: true, default: "" },
    description_ar: { type: String, trim: true, default: "" },

    // stored as relative path like "/uploads/media/filename.ext"
    mediaUrl: { type: String, required: true, trim: true },

    // "image" | "video"
    mediaType: { type: String, required: true, enum: ["image", "video"] },

    // optional metadata
    size: { type: Number },
    mimeType: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const Media = mongoose.models.Media || mongoose.model("Media", MediaSchema);
export default Media;
