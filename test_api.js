import dotenv from "dotenv";
dotenv.config();

const key = process.env.GEMINI_API_KEY;

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("STATUS:", res.status);
    if (data.models) {
      console.log("AVAILABLE MODELS:");
      data.models.forEach(m => console.log(` - ${m.name} (${m.displayName})`));
    } else {
      console.log("NO MODELS FOUND. DATA:", JSON.stringify(data));
    }
  } catch (error) {
    console.error("FETCH ERROR:", error.message);
  }
}

listModels();
