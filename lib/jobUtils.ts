import axios from 'axios';
import { ref, get, set } from 'firebase/database';
import { db } from './firebase'; // Ensure this path points to your firebase.ts initialization file

// ==========================================
// 1. INTERFACES
// ==========================================

export interface Job {
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
  salaryType?: 'annual' | 'hourly' | 'mixed' | 'unknown';
  description: string;
  url: string;
  tags: string[];
  postedDate: string;
  jobType: string;
  requirements?: string[];
  benefits?: string[];
  applicationUrl?: string;
}

export interface UserPreferences {
  keywords?: string[];
  locations?: string[];
  minSalary?: number;
  maxSalary?: number;
  jobTypes?: string[];
  excludeKeywords?: string[];
}

export interface JobApplication {
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  resumePath?: string;
  additionalDocuments?: string[];
  appliedAt: string;
}

export interface JobMatch {
  job: Job;
  matchScore: number; // 0-100
  matchReasons: string[];
}

// ==========================================
// 2. FIREBASE DATABASE OPERATIONS
// ==========================================

export async function fetchAllJobs(): Promise<Job[]> {
  try {
    const jobsRef = ref(db, 'jobs');
    const snapshot = await get(jobsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching jobs from Firebase:', error);
    throw new Error('Failed to fetch jobs from database');
  }
}

export async function getJobById(jobId: string): Promise<Job | null> {
  try {
    const jobRef = ref(db, `jobs/${jobId}`);
    const snapshot = await get(jobRef);
    if (snapshot.exists()) return { id: jobId, ...snapshot.val() };
    return null;
  } catch (error) {
    console.error(`Error fetching job ${jobId}:`, error);
    return null;
  }
}

export async function applyForJob(application: JobApplication): Promise<{ success: boolean; message: string; applicationId?: string }> {
  try {
    if (!application.jobId || !application.firstName || !application.lastName || !application.email || !application.message) {
      return { success: false, message: 'Missing required fields.' };
    }

    const applicationId = `APP_${Date.now()}`;
    const appRef = ref(db, `applications/${applicationId}`);
    await set(appRef, { ...application, appliedAt: application.appliedAt || new Date().toISOString() });

    return { success: true, message: 'Application submitted successfully!', applicationId };
  } catch (error) {
    console.error('Error submitting job application:', error);
    return { success: false, message: 'Failed to submit application.' };
  }
}

export async function getUserApplications(userEmail: string): Promise<JobApplication[]> {
  try {
    const appsRef = ref(db, 'applications');
    const snapshot = await get(appsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data).filter((app: any) => app.email?.toLowerCase() === userEmail.toLowerCase()) as JobApplication[];
    }
    return [];
  } catch (error) {
    return [];
  }
}

export function clearJobCache(): void {
  console.log('Local cache removed. Using Firebase Realtime Database.');
}

// ==========================================
// 3. API FETCHERS & SYNC (REMOTE OK & ARBEITNOW)
// ==========================================

/**
 * Safety Net: Recursively removes undefined values to prevent Firebase 'set failed' errors
 */
function cleanForFirebase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirebase);
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = cleanForFirebase(obj[key]);
    }
  }
  return cleaned;
}

/**
 * Safety Net: Prevents "Invalid time value" crashes by safely parsing dates
 */
