"use client";

import { useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  Send,
  Clock3,
  MessageSquare,
} from "lucide-react";
import Nav from "@/components/Nav";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert("Message sent successfully!");
    }, 1500);
  };

  return (
    <>
    <Nav />

    <section className="relative min-h-screen overflow-hidden bg-zinc-950 px-4 py-24 text-white sm:px-6 lg:px-8">
      {/* Background Effects */}
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.15),transparent_35%)]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
       
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
            Contact Us
          </span>

          <h1 className="mt-6 text-4xl font-black sm:text-6xl">
            Let's Talk About Your
            <span className="block bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Career Goals
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-zinc-300">
            Have questions about JobAlert? Need help with your
            subscription? We'd love to hear from you.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-yellow-400 p-3 text-black">
                  <Mail size={24} />
                </div>

                <div>
                  <h3 className="font-bold text-white">
                    Email Address
                  </h3>
                  <p className="text-zinc-400">
                    dimejifalayi@gmail.com
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-yellow-400 p-3 text-black">
                  <Phone size={24} />
                </div>

                <div>
                  <h3 className="font-bold text-white">
                    Phone Number
                  </h3>
                  <p className="text-zinc-400">
                    +234 703 878 4017
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-yellow-400 p-3 text-black">
                  <MapPin size={24} />
                </div>

                <div>
                  <h3 className="font-bold text-white">
                    Location
                  </h3>
                  <p className="text-zinc-400">
                    Lagos, Nigeria
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-yellow-400 p-3 text-black">
                  <Clock3 size={24} />
                </div>

                <div>
                  <h3 className="font-bold text-white">
                    Support Hours
                  </h3>
                  <p className="text-zinc-400">
                    Monday - Friday
                  </p>
                  <p className="text-zinc-400">
                    8:00 AM - 6:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 backdrop-blur">
            <div className="mb-8 flex items-center gap-3">
              <MessageSquare className="text-yellow-300" />
              <h2 className="text-2xl font-black">
                Send Us A Message
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full Name
                </label>

                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-white outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email Address
                </label>

                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-white outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Subject
                </label>

                <input
                  type="text"
                  required
                  placeholder="Enter message subject"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-white outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Message
                </label>

                <textarea
                  required
                  rows={6}
                  placeholder="Write your message here..."
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-white outline-none transition focus:border-yellow-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-4 font-black text-black transition hover:bg-yellow-300 disabled:opacity-50"
              >
                <Send size={18} />
                {loading
                  ? "Sending..."
                  : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}