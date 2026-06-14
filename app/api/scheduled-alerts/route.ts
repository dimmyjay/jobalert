import { NextRequest, NextResponse } from 'next/server';
import { ref, get, child, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { fetchAllJobs } from '@/lib/jobUtils';
import { getJobsForEmailAlert } from '@/lib/jobMatcher';

// Removed node-fetch import. Native fetch is available in Next.js App Router.

interface Subscription {
  id: string;
  email: string;
  keywords: string[];
  locations: string[];
  workLocations: ('digital' | 'onsite' | 'hybrid')[];
  minSalary: number | null;
  maxSalary: number | null;
  jobTypes: string[];
  excludeKeywords: string[];
  alertFrequency: 'hourly' | 'daily' | 'weekly';
  isActive: boolean;
  nextAlertDate: string;
  sentJobIds?: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculate alert interval in milliseconds
 */
function getAlertIntervalMs(frequency: string): number {
  switch (frequency) {
    case 'hourly':
      return 60 * 60 * 1000; // 1 hour
    case 'daily':
      return 24 * 60 * 60 * 1000; // 1 day
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000; // 1 week
    default:
      return 24 * 60 * 60 * 1000;
  }
}

/**
 * Calculate next alert date
 */
function calculateNextAlertDate(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case 'hourly':
      now.setHours(now.getHours() + 1);
      break;
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
  }
  return now;
}

/**
 * Send alert email via API using native fetch
 */
async function sendAlertViaAPI(
  email: string,
  preferences: any,
  alertFrequency: string,
  jobs: any[]
): Promise<void> {
  try {
    // Use native fetch instead of node-fetch
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-job-alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        preferences,
        alertFrequency,
      }),
    });

    if (!response.ok) {
      throw new Error(`Email API returned ${response.status}`);
    }

    console.log(`✅ Alert sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send alert to ${email}:`, error);
    throw error;
  }
}

/**
 * Process scheduled alerts
 */
