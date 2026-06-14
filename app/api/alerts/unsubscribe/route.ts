import { NextRequest, NextResponse } from "next/server";
import { unsubscribeSubscription } from "@/lib/jobAlerts";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Subscription ID is required." },
        { status: 400 }
      );
    }

    await unsubscribeSubscription(id);

    return new NextResponse(
      `
      <html>
        <body style="font-family:Arial;padding:40px;">
          <h1>Unsubscribed</h1>
          <p>You have successfully unsubscribed from job alerts.</p>
        </body>
      </html>
      `,
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unsubscribe failed.",
      },
      { status: 500 }
    );
  }
}