function safeDate(dateValue: any): string {
  if (!dateValue) return new Date().toISOString();
  let date: Date;
  if (typeof dateValue === 'number') {
    date = new Date(dateValue < 10000000000 ? dateValue * 1000 : dateValue);
  } else if (typeof dateValue === 'string') {
    date = new Date(dateValue);
  } else {
    return new Date().toISOString();
  }
  if (isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function parseSimpleSalary(salaryString: string): Job['salary'] | undefined {
  if (!salaryString || typeof salaryString !== 'string') return undefined;
  const numbers = salaryString.match(/\d+/g);
  if (!numbers || numbers.length < 2) return undefined;
  let min = parseInt(numbers[0]);
  let max = parseInt(numbers[1]);
  if (salaryString.toLowerCase().includes('k')) { min *= 1000; max *= 1000; }
  if (min <= 0 || max <= 0 || min > max) return undefined;
  const currency = salaryString.includes('€') ? '€' : (salaryString.includes('£') ? '£' : '$');
  return { min, max, currency };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

async function fetchFromRemoteOK(): Promise<Job[]> {
  try {
    const response = await axios.get('https://remoteok.com/api', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const rawJobs = response.data.slice(1);

    return rawJobs.map((job: any) => ({
      id: `rok_${job.id || Math.random()}`, 
      title: job.position || 'Unknown Position',
      company: job.company || 'Unknown Company',
      location: job.location || 'Remote',
      workLocation: 'digital' as const, 
      salary: parseSimpleSalary(job.salary || ''),
      description: stripHtml(job.description || ''),
      url: job.url || '',
      applicationUrl: job.url || '',
      tags: Array.isArray(job.tag) ? job.tag : (job.tags ? (Array.isArray(job.tags) ? job.tags : [job.tags]) : []),
      postedDate: safeDate(job.date),
      jobType: 'Full-time', 
    }));
  } catch (error) {
    console.error('Error fetching from Remote OK:', error);
    return [];
  }
}

async function fetchFromArbeitnow(): Promise<Job[]> {
  try {
    const response = await axios.get('https://www.arbeitnow.com/api/job-board-api?remote=true');
    const rawJobs = response.data.data;

    return rawJobs.map((job: any) => ({
      id: `arb_${job.slug || Math.random()}`, 
      title: job.title || 'Unknown Position',
      company: job.company_name || 'Unknown Company',
      location: job.location || 'Remote',
      workLocation: job.remote ? ('digital' as const) : ('onsite' as const),
      salary: parseSimpleSalary(job.salary || ''),
      description: stripHtml(job.description || ''),
      url: job.url || '',
      applicationUrl: job.url || '',
      tags: Array.isArray(job.tags) ? job.tags : [],
      postedDate: safeDate(job.created_at),
      jobType: job.job_type || 'Full-time',
    }));
  } catch (error) {
    console.error('Error fetching from Arbeitnow:', error);
    return [];
  }
}

export async function syncJobsToFirebase(): Promise<number> {
  try {
    console.log('Starting job sync...');
    const [rokJobs, arbJobs] = await Promise.all([fetchFromRemoteOK(), fetchFromArbeitnow()]);

    const allJobs = [...rokJobs, ...arbJobs];
    const uniqueJobsMap = new Map<string, Job>();
    
    allJobs.forEach(job => {
      const key = `${job.title}-${job.company}`;
      if (!uniqueJobsMap.has(key)) uniqueJobsMap.set(key, job);
    });

    const uniqueJobs = Array.from(uniqueJobsMap.values());
    const jobsData: Record<string, any> = {};
    
    uniqueJobs.forEach(job => {
      const { id, ...rest } = job;
      jobsData[id] = cleanForFirebase(rest); // Strips undefined values before saving
    });

    const jobsRef = ref(db, 'jobs');
    await set(jobsRef, jobsData);

    console.log(`Successfully synced ${uniqueJobs.length} jobs to Firebase!`);
    return uniqueJobs.length;
  } catch (error) {
    console.error('Failed to sync jobs:', error);
    throw error;
  }
}

// ==========================================
// 4. PURE UTILITY FUNCTIONS (SORTING, FILTERING, ETC.)
// ==========================================

export function sortJobs(jobs: Job[], sortBy: 'newest' | 'salary-high' | 'salary-low' | 'company' = 'newest'): Job[] {
  const sorted = [...jobs];
  switch (sortBy) {
    case 'newest':
      sorted.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
      break;
    case 'salary-high':
      sorted.sort((a, b) => {
        let aMax = a.salary?.max || 0;
        let bMax = b.salary?.max || 0;
        if (a.wages && !a.salary) aMax = a.wages.hourlyMax * 40 * 52;
        if (b.wages && !b.salary) bMax = b.wages.hourlyMax * 40 * 52;
        return bMax - aMax;
      });
      break;
    case 'salary-low':
      sorted.sort((a, b) => {
        let aMin = a.salary?.min || 0;
        let bMin = b.salary?.min || 0;
        if (a.wages && !a.salary) aMin = a.wages.hourlyMin * 40 * 52;
        if (b.wages && !b.salary) bMin = b.wages.hourlyMin * 40 * 52;
        return aMin - bMin;
      });
      break;
    case 'company':
      sorted.sort((a, b) => a.company.localeCompare(b.company));
      break;
  }
  return sorted;
}

export function paginateJobs(jobs: Job[], page: number = 1, pageSize: number = 10): { jobs: Job[]; totalPages: number; currentPage: number } {
  const totalPages = Math.ceil(jobs.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  return { jobs: jobs.slice(startIndex, startIndex + pageSize), totalPages, currentPage: page };
}

export function getAvailableTags(jobs: Job[]): string[] {
  const tags = new Set<string>();
  jobs.forEach(job => {
    // ✅ Added ?. so it won't crash if tags is somehow still undefined
    job.tags?.forEach(tag => { 
      if (tag && tag.trim()) tags.add(tag.trim()); 
    });
  });
  return Array.from(tags).sort();
}

export function getAvailableLocations(jobs: Job[]): string[] {
  const locations = new Set<string>();
  jobs.forEach(job => { if (job.location && job.location.trim()) locations.add(job.location.trim()); });
  return Array.from(locations).sort();
}

export function getSalaryStats(jobs: Job[]): { minSalary: number; maxSalary: number; averageSalary: number } {
  const salaries: number[] = [];
  jobs.forEach(job => {
    if (job.salary) { salaries.push(job.salary.min); salaries.push(job.salary.max); }
    if (job.wages) { salaries.push(job.wages.hourlyMin * 40 * 52); salaries.push(job.wages.hourlyMax * 40 * 52); }
  });

  if (salaries.length === 0) return { minSalary: 0, maxSalary: 0, averageSalary: 0 };
  return {
    minSalary: Math.min(...salaries),
    maxSalary: Math.max(...salaries),
    averageSalary: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
  };
}



export function searchJobs(jobs: Job[], searchTerm: string): Job[] {
  const term = searchTerm.toLowerCase();
  return jobs.filter(job => 
    job.title?.toLowerCase().includes(term) || 
    job.company?.toLowerCase().includes(term) || 
    job.description?.toLowerCase().includes(term) || 
    job.tags?.some(tag => tag.toLowerCase().includes(term)) // ✅ Added ?. here
  );
}

export function filterJobsByPreferences(jobs: Job[], preferences: UserPreferences): Job[] {
  return jobs.filter(job => {
    if (preferences.keywords?.length) {
      const match = preferences.keywords.some(k => 
        job.title.toLowerCase().includes(k.toLowerCase()) || 
        job.tags.some(t => t.toLowerCase().includes(k.toLowerCase())) || 
        job.description.toLowerCase().includes(k.toLowerCase())
      );
      if (!match) return false;
    }
    if (preferences.excludeKeywords?.length) {
      const exclude = preferences.excludeKeywords.some(k => 
        job.title.toLowerCase().includes(k.toLowerCase()) || 
        job.description.toLowerCase().includes(k.toLowerCase())
      );
      if (exclude) return false;
    }
    return true;
  });
}

export function findMatchingJobs(jobs: Job[], preferences: UserPreferences, minMatchScore: number = 40): JobMatch[] {
  return jobs
    .map(job => ({ job, matchScore: 50, matchReasons: ['Matches profile'] })) // Simplified matching
    .filter(match => match.matchScore >= minMatchScore)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export async function getMatchingJobs(preferences: UserPreferences, searchTerm?: string, sortBy: 'newest' | 'salary-high' | 'salary-low' | 'company' = 'newest', page: number = 1, pageSize: number = 20) {
  try {
    let jobs = await fetchAllJobs();
    jobs = filterJobsByPreferences(jobs, preferences);
    if (searchTerm) jobs = searchJobs(jobs, searchTerm);
    jobs = sortJobs(jobs, sortBy);
    const paginated = paginateJobs(jobs, page, pageSize);

    return {
      success: true,
      data: paginated.jobs,
      pagination: { currentPage: paginated.currentPage, totalPages: paginated.totalPages, pageSize, totalJobs: jobs.length },
    };
  } catch (error) {
    return { success: false, error: 'Unknown error', data: [], pagination: { currentPage: 1, totalPages: 0, pageSize: 20, totalJobs: 0 } };
  }
}

export async function getSmartJobRecommendations(preferences: UserPreferences, page: number = 1, pageSize: number = 20, minMatchScore: number = 40) {
  try {
    let jobs = await fetchAllJobs();
    const matchedJobs = findMatchingJobs(jobs, preferences, minMatchScore);
    const totalPages = Math.ceil(matchedJobs.length / pageSize);
    const startIndex = (page - 1) * pageSize;

    return {
      success: true,
      data: matchedJobs.slice(startIndex, startIndex + pageSize),
      pagination: { currentPage: page, totalPages, pageSize, totalMatches: matchedJobs.length },
      summary: { totalJobs: jobs.length, matchedJobs: matchedJobs.length, matchPercentage: Math.round((matchedJobs.length / jobs.length) * 100) },
    };
  } catch (error) {
    return { success: false, error: 'Unknown error', data: [], pagination: { currentPage: 1, totalPages: 0, pageSize: 20, totalMatches: 0 }, summary: { totalJobs: 0, matchedJobs: 0, matchPercentage: 0 } };
  }
}

export function isJobMatch(job: Job, preferences: UserPreferences): boolean {
  const filtered = filterJobsByPreferences([job], preferences);
  return filtered.length > 0;
}