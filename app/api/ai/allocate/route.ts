import { NextResponse } from "next/server";

function normalizeResources(resources: string[] = []) {
  const normalized = new Set<string>();

  resources.forEach((resource) => {
    const lower = resource.toLowerCase();
    if (lower.includes("water")) normalized.add("water");
    if (lower.includes("medical")) normalized.add("medical");
    if (lower.includes("ors")) normalized.add("ORS");
    if (lower.includes("cool")) normalized.add("cooling");
  });

  if (!normalized.size) {
    normalized.add("water");
    normalized.add("medical");
  }

  return Array.from(normalized);
}

function buildFallbackAllocation(reports: any[], camps: any[]) {
  if (!Array.isArray(camps) || camps.length === 0) {
    camps = [
      {
        id: "camp-1",
        name: "North Relief Camp",
        currentLoad: 0,
        capacity: 50,
        supplies: { water: 200, medicalKits: 20, ORS: 100, coolingKits: 20 },
      },
      {
        id: "camp-2",
        name: "East Relief Camp",
        currentLoad: 0,
        capacity: 35,
        supplies: { water: 180, medicalKits: 18, ORS: 80, coolingKits: 15 },
      },
      {
        id: "camp-3",
        name: "South Relief Camp",
        currentLoad: 0,
        capacity: 45,
        supplies: { water: 220, medicalKits: 25, ORS: 120, coolingKits: 25 },
      },
    ];
  }

  const allocations = reports.map((report: any) => {
    const needs = normalizeResources(report.resources || report.needed_resources || []);

    const assignedResources = {
      water: needs.includes("water") ? Math.max(20, Math.round((report.urgencyScore || 50) * 0.35)) : 0,
      medicalKits: needs.includes("medical") ? Math.max(1, Math.ceil((report.urgencyScore || 50) / 40)) : 0,
      ORS: needs.includes("ORS") ? Math.max(10, Math.round((report.urgencyScore || 50) * 0.2)) : 0,
      coolingKits: needs.includes("cooling") ? Math.max(5, Math.round((report.urgencyScore || 50) * 0.15)) : 0,
    };

    let bestCamp = camps[0];
    let bestScore = Number.MAX_SAFE_INTEGER;

    camps.forEach((camp: any) => {
      const loadRatio = (camp.currentLoad || 0) / Math.max(camp.capacity || 1, 1);
      const hasMinimum =
        (camp.supplies?.water ?? 0) >= 20 &&
        (camp.supplies?.medicalKits ?? 0) >= 1 &&
        (camp.supplies?.ORS ?? 0) >= 10;
      const score = loadRatio + (hasMinimum ? 0 : 1);

      if (score < bestScore) {
        bestScore = score;
        bestCamp = camp;
      }
    });

    const hasEnough =
      (bestCamp.supplies?.water ?? 0) >= assignedResources.water &&
      (bestCamp.supplies?.medicalKits ?? 0) >= assignedResources.medicalKits &&
      (bestCamp.supplies?.ORS ?? 0) >= assignedResources.ORS &&
      (bestCamp.supplies?.coolingKits ?? 0) >= assignedResources.coolingKits;

    return {
      reportId: report.id,
      campId: bestCamp.id,
      campName: bestCamp.name || bestCamp.id || "Assigned Camp",
      resources: assignedResources,
      priority: report.urgencyScore || 50,
      supplyStatus: hasEnough ? "available" : "limited",
    };
  });

  return {
    allocations,
    bias_score: 10,
    audit_notes:
      "Fallback allocation used due to AI unavailability. Distribution is based on urgency, reported resource needs, and available camp supplies.",
  };
}

function parseGeminiContent(raw: any) {
  try {
    if (typeof raw !== "string") return raw;
    return JSON.parse(String(raw).replace(/```json|```/g, ""));
  } catch (error) {
    return null;
  }
}

export async function POST(req: Request) {
  const { reports, camps } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!Array.isArray(reports) || reports.length === 0) {
    return NextResponse.json({
      allocations: [],
      bias_score: 0,
      audit_notes: "No reports provided for allocation.",
    });
  }

  try {
    if (!apiKey) throw new Error("Gemini API key missing");

    const prompt = `You are HeatGuard AI Allocation Engine.\n\nYou must:\n- Prioritize disaster reports\n- Assign camps logically\n- Avoid bias\n- Optimize resource distribution\n\nReports:\n${JSON.stringify(reports, null, 2)}\n\nAvailable camps and inventory:\n${JSON.stringify(camps || [], null, 2)}\n\nReturn ONLY JSON:\n{\n  "allocations": [\n    {\n      "reportId": "",\n      "campId": "",\n      "campName": "",\n      "resources": {"water": 0, "medicalKits": 0, "ORS": 0, "coolingKits": 0},\n      "priority": number,\n      "supplyStatus": "available|limited"\n    }\n  ],\n  "bias_score": number,\n  "audit_notes": ""\n}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: { text: prompt }, temperature: 0.2 }),
      }
    );

    if (!res.ok) {
      console.log("Gemini allocation error", await res.text());
      throw new Error("Gemini allocation failed");
    }

    const data = await res.json();
    const raw =
      data?.candidates?.[0]?.content ||
      data?.candidates?.[0]?.message?.content?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = parseGeminiContent(raw);

    if (parsed && Array.isArray(parsed.allocations)) {
      return NextResponse.json(parsed);
    }

    throw new Error("Empty or invalid Gemini allocation response");
  } catch (err) {
    console.log("Gemini failed → fallback allocation used", err);
    return NextResponse.json(buildFallbackAllocation(reports, camps));
  }
}
