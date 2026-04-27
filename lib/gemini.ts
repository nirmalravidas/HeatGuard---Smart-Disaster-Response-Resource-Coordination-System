export async function analyzeWithGemini(text: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.log("Gemini API key missing, using fallback AI");
    return fallbackAI(text);
  }

  const prompt = `You are HeatGuard AI disaster response system.\n\nAnalyze this heatwave report and return ONLY JSON.\n\nText: ${text}\n\nFormat:\n{\n  "urgency_score": number (0-100),\n  "needed_resources": [\"water\",\"medical\",\"ORS\",\"cooling\"],\n  "explanation": \"short reasoning\"\n}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: {
            text: prompt,
          },
          temperature: 0.2,
        }),
      }
    );

    if (!res.ok) {
      console.log("Gemini response error", await res.text());
      throw new Error("Gemini request failed");
    }

    const data = await res.json();

    const raw =
      data?.candidates?.[0]?.content ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.message?.content?.[0]?.text;

    if (!raw) throw new Error("Empty Gemini response");

    return JSON.parse(String(raw).replace(/```json|```/g, ""));
  } catch (err) {
    console.log("Gemini failed → fallback AI used", err);

    return fallbackAI(text);
  }
}

// SAFE FALLBACK LOGIC
function fallbackAI(text: string) {
  const lower = text.toLowerCase();

  let score = 50;
  if (lower.includes("death") || lower.includes("unconscious")) score = 90;
  else if (lower.includes("hospital") || lower.includes("collapse")) score = 80;
  else if (lower.includes("water") || lower.includes("heat")) score = 70;

  const resources = [];
  if (lower.includes("water") || lower.includes("thirst")) resources.push("water");
  if (lower.includes("medical") || lower.includes("injury") || lower.includes("hospital")) resources.push("medical");
  if (lower.includes("ors")) resources.push("ORS");
  if (lower.includes("cool") || lower.includes("heat")) resources.push("cooling");
  if (!resources.length) resources.push("water", "ORS", "medical");

  return {
    urgency_score: score,
    needed_resources: resources,
    explanation: "Fallback AI used due to Gemini unavailability.",
  };
}