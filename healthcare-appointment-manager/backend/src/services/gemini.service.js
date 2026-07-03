const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

/**
 * Generates a pre-visit summary from patient-submitted symptoms.
 * Returns a graceful fallback object if the LLM call fails so booking
 * flow never breaks because of an LLM outage.
 */
async function generatePreVisitSummary(symptoms) {
  const prompt = `Analyse these symptoms and return ONLY valid JSON with keys
"urgencyLevel" (Low | Medium | High), "chiefComplaint" (string), and
"suggestedQuestions" (array of 3 strings). Symptoms: ${symptoms}`;

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);

    return {
      urgencyLevel: parsed.urgencyLevel || "Medium",
      summary: `Chief complaint: ${parsed.chiefComplaint}. Suggested questions: ${(
        parsed.suggestedQuestions || []
      ).join(" | ")}`,
    };
  } catch (err) {
    console.error("Gemini pre-visit summary failed:", err.message);
    return {
      urgencyLevel: "Medium",
      summary: `Auto-summary unavailable. Raw symptoms reported: ${symptoms}`,
    };
  }
}

/**
 * Converts a doctor's clinical notes into a patient-friendly summary.
 */
async function generatePostVisitSummary(notes) {
  const prompt = `Convert these clinical notes into a patient-friendly summary with
a medication schedule and follow-up steps. Keep it warm and easy to understand.
Notes: ${notes}`;

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error("Gemini post-visit summary failed:", err.message);
    return `Summary unavailable at this time. Please refer to your doctor's original notes: ${notes}`;
  }
}

module.exports = { generatePreVisitSummary, generatePostVisitSummary };
