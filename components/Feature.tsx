import {
  BellRing,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Filter,
  Globe2,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: BellRing,
    title: "Instant Job Alerts",
    description:
      "Receive fresh job opportunities directly in your email based on your selected alert frequency.",
  },
  {
    icon: Filter,
    title: "Smart Matching",
    description:
      "Filter jobs by keywords, location, salary, work type, and job category.",
  },
  {
    icon: Globe2,
    title: "Remote & Onsite Jobs",
    description:
      "Find digital, remote, hybrid, and onsite jobs from different industries.",
  },
  {
    icon: MailCheck,
    title: "Email Delivery",
    description:
      "Get job links sent straight to your inbox after payment and subscription activation.",
  },
  {
    icon: Clock3,
    title: "Hourly, Daily, Weekly",
    description:
      "Choose how often you want to receive job matches that fit your preference.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description:
      "Subscribe safely with Paystack and activate your alerts automatically.",
  },
];

export default function Feature() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.18),transparent_35%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
            <Sparkles size={16} />
            Powerful Features
          </div>

          <h2 className="text-3xl font-black leading-tight sm:text-5xl">
            Everything You Need To Find
            <span className="block bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Better Job Opportunities
            </span>
          </h2>

          <p className="mt-5 text-base leading-8 text-zinc-300 sm:text-lg">
            JobAlert helps users discover fresh jobs faster, receive smart
            matches, and apply directly from their inbox.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur transition hover:-translate-y-2 hover:border-yellow-400/50 hover:bg-white/[0.08]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 transition group-hover:scale-110">
                  <Icon size={28} />
                </div>

                <h3 className="text-xl font-black text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  {feature.description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm font-bold text-yellow-300">
                  <CheckCircle2 size={18} />
                  Included
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-[2rem] border border-yellow-400/20 bg-gradient-to-r from-yellow-400/10 to-red-500/10 p-8 text-center sm:p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-black">
            <BriefcaseBusiness size={28} />
          </div>

          <h3 className="text-2xl font-black sm:text-3xl">
            Start receiving jobs that match your skills.
          </h3>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
            Choose your preferences once and let JobAlert automatically notify
            you whenever matching jobs are available.
          </p>
        </div>
      </div>
    </section>
  );
}