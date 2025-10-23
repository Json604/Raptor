import { GoogleGenAI } from '@google/genai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const analyzeReportWithAI = async (rawReport) => {
  // Prompt for technical/in-depth audience
  const inDepthPrompt = `
You are a cybersecurity expert. Analyze the following security scan report in detail.

Return a JSON object with:
1. "summary": detailed technical explanation of vulnerabilities.
2. "fixes": an array of objects, each with:
   - "issue": technical issue description
   - "recommendation": precise developer-oriented fix

Format strictly as JSON.

Report: ${JSON.stringify(rawReport)}
`;

  // Prompt for vibe-coding/non-technical audience
const vibePrompt = `
You are a cybersecurity assistant. Analyze the following security scan report.

Task 1: Provide a plain English summary of the report suitable for a non-technical creator (vibe-coder). 
- Keep it simple, short, and easy to understand.
- Focus on what is risky and why it matters in plain terms.

Task 2: For each vulnerability or issue, provide a **short, step-by-step fix**.
- Keep each step **concise and to the point**.
- Specify exactly **what to do, where, and how** in code or settings.
- Include a field "necessary" which is a **short line explaining if the issue is necessary to fix and why**.

Format your response as JSON like:

{
  "summary": "Plain English summary for non-coders",
  "fixes": [
    {
      "issue": "Issue description",
      "stepByStep": [
        "Step 1: ...",
        "Step 2: ...",
        "Step 3: ..."
      ],
      "necessary": "Yes — critical to fix because exposed API keys can be stolen"
    }
  ]
}

Report: ${JSON.stringify(rawReport)}
`;



  // Generate both AI responses in parallel
  const [inDepthResp, vibeResp] = await Promise.all([
    ai.models.generateContent({ model: 'gemini-2.0-flash-001', contents: inDepthPrompt }),
    ai.models.generateContent({ model: 'gemini-2.0-flash-001', contents: vibePrompt }),
  ]);

  // Helper to clean and parse AI response
  const parseAIResponse = (text) => {
    let aiText = text.trim();
    if (aiText.startsWith("```")) {
      const firstNewline = aiText.indexOf("\n");
      const lastBackticks = aiText.lastIndexOf("```");
      aiText = aiText.substring(firstNewline + 1, lastBackticks).trim();
    }
    try {
      return JSON.parse(aiText);
    } catch (err) {
      console.error("Failed to parse AI response:", aiText);
      return { summary: "AI response parsing failed", fixes: [] };
    }
  };

  return {
    inDepth: parseAIResponse(inDepthResp.text),
    vibe: parseAIResponse(vibeResp.text),
  };
};
