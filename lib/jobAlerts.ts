import { ref, get, child, set, remove, update } from "firebase/database";
import { db } from "./firebase";
import {
  fetchAllJobs,
  filterJobsByPreferences,
  UserPreferences,
} from "./jobUtils";

const SUBSCRIPTIONS_PATH = "jobAlertSubscriptions";
const PENDING_SUBSCRIPTIONS_PATH = "pendingSubscriptions";

/**
 * Calculate next alert date based on frequency
 */
function calculateNextAlertDate(frequency: string): string {
  const now = new Date();
  switch (frequency) {
    case "hourly":
      now.setHours(now.getHours() + 1);
      break;
    case "daily":
      now.setDate(now.getDate() + 1);
      now.setHours(9, 0, 0, 0); // 9 AM next day
      break;
    case "weekly":
      now.setDate(now.getDate() + 7);
      now.setHours(9, 0, 0, 0); // 9 AM next week
      break;
  }
  return now.toISOString();
}

/**
 * Create a pending subscription before payment verification
 */
export async function createPendingSubscription(data: {
  email: string;
  keyword?: string;
  keywords?: string[];
  location?: string;
  locations?: string[];
  frequency: "hourly" | "daily" | "weekly";
  amount: number;
  paymentReference: string;
}) {
  if (!db) throw new Error("Database not initialized");

  try {
    const subscriptionId = `pending-${data.paymentReference}`;

    const keywords = data.keywords || (data.keyword ? [data.keyword] : []);
    const locations = data.locations || (data.location ? [data.location] : []);

    const pendingData = {
      id: subscriptionId,
      email: data.email,
      keywords,
      keyword: keywords[0] || "",
      locations,
      location: locations[0] || "Remote",
      alertFrequency: data.frequency,
      frequency: data.frequency,
      amount: data.amount,
      paymentReference: data.paymentReference,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const dbRef = ref(db, `${PENDING_SUBSCRIPTIONS_PATH}/${subscriptionId}`);
    await set(dbRef, pendingData);

    console.log(`Pending subscription created: ${subscriptionId}`);
    return subscriptionId;
  } catch (error) {
    console.error("Error creating pending subscription:", error);
    throw error;
  }
}

/**
 * Confirm subscription after payment verification
 */
export async function confirmSubscription(paymentReference: string) {
  if (!db) throw new Error("Database not initialized");

  try {
    const pendingRef = ref(db, PENDING_SUBSCRIPTIONS_PATH);
    const snapshot = await get(pendingRef);

    if (!snapshot.exists()) {
      throw new Error("No pending subscriptions found");
    }

    let pendingData: any = null;
    let pendingId: string | null = null;

    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();

      if (data.paymentReference === paymentReference) {
        pendingData = data;
        pendingId = childSnapshot.key;
      }
    });

    if (!pendingData || !pendingId) {
      throw new Error(
        `Pending subscription with reference ${paymentReference} not found`
      );
    }

    const cleanEmail = pendingData.email.replace(/[^a-z0-9]/gi, "");
    const subscriptionId = `sub-${cleanEmail}-${Date.now()}`;

    // Calculate when the next alert should be sent
    const nextAlertDate = calculateNextAlertDate(pendingData.alertFrequency || pendingData.frequency);

    const confirmedData = {
      id: subscriptionId,
      email: pendingData.email,
      keywords: pendingData.keywords || [],
      keyword: pendingData.keywords?.[0] || "",
      locations: pendingData.locations || [],
      location: pendingData.locations?.[0] || "Remote",
      jobTypes: pendingData.jobTypes || ["Full-time"],
      excludeKeywords: pendingData.excludeKeywords || [],
      alertFrequency: pendingData.alertFrequency,
      frequency: pendingData.alertFrequency,
      amount: pendingData.amount,
      paymentReference,
      status: "active",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activatedAt: new Date().toISOString(),
      nextAlertDate: nextAlertDate, // Important for cron job
      sentJobIds: {},
    };

    const confirmedRef = ref(db, `${SUBSCRIPTIONS_PATH}/${subscriptionId}`);
    await set(confirmedRef, confirmedData);

    const pendingToRemove = ref(
      db,
      `${PENDING_SUBSCRIPTIONS_PATH}/${pendingId}`
    );
    await remove(pendingToRemove);

    console.log(`Subscription confirmed: ${subscriptionId}`);
    return subscriptionId;
  } catch (error) {
    console.error("Error confirming subscription:", error);
    throw error;
  }
}

/**
 * Alias for confirmSubscription to match API route expectations
 * Used by app/api/alerts/verify/route.ts
 */
export const activateSubscriptionByReference = confirmSubscription;

/**
 * Get all subscriptions from Firebase Realtime Database
 */