async function processScheduledAlerts(): Promise<{
  success: boolean;
  alertsSent: number;
  alertsFailed: number;
  message: string;
  details?: string;
}> {
  let alertsSent = 0;
  let alertsFailed = 0;
  const results: string[] = [];

  try {
    console.log('🔄 Starting scheduled alerts job...');

    // Fetch all subscriptions from Firebase
    // Note: Ensure this path matches your database structure (jobAlertSubscriptions vs subscriptions)
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, 'jobAlertSubscriptions'));

    if (!snapshot.exists()) {
      console.log('ℹ️ No subscriptions found');
      return {
        success: true,
        alertsSent: 0,
        alertsFailed: 0,
        message: 'No subscriptions to process',
      };
    }

    const subscriptions = snapshot.val();
    const now = new Date();

    // Fetch all jobs once
    console.log('📥 Fetching all available jobs...');
    const allJobs = await fetchAllJobs();
    console.log(`📊 Total jobs available: ${allJobs.length}`);

    // Process each subscription
    const subscriptionEntries = Object.entries(subscriptions);
    console.log(`🔍 Processing ${subscriptionEntries.length} subscriptions...`);

    for (const [subscriptionId, subscriptionData] of subscriptionEntries) {
      const subscription = subscriptionData as Subscription;

      try {
        // Check if subscription is active
        if (!subscription.isActive) {
          console.log(`⏸️  Skipping inactive subscription: ${subscription.email}`);
          continue;
        }

        // Check if it's time to send alert
        const nextAlertTime = new Date(subscription.nextAlertDate);
        if (nextAlertTime > now) {
          console.log(
            `⏳ Alert for ${subscription.email} not due yet. Next: ${nextAlertTime.toISOString()}`
          );
          continue;
        }

        console.log(`\n📧 Processing alert for ${subscription.email}...`);

        // Get matching jobs
        // We look for jobs posted since the last alert was theoretically due
        const lastAlertDate = new Date(nextAlertTime);
        lastAlertDate.setTime(
          lastAlertDate.getTime() - getAlertIntervalMs(subscription.alertFrequency)
        );

        const matchingJobs = getJobsForEmailAlert(
          allJobs,
          {
            keywords: subscription.keywords,
            locations: subscription.locations,
            workLocations: subscription.workLocations,
            minSalary: subscription.minSalary,
            maxSalary: subscription.maxSalary,
            jobTypes: subscription.jobTypes,
            excludeKeywords: subscription.excludeKeywords,
          },
          lastAlertDate,
          15
        );

        console.log(`   ✓ Found ${matchingJobs.length} matching jobs`);

        // Filter out already sent jobs
        const sentJobIds = subscription.sentJobIds || {};
        const newJobs = matchingJobs.filter((job: any) => !sentJobIds[job.id]);

        console.log(`   ✓ ${newJobs.length} new jobs (not previously sent)`);

        if (newJobs.length > 0) {
            // Send email
            await sendAlertViaAPI(
            subscription.email,
            {
                keywords: subscription.keywords,
                locations: subscription.locations,
                workLocations: subscription.workLocations,
                minSalary: subscription.minSalary,
                maxSalary: subscription.maxSalary,
                jobTypes: subscription.jobTypes,
                excludeKeywords: subscription.excludeKeywords,
            },
            subscription.alertFrequency,
            newJobs
            );
        } else {
            console.log(`   ℹ️ No new jobs to send for ${subscription.email}`);
        }

        // Update sent job IDs
        const updatedSentJobIds = { ...sentJobIds };
        newJobs.forEach((job: any) => {
          updatedSentJobIds[job.id] = true;
        });

        // Calculate next alert date
        const nextAlertDate = calculateNextAlertDate(subscription.alertFrequency);

        // Update subscription in Firebase
        const subRef = ref(db, `jobAlertSubscriptions/${subscriptionId}`);
        await set(subRef, {
          ...subscription,
          sentJobIds: updatedSentJobIds,
          nextAlertDate: nextAlertDate.toISOString(),
          updatedAt: new Date().toISOString(),
        });

        alertsSent++;
        results.push(
          `✅ ${subscription.email}: ${newJobs.length} jobs sent (next: ${nextAlertDate.toISOString()})`
        );

        console.log(`   ✓ Updated nextAlertDate to ${nextAlertDate.toISOString()}`);
      } catch (error) {
        alertsFailed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push(
          `❌ ${subscription.email}: Failed - ${errorMsg}`
        );
        console.error(
          `   ✗ Error processing subscription ${subscriptionId}:`,
          error
        );
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Scheduled Alerts Summary:');
    console.log(`   Sent: ${alertsSent}`);
    console.log(`   Failed: ${alertsFailed}`);
    console.log('='.repeat(50));

    return {
      success: true,
      alertsSent,
      alertsFailed,
      message: 'Scheduled alerts completed',
      details: results.join('\n'),
    };
  } catch (error) {
    console.error('❌ Error in processScheduledAlerts:', error);
    return {
      success: false,
      alertsSent,
      alertsFailed,
      message: 'Scheduled alerts failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * POST /api/scheduled-alerts
 * Manual trigger endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication header check
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await processScheduledAlerts();

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error('❌ Error in scheduled-alerts API:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduled alerts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scheduled-alerts
 * Health check and status endpoint
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        status: 'ok',
        message: 'Scheduled alerts endpoint is active',
        instructions: {
          description: 'Trigger scheduled alerts manually',
          method: 'POST',
          endpoint: '/api/scheduled-alerts',
          authentication: 'Optional Bearer token (set CRON_SECRET env var)',
          example: {
            curl: 'curl -X POST https://your-app.com/api/scheduled-alerts -H "Authorization: Bearer YOUR_SECRET"',
            js: `fetch('/api/scheduled-alerts', { method: 'POST', headers: { 'Authorization': 'Bearer YOUR_SECRET' } })`,
          },
        },
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