import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are an AI Legal Document Risk Analyzer.

Your job is to analyze legal documents (contracts, agreements, policies)
and provide a structured risk assessment.

STRICT INSTRUCTIONS:
1. Read the document carefully.
2. Identify risky clauses, ambiguous terms, and missing protections.
3. Classify risks into: High Risk, Moderate Risk, or Low Risk.
4. Provide output in STRICT JSON format only.

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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set in Vercel environment variables." });
  }

  try {
    const { documentText } = req.body;

    if (!documentText) {
      return res.status(400).json({ error: "documentText is required" });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `${SYSTEM_PROMPT}\n\nAnalyze the following document:\n${documentText}`;

    const result = await model.generateContent(prompt);
    const raw = await result.response.text();
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Gemini Analysis Error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