export async function getAllSubscriptions() {
  if (!db) return [];

  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, SUBSCRIPTIONS_PATH));

    if (!snapshot.exists()) {
      console.log("No subscriptions found");
      return [];
    }

    const subscriptions: any[] = [];

    snapshot.forEach((childSnapshot) => {
      subscriptions.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });

    return subscriptions;
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    throw error;
  }
}

/**
 * Get active subscriptions by frequency
 */
export async function getSubscriptionsByFrequency(
  frequency: "hourly" | "daily" | "weekly"
) {
  try {
    const allSubscriptions = await getAllSubscriptions();

    return allSubscriptions.filter((sub) => {
      const subFrequency = sub.alertFrequency || sub.frequency;

      return (
        (sub.isActive === true || sub.status === "active") &&
        subFrequency === frequency
      );
    });
  } catch (error) {
    console.error(`Error fetching ${frequency} subscriptions:`, error);
    throw error;
  }
}

/**
 * Get jobs matching user preferences
 */
export async function getMatchingJobsForUser(preferences: UserPreferences) {
  try {
    const allJobs = await fetchAllJobs();
    const matchingJobs = filterJobsByPreferences(allJobs, preferences);

    return matchingJobs;
  } catch (error) {
    console.error("Error getting matching jobs:", error);
    throw error;
  }
}

/**
 * Smart job recommendation function used by app/api/send-job-matches/route.ts
 */
export async function getSmartJobRecommendations(
  preferences: UserPreferences,
  page: number = 1,
  limit: number = 10,
  days: number = 30
) {
  try {
    const allJobs = await fetchAllJobs();

    const matchingJobs = filterJobsByPreferences(allJobs, preferences);

    const startIndex = (page - 1) * limit;
    const paginatedJobs = matchingJobs.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginatedJobs,
      pagination: {
        page,
        limit,
        total: matchingJobs.length,
        totalPages: Math.ceil(matchingJobs.length / limit),
      },
      filters: {
        days,
        keywords: preferences.keywords || [],
        locations: preferences.locations || [],
      },
    };
  } catch (error) {
    console.error("Error getting smart job recommendations:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get job recommendations",
      data: [],
    };
  }
}

/**
 * Check if a job has already been sent to a user
 */
export function hasJobBeenSent(jobId: string, sentJobIds: any): boolean {
  if (!sentJobIds) return false;

  if (Array.isArray(sentJobIds)) {
    return sentJobIds.includes(jobId);
  }

  return sentJobIds[jobId] !== undefined;
}

/**
 * Add job to sent list
 */
export function addJobToSentList(jobId: string, sentJobIds: any): any {
  if (!sentJobIds) {
    return { [jobId]: true };
  }

  if (Array.isArray(sentJobIds)) {
    return [...sentJobIds, jobId];
  }

  return {
    ...sentJobIds,
    [jobId]: true,
  };
}

/**
 * Get new jobs for a user
 */
export function getNewJobs(jobs: any[], sentJobIds: any) {
  return jobs.filter((job) => !hasJobBeenSent(job.id, sentJobIds));
}

/**
 * Update subscription after sending alert
 */
export async function updateSubscriptionAfterAlert(
  subscriptionId: string,
  newJobIds: string[]
) {
  if (!db) throw new Error("Database not initialized");

  try {
    const dbRef = ref(db, `${SUBSCRIPTIONS_PATH}/${subscriptionId}`);
    const snapshot = await get(dbRef);

    if (!snapshot.exists()) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const currentData = snapshot.val();

    const updatedSentJobIds = {
      ...(currentData.sentJobIds || {}),
    };

    newJobIds.forEach((jobId) => {
      updatedSentJobIds[jobId] = true;
    });

    await updateSubscription(subscriptionId, {
      lastAlertSent: new Date().toISOString(),
      sentJobIds: updatedSentJobIds,
      updatedAt: new Date().toISOString(),
    });

    console.log(
      `Updated subscription ${subscriptionId} with ${newJobIds.length} new jobs`
    );
  } catch (error) {
    console.error(`Error updating subscription ${subscriptionId}:`, error);
    throw error;
  }
}

/**
 * Update subscription data
 */
