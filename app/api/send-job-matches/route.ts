/**
 * API Route: Send Job Matches Email
 * POST /api/send-job-matches
 * 
 * Sends immediate job matches to a user based on their preferences
 * Tracks sent jobs to avoid duplicates
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ref, get, child, update } from 'firebase/database';
import { db } from '@/lib/firebase';

interface JobPreferences {
    keywords: string[];
    locations: string[];
    workLocations: ('digital' | 'onsite' | 'hybrid')[];
    minSalary: number | null;
    maxSalary: number | null;
    jobTypes: string[];
    excludeKeywords: string[];
}

interface Job {
    id: string;
    title: string;
    company: string;
    description: string;
    salary: number | null;
    location: string;
    jobType: string;
    workLocation: 'digital' | 'onsite' | 'hybrid';
    skills: string[];
    postedDate: string;
    url: string;
}

interface MatchedJob extends Job {
    matchScore: number;
    matchedKeywords: string[];
}

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Calculate match score for a job based on preferences
 */
function calculateMatchScore(job: Job, preferences: JobPreferences): { score: number; matchedKeywords: string[] } {
    let score = 0;
    const matchedKeywords: string[] = [];

    // Title match (highest weight)
    preferences.keywords.forEach((keyword) => {
        if (job.title.toLowerCase().includes(keyword.toLowerCase())) {
            score += 30;
            matchedKeywords.push(keyword);
        }
    });

    // Skills match
    if (job.skills && job.skills.length > 0) {
        preferences.keywords.forEach((keyword) => {
            job.skills.forEach((skill) => {
                if (skill.toLowerCase().includes(keyword.toLowerCase())) {
                    score += 20;
                    if (!matchedKeywords.includes(keyword)) {
                        matchedKeywords.push(keyword);
                    }
                }
            });
        });
    }

    // Description match
    preferences.keywords.forEach((keyword) => {
        if (job.description.toLowerCase().includes(keyword.toLowerCase())) {
            score += 10;
            if (!matchedKeywords.includes(keyword)) {
                matchedKeywords.push(keyword);
            }
        }
    });

    // Location match bonus
    preferences.locations.forEach((loc) => {
        if (job.location.toLowerCase().includes(loc.toLowerCase()) ||
            loc.toLowerCase().includes(job.location.toLowerCase())) {
            score += 15;
        }
    });

    // Work location match
    if (preferences.workLocations.includes(job.workLocation)) {
        score += 10;
    }

    // Job type match
    if (preferences.jobTypes.includes(job.jobType)) {
        score += 10;
    }

    // Salary match bonus
    if (job.salary && preferences.minSalary && preferences.maxSalary) {
        if (job.salary >= preferences.minSalary && job.salary <= preferences.maxSalary) {
            score += 5;
        }
    }

    return { score, matchedKeywords };
}

/**
 * Filter jobs based on preferences with scoring
 */
