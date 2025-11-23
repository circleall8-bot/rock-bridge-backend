// src/models/QuoteRequest.js
import mongoose from "mongoose";

const QuoteRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const QuoteRequest = mongoose.models.QuoteRequest || mongoose.model("QuoteRequest", QuoteRequestSchema);
export default QuoteRequest;
