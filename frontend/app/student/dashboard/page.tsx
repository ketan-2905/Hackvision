"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/student/TopBar';
import { ResumeUploader } from '@/components/student/ResumeUploader';
import { MockSteps } from '@/components/student/MockSteps';
import { ResumeInsights } from '@/components/student/ResumeInsights';
import { ResumeAnalysis, DashboardStatus } from '@/types/resume';
import { LayoutDashboard, FileText, FolderGit2, Target, MessageSquare } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export default function StudentDashboard() {
    const router = useRouter();
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [status, setStatus] = useState<DashboardStatus>('EMPTY');
    const [profileProgress, setProfileProgress] = useState(25);
    const [userId, setUserId] = useState<string | null>(null);
    const [competencyScore, setCompetencyScore] = useState<number | null>(null);
    const [realName, setRealName] = useState<string>("Student");
    const [hasQuiz, setHasQuiz] = useState(false);
    const [hasInterview, setHasInterview] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('resumeAnalysis');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setAnalysis(data);
                setStatus('ANALYZED');
            } catch (e) {
                console.error('Failed to load stored analysis:', e);
            }
        }
    }, []);

    // Track current user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUserId(user?.uid || null);
            if (!user) {
                setCompetencyScore(null);
                setRealName("Student");
                setHasQuiz(false);
                setHasInterview(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Track user data from Firestore
    useEffect(() => {
        if (!userId) return;

        const userDocRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();

                // Update Name
                if (userData.full_name) {
                    setRealName(userData.full_name);
                }

                // Update Score
                if (userData.competency_score !== undefined) {
                    setCompetencyScore(userData.competency_score);
                }

                // Calculate Dynamic Progress - Flexible System
                // Complete any 2 out of 3 activities = 100%
                const hasResume = !!(userData.resume_url || userData.personal_info?.full_name);
                const quizHistory = userData.history?.filter((h: any) => h.type === 'quiz') || [];
                const interviewHistory = userData.history?.filter((h: any) => h.type === 'interview') || [];

                const hasQuiz = quizHistory.length > 0;
                const hasInterview = interviewHistory.length > 0;

                // Count completed activities
                let completedCount = 0;
                if (hasResume) completedCount++;
                if (hasQuiz) completedCount++;
                if (hasInterview) completedCount++;

                // Progress: 0 activities = 0%, 1 = 50%, 2+ = 100%
                let progress = 0;
                if (completedCount === 1) progress = 50;
                else if (completedCount >= 2) progress = 100;

                console.log('[Dashboard Debug] History data:', {
                    totalHistory: userData.history?.length || 0,
                    quizCount: quizHistory.length,
                    interviewCount: interviewHistory.length,
                    hasResume,
                    completedCount
                });

                setHasQuiz(hasQuiz);
                setHasInterview(hasInterview);

                console.log('[Dashboard Debug] Final progress:', progress);
                setProfileProgress(progress);

                // Update status
                if (hasResume && status === 'EMPTY') setStatus('ANALYZED');

            }
        });

        return () => unsubscribe();
    }, [userId]);

    const handleResumeUpload = async (file: File) => {
        setIsAnalyzing(true);
        setStatus('RESUME_UPLOADED');

        try {
            // Create FormData to send actual file
            const formData = new FormData();
            formData.append('file', file);

            // Add userId for Firestore save
            if (userId) {
                formData.append('userId', userId);
            }

            // Call API
            const response = await fetch('/api/resume/analyze', {
                method: 'POST',
                body: formData
                // No Content-Type header - browser sets it automatically with boundary for FormData
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const result = await response.json();

            if (result.success && result.data) {
                setAnalysis(result.data);
                setStatus('ANALYZED');
                setProfileProgress(45);

                // Store in localStorage
                localStorage.setItem('resumeAnalysis', JSON.stringify(result.data));
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Resume analysis error:', error);
            setStatus('RESUME_UPLOADED');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const sidebarItems = [
        {
            label: 'Dashboard',
            href: '/student/dashboard',
            icon: LayoutDashboard,
            isActive: true
        },
        {
            label: 'Tests',
            href: '/student/tests',
            icon: FileText,
            isActive: false
        },
        {
            label: 'Interview',
            href: '/student/interview',
            icon: MessageSquare,
            isActive: false
        },
        {
            label: 'Projects',
            href: '/student/projects',
            icon: FolderGit2,
            isActive: false
        },
        {
            label: 'IUTS',
            href: '/student/iuts',
            icon: Target,
            isActive: false
        }
    ];

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Sidebar */}
            <Sidebar items={sidebarItems} userName={realName} />

            {/* Main Content */}
            <div className="pl-64">
                <TopBar
                    profileProgress={profileProgress}
                    status={status}
                    userName={realName}
                />

                <main className="p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Page Title */}
                        <div className="mb-8">
                            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none text-slate-900 mb-2">
                                {realName.split(' ')[0]}
                                <br />
                                <span className="text-sky-500">Dashboard.</span>
                            </h1>
                            <p className="text-sm font-medium text-slate-600 mt-4">
                                Track your competency, upload your resume, and discover personalized career insights.
                            </p>
                        </div>

                        {/* First Row: Competency Score + Resume Upload */}
                        <div className="grid lg:grid-cols-2 gap-6 mb-6">
                            {/* Competency Score Card */}
                            <div className="border-2 border-slate-900 bg-white shadow-[8px_8px_0px_#0f172a] rounded-none p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
                                        Competency Score
                                    </h3>
                                    <div className="w-10 h-10 border-2 border-slate-900 bg-sky-300 flex items-center justify-center">
                                        <span className="text-slate-900 font-black text-lg">%</span>
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-3 mb-4">
                                    <span className="text-7xl font-black text-slate-900">
                                        {competencyScore !== null ? competencyScore : (analysis?.baselineCompetencyScore || 0)}
                                    </span>
                                    <span className="text-3xl font-black text-slate-400">/100</span>
                                </div>

                                <div className="border-t-2 border-slate-200 pt-4 mt-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                        Status
                                    </p>
                                    <p className="text-sm font-medium text-slate-600">
                                        {analysis
                                            ? (hasQuiz || hasInterview)
                                                ? 'Dynamic score updated based on your latest activities'
                                                : 'Baseline score calculated from resume analysis'
                                            : 'Upload your resume to generate your competency score'}
                                    </p>
                                </div>

                                {/* Company Matches Button */}
                                {competencyScore !== null && competencyScore > 0 && (
                                    <button
                                        onClick={() => router.push('/student/companies')}
                                        className="mt-6 w-full bg-slate-900 text-white px-6 py-4 text-sm font-black uppercase tracking-widest border-2 border-slate-900 shadow-[4px_4px_0px_#0ea5e9] hover:translate-y-1 hover:shadow-none transition-all"
                                    >
                                        🏢 View Company Matches
                                    </button>
                                )}
                            </div>

                            {/* Resume Upload */}
                            <ResumeUploader
                                onUpload={handleResumeUpload}
                                isAnalyzing={isAnalyzing}
                            />
                        </div>

                        {/* Activity History Section */}
                        {hasQuiz || hasInterview ? (
                            <div className="border-2 border-slate-900 bg-white shadow-[8px_8px_0px_#0f172a] p-8 mb-6">
                                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6">
                                    Recent Activity
                                </h3>
                                <div className="space-y-4">
                                    {hasQuiz && (
                                        <div className="flex items-center justify-between p-4 border-2 border-slate-900 bg-stone-50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-sky-300 border-2 border-slate-900 flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-slate-900" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase">Skill Assessment</p>
                                                    <p className="text-xs text-slate-500">Multiple Quiz Attempts Recorded</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold uppercase text-sky-600 bg-sky-50 px-2 py-1 border border-sky-200">
                                                    COMPLETED
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {hasInterview && (
                                        <div className="flex items-center justify-between p-4 border-2 border-slate-900 bg-stone-50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-purple-300 border-2 border-slate-900 flex items-center justify-center">
                                                    <MessageSquare className="w-5 h-5 text-slate-900" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase">AI Interview</p>
                                                    <p className="text-xs text-slate-500">Session Completed</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold uppercase text-purple-600 bg-purple-50 px-2 py-1 border border-purple-200">
                                                    COMPLETED
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {/* Second Row: Insights or Onboarding Steps */}
                        {analysis ? (
                            <ResumeInsights analysis={analysis} />
                        ) : (
                            <MockSteps />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
