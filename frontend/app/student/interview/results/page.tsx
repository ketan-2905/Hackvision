'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { LayoutDashboard, FileText, FolderGit2, Target, MessageSquare, Award, TrendingUp, Brain, Activity } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

type InterviewData = {
    questions: string[];
    answers: string[];
    anxietyLevels: number[];
    startTime: number;
    endTime: number;
    weaknesses: string[];
};

type EvaluationMetrics = {
    overallScore: number;
    technicalAccuracy: number;
    communicationClarity: number;
    confidence: number;
    completeness: number;
    strengths: string[];
    improvements: string[];
};

function evaluateInterview(data: InterviewData): EvaluationMetrics {
    // Technical: Check response length and keywords
    const avgLength = data.answers.reduce((sum, a) => sum + a.split(' ').length, 0) / data.answers.length;
    const technical = Math.min(100, Math.max(40, (avgLength / 30) * 100)); // 30 words = 100%

    // Communication: Not too short, not too long
    const communication = avgLength > 15 && avgLength < 100 ? 85 : 65;

    // Confidence: Inverse of average anxiety
    const avgAnxiety = data.anxietyLevels.reduce((sum, a) => sum + a, 0) / data.anxietyLevels.length;
    const confidence = 100 - (avgAnxiety * 100);

    // Completeness: Did they answer all 4 questions?
    const completeness = (data.answers.length / 4) * 100;

    // Overall: Weighted average
    const overall = Math.round(
        technical * 0.35 +
        communication * 0.25 +
        confidence * 0.25 +
        completeness * 0.15
    );

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (confidence > 75) strengths.push('Maintained composure and confidence');
    if (avgLength > 25) strengths.push('Provided detailed responses');
    if (completeness === 100) strengths.push('Answered all questions');

    if (confidence < 60) improvements.push('Practice staying calm during interviews');
    if (avgLength < 20) improvements.push('Provide more detailed explanations');
    if (technical < 70) improvements.push('Deepen technical knowledge in weak areas');

    return {
        overallScore: overall,
        technicalAccuracy: Math.round(technical),
        communicationClarity: Math.round(communication),
        confidence: Math.round(confidence),
        completeness: Math.round(completeness),
        strengths,
        improvements,
    };
}

