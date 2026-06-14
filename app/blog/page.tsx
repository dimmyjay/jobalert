import Link from "next/link";
import { ArrowRight, CalendarDays, Newspaper } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "How Job Alerts Help You Find Work Faster",
    date: "June 2026",
    category: "Job Search",
    excerpt:
      "Job alerts help you avoid missing new opportunities by sending matched jobs directly to your email.",
    slug: "/blog/how-job-alerts-help-you-find-work-faster",
  },
  {
    id: 2,
    title: "Digital Jobs You Can Do From Home",
    date: "June 2026",
    category: "Remote Work",
    excerpt:
      "Explore digital jobs like data entry, virtual assistance, content writing, design, coding, and online customer support.",
    slug: "/blog/digital-jobs-you-can-do-from-home",
  },
  {
    id: 3,
    title: "Why Employers Should Post Jobs Online",
    date: "June 2026",
    category: "Employers",
    excerpt:
      "Posting jobs online helps employers reach more qualified applicants faster and manage applications better.",
    slug: "/blog/why-employers-should-post-jobs-online",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
            <Newspaper className="h-4 w-4" />
            JobAlert Blog
          </span>

          <h1 className="mt-6 text-4xl font-extrabold md:text-6xl">
            Career tips, job updates, and work opportunities.
          </h1>

          <p className="mt-5 max-w-3xl text-lg text-slate-300">
            Read useful articles about job alerts, online work, onsite jobs, hiring, and career growth.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl transition hover:-translate-y-1 hover:bg-white/10"
            >
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-300">
                {post.category}
              </span>

              <h2 className="mt-5 text-2xl font-bold">{post.title}</h2>

              <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                <CalendarDays className="h-4 w-4" />
                {post.date}
              </div>

              <p className="mt-4 text-slate-300">{post.excerpt}</p>

              <Link
                href={post.slug}
                className="mt-6 inline-flex items-center gap-2 font-bold text-yellow-300 hover:text-yellow-200"
              >
                Read More
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}