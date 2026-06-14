/**
 * API Route: Seed Sample Jobs to Firebase
 * GET /api/seed-jobs
 * 
 * This endpoint seeds your Firebase database with sample jobs
 * Use this once to populate jobs for testing
 * 
 * Access: http://localhost:3000/api/seed-jobs?key=your-internal-api-key
 */

import { NextRequest, NextResponse } from 'next/server';
import { ref, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { SAMPLE_JOBS } from '@/lib/sampleJobs';

export async function GET(request: NextRequest) {
    try {
        // Verify authorization
        const searchParams = request.nextUrl.searchParams;
        const apiKey = searchParams.get('key');
        const expectedKey = process.env.INTERNAL_API_KEY;

        if (!expectedKey || apiKey !== expectedKey) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Seed jobs to Firebase
        let successCount = 0;
        let failureCount = 0;

        for (const job of SAMPLE_JOBS) {
            try {
                const dbRef = ref(db, `jobs/${job.id}`);
                await set(dbRef, job);
                successCount++;
            } catch (error) {
                console.error(`Failed to seed job ${job.id}:`, error);
                failureCount++;
            }
        }

        return NextResponse.json(
            {
                message: 'Jobs seeded successfully',
                totalSeeded: SAMPLE_JOBS.length,
                successCount,
                failureCount,
                jobs: SAMPLE_JOBS,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error seeding jobs:', error);
        return NextResponse.json(
            {
                error: 'Failed to seed jobs',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
