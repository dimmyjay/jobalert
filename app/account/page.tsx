'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ref, get, child, update, remove } from 'firebase/database';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { LogOut, Edit, Trash2, Home, Copy, Check, Lock } from 'lucide-react';
import Nav from '@/components/Nav';

interface JobSubscription {
    id: string;
    email: string;
    keywords: string[];
    locations: string[];
    workLocations: ('digital' | 'onsite' | 'hybrid')[];
    minSalary: number | null;
    maxSalary: number | null;
    jobTypes: string[];
    excludeKeywords: string[];
    alertFrequency: 'hourly' | 'daily' | 'weekly';
    isActive: boolean;
    createdAt: string;
    paymentReference?: string;
    paymentAmount?: number;
}

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<JobSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // 🔒 Check authentication first
    useEffect(() => {
        if (!auth) {
            console.error("Firebase Auth is not initialized.");
            setAuthLoading(false);
            setError("Authentication service unavailable.");
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push('/login?redirect=/account');
                return;
            }
            setUser(currentUser);
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    // Load only the logged-in user's subscriptions
    useEffect(() => {
        if (!user) return;
        
        // Use a local constant to satisfy TypeScript strictness regarding null checks in closures
        const currentDb = db;
        if (!currentDb) {
            setError("Database connection unavailable.");
            setLoading(false);
            return;
        }

        const loadSubscriptions = async () => {
            try {
                setLoading(true);
                const dbRef = ref(currentDb);
                const snapshot = await get(child(dbRef, 'jobAlertSubscriptions'));

                if (snapshot.exists()) {
                    const subs: JobSubscription[] = [];
                    snapshot.forEach((childSnapshot) => {
                        const data = childSnapshot.val();
                        // 🔒 CRITICAL: Only include subscriptions matching the logged-in user's email
                        if (data.email === user.email) {
                            subs.push({
                                id: childSnapshot.key || '',
                                ...data,
                            });
                        }
                    });
                    setSubscriptions(subs);
                }
                setError(null);
            } catch (err) {
                console.error('Error loading subscriptions:', err);
                setError('Failed to load subscriptions');
            } finally {
                setLoading(false);
            }
        };

        loadSubscriptions();
    }, [user]);

    // 🔒 Delete subscription (with ownership check)
    const handleDeleteSubscription = async (subscriptionId: string) => {
        if (!db) return;
        
        // Verify ownership
        const sub = subscriptions.find((s) => s.id === subscriptionId);
        if (!sub || sub.email !== user?.email) {
            setError('You do not have permission to delete this subscription');
            return;
        }

        try {
            const dbRef = ref(db, `jobAlertSubscriptions/${subscriptionId}`);
            await remove(dbRef);
            setSubscriptions(subscriptions.filter((s) => s.id !== subscriptionId));
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting subscription:', err);
            setError('Failed to delete subscription');
        }
    };

    // 🔒 Toggle subscription active status (with ownership check)
    const handleToggleActive = async (subscriptionId: string, currentStatus: boolean) => {
        if (!db) return;

        // Verify ownership
        const sub = subscriptions.find((s) => s.id === subscriptionId);
        if (!sub || sub.email !== user?.email) {
            setError('You do not have permission to modify this subscription');
            return;
        }

        try {
            const dbRef = ref(db, `jobAlertSubscriptions/${subscriptionId}`);
            await update(dbRef, {
                isActive: !currentStatus,
            });
            setSubscriptions(
                subscriptions.map((s) =>
                    s.id === subscriptionId ? { ...s, isActive: !currentStatus } : s
                )
            );
        } catch (err) {
            console.error('Error updating subscription:', err);
            setError('Failed to update subscription');
        }
    };

    // Copy subscription ID
    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Handle logout
    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
        }
        router.push('/login');
    };

    // Show loading while checking auth
    if (authLoading) {
        return (
            <>
                <Nav />
                <div className="min-h-screen bg-zinc-950 text-white pt-24 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-300 mb-4"></div>
                        <p className="text-gray-300">Checking authentication...</p>
                    </div>
                </div>
            </>
        );
    }

    // If no user (shouldn't happen due to redirect, but just in case)
    if (!user) {
        return (
            <>
                <Nav />
                <div className="min-h-screen bg-zinc-950 text-white pt-24 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <Lock className="mx-auto mb-4 text-yellow-300" size={48} />
                        <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
                        <p className="text-gray-300 mb-6">Please log in to view your account.</p>
                        <Link
                            href="/login?redirect=/account"
                            className="inline-block bg-gradient-to-r from-yellow-300 to-red-500 text-black px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                        >
                            Log In
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Nav />
            <div className="relative min-h-screen bg-zinc-950 text-white pt-24 pb-12">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.15),transparent_35%)]" />

                {/* Main Content */}
                <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-4xl font-bold mb-2">My Account</h1>
                                <p className="text-gray-300">
                                    Logged in as <span className="text-yellow-300 font-semibold">{user.email}</span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href="/alerts"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-300 to-red-500 text-black px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-300/50 transition"
                                >
                                    <Home size={18} />
                                    New Subscription
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 px-4 py-2 rounded-lg font-semibold hover:bg-red-500/30 border border-red-500/30 transition"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-300 mb-4"></div>
                                <p className="text-gray-300">Loading your subscriptions...</p>
                            </div>
                        </div>
                    ) : subscriptions.length === 0 ? (
                        /* Empty State */
                        <div className="text-center py-12">
                            <div className="mb-4 text-6xl">📭</div>
                            <h2 className="text-2xl font-bold mb-2">No Subscriptions Yet</h2>
                            <p className="text-gray-300 mb-6">
                                You don't have any active job alert subscriptions. Create one to get started!
                            </p>
                            <Link
                                href="/alerts"
                                className="inline-block bg-gradient-to-r from-yellow-300 to-red-500 text-black px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-300/50 transition"
                            >
                                Create Subscription
                            </Link>
                        </div>
                    ) : (
                        /* Subscriptions List */
                        <div className="space-y-6">
                            {subscriptions.map((sub) => (
                                <div
                                    key={sub.id}
                                    className="bg-white/[0.04] border border-white/10 rounded-xl p-6 hover:border-white/20 transition"
                                >
                                    {/* Subscription Header */}
                                    <div className="flex items-start justify-between mb-4 gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-xl font-bold">{sub.email}</h3>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                        sub.isActive
                                                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                                    }`}
                                                >
                                                    {sub.isActive ? '✓ Active' : '○ Paused'}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-sm mb-2">
                                                <strong>Plan:</strong>{' '}
                                                {sub.alertFrequency.charAt(0).toUpperCase() + sub.alertFrequency.slice(1)}{' '}
                                                Alerts
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                <strong>Created:</strong> {new Date(sub.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    handleToggleActive(sub.id, sub.isActive)
                                                }
                                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                                    sub.isActive
                                                        ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/30'
                                                        : 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30'
                                                }`}
                                            >
                                                {sub.isActive ? 'Pause' : 'Resume'}
                                            </button>
                                            <Link
                                                href={`/alerts?id=${sub.id}`}
                                                className="px-4 py-2 rounded-lg font-medium bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 transition inline-flex items-center gap-2"
                                            >
                                                <Edit size={16} />
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => setDeleteConfirm(sub.id)}
                                                className="px-4 py-2 rounded-lg font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preferences */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 pb-4 border-b border-white/10">
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">
                                                <strong>Keywords:</strong>
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {sub.keywords.slice(0, 3).map((keyword) => (
                                                    <span
                                                        key={keyword}
                                                        className="px-2 py-1 bg-yellow-300/10 text-yellow-300 rounded text-xs"
                                                    >
                                                        {keyword}
                                                    </span>
                                                ))}
                                                {sub.keywords.length > 3 && (
                                                    <span className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs">
                                                        +{sub.keywords.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">
                                                <strong>Locations:</strong>
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {sub.locations.slice(0, 3).map((location) => (
                                                    <span
                                                        key={location}
                                                        className="px-2 py-1 bg-orange-300/10 text-orange-300 rounded text-xs"
                                                    >
                                                        {location}
                                                    </span>
                                                ))}
                                                {sub.locations.length > 3 && (
                                                    <span className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs">
                                                        +{sub.locations.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* More Details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400">
                                        <div>
                                            <p className="mb-1">
                                                <strong>Work Location Types:</strong>{' '}
                                                {sub.workLocations.join(', ')}
                                            </p>
                                            <p>
                                                <strong>Job Types:</strong> {sub.jobTypes.join(', ')}
                                            </p>
                                        </div>
                                        <div>
                                            {sub.minSalary || sub.maxSalary ? (
                                                <p className="mb-1">
                                                    <strong>Salary Range:</strong> ${sub.minSalary || '0'} - $
                                                    {sub.maxSalary || 'unlimited'}
                                                </p>
                                            ) : (
                                                <p className="mb-1">
                                                    <strong>Salary Range:</strong> No limit
                                                </p>
                                            )}
                                            <p>
                                                <strong>Subscription ID:</strong>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <code className="bg-white/10 px-2 py-1 rounded text-xs font-mono break-all">
                                                    {sub.id}
                                                </code>
                                                <button
                                                    onClick={() => handleCopyId(sub.id)}
                                                    className="text-gray-400 hover:text-yellow-300 transition"
                                                >
                                                    {copiedId === sub.id ? (
                                                        <Check size={16} />
                                                    ) : (
                                                        <Copy size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete Confirmation */}
                                    {deleteConfirm === sub.id && (
                                        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                                            <p className="text-red-300 mb-3 font-medium">
                                                Are you sure? This action cannot be undone.
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDeleteSubscription(sub.id)}
                                                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
