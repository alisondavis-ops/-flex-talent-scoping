import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { system, user } = await req.json();
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        system,
        messages: [{ role: "user", content: user }],
      });
      const text = msg.content.find((b) => b.type === "text")?.text ?? "";
      return NextResponse.json({ text });
    } catch (err: any) {
      const isOverloaded = err?.status === 529 || err?.status === 503;
      if (isOverloaded && attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 2000));
        continue;
      }
      console.error(err);
      return NextResponse.json({ error: "API call failed" }, { status: 500 });
    }
  }
}