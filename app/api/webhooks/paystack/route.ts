import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDatabase } from "firebase-admin/database";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { sendJobMatchEmail } from "@/lib/emailAlerts";

export const runtime = "nodejs";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

type Job = {
  id?: string;
  title?: string;
  company?: string;
  location?: string;
  type?: string;
  salary?: string;
  description?: string;
  applyLink?: string;
  link?: string;
  url?: string;
  category?: string;
  skills?: string[];
};

function normalizeKeywords(keywords: unknown): string[] {
  if (Array.isArray(keywords)) {
    return keywords.map(String).filter(Boolean);
  }

  if (typeof keywords === "string") {
    return keywords
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);
  }

  return [];
}

function matchJobsWithKeywords(jobs: Job[], keywords: string[]) {
  if (!keywords.length) {
    return jobs.slice(0, 10);
  }

  const cleanKeywords = keywords.map((keyword) => keyword.toLowerCase());

  return jobs
    .filter((job) => {
      const searchableText = [
        job.title,
        job.company,
        job.location,
        job.type,
        job.salary,
        job.description,
        job.category,
        Array.isArray(job.skills) ? job.skills.join(" ") : "",
      ]
        .join(" ")
        .toLowerCase();

      return cleanKeywords.some((keyword) => searchableText.includes(keyword));
    })
    .slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    const paystackSignature = req.headers.get("x-paystack-signature") || "";

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY is missing");
      return NextResponse.json(
        { error: "Server payment secret is missing" },
        { status: 500 }
      );
    }

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (hash !== paystackSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const paymentData = event.data;

      const email = paymentData.customer?.email;
      const reference = paymentData.reference;
      const amount = paymentData.amount / 100;
      const metadata = paymentData.metadata || {};

      const alertType = metadata.alertType || metadata.frequency || "daily";
      const keywords = normalizeKeywords(metadata.keywords);

      if (!email || !reference) {
        console.error("Missing email or reference from Paystack webhook");
        return NextResponse.json(
          { error: "Missing email or reference" },
          { status: 400 }
        );
      }

      const db = getDatabase();

     await db.ref(`jobAlertSubscriptions/${reference}`).set({
  id: reference,
  email,
  keyword: keywords[0] || "",
  keywords,
  location: metadata.location || "Remote",
  frequency: alertType,
  status: "active",
  amount,
  paymentReference: reference,
  createdAt: new Date().toISOString(),
  activatedAt: new Date().toISOString(),
});

      const jobsSnapshot = await db.ref("jobs").once("value");
      const jobsData = jobsSnapshot.val() || {};

      const allJobs: Job[] = Object.entries(jobsData).map(([id, value]) => ({
        id,
        ...(value as Job),
      }));

      const matchedJobs = matchJobsWithKeywords(allJobs, keywords);

      await sendJobMatchEmail({
        to: email,
        reference,
        amount,
        alertType,
        keywords,
        jobs: matchedJobs,
      });

      console.log(`Subscription activated and job email sent to ${email}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}