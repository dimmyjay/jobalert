/**
 * API Route: Get Jobs
 * GET /api/jobs
 * 
 * Returns all available jobs from Firebase
 */

import { NextRequest, NextResponse } from 'next/server';
import { ref, get, child, set } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
    try {
        // Verify authorization
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.INTERNAL_API_KEY;

        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!db) {
            return NextResponse.json(
                { error: 'Database not initialized' },
                { status: 500 }
            );
        }

        // Fetch jobs from Firebase
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, 'jobs'));

        if (!snapshot.exists()) {
            return NextResponse.json(
                { jobs: [], message: 'No jobs available' },
                { status: 200 }
            );
        }

        const jobs: any[] = [];
        snapshot.forEach((childSnapshot) => {
            jobs.push({
                id: childSnapshot.key || '',
                ...childSnapshot.val(),
            });
        });

        return NextResponse.json(
            { 
                jobs,
                total: jobs.length,
                message: `Successfully fetched ${jobs.length} jobs`,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching jobs:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch jobs',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * POST endpoint to add a new job (admin only)
 */
export async function POST(request: NextRequest) {
    try {
        // Verify admin authorization
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.INTERNAL_API_KEY;

        if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!db) {
            return NextResponse.json(
                { error: 'Database not initialized' },
                { status: 500 }
            );
        }

        const jobData = await request.json();

        // Validate required fields
        const requiredFields = ['title', 'company', 'description', 'location', 'jobType', 'workLocation', 'url'];
        for (const field of requiredFields) {
            if (!jobData[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Add job to Firebase
        const jobId = `job-${Date.now()}`;
        const dbRef = ref(db, `jobs/${jobId}`);

        await set(dbRef, {
            id: jobId,
            title: jobData.title,
            company: jobData.company,
            description: jobData.description,
            salary: jobData.salary || null,
            location: jobData.location,
            jobType: jobData.jobType,
            workLocation: jobData.workLocation,
            skills: jobData.skills || [],
            postedDate: new Date().toISOString(),
            url: jobData.url,
        });

        return NextResponse.json(
            { 
                message: 'Job added successfully',
                jobId,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error adding job:', error);
        return NextResponse.json(
            { 
                error: 'Failed to add job',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
