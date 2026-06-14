"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
} from "lucide-react";
import Nav from "@/components/Nav";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/alerts");
    } catch (error: any) {
      setError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);

      router.push("/alerts");
    } catch (error: any) {
      setError(error.message || "Google login failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Nav />

      <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white pt-28 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.15),transparent_35%)]" />

        <div className="relative z-10 mx-auto max-w-md px-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl shadow-2xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500">
                <BriefcaseBusiness className="text-black" size={30} />
              </div>

              <h1 className="text-4xl font-black">
                Welcome Back
              </h1>

              <p className="mt-3 text-gray-400">
                Sign in to access your job alerts and subscriptions.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />

                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 py-4 pl-12 pr-4 text-white outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs text-yellow-300 hover:text-yellow-200"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />

                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="********"
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 py-4 pl-12 pr-12 text-white outline-none focus:border-yellow-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 px-6 py-4 font-black text-black transition hover:shadow-2xl hover:shadow-yellow-400/30 disabled:opacity-60"
              >
                {loading ? (
                  "Signing In..."
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center">
              <div className="h-px flex-1 bg-white/10" />
              <span className="px-4 text-sm text-gray-500">
                OR
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 font-semibold text-white transition hover:border-yellow-400 disabled:opacity-60"
            >
              {googleLoading ? "Connecting Google..." : "Continue with Google"}
            </button>

            <p className="mt-8 text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-yellow-300 hover:text-yellow-200"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}