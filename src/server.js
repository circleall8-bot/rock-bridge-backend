// src/server.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import AuthRoutes from "./routes/AuthRoutes.js";
import servicesRouter from "./routes/servicesRouter.js";
import mediaRouter from "./routes/mediaRouter.js";
import quoteRouter from "./routes/quoteRouter.js";
import path from "path";

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

// increase body size limit (adjust as needed)
const BODY_LIMIT = process.env.BODY_LIMIT || "10mb";

app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }));
app.use(cors());

// Serve uploaded files from the project-level "uploads" folder
// (ensure this matches the UPLOAD_DIR used by multer)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

connectDB();


app.use("/auth", AuthRoutes);
app.use("/services", servicesRouter);
app.use("/media", mediaRouter);
app.use("/quotes", quoteRouter);

app.get("/", (req, res) => res.send("Hello, Modular Backend!"));

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`Body parser limit: ${BODY_LIMIT}`);
});
