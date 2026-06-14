"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";

const faqs = [
  {
    question: "What is JobAlert?",
    answer:
      "JobAlert is a platform that helps job seekers receive job opportunities directly through email based on their preferred job type, location, skills, and alert frequency.",
  },
  {
    question: "How does JobAlert work?",
    answer:
      "Users subscribe to job alerts, choose their preferred job categories, and receive matching jobs through email whenever suitable opportunities become available.",
  },
  {
    question: "Can I receive remote jobs?",
    answer:
      "Yes. You can choose remote jobs, onsite jobs, hybrid jobs, freelance opportunities, and digital jobs.",
  },
  {
    question: "How often will I receive job alerts?",
    answer:
      "You can select hourly, daily, or weekly email notifications depending on your subscription plan.",
  },
  {
    question: "Do I need to pay before receiving alerts?",
    answer:
      "Yes. A valid subscription is required before premium job alerts can be sent to your email address.",
  },
  {
    question: "How do employers post jobs?",
    answer:
      "Employers can create and publish job vacancies through the employer dashboard after completing the required payment.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Yes. You can cancel your subscription at any time from your account dashboard.",
  },
  {
    question: "How will I receive my job matches?",
    answer:
      "All job matches are delivered directly to your registered email address.",
  },
  {
    question: "Can I change my job preferences later?",
    answer:
      "Yes. You can update your skills, location, preferred industries, and alert settings anytime.",
  },
  {
    question: "What types of jobs are available?",
    answer:
      "We provide digital jobs, remote jobs, onsite jobs, contract jobs, freelance work, internships, and full-time employment opportunities.",
  },
  {
    question: "How do I apply for a job?",
    answer:
      "Open the job alert email, review the job details, and click the application link provided in the email.",
  },
  {
    question: "Is my personal information secure?",
    answer:
      "Yes. We use secure technologies to protect your personal information and do not share your data without permission.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400/10 px-4 py-2 text-yellow-300">
            <HelpCircle className="h-4 w-4" />
            Frequently Asked Questions
          </div>

          <h1 className="mt-6 text-4xl font-extrabold md:text-6xl">
            Frequently Asked Questions
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-lg text-slate-300">
            Find answers to common questions about JobAlert subscriptions,
            job matching, employer postings, and email notifications.
          </p>
        </div>

        <div className="mt-14 space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-lg font-semibold">
                  {faq.question}
                </span>

                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-yellow-300" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-yellow-300" />
                )}
              </button>

              {openIndex === index && (
                <div className="border-t border-white/10 px-6 py-5 text-slate-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-yellow-400/20 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-8 text-center">
          <h2 className="text-2xl font-bold">
            Still Have Questions?
          </h2>

          <p className="mt-4 text-slate-300">
            Contact our support team and we will be happy to help you.
          </p>

          <a
            href="mailto:support@jobalert.com"
            className="mt-6 inline-block rounded-full bg-yellow-400 px-8 py-4 font-bold text-slate-950 transition hover:bg-yellow-300"
          >
            Contact Support
          </a>
        </div>
      </section>
    </main>
  );
}