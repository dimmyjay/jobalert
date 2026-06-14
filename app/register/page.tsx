"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  BriefcaseBusiness,
} from "lucide-react";
import Nav from "@/components/Nav";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const saveUserToDatabase = async (
    uid: string,
    name: string,
    email: string,
    photoURL?: string | null
  ) => {
    await set(ref(db, `users/${uid}`), {
      uid,
      name,
      email,
      photoURL: photoURL || "",
      provider: photoURL ? "google" : "email",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const fullName = String(formData.get("fullName"));
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const confirmPassword = String(formData.get("confirmPassword"));

    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: fullName,
      });

      await saveUserToDatabase(
        userCredential.user.uid,
        fullName,
        email,
        userCredential.user.photoURL
      );

      router.push("/alerts");
    } catch (error: any) {
      setError(error.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      const userCredential = await signInWithPopup(auth, provider);

      await saveUserToDatabase(
        userCredential.user.uid,
        userCredential.user.displayName ||
          userCredential.user.email?.split("@")[0] ||
          "User",
        userCredential.user.email || "",
        userCredential.user.photoURL
      );

      router.push("/alerts");
    } catch (error: any) {
      setError(error.message || "Google registration failed.");
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
                <BriefcaseBusiness
                  className="text-black"
                  size={30}
                />
              </div>

              <h1 className="text-4xl font-black">
                Create Account
              </h1>

              <p className="mt-3 text-gray-400">
                Join JobAlert and start receiving personalized job opportunities.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <form
              onSubmit={handleRegister}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full Name
                </label>

                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />

                  <input
                    name="fullName"
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 py-4 pl-12 pr-4 text-white outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />

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
                <label className="mb-2 block text-sm font-medium">
                  Password
                </label>

                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />

                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="********"
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 py-4 pl-12 pr-4 text-white outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Confirm Password
                </label>

                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />

                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    placeholder="********"
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 py-4 pl-12 pr-4 text-white outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm text-gray-300">
                <input
                  type="checkbox"
                  required
                  className="h-4 w-4"
                />

                I agree to the Terms and Privacy Policy
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 px-6 py-4 font-black text-black transition hover:shadow-2xl hover:shadow-yellow-400/30 disabled:opacity-60"
              >
                {loading ? (
                  "Creating Account..."
                ) : (
                  <>
                    Create Account
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
              onClick={handleGoogleRegister}
              disabled={googleLoading}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 font-semibold text-white transition hover:border-yellow-400 disabled:opacity-60"
            >
              {googleLoading
                ? "Connecting Google..."
                : "Continue with Google"}
            </button>

            <p className="mt-8 text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-yellow-300 hover:text-yellow-200"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}