"use client";

import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  Sparkles,
} from "lucide-react";

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 px-4 py-24 sm:px-6 lg:px-8">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.25),transparent_35%)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 shadow-2xl sm:p-12 lg:p-16">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-5 py-2 text-sm font-semibold text-yellow-300">
              <Sparkles size={16} />
              Start Receiving Better Job Opportunities Today
            </div>

            {/* Heading */}
            <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Stop Searching.
              <span className="block bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
                Let Jobs Find You.
              </span>
            </h2>

            {/* Description */}
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
              Join thousands of job seekers receiving carefully matched
              opportunities directly in their inbox. Choose your
              preferences once and let JobAlert do the hard work.
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <h3 className="text-3xl font-black text-yellow-300">
                  10K+
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Jobs Tracked
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <h3 className="text-3xl font-black text-yellow-300">
                  24/7
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Smart Monitoring
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <h3 className="text-3xl font-black text-yellow-300">
                  100%
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Automated Alerts
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/alerts"
                className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-4 text-base font-black text-black shadow-xl shadow-yellow-400/20 transition hover:bg-yellow-300"
              >
                <BellRing size={20} />
                Start Job Alerts
                <ArrowRight size={20} />
              </Link>

              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-base font-bold text-white transition hover:border-yellow-400 hover:text-yellow-300"
              >
                <BriefcaseBusiness size={20} />
                Browse Jobs
              </Link>
            </div>

            {/* Trust Message */}
            <div className="mt-10 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5">
              <p className="text-sm leading-7 text-zinc-300 sm:text-base">
                🔥 New jobs are added daily. Subscribe now and receive
                matching opportunities based on your skills, location,
                work preference, and career goals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}