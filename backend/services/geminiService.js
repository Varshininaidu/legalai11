import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../config/env.js";

if (!ENV.GEMINI_API_KEY || ENV.GEMINI_API_KEY === "your_gemini_api_key_here") {
  console.error("⚠️  GEMINI_API_KEY is not set in backend/.env! Please add it.");
}

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);

export const getModel = (modelName = "gemini-2.5-flash") => {
  return genAI.getGenerativeModel({ model: modelName });
};

export const model = getModel();
