// app/api/cron/process-job-alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ref, get, child, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Resend } from 'resend';
import { extractFromDescription, formatSalaryDisplay } from '@/lib/salaryExtractor';

const resend = new Resend(process.env.RESEND_API_KEY);

interface Subscription {
    id: string;
    email: string;
    keywords: string[];
    locations: string[];
    workLocations: string[];
    minSalary: number | null;
    maxSalary: number | null;
    jobTypes: string[];
    excludeKeywords: string[];
    alertFrequency: 'hourly' | 'daily' | 'weekly';
    isActive: boolean;
    nextAlertDate: string;
    sentJobIds: { [key: string]: any };
}

interface Job {
    id: string;
    title: string;
    company: string;
    description: string;
    salary: any; // Can be SalaryInfo or null
    location: string;
    jobType: string;
    workLocation: string;
    skills: string[];
    postedDate: string;
    url: string;
    tags?: string[];
}

/**
 * Calculate next alert date based on frequency
 */
function calculateNextAlertDate(frequency: string): string {
    const now = new Date();
    switch (frequency) {
        case 'hourly':
            now.setHours(now.getHours() + 1);
            break;
        case 'daily':
            now.setDate(now.getDate() + 1);
            now.setHours(9, 0, 0, 0); // 9 AM next day
            break;
        case 'weekly':
            now.setDate(now.getDate() + 7);
            now.setHours(9, 0, 0, 0); // 9 AM next week
            break;
    }
    return now.toISOString();
}

/**
 * Fetch all jobs from Firebase
 */
async function fetchAvailableJobs(): Promise<Job[]> {
    if (!db) {
        console.error('Firebase DB not initialized');
        return [];
    }

    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, 'jobs'));
        
        if (!snapshot.exists()) return [];
        
        const jobs: Job[] = [];
        snapshot.forEach((childSnapshot) => {
            const val = childSnapshot.val();
            
            // Extract salary from description if not present in structured data
            let salaryInfo = val.salary;
            if (!salaryInfo && val.description) {
                salaryInfo = extractFromDescription(val.description);
            }

            jobs.push({
                id: childSnapshot.key || '',
                title: val.title || '',
                company: val.company || '',
                description: val.description || '',
                salary: salaryInfo,
                location: val.location || '',
                jobType: val.jobType || '',
                workLocation: val.workLocation || 'onsite',
                skills: val.skills || [],
                postedDate: val.postedDate || '',
                url: val.url || '',
                tags: val.tags || [],
            });
        });
        
        return jobs;
    } catch (error) {
        console.error('Error fetching jobs:', error);
        return [];
    }
}

/**
 * Filter jobs based on subscription preferences
 */
function filterJobsForSubscription(jobs: Job[], subscription: Subscription): Job[] {
    return jobs.filter((job) => {
        // 1. Skip if already sent
        if (subscription.sentJobIds && subscription.sentJobIds[job.id]) {
            return false;
        }

        // 2. Check salary range
        if (job.salary) {
            // Handle both old structure and new SalaryInfo structure
            const minSal = job.salary.min || job.salary;
            const maxSal = job.salary.max || job.salary;
            
            if (subscription.minSalary && minSal < subscription.minSalary) return false;
            if (subscription.maxSalary && maxSal > subscription.maxSalary) return false;
        }

        // 3. Check location
        const locationMatch = subscription.locations.some((loc) =>
            job.location.toLowerCase().includes(loc.toLowerCase()) ||
            loc.toLowerCase().includes(job.location.toLowerCase())
        );
        if (!locationMatch) return false;

        // 4. Check work location
        if (!subscription.workLocations.includes(job.workLocation)) return false;

        // 5. Check job type
        if (!subscription.jobTypes.includes(job.jobType)) return false;

        // 6. Check keywords (job roles)
        const hasKeyword = subscription.keywords.some((keyword) => {
            const keywordLower = keyword.toLowerCase();
            return (
                job.title.toLowerCase().includes(keywordLower) ||
                job.description.toLowerCase().includes(keywordLower) ||
                (job.skills || []).some((skill) => skill.toLowerCase().includes(keywordLower)) ||
                (job.tags || []).some((tag) => tag.toLowerCase().includes(keywordLower))
            );
        });
        if (!hasKeyword) return false;

        // 7. Check excluded keywords
        const hasExcluded = subscription.excludeKeywords.some((keyword) =>
            job.title.toLowerCase().includes(keyword.toLowerCase()) ||
            job.description.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasExcluded) return false;

        return true;
    });
}

/**
 * Generate email HTML with job matches
 */
