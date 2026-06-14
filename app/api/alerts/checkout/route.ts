import { NextRequest, NextResponse } from "next/server";
import { createPendingSubscription } from "@/lib/jobAlerts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, keyword, location, frequency } = await req.json();

    if (!email || !keyword || !frequency) {
      return NextResponse.json(
        { error: "Email, keyword and frequency are required." },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!secretKey) {
      return NextResponse.json(
        { error: "PAYSTACK_SECRET_KEY is missing." },
        { status: 500 }
      );
    }

    const amount = frequency === "daily" ? 200000 : 100000;
    const reference = `job_alert_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount,
          reference,
          callback_url: `${appUrl}/api/alerts/verify?reference=${reference}`,
          metadata: {
            email,
            keyword,
            location,
            frequency,
            service: "job_alerts",
          },
        }),
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || "Paystack checkout failed." },
        { status: 400 }
      );
    }

    await createPendingSubscription({
      email,
      keyword,
      location,
      frequency,
      amount,
      paymentReference: reference,
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}