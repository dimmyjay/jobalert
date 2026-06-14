"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Search,
  Sparkles,
} from "lucide-react";

export default function BrowseJobsCTA() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 px-4 py-24 text-white sm:px-6 lg:px-8">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.2),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.2),transparent_35%)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-2xl">
          <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
            {/* Left Side */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
                <Sparkles size={16} />
                Thousands of Opportunities Waiting
              </div>

              <h2 className="text-3xl font-black leading-tight sm:text-5xl">
                Browse The Latest
                <span className="block bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
                  Available Jobs
                </span>
              </h2>

              <p className="mt-6 text-base leading-8 text-zinc-300 sm:text-lg">
                Discover remote, digital, hybrid, and onsite opportunities
                from trusted companies worldwide. Apply directly and take the
                next step in your career today.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/jobs"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-7 py-4 text-base font-black text-black shadow-xl shadow-yellow-400/20 transition hover:bg-yellow-300"
                >
                  Browse Jobs
                  <ArrowRight size={20} />
                </Link>

                <Link
                  href="/alerts"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-4 text-base font-bold text-white transition hover:border-yellow-400 hover:text-yellow-300"
                >
                  Get Job Alerts
                </Link>
              </div>
            </div>

            {/* Right Side */}
            <div className="relative">
              <div className="absolute -inset-5 rounded-[2rem] bg-yellow-400/10 blur-2xl" />

              <div className="relative rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">
                      Available Jobs
                    </p>
                    <h3 className="text-2xl font-black">
                      Live Opportunities
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-yellow-400 p-3 text-black">
                    <BriefcaseBusiness size={26} />
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      title: "Senior React Developer",
                      type: "Remote",
                      salary: "$5,000 - $8,000/mo",
                    },
                    {
                      title: "Virtual Assistant",
                      type: "Digital",
                      salary: "$800 - $1,500/mo",
                    },
                    {
                      title: "Customer Support Officer",
                      type: "Hybrid",
                      salary: "₦250k - ₦450k",
                    },
                  ].map((job) => (
                    <div
                      key={job.title}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-yellow-400/40"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold">
                            {job.title}
                          </h4>

                          <p className="mt-1 text-sm text-zinc-400">
                            {job.type}
                          </p>
                        </div>

                        <Search
                          size={18}
                          className="text-yellow-300"
                        />
                      </div>

                      <p className="mt-3 text-sm font-bold text-green-400">
                        {job.salary}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                  <p className="text-sm text-zinc-300">
                    🔥 New jobs are added daily. Browse opportunities and
                    apply directly from our platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}