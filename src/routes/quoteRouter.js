// src/routes/quoteRouter.js
import express from "express";
import { addQuote, deleteQuote, getQuotes } from "../controllers/quoteController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();


// POST create a quote request
router.post("/", addQuote);
router.use(requireAuth);
router.get("/", getQuotes);
// GET all quote requests
router.delete("/:id", deleteQuote);
export default router;
