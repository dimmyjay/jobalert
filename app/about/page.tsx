import Link from "next/link";
import { Bell, BriefcaseBusiness, CheckCircle2, Mail, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10">
          <span className="rounded-full bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
            About JobAlert
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-6xl">
            Helping people get the right job alerts faster.
          </h1>

          <p className="mt-6 max-w-3xl text-lg text-slate-300">
            JobAlert helps users receive matched job opportunities through email based on
            their skills, location, job type, and alert frequency.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <Bell className="mb-4 h-10 w-10 text-yellow-300" />
            <h2 className="text-xl font-bold">Smart Job Alerts</h2>
            <p className="mt-3 text-slate-300">
              Users can receive hourly, daily, or weekly job alerts directly by email.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <BriefcaseBusiness className="mb-4 h-10 w-10 text-blue-300" />
            <h2 className="text-xl font-bold">Real Job Matching</h2>
            <p className="mt-3 text-slate-300">
              JobAlert compares user preferences with available jobs and sends only useful matches.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <Mail className="mb-4 h-10 w-10 text-green-300" />
            <h2 className="text-xl font-bold">Email Delivery</h2>
            <p className="mt-3 text-slate-300">
              Matched jobs are sent to the user’s email after successful subscription payment.
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-r from-blue-700 to-slate-900 p-8">
          <h2 className="text-3xl font-bold">Why Choose JobAlert?</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "Easy job alert subscription",
              "Hourly, daily, and weekly email options",
              "Digital and onsite job categories",
              "Fast job matching system",
              "Secure payment integration",
              "Helpful for job seekers and employers",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-yellow-300" />
                <span className="text-slate-100">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/alerts"
            className="rounded-full bg-yellow-400 px-8 py-4 text-center font-bold text-slate-950 hover:bg-yellow-300"
          >
            Create Job Alert
          </Link>

          <Link
            href="/jobs"
            className="rounded-full border border-white/20 px-8 py-4 text-center font-bold text-white hover:bg-white/10"
          >
            Browse Jobs
          </Link>
        </div>
      </section>
    </main>
  );
}