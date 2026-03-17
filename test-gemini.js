import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const key = process.env.GEMINI_API_KEY;
console.log("API Key found:", key ? "Yes (starts with " + key.substring(0, 4) + ")" : "No");

const genAI = new GoogleGenerativeAI(key);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say hello");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Test Failed:");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
    if (error.response) {
        console.error("Response data:", await error.response.text());
    }
  }
}

test();
