import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const key = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(key);

async function listModels() {
  try {
    // Note: The newer versions of the SDK might not have a simple listModels on the genAI instance
    // but we can try to fetch from the API directly or check documentation.
    // Actually, newer SDKs use the REST API for listing.
    
    // Let's try to just test "gemini-1.5-flash-latest" or "gemini-pro"
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    
    for (const modelName of modelsToTry) {
        console.log(`Testing ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("test");
            console.log(`  Success with ${modelName}!`);
            return;
        } catch (e) {
            console.log(`  Failed with ${modelName}: ${e.message}`);
        }
    }
  } catch (error) {
    console.error("List Test Failed:", error);
  }
}

listModels();
