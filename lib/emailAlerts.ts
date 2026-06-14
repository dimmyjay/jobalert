import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
};

type SendJobMatchEmailProps = {
  to: string;
  reference: string;
  amount: number;
  alertType: string;
  keywords: string[];
  jobs: Job[];
};

function getJobUrl(job: Job) {
  if (job.applyLink) return job.applyLink;
  if (job.link) return job.link;
  if (job.url) return job.url;

  return `${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job.id}`;
}

export async function sendJobMatchEmail({
  to,
  reference,
  amount,
  alertType,
  keywords,
  jobs,
}: SendJobMatchEmailProps) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const jobListHtml = jobs.length
    ? jobs
        .map((job) => {
          const jobUrl = getJobUrl(job);

          return `
            <li style="margin-bottom: 18px; padding: 14px; border: 1px solid #ddd; border-radius: 10px;">
              <h3 style="margin: 0 0 6px;">${job.title || "Job Opportunity"}</h3>
              <p style="margin: 0 0 6px;"><strong>Company:</strong> ${
                job.company || "Not specified"
              }</p>
              <p style="margin: 0 0 6px;"><strong>Location:</strong> ${
                job.location || "Remote / Not specified"
              }</p>
              <p style="margin: 0 0 10px;"><strong>Salary:</strong> ${
                job.salary || "Not specified"
              }</p>
              <a href="${jobUrl}" style="background:#facc15;color:#000;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:bold;">
                View / Apply
              </a>
            </li>
          `;
        })
        .join("")
    : `
      <p>No exact job match was found immediately, but your alert is now active.</p>
      <p>You will receive new matching jobs automatically based on your selected alert frequency.</p>
    `;

  await resend.emails.send({
    from:
      process.env.EMAIL_FROM ||
      "TechTune Job Alerts <onboarding@resend.dev>",
    to,
    subject: "Your Job Alert Subscription is Active",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 20px;">
        <h2 style="color:#111;">Your Job Alert Subscription is Active ✅</h2>

        <p>Thank you for subscribing to TechTune Job Alerts.</p>

        <div style="background:#f7f7f7;padding:15px;border-radius:10px;margin:20px 0;">
          <p><strong>Payment Reference:</strong> ${reference}</p>
          <p><strong>Amount Paid:</strong> ₦${amount.toLocaleString()}</p>
          <p><strong>Alert Frequency:</strong> ${alertType}</p>
          <p><strong>Keywords:</strong> ${
            keywords.length ? keywords.join(", ") : "All jobs"
          }</p>
        </div>

        <h3>Your Matching Jobs</h3>

        <ul style="list-style:none;padding:0;margin:0;">
          ${jobListHtml}
        </ul>

        <div style="margin-top:25px;">
          <a href="${appUrl}/alerts" style="background:#111;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Manage My Job Alerts
          </a>
        </div>

        <p style="margin-top:25px;font-size:13px;color:#555;">
          To stop receiving alerts, visit:
          <a href="${appUrl}/alerts/unsubscribe">Unsubscribe</a>
        </p>
      </div>
    `,
  });
}