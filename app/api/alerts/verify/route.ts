import { NextRequest, NextResponse } from "next/server";
import { activateSubscriptionByReference } from "@/lib/jobAlerts";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const reference = req.nextUrl.searchParams.get("reference");

    if (!reference) {
      return NextResponse.redirect(
        new URL("/alerts?error=missing_reference", req.url)
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "PAYSTACK_SECRET_KEY is missing." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || data.data?.status !== "success") {
      return NextResponse.redirect(
        new URL("/alerts?payment=failed", req.url)
      );
    }

    await activateSubscriptionByReference(reference);

    return NextResponse.redirect(
      new URL("/alerts?payment=success", req.url)
    );
  } catch {
    return NextResponse.redirect(new URL("/alerts?payment=error", req.url));
  }
}