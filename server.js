import express from "express";
import cors from "cors";
import { ENV } from "./config/env.js";
import analyzeRouter from "./routes/analyze.js";

const app = express();

app.use(cors({
  origin: ENV.CLIENT_URL,
}));
app.use(express.json());

// Routes
app.use("/api/analyze", analyzeRouter);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(ENV.PORT, () => {
  console.log(`Server running on port ${ENV.PORT}`);
});
