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
      "clause": "text of the risky clause",
      "risk_level": "High | Moderate | Low",
      "reason": "why it is risky",
      "suggestion": "how to improve it"
    }
  ],
  "final_verdict": "Safe | Moderate | Risky"
}

RULES:
- Do NOT return plain text
- ONLY return valid JSON
- Be precise and professional
- If unsure, mark as Moderate Risk`;

router.post("/", async (req, res) => {
  try {
    const { documentText } = req.body;

    if (!documentText) {
      return res.status(400).json({ error: "documentText is required" });
    }

    const prompt = `${SYSTEM_PROMPT}\n\nAnalyze the following document:\n${documentText}`;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (e) {
      if (e.status === 404) {
        console.log("gemini-2.0-flash not available, retrying with gemini-1.5-pro...");
        const fallback = getModel("gemini-1.5-pro");
        result = await fallback.generateContent(prompt);
      } else {
        throw e;
      }
    }

    const raw = await result.response.text();
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.json(parsed);
  } catch (err) {
    console.error("Gemini Analysis Error:", err.message || err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
