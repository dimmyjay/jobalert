"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Sparkles,
  TrendingUp,
  UserCheck,
  Bot,
  Send,
} from "lucide-react";

const articles = [
  {
    title: "How to Create a Job-Winning CV in 2026",
    category: "Resume Tips",
    readTime: "5 min read",
    description:
      "Build a professional CV that gets noticed by recruiters and passes ATS systems.",
  },
  {
    title: "10 Common Interview Questions and How to Answer Them",
    category: "Interview Tips",
    readTime: "7 min read",
    description:
      "Prepare for interviews with clear, confident, and professional answers.",
  },
  {
    title: "Best Remote Jobs You Can Start Today",
    category: "Remote Work",
    readTime: "6 min read",
    description:
      "Explore digital and remote jobs you can do from anywhere.",
  },
  {
    title: "How to Negotiate a Higher Salary",
    category: "Career Growth",
    readTime: "8 min read",
    description:
      "Learn practical strategies to increase your earning potential.",
  },
  {
    title: "Top Skills Employers Are Looking For",
    category: "Skills",
    readTime: "4 min read",
    description:
      "Discover the most valuable skills for today’s job market.",
  },
  {
    title: "How to Get Hired Faster",
    category: "Job Search",
    readTime: "6 min read",
    description:
      "Use smarter job search strategies to increase your chances quickly.",
  },
];

export default function CareerTipsPage() {
  const [topic, setTopic] = useState("");
  const [aiTips, setAiTips] = useState("");
  const [loadingTips, setLoadingTips] = useState(false);

  const generateCareerTips = async () => {
    try {
      setLoadingTips(true);
      setAiTips("");

      const response = await fetch("/api/career-tips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic || "general job search and career growth",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate career tips");
      }

      setAiTips(data.tips);
    } catch (error) {
      setAiTips(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating tips."
      );
    } finally {
      setLoadingTips(false);
    }
  };

  return (
    <>
      <Nav />

      <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white pt-28 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.15),transparent_35%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300 mb-6">
              <Sparkles size={16} />
              Career Growth Resources
            </div>

            <h1 className="text-5xl md:text-6xl font-black leading-tight">
              Career
              <span className="block bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
                Tips & Resources
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-300 leading-8">
              Get expert job search advice, interview tips, resume guidance,
              and AI-powered career support to help you land better jobs.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-16">
            {[
              ["100+", "Career Articles", BookOpen],
              ["500+", "Job Resources", BriefcaseBusiness],
              ["95%", "Success Guide", TrendingUp],
              ["10K+", "Professionals Helped", UserCheck],
            ].map(([value, label, Icon]: any) => (
              <div
                key={label}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
              >
                <Icon className="text-yellow-300 mb-3" size={28} />
                <div className="text-3xl font-black text-white">{value}</div>
                <p className="text-gray-400 text-sm">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-yellow-400/20 bg-white/[0.04] p-8 backdrop-blur-xl mb-20">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="text-yellow-300" size={30} />
              <h2 className="text-3xl font-black">Ask AI For Career Tips</h2>
            </div>

            <p className="text-gray-300 mb-6">
              Type any career topic and Groq AI will generate helpful advice
              instantly.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Example: React developer interview tips"
                className="flex-1 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-white outline-none focus:border-yellow-400"
              />

              <button
                onClick={generateCareerTips}
                disabled={loadingTips}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 px-6 py-4 font-black text-black transition hover:shadow-2xl hover:shadow-yellow-400/30 disabled:opacity-60"
              >
                <Send size={18} />
                {loadingTips ? "Generating..." : "Generate Tips"}
              </button>
            </div>

            {aiTips && (
              <div className="mt-8 whitespace-pre-line rounded-2xl border border-white/10 bg-zinc-900/80 p-6 text-gray-300 leading-8">
                {aiTips}
              </div>
            )}
          </div>

          <div className="mb-20">
            <h2 className="text-3xl font-black mb-8">Latest Career Tips</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <div
                  key={article.title}
                  className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-yellow-400/50 hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-yellow-400/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="rounded-full bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 text-xs font-bold text-yellow-300">
                      {article.category}
                    </span>

                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <Clock3 size={14} />
                      {article.readTime}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-300 transition">
                    {article.title}
                  </h3>

                  <p className="text-gray-400 text-sm leading-7 mb-5">
                    {article.description}
                  </p>

                  <button className="flex items-center gap-2 text-yellow-300 font-semibold">
                    Read More
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <h2 className="text-3xl font-black mb-8">
              Essential Career Success Tips
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Keep your resume updated regularly.",
                "Apply to jobs consistently every week.",
                "Build a strong LinkedIn profile.",
                "Learn new in-demand skills continuously.",
                "Prepare thoroughly for interviews.",
                "Network with professionals in your industry.",
                "Customize applications for each role.",
                "Follow up after interviews professionally.",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-3">
                  <CheckCircle2 className="text-yellow-300 mt-1" size={20} />
                  <span className="text-gray-300">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20 text-center rounded-[2rem] border border-yellow-400/20 bg-gradient-to-r from-yellow-400/10 via-orange-400/5 to-red-500/10 p-10">
            <h2 className="text-4xl font-black mb-4">
              Ready To Find Your Next Job?
            </h2>

            <p className="text-gray-300 max-w-2xl mx-auto mb-8">
              Browse thousands of jobs and receive personalized job alerts
              directly in your inbox.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 px-8 py-4 font-black text-black transition hover:shadow-2xl hover:shadow-yellow-400/30"
              >
                Browse Jobs
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/alerts"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 font-bold text-white hover:border-yellow-400 hover:text-yellow-300 transition"
              >
                Get Job Alerts
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}