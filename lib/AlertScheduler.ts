/**
 * Job Alert Scheduler
 * Handles recurring job alert emails for subscriptions
 * This should run as a Cloud Function or scheduled job
 */

import { db } from './firebase';
import { ref, get, child, update } from 'firebase/database';

interface JobSubscription {
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
    sentJobIds: { [key: string]: boolean };
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

/**
 * Fetch all active subscriptions that are due for alerts
 */
export async function getDueSubscriptions(): Promise<JobSubscription[]> {
    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, 'jobAlertSubscriptions'));
        
        if (!snapshot.exists()) {
            return [];
        }

        const now = new Date();
        const dueSubscriptions: JobSubscription[] = [];

        snapshot.forEach((childSnapshot) => {
            const sub = childSnapshot.val() as JobSubscription;
            
            if (!sub.isActive) return;

            const nextAlertDate = new Date(sub.nextAlertDate);
            if (nextAlertDate <= now) {
                dueSubscriptions.push(sub);
            }
        });

        return dueSubscriptions;
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        return [];
    }
}

/**
 * Fetch all available jobs from your jobs database/API
 */
export async function fetchAvailableJobs(): Promise<Job[]> {
    try {
        // Option 1: Fetch from Firebase
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, 'jobs'));
        
        if (!snapshot.exists()) {
            return [];
        }

        const jobs: Job[] = [];
        snapshot.forEach((childSnapshot) => {
            jobs.push(childSnapshot.val());
        });

        return jobs;

        // Option 2: If jobs come from external API
        // const response = await fetch('your-jobs-api-endpoint');
        // return response.json();
    } catch (error) {
        console.error('Error fetching jobs:', error);
        return [];
    }
}

/**
 * Filter jobs based on subscription preferences
 */
export function filterJobsForSubscription(jobs: Job[], subscription: JobSubscription): Job[] {
    return jobs.filter((job) => {
        // Check if already sent
        if (subscription.sentJobIds[job.id]) {
            return false;
        }

        // Check salary range
        if (job.salary) {
            if (subscription.minSalary && job.salary < subscription.minSalary) {
                return false;
            }
            if (subscription.maxSalary && job.salary > subscription.maxSalary) {
                return false;
            }
        }

        // Check location
        const jobLocationMatch = subscription.locations.some((loc) =>
            job.location.toLowerCase().includes(loc.toLowerCase()) ||
            loc.toLowerCase().includes(job.location.toLowerCase())
        );
        if (!jobLocationMatch) {
            return false;
        }

        // Check work location type
        if (!subscription.workLocations.includes(job.workLocation)) {
            return false;
        }

        // Check job type
        if (!subscription.jobTypes.includes(job.jobType)) {
            return false;
        }

        // Check keywords (must include at least one)
        const hasKeyword = subscription.keywords.some((keyword) =>
            job.title.toLowerCase().includes(keyword.toLowerCase()) ||
            job.description.toLowerCase().includes(keyword.toLowerCase()) ||
            job.skills.some((skill) =>
                skill.toLowerCase().includes(keyword.toLowerCase())
            )
        );
        if (!hasKeyword) {
            return false;
        }

        // Check excluded keywords
        const hasExcludedKeyword = subscription.excludeKeywords.some((keyword) =>
            job.title.toLowerCase().includes(keyword.toLowerCase()) ||
            job.description.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasExcludedKeyword) {
            return false;
        }

        return true;
    });
}

/**
 * Update subscription after sending alert
 */
export async function updateSubscriptionAfterAlert(
    subscriptionId: string,
    matchedJobIds: string[],
    nextAlertDate: string
): Promise<void> {
    try {
        const dbRef = ref(db, `jobAlertSubscriptions/${subscriptionId}`);
        const snapshot = await get(dbRef);
        
        if (!snapshot.exists()) {
            throw new Error('Subscription not found');
        }

        const currentSentJobIds = snapshot.val().sentJobIds || {};
        const updatedSentJobIds = { ...currentSentJobIds };

        // Mark matched jobs as sent
        matchedJobIds.forEach((jobId) => {
            updatedSentJobIds[jobId] = true;
        });

        await update(dbRef, {
            sentJobIds: updatedSentJobIds,
            nextAlertDate: nextAlertDate,
            lastAlertDate: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        throw error;
    }
}

/**
 * Calculate next alert date based on frequency
 */
export function calculateNextAlertDate(frequency: 'hourly' | 'daily' | 'weekly'): string {
    const now = new Date();
    
    switch (frequency) {
        case 'hourly':
            now.setHours(now.getHours() + 1);
            break;
        case 'daily':
            now.setDate(now.getDate() + 1);
            now.setHours(9, 0, 0, 0); // Send at 9 AM
            break;
        case 'weekly':
            now.setDate(now.getDate() + 7);
            now.setHours(9, 0, 0, 0); // Send at 9 AM
            break;
    }
    
    return now.toISOString();
}
