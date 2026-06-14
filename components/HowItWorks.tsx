"use client";

import {
  BellRing,
  CreditCard,
  Mail,
  Search,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Choose Your Preferences",
    description:
      "Tell us the jobs you want by selecting keywords, skills, locations, work type, and salary expectations.",
  },
  {
    icon: CreditCard,
    title: "Activate Your Subscription",
    description:
      "Subscribe securely with Paystack and choose how often you want to receive job alerts: hourly, daily, or weekly.",
  },
  {
    icon: BellRing,
    title: "We Search For Jobs",
    description:
      "Our system continuously scans available opportunities and matches them against your selected preferences.",
  },
  {
    icon: Mail,
    title: "Receive Job Matches",
    description:
      "Get fresh job opportunities delivered directly to your email with direct application links included.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 px-4 py-24 text-white sm:px-6 lg:px-8">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.15),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.15),transparent_35%)]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
            How It Works
          </span>

          <h2 className="mt-6 text-4xl font-black sm:text-5xl">
            Finding Your Next Job Has
            <span className="block bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Never Been Easier
            </span>
          </h2>

          <p className="mt-6 text-lg leading-8 text-zinc-300">
            Set your preferences once and let JobAlert automatically
            discover matching opportunities and deliver them directly
            to your inbox.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="group relative rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm transition hover:-translate-y-2 hover:border-yellow-400/40 hover:bg-white/[0.08]"
              >
                {/* Step Number */}
                <div className="absolute right-5 top-5 text-5xl font-black text-white/5">
                  0{index + 1}
                </div>

                {/* Icon */}
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 transition group-hover:scale-110">
                  <Icon size={30} />
                </div>

                <h3 className="text-xl font-black">
                  {step.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  {step.description}
                </p>

                {index < steps.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 lg:block">
                    <ArrowRight className="text-yellow-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 rounded-[2rem] border border-yellow-400/20 bg-gradient-to-r from-yellow-400/10 to-red-500/10 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 text-black">
            <CheckCircle2 size={32} />
          </div>

          <h3 className="mt-6 text-3xl font-black">
            Ready To Receive Better Job Opportunities?
          </h3>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-300">
            Join professionals already receiving carefully matched
            opportunities directly in their inbox every day.
          </p>

          <a
            href="/alerts"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-4 text-base font-black text-black transition hover:bg-yellow-300"
          >
            Start Job Alerts Now
            <ArrowRight size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}