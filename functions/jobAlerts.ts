import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { Resend } from "resend";
import axios from "axios";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

const resend = new Resend(process.env.RESEND_API_KEY);

type Frequency = "hourly" | "daily" | "weekly";

type Subscription = {
  id?: string;
  email: string;
  keywords?: string[];
  keyword?: string;
  locations?: string[];
  location?: string;
  workLocations?: string[];
  jobTypes?: string[];
  excludeKeywords?: string[];
  minSalary?: number | null;
  maxSalary?: number | null;
  frequency?: Frequency;
  alertFrequency?: Frequency;
  status?: string;
  isActive?: boolean;
  nextAlertDate?: string;
  sentJobIds?: Record<string, boolean>;
};

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  tags: string[];
  jobType?: string;
  workLocation?: string;
};

function getFrequency(sub: Subscription): Frequency {
  return sub.frequency || sub.alertFrequency || "daily";
}

function calculateNextAlertDate(frequency: Frequency): string {
  const now = new Date();

  if (frequency === "hourly") {
    now.setHours(now.getHours() + 1);
  }

  if (frequency === "daily") {
    now.setDate(now.getDate() + 1);
  }

  if (frequency === "weekly") {
    now.setDate(now.getDate() + 7);
  }

  return now.toISOString();
}

async function fetchJobs(): Promise<Job[]> {
  const response = await axios.get("https://remoteok.com/api", {
    headers: {
      "User-Agent": "TechTune Job Alerts",
    },
  });

  const jobs = Array.isArray(response.data) ? response.data.slice(1) : [];

  return jobs.map((job: any) => ({
    id: String(job.id),
    title: job.position || job.title || "Remote Job",
    company: job.company || "Company",
    location: job.location || "Remote",
    description: String(job.description || "").replace(/<[^>]+>/g, " "),
    url: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
    tags: Array.isArray(job.tags) ? job.tags : [],
    jobType: "Full-time",
    workLocation: "digital",
  }));
}

function matchJobs(jobs: Job[], sub: Subscription): Job[] {
  const keywords = [
    ...(sub.keywords || []),
    ...(sub.keyword ? [sub.keyword] : []),
  ].map((k) => k.toLowerCase());

  const locations = [
    ...(sub.locations || []),
    ...(sub.location ? [sub.location] : []),
  ].map((l) => l.toLowerCase());

  const workLocations = (sub.workLocations || []).map((w) =>
    w.toLowerCase()
  );

  const jobTypes = (sub.jobTypes || []).map((j) => j.toLowerCase());

  const excludes = (sub.excludeKeywords || []).map((e) => e.toLowerCase());

  const sentJobIds = sub.sentJobIds || {};

  return jobs
    .filter((job) => {
      if (sentJobIds[job.id]) return false;

      const text = [
        job.title,
        job.company,
        job.location,
        job.description,
        job.jobType,
        job.workLocation,
        job.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const keywordMatch =
        keywords.length === 0 ||
        keywords.some((keyword) => text.includes(keyword));

      const locationMatch =
        locations.length === 0 ||
        locations.some(
          (location) =>
            job.location.toLowerCase().includes(location) ||
            job.location.toLowerCase() === "remote"
        );

      const workLocationMatch =
        workLocations.length === 0 ||
        workLocations.includes((job.workLocation || "").toLowerCase());

      const jobTypeMatch =
        jobTypes.length === 0 ||
        jobTypes.includes((job.jobType || "").toLowerCase());

      const excluded = excludes.some((word) => text.includes(word));

      return (
        keywordMatch &&
        locationMatch &&
        workLocationMatch &&
        jobTypeMatch &&
        !excluded
      );
    })
    .slice(0, 10);
}

async function sendJobEmail(sub: Subscription, jobs: Job[]) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const frequency = getFrequency(sub);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #facc15, #fb923c, #ef4444); padding: 25px; border-radius: 14px; color: #000;">
        <h1 style="margin:0;">Your ${frequency} Job Matches</h1>
        <p style="margin:8px 0 0;">TechTune International found ${jobs.length} new job match${
    jobs.length > 1 ? "es" : ""
  } for you.</p>
      </div>

      <div style="padding: 20px 0;">
        ${jobs
          .map(
            (job) => `
              <div style="padding:16px;border:1px solid #ddd;margin-bottom:15px;border-radius:12px;background:#fff;">
                <h3 style="margin:0 0 8px;">${job.title}</h3>
                <p><strong>Company:</strong> ${job.company}</p>
                <p><strong>Location:</strong> ${job.location}</p>
                <p>${job.description.slice(0, 250)}...</p>
                <a href="${job.url}" target="_blank"
                  style="display:inline-block;background:#facc15;color:#000;padding:10px 15px;text-decoration:none;border-radius:8px;font-weight:bold;">
                  Apply Now
                </a>
              </div>
            `
          )
          .join("")}
      </div>

      <p style="font-size:13px;color:#666;">
        You are receiving this because your JobAlert subscription is active.
      </p>

      <p>
        <a href="${appUrl}/alerts">Manage Subscription</a>
      </p>
    </div>
  `;

  await resend.emails.send({
    from:
      process.env.EMAIL_FROM ||
      "TechTune Job Alerts <onboarding@resend.dev>",
    to: sub.email,
    subject: `Your ${frequency} Job Matches from TechTune`,
    html,
  });
}

export const sendScheduledJobAlerts = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "Africa/Lagos",
    secrets: ["RESEND_API_KEY"],
  },
  async () => {
    const snapshot = await db.ref("jobAlertSubscriptions").once("value");

    if (!snapshot.exists()) {
      logger.info("No active job alert subscriptions found");
      return;
    }

    const jobs = await fetchJobs();
    const subscriptions = snapshot.val();
    const now = new Date();

    for (const [subscriptionId, value] of Object.entries(subscriptions)) {
      const sub = value as Subscription;

      const isActive = sub.status === "active" || sub.isActive === true;

      if (!isActive) continue;
      if (!sub.email) continue;

      const frequency = getFrequency(sub);

      const nextAlertDate = sub.nextAlertDate
        ? new Date(sub.nextAlertDate)
        : new Date(0);

      if (nextAlertDate > now) {
        logger.info(
          `Skipping ${sub.email}. Next ${frequency} alert is due at ${sub.nextAlertDate}`
        );
        continue;
      }

      const matches = matchJobs(jobs, sub);

      const sentJobIds = {
        ...(sub.sentJobIds || {}),
      };

      if (matches.length > 0) {
        await sendJobEmail(sub, matches);

        matches.forEach((job) => {
          sentJobIds[job.id] = true;
        });
      }

      await db.ref(`jobAlertSubscriptions/${subscriptionId}`).update({
        frequency,
        alertFrequency: frequency,
        lastAlertSentAt: new Date().toISOString(),
        nextAlertDate: calculateNextAlertDate(frequency),
        sentJobIds,
        updatedAt: new Date().toISOString(),
      });

      logger.info(
        `Processed ${frequency} alert for ${sub.email}. Sent ${matches.length} job(s).`
      );
    }
  }
);