'use client';

import React, { Suspense } from 'react';
import { Zap } from 'lucide-react';
import Nav from '@/components/Nav';
import JobAlertsContent from '@/components/JobAlertsContent';

export default function JobAlertsPage() {
    return (
        <>
            <Nav />
            <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white overflow-x-hidden pt-24">
                {/* Background Gradient Orbs */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.15),transparent_35%)]" />

                {/* Main Content */}
                <div className="relative py-10 px-4 sm:px-6 lg:px-8 w-full z-10">
                    <div className="max-w-6xl mx-auto">
                        <Suspense fallback={<LoadingFallback />}>
                            <JobAlertsContent />
                        </Suspense>
                    </div>
                </div>
            </div>
        </>
    );
}

function LoadingFallback() {
    return (
        <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 mb-6 w-fit mx-auto">
                <Zap size={16} className="text-yellow-300 flex-shrink-0" />
                <span className="text-sm font-medium text-yellow-300">Loading...</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
                Set Your Job
                <br />
                <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
                    Preferences
                </span>
            </h1>
        </div>
    );
}
