import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing" },
        { status: 500 }
      );
    }

    const userTopic =
      topic || "general job search and career growth";

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful career coach. Give practical, clear, professional career tips for job seekers. Keep the answer useful and easy to follow.",
            },
            {
              role: "user",
              content: `Give me career tips about: ${userTopic}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 600,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          error: "Groq request failed",
          details: errorText,
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    const tips =
      data.choices?.[0]?.message?.content ||
      "No career tips generated.";

    return NextResponse.json({
      success: true,
      tips,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate career tips",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}