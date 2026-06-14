'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ref, set, get, child, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Zap, CheckCircle2, Lock, AlertCircle, Home } from 'lucide-react';
import Nav from '@/components/Nav';
import { JOB_ROLES, JOB_ROLES_BY_CATEGORY } from '@/lib/jobRoles';

// Force dynamic rendering to avoid prerender errors with useSearchParams and browser APIs
export const dynamic = 'force-dynamic';

interface SubscriptionForm {
    email: string;
    keywords: string[]; // Now job role IDs
    locations: string[];
    workLocations: ('digital' | 'onsite' | 'hybrid')[];
    minSalary: number | '';
    maxSalary: number | '';
    jobTypes: string[];
    excludeKeywords: string[];
    alertFrequency: 'hourly' | 'daily' | 'weekly';
    isActive: boolean;
}

interface FormErrors {
    [key: string]: string;
}

interface PricingTier {
    frequency: 'hourly' | 'daily' | 'weekly';
    name: string;
    priceUSD: number;
    priceNGN: number;
    description: string;
    features: string[];
    emailsPerMonth: number;
}

const PRICING_TIERS: PricingTier[] = [
    {
        frequency: 'hourly',
        name: 'Hourly Hunter',
        priceUSD: 3,
        priceNGN: 10500,
        description: 'Get jobs every hour',
        features: [
            '✓ Hourly job alerts',
            '✓ Up to 240 emails/month',
            '✓ All job types included',
            '✓ Custom roles & locations',
            '✓ Salary filtering',
            '✓ Priority support',
        ],
        emailsPerMonth: 240,
    },
    {
        frequency: 'daily',
        name: 'Daily Finder',
        priceUSD: 2,
        priceNGN: 5000,
        description: 'New jobs every day',
        features: [
            '✓ Daily job alerts',
            '✓ Up to 30 emails/month',
            '✓ All job types included',
            '✓ Custom roles & locations',
            '✓ Salary filtering',
        ],
        emailsPerMonth: 30,
    },
    {
        frequency: 'weekly',
        name: 'Weekly Watcher',
        priceUSD: 1,
        priceNGN: 3000,
        description: 'Weekly job roundup',
        features: [
            '✓ Weekly job alerts',
            '✓ 4 emails/month',
            '✓ Best matches curated',
            '✓ Custom roles & locations',
            '✓ Basic salary filtering',
        ],
        emailsPerMonth: 4,
    },
];

const COMMON_LOCATIONS = [
    'Remote',
    'USA',
    'Europe',
    'UK',
    'Canada',
    'Australia',
    'Asia',
    'India',
];

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];

const WORK_LOCATIONS = [
    { id: 'digital', label: '💻 Digital/Remote', description: 'Work from anywhere' },
    { id: 'onsite', label: '🏢 Onsite', description: 'Work at office location' },
    { id: 'hybrid', label: '🔄 Hybrid', description: 'Mix of remote and office' },
];

