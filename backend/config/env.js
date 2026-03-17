import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Resolve the absolute path of this config file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Go one level up from /config to /backend, where .env lives
const envPath = path.resolve(__dirname, "..", ".env");

dotenv.config({ path: envPath });

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
};
