import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getJobsForEmailAlert } from '@/lib/jobMatcher';
import { fetchAllJobs } from '@/lib/jobUtils';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailAlertRequest {
  email: string;
  preferences: {
    keywords: string[];
    locations: string[];
    workLocations: ('digital' | 'onsite' | 'hybrid')[];
    minSalary: number | null;
    maxSalary: number | null;
    jobTypes: string[];
    excludeKeywords: string[];
  };
  alertFrequency: 'hourly' | 'daily' | 'weekly';
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  workLocation: 'digital' | 'onsite' | 'hybrid';
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  wages?: {
    hourlyMin: number;
    hourlyMax: number;
    currency: string;
  };
  description: string;
  url: string;
  tags: string[];
  postedDate: string;
  jobType: string;
  applicationUrl?: string;
}

/**
 * Format job salary for display
 */
function formatJobSalary(job: Job): string {
  if (job.salary) {
    const min = (job.salary.min / 1000).toFixed(0);
    const max = (job.salary.max / 1000).toFixed(0);
    return `${job.salary.currency}${min}k - ${job.salary.currency}${max}k`;
  } else if (job.wages) {
    return `${job.wages.currency}${job.wages.hourlyMin} - ${job.wages.currency}${job.wages.hourlyMax}/hr`;
  }
  return 'Not specified';
}

/**
 * Get work location badge
 */
function getWorkLocationBadge(workLocation: string): string {
  const badges: Record<string, string> = {
    digital: '💻 Remote',
    onsite: '🏢 On-site',
    hybrid: '🔄 Hybrid',
  };
  return badges[workLocation] || 'Remote';
}

/**
 * Generate job card HTML for email
 */
