// Job matching logic to connect JobAlertsPage with JobsPage

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
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
  workLocation: 'digital' | 'onsite' | 'hybrid';
  applicationUrl?: string;
}

export interface SubscriptionPreferences {
  keywords: string[];
  locations: string[];
  minSalary: number | null;
  maxSalary: number | null;
  jobTypes: string[];
  excludeKeywords: string[];
  workLocations: ('digital' | 'onsite' | 'hybrid')[];
}

/**
 * Check if a single job matches the subscription preferences
 */
export const matchJobWithPreferences = (
  job: Job,
  preferences: SubscriptionPreferences
): boolean => {
  // Check if job should be excluded
  if (preferences.excludeKeywords.length > 0) {
    const jobText = `${job.title} ${job.company} ${job.description}`.toLowerCase();
    for (const excludeKeyword of preferences.excludeKeywords) {
      if (jobText.includes(excludeKeyword.toLowerCase())) {
        return false;
      }
    }
  }

  // Check keywords match (at least one keyword must match)
  if (preferences.keywords.length > 0) {
    const jobText = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
    const keywordMatched = preferences.keywords.some((keyword) =>
      jobText.includes(keyword.toLowerCase())
    );
    if (!keywordMatched) {
      return false;
    }
  }

  // Check location match
  if (preferences.locations.length > 0) {
    const jobLocation = job.location.toLowerCase();
    const isRemote = jobLocation.includes('remote');
    
    const locationMatched = preferences.locations.some((location) => {
      const prefLocation = location.toLowerCase();
      if (prefLocation === 'remote' && isRemote) return true;
      return jobLocation.includes(prefLocation);
    });

    if (!locationMatched) {
      return false;
    }
  }

  // Check work location (digital/onsite/hybrid)
  if (preferences.workLocations.length > 0) {
    if (!preferences.workLocations.includes(job.workLocation)) {
      return false;
    }
  }

  // Check job type (at least one must match)
  if (preferences.jobTypes.length > 0) {
    const jobTypeMatched = preferences.jobTypes.some(
      (type) => job.jobType.toLowerCase() === type.toLowerCase()
    );
    if (!jobTypeMatched) {
      return false;
    }
  }

  // Check salary range
  if (job.salary) {
    if (preferences.minSalary && job.salary.max < preferences.minSalary) {
      return false;
    }
    if (preferences.maxSalary && job.salary.min > preferences.maxSalary) {
      return false;
    }
  }

  // If wages exist, convert to annual and check
  if (job.wages && !job.salary) {
    const annualMin = job.wages.hourlyMin * 40 * 52;
    const annualMax = job.wages.hourlyMax * 40 * 52;

    if (preferences.minSalary && annualMax < preferences.minSalary) {
      return false;
    }
    if (preferences.maxSalary && annualMin > preferences.maxSalary) {
      return false;
    }
  }

  return true;
};

/**
 * Find all jobs that match the subscription preferences
 */
export const findMatchingJobs = (
  jobs: Job[],
  preferences: SubscriptionPreferences
): Job[] => {
  return jobs.filter((job) => matchJobWithPreferences(job, preferences));
};

/**
 * Get jobs for alert based on last alert time
 * Used for scheduled alerts (hourly, daily, weekly)
 */
export const getJobsForAlert = (
  jobs: Job[],
  preferences: SubscriptionPreferences,
  lastAlertTime?: Date
): Job[] => {
  // Get matching jobs
  const matchingJobs = findMatchingJobs(jobs, preferences);

  // If lastAlertTime is provided, only return jobs posted after that time
  if (lastAlertTime) {
    return matchingJobs.filter((job) => {
      const jobPostedDate = new Date(job.postedDate);
      return jobPostedDate > lastAlertTime;
    });
  }

  return matchingJobs;
};

/**
 * Sort jobs by most recent
 */
export const sortJobsByRecent = (jobs: Job[]): Job[] => {
  return [...jobs].sort((a, b) => {
    const dateA = new Date(a.postedDate).getTime();
    const dateB = new Date(b.postedDate).getTime();
    return dateB - dateA;
  });
};

/**
 * Limit jobs to a specific count
 */
export const limitJobs = (jobs: Job[], limit: number): Job[] => {
  return jobs.slice(0, limit);
};

/**
 * Get jobs ready for email alert
 * Returns most recent matching jobs
 */
export const getJobsForEmailAlert = (
  jobs: Job[],
  preferences: SubscriptionPreferences,
  lastAlertTime?: Date,
  limit: number = 10
): Job[] => {
  const jobsForAlert = getJobsForAlert(jobs, preferences, lastAlertTime);
  const sortedJobs = sortJobsByRecent(jobsForAlert);
  return limitJobs(sortedJobs, limit);
};