export default function JobAlertsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [showRoleSearch, setShowRoleSearch] = useState(false);
    const [showLocationInput, setShowLocationInput] = useState(false);
    const [showExcludeInput, setShowExcludeInput] = useState(false);
    const [roleSearchQuery, setRoleSearchQuery] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [newExcludeKeyword, setNewExcludeKeyword] = useState('');
    const [paymentInProgress, setPaymentInProgress] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'hourly' | 'daily' | 'weekly' | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    const [form, setForm] = useState<SubscriptionForm>({
        email: '',
        keywords: [],
        locations: [],
        workLocations: [],
        minSalary: '',
        maxSalary: '',
        jobTypes: [],
        excludeKeywords: [],
        alertFrequency: 'daily',
        isActive: true,
    });

    // Ensure we are on the client side
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Load existing subscription if user is editing
    useEffect(() => {
        if (!isClient) return;

        const loadSubscription = async () => {
            try {
                const subscriptionId = searchParams.get('id');
                if (!subscriptionId) return;

                // Safety check for db
                if (!db) {
                    setErrors({ submit: 'Database connection unavailable.' });
                    return;
                }

                setIsEditMode(true);
                setEditingSubscriptionId(subscriptionId);

                const dbRef = ref(db);
                const snapshot = await get(child(dbRef, `jobAlertSubscriptions/${subscriptionId}`));
                
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setForm({
                        email: data.email || '',
                        keywords: data.keywords || [],
                        locations: data.locations || [],
                        workLocations: data.workLocations || [],
                        minSalary: data.minSalary || '',
                        maxSalary: data.maxSalary || '',
                        jobTypes: data.jobTypes || [],
                        excludeKeywords: data.excludeKeywords || [],
                        alertFrequency: data.alertFrequency || 'daily',
                        isActive: data.isActive !== undefined ? data.isActive : true,
                    });
                    setSelectedPlan(data.alertFrequency);
                }
            } catch (error) {
                console.error('Error loading subscription:', error);
                setErrors({ submit: 'Failed to load subscription' });
            }
        };

        loadSubscription();
    }, [searchParams, isClient]);

    // Initialize Paystack script
    useEffect(() => {
        if (!isClient) return;

        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [isClient]);

    // Validation
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!form.email || !form.email.includes('@')) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (form.keywords.length === 0) {
            newErrors.keywords = 'Please select at least one job role';
        }

        if (form.locations.length === 0) {
            newErrors.locations = 'Please select at least one location';
        }

        if (form.workLocations.length === 0) {
            newErrors.workLocations = 'Please select at least one work location type';
        }

        if (form.minSalary && form.maxSalary && Number(form.minSalary) > Number(form.maxSalary)) {
            newErrors.salary = 'Minimum salary cannot be greater than maximum salary';
        }

        if (form.jobTypes.length === 0) {
            newErrors.jobTypes = 'Please select at least one job type';
        }

        if (!selectedPlan) {
            newErrors.plan = 'Please select an alert frequency plan';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Calculate next alert date
    const calculateNextAlertDate = (frequency: string): string => {
        const now = new Date();
        switch (frequency) {
            case 'hourly':
                now.setHours(now.getHours() + 1);
                break;
            case 'daily':
                now.setDate(now.getDate() + 1);
                now.setHours(9, 0, 0, 0);
                break;
            case 'weekly':
                now.setDate(now.getDate() + 7);
                now.setHours(9, 0, 0, 0);
                break;
        }
        return now.toISOString();
    };

    // Handle Paystack Payment
    const handlePaystackPayment = async () => {
        if (!validateForm()) {
            return;
        }

        if (!selectedPlan) {
            setErrors({ ...errors, plan: 'Please select a plan' });
            return;
        }

        const pricingTier = PRICING_TIERS.find((tier) => tier.frequency === selectedPlan);
        if (!pricingTier) return;

        setPaymentInProgress(true);

        try {
            // @ts-ignore - Paystack is loaded globally
            if (!window.PaystackPop) {
                throw new Error('Paystack library not loaded');
            }

            const transactionRef = `SUB${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
            const amountInKobo = Math.round(pricingTier.priceNGN * 100);

            // @ts-ignore
            const handler = window.PaystackPop.setup({
                key: process.env.NEXT_PUBLIC_PAYSTACK_KEY || '',
                email: form.email,
                amount: amountInKobo,
                currency: 'NGN',
                ref: transactionRef,

                onClose: function () {
                    console.log('Payment window closed');
                    setPaymentInProgress(false);
                },

                callback: function (response: any) {
                    console.log('Payment successful:', response);
                    void handleSaveSubscription(response.reference, pricingTier);
                },
            });

            handler.openIframe();
        } catch (error) {
            console.error('Payment error:', error);
            setErrors({
                submit: error instanceof Error ? error.message : 'Payment failed. Please try again.',
            });
            setPaymentInProgress(false);
        }
    };

    // Save or update subscription after successful payment
    const handleSaveSubscription = async (paymentReference: string, pricingTier: PricingTier) => {
        if (!db) {
            setErrors({ submit: 'Database connection unavailable.' });
            return;
        }

        try {
            const subscriptionId = isEditMode && editingSubscriptionId 
                ? editingSubscriptionId 
                : `sub-${form.email.replace(/[^a-z0-9]/g, '')}-${Date.now()}`;

            const subscriptionData = {
                email: form.email,
                keywords: form.keywords,
                locations: form.locations,
                workLocations: form.workLocations,
                minSalary: form.minSalary ? Number(form.minSalary) : null,
                maxSalary: form.maxSalary ? Number(form.maxSalary) : null,
                jobTypes: form.jobTypes,
                excludeKeywords: form.excludeKeywords,
                alertFrequency: pricingTier.frequency,
                isActive: true,
                createdAt: isEditMode && editingSubscriptionId ? form.email : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                nextAlertDate: calculateNextAlertDate(pricingTier.frequency),
                paymentReference: paymentReference,
                paymentAmount: pricingTier.priceNGN,
                paymentCurrency: 'NGN',
                sentJobIds: {},
            };

            const dbRef = ref(db, `jobAlertSubscriptions/${subscriptionId}`);
            await set(dbRef, subscriptionData);

            setSavedSuccess(true);
            setErrors({});
            setSelectedPlan(null);

            // Send confirmation email
            await sendConfirmationEmail(form.email, pricingTier, subscriptionId);

            // Send initial job matches
            await sendJobMatchesEmail(form.email, subscriptionData);

            setTimeout(() => {
                setSavedSuccess(false);
                router.push('/account');
            }, 3000);

            console.log('Subscription saved successfully with ID:', subscriptionId);
        } catch (error) {
            console.error('Error saving subscription:', error);
            setErrors({
                submit: error instanceof Error ? error.message : 'Failed to save subscription',
            });
        } finally {
            setPaymentInProgress(false);
        }
    };

    // Send job matches email
    const sendJobMatchesEmail = async (email: string, subscriptionData: any) => {
        try {
            const response = await fetch('/api/send-job-matches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    preferences: {
                        keywords: subscriptionData.keywords,
                        locations: subscriptionData.locations,
                        workLocations: subscriptionData.workLocations,
                        minSalary: subscriptionData.minSalary,
                        maxSalary: subscriptionData.maxSalary,
                        jobTypes: subscriptionData.jobTypes,
                        excludeKeywords: subscriptionData.excludeKeywords,
                    },
                    alertFrequency: subscriptionData.alertFrequency,
                }),
            });

            if (!response.ok) {
                console.error('Failed to send job matches');
            }
        } catch (error) {
            console.error('Error sending job matches:', error);
        }
    };

    // Send confirmation email
    const sendConfirmationEmail = async (email: string, tier: PricingTier, subscriptionId: string) => {
        try {
            const response = await fetch('/api/send-confirmation-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    tier,
                    subscriptionId,
                    keywords: form.keywords,
                    locations: form.locations,
                    workLocations: form.workLocations,
                }),
            });

            if (!response.ok) {
                console.error('Failed to send confirmation email');
            }
        } catch (error) {
            console.error('Error sending confirmation email:', error);
        }
    };

    // Handle job role toggle
    const handleRoleToggle = (roleId: string) => {
        setForm((prev) => ({
            ...prev,
            keywords: prev.keywords.includes(roleId)
                ? prev.keywords.filter((k) => k !== roleId)
                : [...prev.keywords, roleId],
        }));
    };

    // Handle location change
    const handleLocationToggle = (location: string) => {
        setForm((prev) => ({
            ...prev,
            locations: prev.locations.includes(location)
                ? prev.locations.filter((l) => l !== location)
                : [...prev.locations, location],
        }));
    };

    // Handle work location change
    const handleWorkLocationToggle = (workLocation: 'digital' | 'onsite' | 'hybrid') => {
        setForm((prev) => ({
            ...prev,
            workLocations: prev.workLocations.includes(workLocation)
                ? prev.workLocations.filter((wl) => wl !== workLocation)
                : [...prev.workLocations, workLocation],
        }));
    };

    // Handle job type change
    const handleJobTypeToggle = (jobType: string) => {
        setForm((prev) => ({
            ...prev,
            jobTypes: prev.jobTypes.includes(jobType)
                ? prev.jobTypes.filter((jt) => jt !== jobType)
                : [...prev.jobTypes, jobType],
        }));
    };

    // Add custom location
    const addCustomLocation = () => {
        if (newLocation.trim() && !form.locations.includes(newLocation.trim())) {
            setForm((prev) => ({
                ...prev,
                locations: [...prev.locations, newLocation.trim()],
            }));
            setNewLocation('');
            setShowLocationInput(false);
        }
    };

    // Add custom exclude keyword
    const addExcludeKeyword = () => {
        if (newExcludeKeyword.trim() && !form.excludeKeywords.includes(newExcludeKeyword.trim())) {
            setForm((prev) => ({
                ...prev,
                excludeKeywords: [...prev.excludeKeywords, newExcludeKeyword.trim()],
            }));
            setNewExcludeKeyword('');
            setShowExcludeInput(false);
        }
    };

    // Remove tag
    const removeTag = (type: 'keywords' | 'locations' | 'excludeKeywords', value: string) => {
        setForm((prev) => ({
            ...prev,
            [type]: prev[type].filter((item) => item !== value),
        }));
    };

    // Filter job roles based on search
    const filteredRoles = roleSearchQuery
        ? JOB_ROLES.filter(
            (role) =>
                role.label.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
                role.id.toLowerCase().includes(roleSearchQuery.toLowerCase())
        )
        : JOB_ROLES;

    if (!isClient) {
        return null; // Or a loading skeleton
    }

    return (
        <>
            <Nav />
            <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white overflow-x-hidden pt-24">
                {/* Background Gradient Orbs */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.15),transparent_35%)]" />

                {/* Main Content */}
                <div className="relative py-10 px-4 sm:px-6 lg:px-8 w-full z-10">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 mb-6 w-fit mx-auto">
                                <Zap size={16} className="text-yellow-300 flex-shrink-0" />
                                <span className="text-sm font-medium text-yellow-300">
                                    Get Remote Jobs Delivered to Your Inbox
                                </span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
                                Set Your Job
                                <br />
                                <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
                                    Preferences
                                </span>
                            </h1>
                            <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
                                Customize your job alerts and get matching opportunities delivered to your inbox. Choose your plan and start receiving jobs today.
                            </p>
                        </div>

                        {/* Pricing Section */}
                        <div className="mb-12" id="pricing">
                            <h2 className="text-2xl sm:text-3xl font-black mb-6 text-center">Choose Your Plan</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {PRICING_TIERS.map((tier) => (
                                    <div
                                        key={tier.frequency}
                                        className={`border rounded-2xl p-6 transition cursor-pointer ${
                                            selectedPlan === tier.frequency
                                                ? 'border-yellow-400 bg-yellow-400/10 shadow-xl shadow-yellow-400/20 shadow-lg shadow-yellow-300/50'
                                                : 'border-white/10 bg-white/[0.04] backdrop-blur-xl hover:border-white/20'
                                        }`}
                                        onClick={() => {
                                            setSelectedPlan(tier.frequency);
                                            setForm((prev) => ({
                                                ...prev,
                                                alertFrequency: tier.frequency,
                                            }));
                                        }}
                                    >
                                        <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                                        <p className="text-gray-400 text-sm mb-4">{tier.description}</p>

                                        {/* Pricing Display */}
                                        <div className="mb-4 space-y-2">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black">₦{tier.priceNGN.toLocaleString()}</span>
                                                <span className="text-gray-400 text-sm">per month</span>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                ≈ ${tier.priceUSD} USD
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-400 mb-4">≈ {tier.emailsPerMonth} emails/month</p>

                                        <ul className="space-y-2 mb-6">
                                            {tier.features.map((feature, idx) => (
                                                <li key={idx} className="text-sm text-gray-300">
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            type="button"
                                            className={`w-full py-2 px-4 rounded-lg font-medium transition text-sm ${
                                                selectedPlan === tier.frequency
                                                    ? 'bg-gradient-to-r from-yellow-300 to-red-500 text-black'
                                                    : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                        >
                                            {selectedPlan === tier.frequency ? '✓ Selected' : 'Select Plan'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Form Container */}
                        <div className="bg-white/[0.04] border border-white/10 rounded-[2rem] backdrop-blur-xl overflow-hidden shadow-2xl">
                            {/* Form Header */}
                            <div className="bg-gradient-to-r from-yellow-400/10 via-orange-400/10 to-red-500/10 border-b border-white/10 p-6 sm:p-8">
                                <h2 className="text-2xl sm:text-3xl font-black">🎯 Customize Your Alerts</h2>
                                <p className="text-gray-300 mt-2">Tell us what jobs you're looking for</p>
                            </div>

                            {/* Form Content */}
                            <div className="p-6 sm:p-8 max-w-full overflow-x-hidden">
                                {/* Success Message */}
                                {savedSuccess && (
                                    <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 flex items-start gap-3 animate-in">
                                        <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-medium block">Your subscription has been saved successfully!</span>
                                            <span className="text-sm">Check your email for confirmation and start receiving job alerts.</span>
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                {errors.submit && (
                                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 flex items-start gap-3">
                                        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                                        <span className="font-medium">{errors.submit}</span>
                                    </div>
                                )}

                                {/* Plan Selection Error */}
                                {errors.plan && (
                                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 flex items-start gap-3">
                                        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                                        <span className="font-medium">{errors.plan}</span>
                                    </div>
                                )}

                                {/* Form */}
                                <form className="space-y-6 w-full">
                                    {/* Email Section */}
                                    <div>
                                        <div className="flex justify-between items-start gap-2 flex-wrap mb-3">
                                            <label className="text-base font-semibold">📧 Email Address</label>
                                            {errors.email && <span className="text-sm text-red-400 font-medium">{errors.email}</span>}
                                        </div>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="your@email.com"
                                            className={`w-full px-4 py-3 bg-white/10 border rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent ${
                                                errors.email ? 'border-red-500/50' : 'border-white/20'
                                            }`}
                                        />
                                        <p className="mt-2 text-sm text-gray-400">
                                            We'll send job alerts to this email address
                                        </p>
                                    </div>

                                    {/* Job Roles Section */}
                                    <div>
                                        <div className="flex justify-between items-start gap-2 flex-wrap mb-3">
                                            <label className="text-base font-semibold">💼 Job Roles</label>
                                            {errors.keywords && <span className="text-sm text-red-400 font-medium">{errors.keywords}</span>}
                                        </div>

                                        {/* Selected Roles */}
                                        <div className="flex flex-wrap gap-2 mb-4 min-h-10">
                                            {form.keywords.map((roleId) => {
                                                const role = JOB_ROLES.find((r) => r.id === roleId);
                                                return (
                                                    <div
                                                        key={roleId}
                                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 text-black px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0"
                                                    >
                                                        <span>{role?.label || roleId}</span>
                                                        <button
                                                            type="button"
                                                            className="hover:opacity-70 transition"
                                                            onClick={() => removeTag('keywords', roleId)}
                                                            aria-label={`Remove ${role?.label}`}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Role Search */}
                                        <div className="mb-4">
                                            <input
                                                type="text"
                                                value={roleSearchQuery}
                                                onChange={(e) => setRoleSearchQuery(e.target.value)}
                                                onFocus={() => setShowRoleSearch(true)}
                                                placeholder="Search job roles..."
                                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                                            />
                                        </div>

                                        {/* Role Dropdown */}
                                        {showRoleSearch && (
                                            <div className="max-h-64 overflow-y-auto bg-white/5 border border-white/20 rounded-lg p-3 mb-4 space-y-2">
                                                {filteredRoles.map((role) => (
                                                    <button
                                                        key={role.id}
                                                        type="button"
                                                        onClick={() => {
                                                            handleRoleToggle(role.id);
                                                            setRoleSearchQuery('');
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg transition ${
                                                            form.keywords.includes(role.id)
                                                                ? 'bg-yellow-300/20 text-yellow-200 border border-yellow-300/50'
                                                                : 'hover:bg-white/10 text-gray-300'
                                                        }`}
                                                    >
                                                        <div className="font-medium">{role.label}</div>
                                                        <div className="text-xs text-gray-400">{role.category}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Role Categories */}
                                        <div className="space-y-3">
                                            {Object.entries(JOB_ROLES_BY_CATEGORY).map(([category, roles]) => (
                                                <div key={category}>
                                                    <h4 className="text-sm font-semibold text-gray-300 capitalize mb-2">
                                                        {category.replace('-', ' ')}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {roles.map((role) => (
                                                            <button
                                                                key={role.id}
                                                                type="button"
                                                                onClick={() => handleRoleToggle(role.id)}
                                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex-shrink-0 ${
                                                                    form.keywords.includes(role.id)
                                                                        ? 'bg-gradient-to-r from-yellow-300 to-red-500 text-black border-0'
                                                                        : 'bg-white/10 text-white border border-white/20 hover:border-white/40 hover:bg-white/20'
                                                                }`}
                                                            >
                                                                {role.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Locations Section */}
                                    <div>
                                        <div className="flex justify-between items-start gap-2 flex-wrap mb-3">
                                            <label className="text-base font-semibold">📍 Preferred Locations</label>
                                            {errors.locations && (
                                                <span className="text-sm text-red-400 font-medium">{errors.locations}</span>
                                            )}
                                        </div>

                                        {/* Selected Locations */}
                                        <div className="flex flex-wrap gap-2 mb-4 min-h-10">
                                            {form.locations.map((location) => (
                                                <div
                                                    key={location}
                                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-300 to-red-500 text-black px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0"
                                                >
                                                    <span>{location}</span>
                                                    <button
                                                        type="button"
                                                        className="hover:opacity-70 transition"
                                                        onClick={() => removeTag('locations', location)}
                                                        aria-label={`Remove ${location}`}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Common Locations */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {COMMON_LOCATIONS.map((location) => (
                                                <button
                                                    key={location}
                                                    type="button"
                                                    onClick={() => handleLocationToggle(location)}
                                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex-shrink-0 ${
                                                        form.locations.includes(location)
                                                            ? 'bg-gradient-to-r from-yellow-300 to-red-500 text-black border-0'
                                                            : 'bg-white/10 text-white border border-white/20 hover:border-white/40 hover:bg-white/20'
                                                    }`}
                                                >
                                                    {location}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Add Custom Location */}
                                        {!showLocationInput ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowLocationInput(true)}
                                                className="text-yellow-300 border border-dashed border-yellow-300/50 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-300/10 transition"
                                            >
                                                + Add Custom Location
                                            </button>
                                        ) : (
                                            <div className="flex gap-2 mt-3 flex-wrap sm:flex-nowrap">
                                                <input
                                                    type="text"
                                                    value={newLocation}
                                                    onChange={(e) => setNewLocation(e.target.value)}
                                                    placeholder="e.g., Singapore, Berlin"
                                                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 min-w-0"
                                                    onKeyPress={(e) => e.key === 'Enter' && addCustomLocation()}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addCustomLocation}
                                                    className="bg-gradient-to-r from-yellow-300 to-red-500 text-black px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-yellow-300/50 transition flex-shrink-0"
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowLocationInput(false);
                                                        setNewLocation('');
                                                    }}
                                                    className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition flex-shrink-0"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Work Location Type Section */}
                                    <div>
                                        <div className="flex justify-between items-start gap-2 flex-wrap mb-3">
                                            <label className="text-base font-semibold">🌍 Work Location Type</label>
                                            {errors.workLocations && (
                                                <span className="text-sm text-red-400 font-medium">{errors.workLocations}</span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {WORK_LOCATIONS.map((workLocation) => (
                                                <button
                                                    key={workLocation.id}
                                                    type="button"
                                                    onClick={() =>
                                                        handleWorkLocationToggle(workLocation.id as 'digital' | 'onsite' | 'hybrid')
                                                    }
                                                    className={`p-4 rounded-lg border-2 transition text-left ${
                                                        form.workLocations.includes(
                                                            workLocation.id as 'digital' | 'onsite' | 'hybrid'
                                                        )
                                                            ? 'border-yellow-300 bg-yellow-300/20'
                                                            : 'border-white/20 bg-white/5 hover:border-white/40'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-white">{workLocation.label}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{workLocation.description}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Job Types Section */}
                                    <div>
                                        <div className="flex justify-between items-start gap-2 flex-wrap mb-3">
                                            <label className="text-base font-semibold">💼 Job Types</label>
                                            {errors.jobTypes && (
                                                <span className="text-sm text-red-400 font-medium">{errors.jobTypes}</span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {JOB_TYPES.map((jobType) => (
                                                <button
                                                    key={jobType}
                                                    type="button"
                                                    onClick={() => handleJobTypeToggle(jobType)}
                                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex-shrink-0 ${
                                                        form.jobTypes.includes(jobType)
                                                            ? 'bg-gradient-to-r from-yellow-300 to-red-500 text-black border-0'
                                                            : 'bg-white/10 text-white border border-white/20 hover:border-white/40 hover:bg-white/20'
                                                    }`}
                                                >
                                                    {jobType}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Salary Range Section */}
                                    <div>
                                        <div className="flex justify-between items-start gap-2 flex-wrap mb-3">
                                            <label className="text-base font-semibold">💰 Salary Range (Optional)</label>
                                            {errors.salary && <span className="text-sm text-red-400 font-medium">{errors.salary}</span>}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                                                    Minimum
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-3 font-semibold text-yellow-300">$</span>
                                                    <input
                                                        type="number"
                                                        value={form.minSalary}
                                                        onChange={(e) =>
                                                            setForm({ ...form, minSalary: e.target.value ? Number(e.target.value) : '' })
                                                        }
                                                        placeholder="0"
                                                        className="w-full px-4 py-2 pl-8 bg-white/10 border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                                                    Maximum
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-3 font-semibold text-yellow-300">$</span>
                                                    <input
                                                        type="number"
                                                        value={form.maxSalary}
                                                        onChange={(e) =>
                                                            setForm({ ...form, maxSalary: e.target.value ? Number(e.target.value) : '' })
                                                        }
                                                        placeholder="0"
                                                        className="w-full px-4 py-2 pl-8 bg-white/10 border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-400">Leave empty for no salary limit</p>
                                    </div>

                                    {/* Exclude Keywords Section */}
                                    <div>
                                        <label className="text-base font-semibold block mb-3">🚫 Exclude Keywords (Optional)</label>

                                        {/* Selected Exclude Keywords */}
                                        <div className="flex flex-wrap gap-2 mb-4 min-h-10">
                                            {form.excludeKeywords.map((keyword) => (
                                                <div
                                                    key={keyword}
                                                    className="inline-flex items-center gap-2 bg-red-600/40 border border-red-500/50 text-red-200 px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0"
                                                >
                                                    <span>{keyword}</span>
                                                    <button
                                                        type="button"
                                                        className="hover:opacity-70 transition"
                                                        onClick={() => removeTag('excludeKeywords', keyword)}
                                                        aria-label={`Remove ${keyword}`}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Exclude Keyword */}
                                        {!showExcludeInput ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowExcludeInput(true)}
                                                className="text-yellow-300 border border-dashed border-yellow-300/50 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-300/10 transition"
                                            >
                                                + Add Exclude Keyword
                                            </button>
                                        ) : (
                                            <div className="flex gap-2 mt-3 flex-wrap sm:flex-nowrap">
                                                <input
                                                    type="text"
                                                    value={newExcludeKeyword}
                                                    onChange={(e) => setNewExcludeKeyword(e.target.value)}
                                                    placeholder="e.g., Junior, Startup"
                                                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 min-w-0"
                                                    onKeyPress={(e) => e.key === 'Enter' && addExcludeKeyword()}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addExcludeKeyword}
                                                    className="bg-gradient-to-r from-yellow-300 to-red-500 text-black px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-yellow-300/50 transition flex-shrink-0"
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowExcludeInput(false);
                                                        setNewExcludeKeyword('');
                                                    }}
                                                    className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition flex-shrink-0"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                        <p className="mt-2 text-sm text-gray-400">
                                            Jobs with these keywords will be filtered out
                                        </p>
                                    </div>

                                    {/* Active Toggle */}
                                    <div className="flex items-center gap-3 pt-2">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            checked={form.isActive}
                                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                            className="w-4 h-4 accent-yellow-300 cursor-pointer"
                                        />
                                        <label htmlFor="isActive" className="font-medium text-gray-200 cursor-pointer">
                                            Keep my subscription active
                                        </label>
                                    </div>

                                    {/* Submit Button with Payment */}
                                    <button
                                        type="button"
                                        onClick={handlePaystackPayment}
                                        disabled={paymentInProgress || !selectedPlan}
                                        className={`w-full py-3 px-4 bg-gradient-to-r from-yellow-300 to-red-500 text-black font-bold rounded-xl transition text-base flex items-center justify-center gap-2 ${
                                            paymentInProgress || !selectedPlan
                                                ? 'opacity-70 cursor-not-allowed'
                                                : 'hover:shadow-lg hover:shadow-yellow-300/50 hover:-translate-y-1'
                                        }`}
                                    >
                                        <Lock size={18} />
                                        {paymentInProgress
                                            ? 'Processing Payment...'
                                            : isEditMode
                                            ? '✓ Update Subscription'
                                            : '✓ Pay with Paystack & Subscribe'}
                                    </button>
                                </form>
                            </div>

                            {/* Footer Info Box */}
                            <div className="bg-white/5 border-t border-white/10 p-6 sm:p-8">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={20} className="text-yellow-300 flex-shrink-0" />
                                    How It Works
                                </h3>
                                <ul className="space-y-3 text-gray-300">
                                    <li className="flex items-start gap-3">
                                        <span className="text-yellow-300 font-bold mt-0.5 flex-shrink-0">1</span>
                                        <span>Choose your alert frequency (Hourly, Daily, or Weekly)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-yellow-300 font-bold mt-0.5 flex-shrink-0">2</span>
                                        <span>Select your job roles (Frontend, Backend, DevOps, Security, etc.)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-yellow-300 font-bold mt-0.5 flex-shrink-0">3</span>
                                        <span>Set your job preferences (locations, work type, salary)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-yellow-300 font-bold mt-0.5 flex-shrink-0">4</span>
                                        <span>Complete secure payment via Paystack (NGN pricing)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-yellow-300 font-bold mt-0.5 flex-shrink-0">5</span>
                                        <span>Receive job alerts based on your schedule and preferences</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