function generateJobCardHTML(job: Job): string {
  const salary = formatJobSalary(job);
  const workLocation = getWorkLocationBadge(job.workLocation);

  return `
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
        <div>
          <h3 style="margin: 0 0 5px 0; color: #1a1a1a; font-size: 16px; font-weight: bold;">
            ${escapeHtml(job.title)}
          </h3>
          <p style="margin: 0 0 5px 0; color: #ffc107; font-size: 14px; font-weight: bold;">
            ${escapeHtml(job.company)}
          </p>
        </div>
      </div>

      <p style="margin: 0 0 10px 0; color: #555; font-size: 13px; line-height: 1.5;">
        ${escapeHtml(job.description.substring(0, 180))}...
      </p>

      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; font-size: 12px;">
        <span style="background-color: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px;">📍 ${escapeHtml(job.location)}</span>
        <span style="background-color: #f3e5f5; color: #7b1fa2; padding: 4px 8px; border-radius: 4px;">${workLocation}</span>
        <span style="background-color: #e8f5e9; color: #388e3c; padding: 4px 8px; border-radius: 4px;">💼 ${escapeHtml(job.jobType)}</span>
        <span style="background-color: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px;">💰 ${salary}</span>
      </div>

      <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;">
        ${job.tags
          .slice(0, 4)
          .map(
            (tag) =>
              `<span style="display: inline-block; background-color: #f0f0f0; color: #666; padding: 3px 6px; border-radius: 3px; font-size: 12px;">${escapeHtml(tag)}</span>`
          )
          .join('')}
        ${
          job.tags.length > 4
            ? `<span style="display: inline-block; background-color: #f0f0f0; color: #666; padding: 3px 6px; border-radius: 3px; font-size: 12px;">+${job.tags.length - 4} more</span>`
            : ''
        }
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #999; font-size: 12px;">Posted: ${new Date(job.postedDate).toLocaleDateString()}</span>
        <a href="${escapeHtml(job.applicationUrl || job.url)}" style="display: inline-block; background-color: #ffc107; color: #000; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 12px;">
          Apply Now →
        </a>
      </div>
    </div>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generate complete email HTML
 */
function generateEmailHTML(
  jobs: Job[],
  preferences: EmailAlertRequest['preferences'],
  alertFrequency: string
): string {
  const jobsHTML = jobs.map((job) => generateJobCardHTML(job)).join('');

  const frequencyText: Record<string, string> = {
    hourly: 'every hour',
    daily: 'every day',
    weekly: 'every week',
  };

  const workLocationText = preferences.workLocations
    .map((wl) => (wl === 'digital' ? 'Remote' : wl === 'onsite' ? 'On-site' : 'Hybrid'))
    .join(', ');

  const salaryRange =
    preferences.minSalary || preferences.maxSalary
      ? `$${preferences.minSalary || 'Any'} - $${preferences.maxSalary || 'Any'}`
      : 'Any';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #ffc107 0%, #ff6b35 100%);
          color: #000;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 30px 20px;
          background-color: #fff;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .intro {
          font-size: 15px;
          color: #555;
          margin-bottom: 20px;
          line-height: 1.8;
        }
        .preferences-box {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
          border-left: 4px solid #ffc107;
        }
        .preferences-box h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: bold;
          color: #333;
        }
        .preference-item {
          font-size: 13px;
          color: #555;
          margin-bottom: 8px;
          display: flex;
          gap: 10px;
        }
        .preference-label {
          font-weight: bold;
          min-width: 80px;
        }
        .jobs-section h2 {
          color: #1a1a1a;
          border-bottom: 2px solid #ffc107;
          padding-bottom: 10px;
          margin: 20px 0;
          font-size: 18px;
        }
        .no-jobs {
          text-align: center;
          padding: 30px;
          color: #999;
          font-size: 14px;
        }
        .cta-button {
          display: inline-block;
          background-color: #ffc107;
          color: #000;
          padding: 12px 30px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
          font-size: 16px;
          margin: 20px 0;
          text-align: center;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #999;
          font-size: 12px;
          border-top: 1px solid #e0e0e0;
          background-color: #f9f9f9;
          border-radius: 0 0 8px 8px;
        }
        .footer a {
          color: #ffc107;
          text-decoration: none;
        }
        .alert-frequency {
          background-color: #e8f5e9;
          padding: 12px;
          border-radius: 4px;
          margin: 15px 0;
          color: #2e7d32;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ JobAlert</h1>
          <p>${jobs.length} New Job${jobs.length !== 1 ? 's' : ''} Match Your Preferences</p>
          <p>${alertFrequency.charAt(0).toUpperCase() + alertFrequency.slice(1)} Alert</p>
        </div>

        <div class="content">
          <p class="intro">
            Hi there! 👋<br>
            We found <strong>${jobs.length} job${jobs.length !== 1 ? 's' : ''}</strong> that perfectly match your preferences. Check them out below:
          </p>

          <div class="preferences-box">
            <h3>📋 Your Preferences:</h3>
            <div class="preference-item">
              <span class="preference-label">🔍 Skills:</span>
              <span>${preferences.keywords.join(', ')}</span>
            </div>
            <div class="preference-item">
              <span class="preference-label">📍 Location:</span>
              <span>${preferences.locations.join(', ')}</span>
            </div>
            <div class="preference-item">
              <span class="preference-label">🌍 Work Type:</span>
              <span>${workLocationText}</span>
            </div>
            <div class="preference-item">
              <span class="preference-label">💼 Job Type:</span>
              <span>${preferences.jobTypes.join(', ')}</span>
            </div>
            <div class="preference-item">
              <span class="preference-label">💰 Salary:</span>
              <span>${salaryRange}</span>
            </div>
          </div>

          <div class="alert-frequency">
            📅 <strong>Next alert:</strong> ${frequencyText[alertFrequency]}
          </div>

          <div class="jobs-section">
            <h2>Matching Jobs:</h2>
            ${
              jobs.length > 0
                ? jobsHTML
                : '<div class="no-jobs">No new jobs match your criteria at this time. We\'ll send you matching jobs as soon as they appear!</div>'
            }
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs" class="cta-button">
              Browse All Jobs
            </a>
          </div>

          <p style="font-size: 13px; color: #999; text-align: center; margin-top: 20px;">
            💡 <strong>Tip:</strong> You can update your preferences anytime by visiting your subscription settings.
          </p>
        </div>

        <div class="footer">
          <p>You received this email because you subscribed to JobAlert notifications.</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/alerts">Update Preferences</a> | 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}">JobAlert</a>
          </p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} JobAlert. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send email alert to user using Resend
 */
async function sendEmailAlert(
  email: string,
  jobs: Job[],
  preferences: EmailAlertRequest['preferences'],
  alertFrequency: string
): Promise<void> {
  try {
    const htmlContent = generateEmailHTML(jobs, preferences, alertFrequency);

    const jobCount = jobs.length;
    const subject =
      jobCount > 0
        ? `⚡ ${jobCount} New Job${jobCount !== 1 ? 's' : ''} Match Your Preferences`
        : '📧 JobAlert - No New Jobs This Time';

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'JobAlert <onboarding@resend.dev>',
      to: email,
      subject: subject,
      html: htmlContent,
    });

    if (result.error) {
      throw new Error(`Resend API error: ${result.error.message}`);
    }

    console.log(`✅ Email sent to ${email} with ${jobCount} jobs via Resend (ID: ${result.data?.id})`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error);
    throw error;
  }
}

/**
 * POST /api/send-job-alert
 * Send job alert email to user
 */
export async function POST(request: NextRequest) {
  try {
    // Validate Resend API Key
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error: 'Email service not configured',
          details: 'Set RESEND_API_KEY in environment variables',
        },
        { status: 500 }
      );
    }

    const body: EmailAlertRequest = await request.json();
    const { email, preferences, alertFrequency } = body;

    // Validate input
    if (!email || !preferences) {
      return NextResponse.json(
        { error: 'Missing required fields: email and preferences' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log(`📧 Processing alert for ${email} (${alertFrequency})`);

    // Fetch all jobs
    const allJobs = await fetchAllJobs();

    // Get matching jobs
    const matchingJobs = getJobsForEmailAlert(allJobs, preferences, undefined, 15);

    console.log(
      `📊 Found ${matchingJobs.length} matching jobs out of ${allJobs.length} total jobs`
    );

    // Send email even if no jobs (to confirm alert is working)
    await sendEmailAlert(email, matchingJobs, preferences, alertFrequency);

    return NextResponse.json(
      {
        success: true,
        message: `Alert sent successfully to ${email}`,
        jobsCount: matchingJobs.length,
        alertFrequency: alertFrequency,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in send-job-alert API:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: 'Failed to send job alert',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/send-job-alert
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const isConfigured = !!process.env.RESEND_API_KEY;

    return NextResponse.json(
      {
        status: isConfigured ? 'configured' : 'not-configured',
        message: isConfigured ? 'Resend email service is ready' : 'Resend API key missing',
        emailProvider: 'Resend',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}