export async function updateSubscription(subscriptionId: string, updates: any) {
  if (!db) throw new Error("Database not initialized");

  try {
    const dbRef = ref(db, `${SUBSCRIPTIONS_PATH}/${subscriptionId}`);

    const snapshot = await get(dbRef);

    if (!snapshot.exists()) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const currentData = snapshot.val();

    const updatedData = {
      ...currentData,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await set(dbRef, updatedData);

    console.log(`Subscription ${subscriptionId} updated successfully`);
  } catch (error) {
    console.error(`Error updating subscription ${subscriptionId}:`, error);
    throw error;
  }
}

/**
 * Deactivate a subscription
 */
export async function deactivateSubscription(subscriptionId: string) {
  try {
    await updateSubscription(subscriptionId, {
      isActive: false,
      status: "inactive",
      updatedAt: new Date().toISOString(),
    });

    console.log(`Subscription ${subscriptionId} deactivated`);
  } catch (error) {
    console.error(`Error deactivating subscription ${subscriptionId}:`, error);
    throw error;
  }
}

/**
 * Delete a subscription
 */
export async function deleteSubscription(subscriptionId: string) {
  if (!db) throw new Error("Database not initialized");

  try {
    const dbRef = ref(db, `${SUBSCRIPTIONS_PATH}/${subscriptionId}`);
    await remove(dbRef);

    console.log(`Subscription ${subscriptionId} deleted`);
  } catch (error) {
    console.error(`Error deleting subscription ${subscriptionId}:`, error);
    throw error;
  }
}

/**
 * Unsubscribe a user by deleting their subscription from Firebase
 * Used by app/api/alerts/unsubscribe/route.ts
 */
export async function unsubscribeSubscription(subscriptionId: string): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  try {
    const subscriptionRef = ref(db, `${SUBSCRIPTIONS_PATH}/${subscriptionId}`);
    
    // Optional: Check if it exists first
    const snapshot = await get(child(ref(db), `${SUBSCRIPTIONS_PATH}/${subscriptionId}`));
    
    if (!snapshot.exists()) {
      throw new Error('Subscription not found');
    }

    // Delete the subscription
    await remove(subscriptionRef);
    
    console.log(`Successfully unsubscribed subscription: ${subscriptionId}`);
  } catch (error) {
    console.error('Error unsubscribing:', error);
    throw error;
  }
}

/**
 * Get subscription by email
 */
export async function getSubscriptionByEmail(email: string) {
  try {
    const allSubscriptions = await getAllSubscriptions();

    return allSubscriptions.find(
      (sub) => sub.email?.toLowerCase() === email.toLowerCase()
    );
  } catch (error) {
    console.error(`Error fetching subscription for ${email}:`, error);
    throw error;
  }
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(subscriptionId: string) {
  if (!db) return null;

  try {
    const dbRef = ref(db);
    const snapshot = await get(
      child(dbRef, `${SUBSCRIPTIONS_PATH}/${subscriptionId}`)
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: subscriptionId,
      ...snapshot.val(),
    };
  } catch (error) {
    console.error(`Error fetching subscription ${subscriptionId}:`, error);
    throw error;
  }
}

/**
 * Get pending subscription by payment reference
 */
export async function getPendingSubscriptionByReference(
  paymentReference: string
) {
  if (!db) return null;

  try {
    const dbRef = ref(db, PENDING_SUBSCRIPTIONS_PATH);
    const snapshot = await get(dbRef);

    if (!snapshot.exists()) {
      return null;
    }

    let pendingData: any = null;
    let pendingId: string | null = null;

    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();

      if (data.paymentReference === paymentReference) {
        pendingData = data;
        pendingId = childSnapshot.key;
      }
    });

    if (!pendingData) {
      return null;
    }

    return {
      id: pendingId,
      ...pendingData,
    };
  } catch (error) {
    console.error("Error fetching pending subscription:", error);
    throw error;
  }
}

/**
 * Count active subscriptions
 */
export async function countActiveSubscriptions() {
  try {
    const allSubscriptions = await getAllSubscriptions();

    return allSubscriptions.filter(
      (sub) => sub.isActive === true || sub.status === "active"
    ).length;
  } catch (error) {
    console.error("Error counting active subscriptions:", error);
    throw error;
  }
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats() {
  try {
    const allSubscriptions = await getAllSubscriptions();

    const activeSubscriptions = allSubscriptions.filter(
      (sub) => sub.isActive === true || sub.status === "active"
    );

    const stats = {
      total: allSubscriptions.length,
      active: activeSubscriptions.length,
      inactive: allSubscriptions.length - activeSubscriptions.length,
      byFrequency: {
        hourly: activeSubscriptions.filter(
          (sub) => (sub.alertFrequency || sub.frequency) === "hourly"
        ).length,
        daily: activeSubscriptions.filter(
          (sub) => (sub.alertFrequency || sub.frequency) === "daily"
        ).length,
        weekly: activeSubscriptions.filter(
          (sub) => (sub.alertFrequency || sub.frequency) === "weekly"
        ).length,
      },
      byJobType: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
    };

    activeSubscriptions.forEach((sub) => {
      sub.jobTypes?.forEach((jobType: string) => {
        stats.byJobType[jobType] = (stats.byJobType[jobType] || 0) + 1;
      });

      sub.locations?.forEach((location: string) => {
        stats.byLocation[location] = (stats.byLocation[location] || 0) + 1;
      });
    });

    return stats;
  } catch (error) {
    console.error("Error getting subscription stats:", error);
    throw error;
  }
}