export default function InterviewResultsPage() {
    const router = useRouter();
    const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
    const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
    const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');

    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const data = localStorage.getItem('lastInterview');
        if (data) {
            const parsed: InterviewData = JSON.parse(data);
            setInterviewData(parsed);
            const calculatedMetrics = evaluateInterview(parsed);
            setMetrics(calculatedMetrics);

            // Update score in Firestore
            if (userId) {
                setSyncStatus('SYNCING');
                console.log('🔄 Syncing interview score for userId:', userId);
                fetch('/api/user/update-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        type: 'interview',
                        score: calculatedMetrics.overallScore
                    })
                }).then(async res => {
                    if (res.ok) {
                        console.log('✅ Interview competency score updated');
                        setSyncStatus('SUCCESS');
                    } else {
                        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                        console.error('❌ Failed to update interview score:', res.status, errorData);
                        setSyncStatus('ERROR');
                        alert(`Interview sync failed: ${errorData.details || errorData.error || 'Unknown error'}. Check console for details.`);
                    }
                }).catch(err => {
                    console.error('❌ Failed to update interview score:', err);
                    setSyncStatus('ERROR');
                    alert(`Network error: ${err.message}. Check console for details.`);
                });
            }
        } else {
            // No data, redirect back
            router.push('/student/interview');
        }
    }, [router, userId]);

    const sidebarItems = [
        { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, isActive: false },
        { label: 'Tests', href: '/student/tests', icon: FileText, isActive: false },
        { label: 'Interview', href: '/student/interview', icon: MessageSquare, isActive: true },
        { label: 'Projects', href: '/student/projects', icon: FolderGit2, isActive: false },
        { label: 'IUTS', href: '/student/iuts', icon: Target, isActive: false }
    ];

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-sky-300';
        if (score >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'EXCELLENT';
        if (score >= 60) return 'GOOD';
        if (score >= 40) return 'FAIR';
        return 'NEEDS IMPROVEMENT';
    };

    if (!interviewData || !metrics) {
        return (
            <div className="min-h-screen bg-stone-50">
                <Sidebar items={sidebarItems} />
                <div className="pl-64 p-12">
                    <div className="text-center">
                        <p className="text-lg font-black uppercase text-slate-900">Loading Results...</p>
                    </div>
                </div>
            </div>
        );
    }

    const duration = Math.round((interviewData.endTime - interviewData.startTime) / 1000 / 60); // minutes

    return (
        <div className="min-h-screen bg-stone-50">
            <Sidebar items={sidebarItems} />

            <div className="pl-64">
                <div className="p-8 max-w-7xl mx-auto">

                    {/* PAGE HEADER */}
                    <div className="mb-8">
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                            INTERVIEW RESULTS
                        </h1>
                        <p className="text-sm font-medium text-slate-600">
                            Comprehensive evaluation of your technical interview performance
                        </p>
                    </div>

                    {/* OVERALL SCORE CARD */}
                    <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-8 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 border-2 border-slate-900 flex items-center justify-center bg-sky-300 shadow-[4px_4px_0px_#0f172a]">
                                    <Award className="w-8 h-8 text-slate-900" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">OVERALL SCORE</h2>
                                    <p className="text-sm text-slate-600">Duration: {duration} minutes</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-6xl font-black text-slate-900">{metrics.overallScore}</div>
                                <div className="mt-2 flex flex-col items-end gap-2">
                                    <div className={`text-sm font-black uppercase tracking-widest px-3 py-1 border-2 border-slate-900 ${getScoreColor(metrics.overallScore)} inline-block`}>
                                        {getScoreLabel(metrics.overallScore)}
                                    </div>

                                    {/* Sync Indicator */}
                                    <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        {syncStatus === 'SYNCING' && <span className="text-sky-500 animate-pulse">● Syncing to Profile...</span>}
                                        {syncStatus === 'SUCCESS' && <span className="text-green-600">✓ Interview Synced to Dashboard</span>}
                                        {syncStatus === 'ERROR' && <span className="text-red-500">⚠ Sync Failed - Check Connection</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-12 border-4 border-slate-900 bg-stone-100 p-1">
                            <div className={`h-full ${getScoreColor(metrics.overallScore)} transition-all`} style={{ width: `${metrics.overallScore}%` }} />
                        </div>
                    </div>

                    {/* PERFORMANCE BREAKDOWN */}
                    <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-6 mb-6">
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6">PERFORMANCE BREAKDOWN</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: 'Technical Accuracy', score: metrics.technicalAccuracy, icon: Brain },
                                { label: 'Communication', score: metrics.communicationClarity, icon: MessageSquare },
                                { label: 'Confidence', score: metrics.confidence, icon: TrendingUp },
                                { label: 'Completeness', score: metrics.completeness, icon: Activity },
                            ].map((item) => (
                                <div key={item.label} className="border-2 border-slate-900 p-4 bg-stone-50">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 border-2 border-slate-900 flex items-center justify-center bg-white">
                                            <item.icon className="w-5 h-5 text-slate-900" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
                                            <div className="text-2xl font-black text-slate-900">{item.score}%</div>
                                        </div>
                                    </div>
                                    <div className="h-6 bg-stone-100 border-2 border-slate-900">
                                        <div className={`h-full ${getScoreColor(item.score)}`} style={{ width: `${item.score}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* QUESTION BY QUESTION ANALYSIS */}
                    <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-6 mb-6">
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6">QUESTION ANALYSIS</h3>
                        <div className="space-y-4">
                            {interviewData.questions.map((q, idx) => (
                                <div key={idx} className="border-2 border-slate-900 bg-stone-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 border-2 border-slate-900 bg-sky-300 flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_#0f172a]">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">QUESTION</div>
                                            <p className="text-sm font-medium text-slate-800 mb-3">{q}</p>

                                            <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">YOUR ANSWER</div>
                                            <p className="text-sm text-slate-600 mb-2">{interviewData.answers[idx] || 'No answer recorded'}</p>

                                            <div className="flex items-center gap-4 mt-3">
                                                <div className="text-xs">
                                                    <span className="font-black uppercase text-slate-500">Words: </span>
                                                    <span className="font-bold">{interviewData.answers[idx]?.split(' ').length || 0}</span>
                                                </div>
                                                <div className="text-xs">
                                                    <span className="font-black uppercase text-slate-500">Anxiety: </span>
                                                    <span className="font-bold">{Math.round((interviewData.anxietyLevels[idx] || 0) * 100)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* STRENGTHS & IMPROVEMENTS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Strengths */}
                        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-6">
                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-4">✓ STRENGTHS</h3>
                            <ul className="space-y-2">
                                {metrics.strengths.map((s, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <div className="w-2 h-2 bg-green-500 border border-slate-900 mt-1.5" />
                                        <span className="text-sm font-medium text-slate-700">{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Improvements */}
                        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-6">
                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-4">→ IMPROVEMENTS</h3>
                            <ul className="space-y-2">
                                {metrics.improvements.map((imp, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <div className="w-2 h-2 bg-yellow-500 border border-slate-900 mt-1.5" />
                                        <span className="text-sm font-medium text-slate-700">{imp}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push('/student/interview')}
                            className="flex-1 bg-slate-900 text-white px-6 py-4 text-sm font-black uppercase tracking-widest border-2 border-slate-900 shadow-[4px_4px_0px_#0ea5e9] hover:translate-y-1 hover:shadow-none transition-all"
                        >
                            START NEW INTERVIEW
                        </button>
                        <button
                            onClick={() => router.push('/student/dashboard')}
                            className="flex-1 bg-white text-slate-900 px-6 py-4 text-sm font-black uppercase tracking-widest border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-none transition-all"
                        >
                            BACK TO DASHBOARD
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