function generateEmailHTML(email: string, jobs: Job[], frequency: string): string {
    const jobsHTML = jobs.slice(0, 20).map((job) => {
        // Format salary for display
        let salaryDisplay = 'Not specified';
        if (job.salary) {
            if (typeof job.salary === 'object' && job.salary.min) {
                 salaryDisplay = formatSalaryDisplay(job.salary);
            } else if (typeof job.salary === 'number') {
                 salaryDisplay = `$${job.salary.toLocaleString()}`;
            }
        }
        
        return `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #f9fafb;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 4px 0; color: #111827; font-size: 16px; font-weight: 600;">
                        ${job.title}
                    </h3>
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                        ${job.company}
                    </p>
                </div>
                <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    ${job.jobType}
                </span>
            </div>
            
            <div style="margin-bottom: 8px; font-size: 14px; color: #374151;">
                <p style="margin: 4px 0;"><strong>📍 Location:</strong> ${job.location}</p>
                <p style="margin: 4px 0;"><strong>🌍 Work Type:</strong> ${job.workLocation}</p>
                <p style="margin: 4px 0;"><strong>💰 Salary:</strong> ${salaryDisplay}</p>
            </div>

            <p style="margin: 8px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                ${job.description.substring(0, 150)}...
            </p>

            <a href="${job.url}" style="display: inline-block; background: #f59e0b; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; margin-top: 8px;">
                View Job
            </a>
        </div>
    `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Job Alerts</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background: white;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); padding: 32px 16px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">⚡ Your ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Job Alerts</h1>
                    <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                        ${jobs.length} new job${jobs.length !== 1 ? 's' : ''} match your preferences
                    </p>
                </div>

                <!-- Content -->
                <div style="padding: 32px 16px;">
                    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px;">
                        Hi ${email.split('@')[0]},
                    </p>
                    
                    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        We found ${jobs.length} new job(s) that match your preferences! Here are the latest opportunities:
                    </p>

                    ${jobsHTML}

                    ${jobs.length > 20 ? `
                        <p style="margin: 16px 0; color: #6b7280; font-size: 14px; text-align: center;">
                            ... and ${jobs.length - 20} more jobs available on our platform
                        </p>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 16px; text-align: center; color: #6b7280; font-size: 12px;">
                    <p style="margin: 0 0 12px 0;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" style="color: #f59e0b; text-decoration: none;">Manage Preferences</a> | 
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #f59e0b; text-decoration: none;">Unsubscribe</a>
                    </p>
                    <p style="margin: 0;">© 2024 Job Alerts. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Main cron handler - called by cron-job.org every 10-15 minutes
 */
export async function GET(request: NextRequest) {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
        return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    try {
        console.log('🕐 Starting job alert processing...');

        // Fetch all subscriptions
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, 'jobAlertSubscriptions'));
        
        if (!snapshot.exists()) {
            return NextResponse.json({ message: 'No subscriptions found', processed: 0 });
        }

        const allSubscriptions: Subscription[] = [];
        snapshot.forEach((childSnapshot) => {
            allSubscriptions.push({
                id: childSnapshot.key || '',
                ...childSnapshot.val(),
            });
        });

        // Filter for active subscriptions that are DUE
        const now = new Date();
        const dueSubscriptions = allSubscriptions.filter(sub => {
            if (!sub.isActive) return false;
            if (!sub.nextAlertDate) return false;
            return new Date(sub.nextAlertDate) <= now;
        });

        console.log(`Found ${dueSubscriptions.length} subscriptions due for alerts out of ${allSubscriptions.length} total`);

        if (dueSubscriptions.length === 0) {
            return NextResponse.json({ message: 'No subscriptions due yet', processed: 0 });
        }

        // Fetch all jobs once
        const allJobs = await fetchAvailableJobs();
        console.log(`Fetched ${allJobs.length} jobs`);

        let successCount = 0;
        let failureCount = 0;

        // Process each due subscription
        for (const subscription of dueSubscriptions) {
            try {
                // Filter jobs for this subscription
                const matchedJobs = filterJobsForSubscription(allJobs, subscription);

                // Calculate next alert date
                const nextAlertDate = calculateNextAlertDate(subscription.alertFrequency);

                if (matchedJobs.length === 0) {
                    console.log(`No new jobs for ${subscription.email}, updating next date.`);
                    await update(ref(db, `jobAlertSubscriptions/${subscription.id}`), {
                        nextAlertDate: nextAlertDate,
                    });
                    successCount++;
                    continue;
                }

                console.log(`Sending ${matchedJobs.length} jobs to ${subscription.email}`);

                // Generate and send email
                const htmlContent = generateEmailHTML(subscription.email, matchedJobs, subscription.alertFrequency);
                
                const result = await resend.emails.send({
                    from: process.env.EMAIL_FROM || 'Job Alerts <onboarding@resend.dev>',
                    to: subscription.email,
                    subject: `⚡ ${matchedJobs.length} New ${subscription.alertFrequency.charAt(0).toUpperCase() + subscription.alertFrequency.slice(1)} Job Alerts`,
                    html: htmlContent,
                });

                if (result.error) {
                    throw new Error(result.error.message);
                }

                // Mark jobs as sent and update nextAlertDate
                const sentJobIdsUpdate: { [key: string]: any } = {};
                matchedJobs.forEach((job) => {
                    sentJobIdsUpdate[`sentJobIds/${job.id}`] = { sentAt: now.toISOString() };
                });

                await update(ref(db, `jobAlertSubscriptions/${subscription.id}`), {
                    ...sentJobIdsUpdate,
                    nextAlertDate: nextAlertDate,
                    lastAlertSent: now.toISOString(),
                });

                successCount++;
                console.log(`✅ Sent ${matchedJobs.length} jobs to ${subscription.email}`);
            } catch (error) {
                console.error(`❌ Error sending to ${subscription.email}:`, error);
                failureCount++;
            }
        }

        console.log(`🎉 Cron job completed: ${successCount} alerts sent, ${failureCount} errors`);

        return NextResponse.json({
            message: 'Processing complete',
            processed: successCount,
            failed: failureCount,
            totalDue: dueSubscriptions.length,
        });

    } catch (error) {
        console.error('Critical Cron Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Support POST for some cron services
export async function POST(request: NextRequest) {
    return GET(request);
}
