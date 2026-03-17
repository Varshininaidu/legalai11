import express from "express";
import { model, getModel } from "../services/geminiService.js";

const router = express.Router();

const SYSTEM_PROMPT = `You are an AI Legal Document Risk Analyzer.

Your job is to analyze legal documents (contracts, agreements, policies)
and provide a structured risk assessment.

STRICT INSTRUCTIONS:

1. Read the document carefully.
2. Identify risky clauses, ambiguous terms, and missing protections.
3. Classify risks into:
   - High Risk
   - Moderate Risk
   - Low Risk

4. Provide output in STRICT JSON format.

OUTPUT FORMAT:

{
  "summary": "Short explanation of the document",
  "risk_score": {
    "safe_percentage": <number>,
    "moderate_percentage": <number>,
    "high_risk_percentage": <number>
  },
  "risks": [
    {
      "clause": "text",
      "risk_level": "High | Moderate | Low",
      "reason": "why it is risky",
      "suggestion": "how to improve"
    }
  ],
  "final_verdict": "Safe | Moderate | Risky"
}

RULES:
- Do NOT return plain text
- ONLY return JSON
- Be precise and professional
- If unsure, mark as Moderate Risk`;

router.post("/", async (req, res) => {
  try {
    const { documentText } = req.body;

    if (!documentText) {
      return res.status(400).json({ error: "documentText is required" });
    }

    const prompt = `
    ${SYSTEM_PROMPT}

    Analyze the following document:
    ${documentText}
    `;

    let result;
    try {
        result = await model.generateContent(prompt);
    } catch (e) {
        if (e.status === 404) {
            console.log("gemini-1.5-flash not found, retrying with gemini-pro...");
            const fallbackModel = getModel("gemini-pro");
            result = await fallbackModel.generateContent(prompt);
        } else {
            throw e;
        }
    }
    
    const response = await result.response.text();
    const cleanResponse = response.replace(/\`\`\`json|\`\`\`/g, "").trim();
    const parsed = JSON.parse(cleanResponse);

    res.json(parsed);
  } catch (err) {
    console.error("Gemini Analysis Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
