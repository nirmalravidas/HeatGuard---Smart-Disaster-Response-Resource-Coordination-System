import { NextResponse } from "next/server";
import { analyzeWithGemini } from "@/lib/gemini";

export async function POST(req: Request) {
  const { text } = await req.json();

  const result = await analyzeWithGemini(text);

  return NextResponse.json(result);
}