// src/models/Service.js
import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema(
  {
    title_en: { type: String, required: true, trim: true },
    title_ar: { type: String, required: true, trim: true },
    description_en: { type: String, required: true, trim: true },
    description_ar: { type: String, required: true, trim: true },
    img: { type: String, required: true, trim: true }, // relative path like "/uploads/filename"
  },
  { timestamps: true }
);

const Service = mongoose.models.Service || mongoose.model("Service", ServiceSchema);
export default Service;
