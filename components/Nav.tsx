"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, BellRing, LogOut, UserCircle } from "lucide-react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const navLinks = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Browse Jobs",
    href: "/jobs",
  },
  {
    label: "Job Alerts",
    href: "/alerts",
  },
  {
    label: "Career Tips",
    href: "/career-tips",
  },
  {
    label: "Contact",
    href: "/contact",
  },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfileOpen(false);
      setMobileOpen(false);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const userName =
    user?.displayName || user?.email?.split("@")[0] || "User";

  const userPhoto = user?.photoURL || "";

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <BellRing className="h-7 w-7 text-yellow-400" />
            <span className="text-xl font-extrabold text-white">
              JobAlert
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => {
              const active =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition ${
                    active
                      ? "text-yellow-400"
                      : "text-white hover:text-yellow-400"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Area */}
          <div className="hidden items-center gap-3 lg:flex">
            {authLoading ? (
              <div className="h-10 w-28 animate-pulse rounded-full bg-white/10" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-white transition hover:border-yellow-400"
                >
                  {userPhoto ? (
                    <Image
                      src={userPhoto}
                      alt={userName}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="h-8 w-8 text-yellow-400" />
                  )}

                  <span className="max-w-[120px] truncate text-sm font-semibold">
                    {userName}
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl">
                    <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
                      {userPhoto ? (
                        <Image
                          src={userPhoto}
                          alt={userName}
                          width={42}
                          height={42}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-11 w-11 text-yellow-400" />
                      )}

                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">
                          {userName}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-xl px-4 py-3 text-sm text-white transition hover:bg-white/10"
                    >
                      My Profile
                    </Link>

                    <Link
                      href="/alerts"
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-xl px-4 py-3 text-sm text-white transition hover:bg-white/10"
                    >
                      My Job Alerts
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="mt-2 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white transition hover:border-yellow-400 hover:text-yellow-400"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-bold text-black transition hover:bg-yellow-300"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white lg:hidden"
          >
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[73px] z-40 border-b border-white/10 bg-zinc-950 lg:hidden">
          <div className="space-y-2 px-4 py-6">
            {user && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                {userPhoto ? (
                  <Image
                    src={userPhoto}
                    alt={userName}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-11 w-11 text-yellow-400" />
                )}

                <div className="min-w-0">
                  <p className="truncate font-bold text-white">
                    {userName}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            {navLinks.map((link) => {
              const active =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-yellow-400 text-black"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-4 flex flex-col gap-3">
              {authLoading ? (
                <div className="h-12 animate-pulse rounded-xl bg-white/10" />
              ) : user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-white/20 px-4 py-3 text-center text-white"
                  >
                    My Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="rounded-xl bg-red-500/10 px-4 py-3 text-center font-bold text-red-400"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-white/20 px-4 py-3 text-center text-white"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl bg-yellow-400 px-4 py-3 text-center font-bold text-black"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}