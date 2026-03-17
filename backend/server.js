import express from "express";
import cors from "cors";
import { ENV } from "./config/env.js";
import analyzeRouter from "./routes/analyze.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS: allow requests from the frontend (for local dev)
app.use(cors({ origin: ENV.CLIENT_URL }));
app.use(express.json({ limit: "10mb" }));

// Serve Static Frontend Files
const frontendPath = path.resolve(__dirname, "..");
app.use(express.static(frontendPath));

// Routes
app.use("/api/analyze", analyzeRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiKeySet: !!ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY !== "your_gemini_api_key_here" });
});

// Fallback: Serve index.html for any other route (SPA style)
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(ENV.PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${ENV.PORT}`);
  console.log(`🔑 Gemini API Key: ${ENV.GEMINI_API_KEY ? "Loaded ✓" : "❌ MISSING — add it to backend/.env"}`);
});
