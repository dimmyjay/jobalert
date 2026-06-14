"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  LogOut,
  Mail,
  UserCircle,
} from "lucide-react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { ref, get } from "firebase/database";
import Nav from "@/components/Nav";
import { auth, db } from "@/lib/firebase";

type UserProfile = {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  provider?: string;
  createdAt?: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      const snapshot = await get(ref(db, `users/${currentUser.uid}`));

      if (snapshot.exists()) {
        setProfile(snapshot.val());
      } else {
        setProfile({
          uid: currentUser.uid,
          name:
            currentUser.displayName ||
            currentUser.email?.split("@")[0] ||
            "User",
          email: currentUser.email || "",
          photoURL: currentUser.photoURL || "",
          provider: currentUser.providerData[0]?.providerId || "email",
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <>
        <Nav />
        <main className="min-h-screen bg-zinc-950 pt-28 text-white">
          <div className="mx-auto max-w-4xl px-4">
            Loading profile...
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />

      <main className="relative min-h-screen overflow-hidden bg-zinc-950 px-4 pt-28 pb-20 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.15),transparent_35%)]" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              {profile?.photoURL ? (
                <Image
                  src={profile.photoURL}
                  alt={profile.name}
                  width={110}
                  height={110}
                  className="h-28 w-28 rounded-full border-4 border-yellow-400 object-cover"
                />
              ) : (
                <UserCircle className="h-28 w-28 text-yellow-400" />
              )}

              <div className="flex-1">
                <h1 className="text-4xl font-black">
                  {profile?.name}
                </h1>

                <p className="mt-2 flex items-center justify-center gap-2 text-gray-300 sm:justify-start">
                  <Mail size={18} className="text-yellow-300" />
                  {profile?.email}
                </p>

                <p className="mt-2 flex items-center justify-center gap-2 text-gray-400 sm:justify-start">
                  <CalendarDays size={18} className="text-yellow-300" />
                  Joined{" "}
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : "Recently"}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-red-500/30 px-5 py-3 font-bold text-red-400 transition hover:bg-red-500/10"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Link
              href="/alerts"
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:border-yellow-400/50 hover:bg-white/[0.08]"
            >
              <BellRing className="mb-4 text-yellow-300" size={32} />
              <h2 className="text-xl font-black">My Job Alerts</h2>
              <p className="mt-2 text-sm leading-7 text-gray-400">
                Manage your hourly, daily, or weekly job alert subscription.
              </p>
            </Link>

            <Link
              href="/jobs"
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:border-yellow-400/50 hover:bg-white/[0.08]"
            >
              <BriefcaseBusiness className="mb-4 text-yellow-300" size={32} />
              <h2 className="text-xl font-black">Browse Jobs</h2>
              <p className="mt-2 text-sm leading-7 text-gray-400">
                Explore matching job opportunities and apply directly.
              </p>
            </Link>

            <Link
              href="/career-tips"
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:border-yellow-400/50 hover:bg-white/[0.08]"
            >
              <UserCircle className="mb-4 text-yellow-300" size={32} />
              <h2 className="text-xl font-black">Career Tips</h2>
              <p className="mt-2 text-sm leading-7 text-gray-400">
                Get AI-powered career guidance and job search advice.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}