function filterJobs(jobs: Job[], preferences: JobPreferences): MatchedJob[] {
    const matchedJobs: MatchedJob[] = [];

    jobs.forEach((job) => {
        // Defensive checks for required string fields
        if (!job.title || !job.description || !job.location || !job.jobType || !job.workLocation) {
            return;
        }

        // Check salary range
        if (job.salary) {
            if (preferences.minSalary && job.salary < preferences.minSalary) {
                return;
            }
            if (preferences.maxSalary && job.salary > preferences.maxSalary) {
                return;
            }
        }

        // Check location - must match at least one
        const locationMatch = preferences.locations.some((loc) =>
            job.location.toLowerCase().includes(loc.toLowerCase()) ||
            loc.toLowerCase().includes(job.location.toLowerCase())
        );
        if (!locationMatch) {
            return;
        }

        // Check work location
        if (!preferences.workLocations.includes(job.workLocation)) {
            return;
        }

        // Check job type
        if (!preferences.jobTypes.includes(job.jobType)) {
            return;
        }

        // Check keywords - must match at least one
        const hasKeyword = preferences.keywords.some((keyword) =>
            job.title.toLowerCase().includes(keyword.toLowerCase()) ||
            job.description.toLowerCase().includes(keyword.toLowerCase()) ||
            (job.skills || []).some((skill) =>
                skill.toLowerCase().includes(keyword.toLowerCase())
            )
        );
        if (!hasKeyword) {
            return;
        }

        // Check excluded keywords
        const hasExcluded = preferences.excludeKeywords.some((keyword) =>
            job.title.toLowerCase().includes(keyword.toLowerCase()) ||
            job.description.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasExcluded) {
            return;
        }

        // Calculate match score
        const { score, matchedKeywords } = calculateMatchScore(job, preferences);

        matchedJobs.push({
            ...job,
            matchScore: score,
            matchedKeywords,
        });
    });

    // Sort by match score (highest first)
    return matchedJobs.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get previously sent job IDs for a user
 */
async function getSentJobIds(email: string): Promise<string[]> {
    try {
        const dbRef = ref(db);
        // Changed path from userSentJobs to alertLogs/sentJobs
        const emailKey = email.replace(/\./g, ',');
        const snapshot = await get(child(dbRef, `alertLogs/sentJobs/${emailKey}`));
        
        if (!snapshot.exists()) {
            return [];
        }
        
        return Object.keys(snapshot.val());
    } catch (error) {
        console.error('Error fetching sent job IDs:', error);
        return [];
    }
}


/**
 * Mark jobs as sent for a user
 */
async function markJobsAsSent(email: string, jobIds: string[]): Promise<void> {
    try {
        const emailKey = email.replace(/\./g, ',');
        const updates: { [key: string]: any } = {};
        
        jobIds.forEach((jobId) => {
            // Changed path from userSentJobs to alertLogs/sentJobs
            updates[`alertLogs/sentJobs/${emailKey}/${jobId}`] = {
                sentAt: new Date().toISOString(),
            };
        });
        
        await update(ref(db), updates);
        console.log(`Marked ${jobIds.length} jobs as sent for ${email}`);
    } catch (error) {
        console.error('Error marking jobs as sent:', error);
    }
}

/**
 * Generate HTML email template
 */
function generateEmailTemplate(email: string, jobs: MatchedJob[], frequency: string): string {
    const jobsHTML = jobs
        .slice(0, 20)
        .map(
            (job) => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #f9fafb;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div>
            <h3 style="margin: 0 0 4px 0; color: #111827; font-size: 16px; font-weight: 600;">
              ${escapeHtml(job.title)}
            </h3>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
              ${escapeHtml(job.company)}
            </p>
          </div>
          <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
            ${escapeHtml(job.jobType)}
          </span>
        </div>
        
        <div style="margin-bottom: 8px; font-size: 14px; color: #374151;">
          <p style="margin: 4px 0;"><strong>Location:</strong> ${escapeHtml(job.location)}</p>
          <p style="margin: 4px 0;"><strong>Work Type:</strong> ${escapeHtml(job.workLocation)}</p>
          ${job.salary ? `<p style="margin: 4px 0;"><strong>Salary:</strong> $${job.salary.toLocaleString()}/year</p>` : ''}
          ${job.matchedKeywords.length > 0 ? `
            <p style="margin: 4px 0;"><strong>Matched Keywords:</strong> ${job.matchedKeywords.map(k => escapeHtml(k)).join(', ')}</p>
          ` : ''}
        </div>

        <p style="margin: 8px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
          ${escapeHtml(job.description.substring(0, 150))}...
        </p>

        <a href="${escapeHtml(job.url)}" style="display: inline-block; background: #f59e0b; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; margin-top: 8px;">
          View Job
        </a>
      </div>
    `
        )
        .join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Job Alerts</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); padding: 32px 16px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">⚡ Your ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Job Alerts</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
            ${jobs.length} new jobs match your preferences
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 32px 16px;">
          <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px;">
            Hi ${escapeHtml(email.split('@')[0])},
          </p>
          
          <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
            We found ${jobs.length} new job(s) that match your preferences! Here are the latest opportunities:
          </p>

          ${jobsHTML}

          ${
              jobs.length > 20
                  ? `<p style="margin: 16px 0; color: #6b7280; font-size: 14px; text-align: center;">
            ... and ${jobs.length - 20} more jobs available on our platform
          </p>`
                  : ''
          }
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 16px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0 0 12px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" style="color: #f59e0b; text-decoration: none;">Manage Preferences</a> | 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color: #f59e0b; text-decoration: none;">Unsubscribe</a>
          </p>
          <p style="margin: 0;">© 2024 Job Alerts. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Fetch jobs from Firebase
 */
async function fetchJobsFromFirebase(): Promise<Job[]> {
    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, 'jobs'));

        if (!snapshot.exists()) {
            console.log('No jobs found in Firebase');
            return [];
        }

        const jobs: Job[] = [];
        snapshot.forEach((childSnapshot) => {
            const val = childSnapshot.val();
            jobs.push({
                id: childSnapshot.key || '',
                title: val.title || '',
                company: val.company || '',
                description: val.description || '',
                salary: val.salary || null,
                location: val.location || '',
                jobType: val.jobType || '',
                workLocation: val.workLocation || 'onsite',
                skills: val.skills || [],
                postedDate: val.postedDate || '',
                url: val.url || '',
            });
        });

        console.log(`Fetched ${jobs.length} jobs from Firebase`);
        return jobs;
    } catch (error) {
        console.error('Error fetching jobs from Firebase:', error);
        return [];
    }
}

/**
 * Fetch jobs from external API (fallback)
 */
async function fetchJobsFromAPI(): Promise<Job[]> {
    try {
        const apiEndpoint = process.env.JOBS_API_ENDPOINT;
        if (!apiEndpoint) {
            return [];
        }

        const response = await fetch(apiEndpoint, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`Failed to fetch jobs from API: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        console.log(`Fetched ${data.length || 0} jobs from API`);
        return data.jobs || data || [];
    } catch (error) {
        console.error('Error fetching jobs from API:', error);
        return [];
    }
}

/**
 * Fetch jobs from available sources
 */
async function fetchJobs(): Promise<Job[]> {
    const firebaseJobs = await fetchJobsFromFirebase();
    if (firebaseJobs.length > 0) {
        return firebaseJobs;
    }

    const apiJobs = await fetchJobsFromAPI();
    if (apiJobs.length > 0) {
        return apiJobs;
    }

    console.warn('No jobs available from any source');
    return [];
}

export async function POST(request: NextRequest) {
    try {
        const { email, preferences, alertFrequency } = await request.json();

        if (!email || !preferences) {
            return NextResponse.json(
                { error: 'Missing email or preferences' },
                { status: 400 }
            );
        }

        // Fetch all available jobs
        const allJobs = await fetchJobs();

        // Filter jobs based on preferences with scoring
        const allMatchedJobs = filterJobs(allJobs, preferences);

        // Get previously sent job IDs
        const sentJobIds = await getSentJobIds(email);

        // Filter out jobs that have already been sent
        const newMatchedJobs = allMatchedJobs.filter(
            (job) => !sentJobIds.includes(job.id)
        );

        if (newMatchedJobs.length === 0) {
            console.log(`No new jobs match preferences for ${email}`);
            return NextResponse.json(
                { message: 'No new jobs match your preferences', sent: false, jobsMatched: 0 },
                { status: 200 }
            );
        }

        // Generate email template
        const htmlContent = generateEmailTemplate(email, newMatchedJobs, alertFrequency);

        // Send email via Resend
        const result = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Job Alerts <onboarding@resend.dev>',
            to: email,
            subject: `⚡ ${newMatchedJobs.length} New ${alertFrequency.charAt(0).toUpperCase() + alertFrequency.slice(1)} Job Alerts`,
            html: htmlContent,
        });

        if (result.error) {
            throw new Error(`Resend API error: ${result.error.message}`);
        }

        // Mark jobs as sent
        const sentJobIdsList = newMatchedJobs.map((job) => job.id);
        await markJobsAsSent(email, sentJobIdsList);

        console.log(`Job alerts email sent to ${email}, ID: ${result.data?.id}, Jobs: ${newMatchedJobs.length}`);

        return NextResponse.json(
            {
                message: 'Email sent successfully',
                jobsMatched: newMatchedJobs.length,
                sent: true,
                emailId: result.data?.id,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error sending job matches:', error);
        return NextResponse.json(
            { 
                error: 'Failed to send email',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}