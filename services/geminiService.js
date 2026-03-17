import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../config/env.js";

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);

export const getModel = (modelName = "gemini-2.0-flash") => {
  return genAI.getGenerativeModel({
    model: modelName,
  });
};

export const model = getModel();
