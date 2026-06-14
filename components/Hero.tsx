"use client";

import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  CheckCircle2,
  Globe2,
  Sparkles,
  Zap,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 px-4 pt-28 pb-20 text-white sm:px-6 lg:px-8">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.25),transparent_35%)]" />
      <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-yellow-400/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        {/* Left */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
            <Sparkles size={16} />
            Smart Job Alerts Built For Fast Opportunities
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-7xl">
            Never Miss Your
            <span className="block bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Next Big Job
            </span>
            Opportunity.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
            Get digital, remote, hybrid, and onsite job matches delivered
            straight to your email. Choose your skills, location, and alert
            frequency while JobAlert does the searching for you.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/alerts"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-7 py-4 text-base font-black text-black shadow-2xl shadow-yellow-400/20 transition hover:bg-yellow-300"
            >
              Start Job Alerts
              <ArrowRight size={20} />
            </Link>

            <Link
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-4 text-base font-bold text-white transition hover:border-yellow-400 hover:text-yellow-300"
            >
              Browse Jobs
              <BriefcaseBusiness size={20} />
            </Link>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            {[
              ["10K+", "Jobs Tracked"],
              ["24/7", "Auto Alerts"],
              ["3", "Alert Plans"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <p className="text-2xl font-black text-yellow-300">{value}</p>
                <p className="mt-1 text-xs text-zinc-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="relative">
          <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-r from-yellow-400/20 to-red-500/20 blur-2xl" />

          <div className="relative rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[1.5rem] bg-zinc-950 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Live Job Matches</p>
                  <h3 className="text-2xl font-black">Today’s Top Alerts</h3>
                </div>

                <div className="rounded-2xl bg-yellow-400 p-3 text-black">
                  <BellRing size={24} />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "Senior React Developer",
                    company: "RemoteTech Global",
                    tag: "Remote",
                    salary: "$5k - $8k/mo",
                  },
                  {
                    title: "Virtual Assistant",
                    company: "Digital Support Hub",
                    tag: "Digital",
                    salary: "$800 - $1.5k/mo",
                  },
                  {
                    title: "Customer Support Officer",
                    company: "BrightCare Services",
                    tag: "Hybrid",
                    salary: "₦250k - ₦450k",
                  },
                ].map((job) => (
                  <div
                    key={job.title}
                    className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-yellow-400/50 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-white">{job.title}</h4>
                        <p className="mt-1 text-sm text-zinc-400">
                          {job.company}
                        </p>
                      </div>

                      <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300">
                        {job.tag}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-bold text-green-400">
                        {job.salary}
                      </span>
                      <span className="text-zinc-500 group-hover:text-yellow-300">
                        View Match →
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 text-yellow-300" size={20} />
                  <p className="text-sm leading-6 text-zinc-300">
                    Your alerts are matched by keywords, location, job type,
                    and work preference before sending.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -left-4 top-10 hidden rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 shadow-xl lg:block">
            <div className="flex items-center gap-2">
              <Globe2 size={18} className="text-yellow-300" />
              <span className="text-sm font-bold">Remote + Onsite</span>
            </div>
          </div>

          <div className="absolute -right-4 bottom-10 hidden rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 shadow-xl lg:block">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-yellow-300" />
              <span className="text-sm font-bold">Instant Matches</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}