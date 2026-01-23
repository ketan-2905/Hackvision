"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    handleGoogleRedirectResult,
    createUserProfile,
    getUserProfile,
    getDashboardRoute,
} from '@/lib/auth';
import { UserRole, AuthFormData } from '@/lib/types';

type AuthMode = 'login' | 'signup';
type LogStatus = 'PENDING' | 'OK' | 'FAIL' | 'NONE';

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<AuthMode>('login');
    const [formData, setFormData] = useState<AuthFormData>({
        name: '',
        email: '',
        password: '',
        role: '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof AuthFormData, string>>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Intelligence Log states
    const [authProvider, setAuthProvider] = useState<string>('PENDING');
    const [roleSelected, setRoleSelected] = useState<string>('NONE');
    const [firestoreStatus, setFirestoreStatus] = useState<LogStatus>('NONE');
    const [redirectTarget, setRedirectTarget] = useState<string>('');
    const [logMessages, setLogMessages] = useState<string[]>([
        '> ASCENDRA AUTH SYSTEM v1.0',
        '> INITIALIZING...',
    ]);

    // Helper to add log message
    const addLog = (message: string) => {
        setLogMessages((prev) => [...prev, `> ${message}`]);
    };

    // Check for Google OAuth redirect result on mount
    useEffect(() => {
        const checkRedirectResult = async () => {
            try {
                addLog('CHECKING_GOOGLE_REDIRECT...');
                const user = await handleGoogleRedirectResult();

                if (user) {
                    // User returned from Google auth
                    setIsLoading(true);
                    setAuthProvider('GOOGLE');
                    addLog('GOOGLE_AUTH_SUCCESS');

                    // Check if profile exists
                    let profile = await getUserProfile(user.uid);

                    if (!profile) {
                        // New user - get role from localStorage
                        const storedRole = localStorage.getItem('pendingRole');

                        if (!storedRole) {
                            addLog('ERROR: NO_ROLE_STORED');
                            setIsLoading(false);
                            return;
                        }

                        // Create profile automatically
                        setFirestoreStatus('PENDING');
                        addLog('CREATING_PROFILE...');
                        await createUserProfile(user.uid, {
                            name: user.displayName || 'User',
                            email: user.email!,
                            role: storedRole as UserRole,
                            provider: 'google',
                        });
                        setFirestoreStatus('OK');
                        addLog('FIRESTORE_WRITE: OK');
                        setRoleSelected(storedRole);

                        // Clear stored role
                        localStorage.removeItem('pendingRole');

                        // Fetch the newly created profile
                        profile = await getUserProfile(user.uid);
                    } else {
                        setRoleSelected(profile.role);
                        addLog(`PROFILE_LOADED: ${profile.role}`);

                        // Redirect to dashboard
                        const route = getDashboardRoute(profile.role);
                        setRedirectTarget(route);
                        addLog(`REDIRECT_TARGET: ${route}`);
                        addLog('REDIRECTING...');
                        setTimeout(() => router.push(route), 1000);
                    }
                }
            } catch (error: any) {
                addLog(`ERROR: ${error.message}`);
                setErrors({ email: error.message });
            }
        };

        checkRedirectResult();
    }, [router]);

    // Validation
    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof AuthFormData, string>> = {};

        if (mode === 'signup' && !formData.name?.trim()) {
            newErrors.name = 'NAME_REQUIRED';
        }

        if (!formData.email?.trim()) {
            newErrors.email = 'EMAIL_REQUIRED';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'EMAIL_INVALID';
        }

        if (!formData.password?.trim()) {
            newErrors.password = 'PASSWORD_REQUIRED';
        } else if (formData.password.length < 6) {
            newErrors.password = 'PASSWORD_TOO_SHORT';
        }

        if (!formData.role) {
            newErrors.role = 'ROLE_REQUIRED';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle Email/Password Auth
    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            addLog('VALIDATION_FAILED');
            return;
        }

        setIsLoading(true);
        setAuthProvider('EMAIL');
        setRoleSelected(formData.role as string);
        addLog(`AUTH_MODE: ${mode.toUpperCase()}`);
        addLog(`AUTH_PROVIDER: EMAIL`);
        addLog(`ROLE_SELECTED: ${formData.role}`);

        try {
            let user: User;

            if (mode === 'signup') {
                // Sign up
                setFirestoreStatus('PENDING');
                addLog('CREATING_USER...');
                user = await signUpWithEmail(
                    formData.email!,
                    formData.password!,
                    formData.name!,
                    formData.role as UserRole
                );
                addLog('USER_CREATED');
                setFirestoreStatus('OK');
                addLog('FIRESTORE_WRITE: OK');
            } else {
                // Login
                addLog('AUTHENTICATING...');
                user = await signInWithEmail(formData.email!, formData.password!);
                addLog('AUTH_SUCCESS');

                // Get user profile for role
                setFirestoreStatus('PENDING');
                const profile = await getUserProfile(user.uid);
                if (profile) {
                    setRoleSelected(profile.role);
                    setFirestoreStatus('OK');
                    addLog(`PROFILE_LOADED: ${profile.role}`);
                }
            }

            // Redirect
            const profile = await getUserProfile(user.uid);
            if (profile) {
                const route = getDashboardRoute(profile.role);
                setRedirectTarget(route);
                addLog(`REDIRECT_TARGET: ${route}`);
                addLog('REDIRECTING...');
                setTimeout(() => router.push(route), 1000);
            }
        } catch (error: any) {
            setFirestoreStatus('FAIL');
            addLog(`ERROR: ${error.message}`);
            setErrors({ email: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Google OAuth (redirect-based)
    const handleGoogleAuth = async () => {
        // For new users with Google, require role selection first
        if (!formData.role) {
            setErrors({ role: 'SELECT_ROLE_BEFORE_GOOGLE_AUTH' });
            addLog('ERROR: ROLE_REQUIRED_BEFORE_GOOGLE');
            return;
        }

        setIsLoading(true);
        setAuthProvider('GOOGLE');
        setRoleSelected(formData.role as string);
        addLog('AUTH_PROVIDER: GOOGLE');
        addLog('REDIRECTING_TO_GOOGLE...');

        // Store role in localStorage for after redirect
        localStorage.setItem('pendingRole', formData.role as string);

        try {
            // This will redirect the page
            await signInWithGoogle();
        } catch (error: any) {
            addLog(`ERROR: ${error.message}`);
            setErrors({ email: error.message });
            setIsLoading(false);
        }
    };

    // Complete Google profile after redirect
    const completeGoogleProfile = async () => {
        if (!formData.role) {
            setErrors({ role: 'ROLE_REQUIRED' });
            return;
        }

        setIsLoading(true);
        const pendingRole = localStorage.getItem('pendingRole') || formData.role;

        try {
            const user = await handleGoogleRedirectResult();
            if (!user) {
                addLog('ERROR: NO_USER_FROM_REDIRECT');
                return;
            }

            setFirestoreStatus('PENDING');
            addLog('CREATING_PROFILE...');
            await createUserProfile(user.uid, {
                name: user.displayName || 'User',
                email: user.email!,
                role: pendingRole as UserRole,
                provider: 'google',
            });
            setFirestoreStatus('OK');
            addLog('FIRESTORE_WRITE: OK');
            setRoleSelected(pendingRole);

            // Clear pending role
            localStorage.removeItem('pendingRole');

            // Redirect
            const route = getDashboardRoute(pendingRole as UserRole);
            setRedirectTarget(route);
            addLog(`REDIRECT_TARGET: ${route}`);
            addLog('REDIRECTING...');
            setTimeout(() => router.push(route), 1000);
        } catch (error: any) {
            setFirestoreStatus('FAIL');
            addLog(`ERROR: ${error.message}`);
            setErrors({ email: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
            {/* Main Container - Brutalist Card */}
            <div className="w-full max-w-7xl border-2 border-slate-900 bg-white shadow-[8px_8px_0px_#0f172a] rounded-none">
                {/* 12-column Grid Layout */}
                <div className="grid lg:grid-cols-12 min-h-[700px]">
                    {/* LEFT PANEL: FORM (7 columns) */}
                    <div className="lg:col-span-7 p-12 lg:p-16 relative">
                        {/* Title */}
                        <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none text-slate-900 mb-12">
                            ACCESS
                            <br />
                            <span className="text-sky-500">PROTOCOL.</span>
                        </h1>

                        {/* Mode Toggle */}
                        <div className="flex gap-2 mb-8">
                            <button
                                type="button"
                                onClick={() => setMode('login')}
                                className={`px-6 py-2 text-xs font-black uppercase tracking-widest border-2 border-slate-900 transition-all ${mode === 'login'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white text-slate-900 hover:bg-stone-50'
                                    }`}
                            >
                                Login
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('signup')}
                                className={`px-6 py-2 text-xs font-black uppercase tracking-widest border-2 border-slate-900 transition-all ${mode === 'signup'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white text-slate-900 hover:bg-stone-50'
                                    }`}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleEmailAuth} className="space-y-6">
                            {/* Name Input (only for signup) */}
                            {mode === 'signup' && (
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border-2 border-slate-900 rounded-none bg-stone-50 px-3 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
                                        placeholder="JOHN DOE"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-xs font-bold text-red-600">{errors.name}</p>
                                    )}
                                </div>
                            )}

                            {/* Email Input */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border-2 border-slate-900 rounded-none bg-stone-50 px-3 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
                                    placeholder="user@ascendra.edu"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs font-bold text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full border-2 border-slate-900 rounded-none bg-stone-50 px-3 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
                                    placeholder="••••••••"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-xs font-bold text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Role Select */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                    Role {authProvider === 'GOOGLE' && <span className="text-red-600">*REQUIRED FOR GOOGLE</span>}
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => {
                                        setFormData({ ...formData, role: e.target.value as UserRole });
                                        setRoleSelected(e.target.value);
                                    }}
                                    className="w-full border-2 border-slate-900 rounded-none bg-stone-50 px-3 py-3 text-slate-900 focus:outline-none focus:border-sky-600"
                                >
                                    <option value="">SELECT ROLE</option>
                                    <option value="student">STUDENT</option>
                                    <option value="recruiter">RECRUITER</option>
                                    <option value="college_admin">COLLEGE ADMIN</option>
                                </select>
                                {errors.role && (
                                    <p className="mt-1 text-xs font-bold text-red-600">{errors.role}</p>
                                )}
                            </div>

                            {/* Primary Button - Email/Password */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-slate-900 text-white border-2 border-slate-900 rounded-none px-6 py-4 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_#0ea5e9] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'PROCESSING...' : mode === 'login' ? 'LOGIN' : 'SIGN UP'}
                            </button>

                            {/* Divider */}
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t-2 border-slate-200" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                        OR
                                    </span>
                                </div>
                            </div>

                            {/* Secondary Button - Google OAuth */}
                            <button
                                type="button"
                                onClick={handleGoogleAuth}
                                disabled={isLoading}
                                className="w-full bg-sky-300 text-slate-900 border-2 border-slate-900 rounded-none px-6 py-4 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                SIGN IN WITH GOOGLE
                            </button>
                        </form>
                    </div>

                    {/* VERTICAL SEPARATOR */}
                    <div className="hidden lg:flex lg:col-span-0 items-center justify-center relative">
                        <div className="w-px h-full bg-slate-200" />
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-180 [writing-mode:vertical-lr] text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                            AUTH_VECTOR
                        </span>
                    </div>

                    {/* RIGHT PANEL: INTELLIGENCE LOG (5 columns) */}
                    <div className="lg:col-span-5 bg-slate-900 p-8 border-l-2 border-slate-900">
                        <div className="h-full flex flex-col">
                            {/* Header */}
                            <div className="mb-6">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 mb-2">
                                    Intelligence Log
                                </h2>
                                <div className="w-full h-px bg-sky-600" />
                            </div>

                            {/* Terminal Content */}
                            <div className="flex-grow font-mono text-[10px] text-sky-400 space-y-1 overflow-y-auto">
                                {logMessages.map((msg, idx) => (
                                    <div key={idx}>{msg}</div>
                                ))}

                                {/* Real-time status */}
                                <div className="mt-4 border-t border-slate-700 pt-4 space-y-1">
                                    <div>AUTH_PROVIDER: {authProvider}</div>
                                    <div>ROLE_SELECTED: {roleSelected}</div>
                                    <div>FIRESTORE_WRITE: {firestoreStatus}</div>
                                    <div>REDIRECT_TARGET: {redirectTarget || 'NONE'}</div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-6 pt-4 border-t border-slate-700">
                                <div className="text-[8px] font-black uppercase tracking-widest text-slate-600">
                                    ASCENDRA AUTH v1.0 // SECURE
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

