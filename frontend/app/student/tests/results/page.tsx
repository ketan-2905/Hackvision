'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { LayoutDashboard, FileText, FolderGit2, Target, MessageSquare, Award, CheckCircle, XCircle, RotateCcw, Home, Briefcase, Code } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

type Question = {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
};

type Quiz = {
    id: string;
    type: string;
    questions: Question[];
    createdAt: string;
};

export default function ResultsPage() {
    const router = useRouter();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [score, setScore] = useState(0);
    const [percentage, setPercentage] = useState(0);
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
        // Load quiz and answers from localStorage
        const quizData = localStorage.getItem('currentQuiz');
        const answersData = localStorage.getItem('quizAnswers');

        if (quizData && answersData) {
            const parsedQuiz: Quiz = JSON.parse(quizData);
            const parsedAnswers: Record<string, number> = JSON.parse(answersData);

            setQuiz(parsedQuiz);
            setAnswers(parsedAnswers);

            // Calculate score
            let correct = 0;
            parsedQuiz.questions.forEach(q => {
                if (parsedAnswers[q.id] === q.correctAnswer) {
                    correct++;
                }
            });

            const finalScore = correct;
            const finalPercentage = Math.round((correct / parsedQuiz.questions.length) * 100);

            setScore(finalScore);
            setPercentage(finalPercentage);

            // Update score in Firestore if userId is available
            if (userId) {
                setSyncStatus('SYNCING');
                console.log('🔄 Syncing score for userId:', userId);
                fetch('/api/user/update-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        type: 'quiz',
                        score: finalPercentage
                    })
                }).then(async res => {
                    if (res.ok) {
                        console.log('✅ Competency score updated');
                        setSyncStatus('SUCCESS');
                    } else {
                        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                        console.error('❌ Failed to update competency score:', res.status, errorData);
                        setSyncStatus('ERROR');
                        alert(`Score sync failed: ${errorData.details || errorData.error || 'Unknown error'}. Check console for details.`);
                    }
                }).catch(err => {
                    console.error('❌ Failed to update competency score:', err);
                    setSyncStatus('ERROR');
                    alert(`Network error: ${err.message}. Check console for details.`);
                });
            }
        } else {
            // No data, redirect to tests
            router.push('/student/tests');
        }
    }, [router, userId]);

    const retryTest = () => {
        localStorage.removeItem('currentQuiz');
        localStorage.removeItem('quizAnswers');
        router.push('/student/tests');
    };

    const sidebarItems = [
        { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, isActive: false },
        { label: 'Tests', href: '/student/tests', icon: FileText, isActive: true },
        { label: 'Interview', href: '/student/interview', icon: MessageSquare, isActive: false },
        { label: 'Projects', href: '/student/projects', icon: FolderGit2, isActive: false },
        { label: 'IUTS', href: '/student/iuts', icon: Target, isActive: false },
        { label: 'Skill Gap', href: '/student/interview/skillgap', icon: Target, isActive: false },
        { label: 'Opportunities', href: '/student/oppurtunits', icon: Briefcase, isActive: false },
        { label: 'Code', href: '/student/code', icon: Code, isActive: false }
    ];

    const getScoreColor = (pct: number) => {
        if (pct >= 80) return 'bg-green-500';
        if (pct >= 60) return 'bg-sky-300';
        if (pct >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getScoreLabel = (pct: number) => {
        if (pct >= 80) return 'EXCELLENT';
        if (pct >= 60) return 'GOOD';
        if (pct >= 40) return 'FAIR';
        return 'NEEDS IMPROVEMENT';
    };

    if (!quiz) {
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

    return (
        <div className="min-h-screen bg-stone-50">
            <Sidebar items={sidebarItems} />

            <div className="pl-64">
                <div className="p-8 max-w-5xl mx-auto">

                    {/* HEADER */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                            TEST RESULTS
                        </h1>
                        <p className="text-sm font-medium text-slate-600">
                            {quiz.type === 'technical' ? 'Technical Assessment' : 'Analytical Assessment'}
                        </p>
                    </div>

                    {/* SCORE CARD */}
                    <div className="bg-white border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] p-8 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 border-2 border-slate-900 flex items-center justify-center bg-sky-300 shadow-[4px_4px_0px_#0f172a]">
                                    <Award className="w-10 h-10 text-slate-900" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">YOUR SCORE</h2>
                                    <p className="text-xs font-medium text-slate-600">{score} out of {quiz.questions.length} correct</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-7xl font-black text-slate-900">{percentage}%</div>
                                <div className="mt-2 flex flex-col items-end gap-2">
                                    <div className={`text-sm font-black uppercase tracking-widest px-4 py-2 border-2 border-slate-900 ${getScoreColor(percentage)} inline-block shadow-[2px_2px_0px_#0f172a]`}>
                                        {getScoreLabel(percentage)}
                                    </div>

                                    {/* Sync Indicator */}
                                    <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        {syncStatus === 'SYNCING' && <span className="text-sky-500 animate-pulse">● Syncing to Profile...</span>}
                                        {syncStatus === 'SUCCESS' && <span className="text-green-600">✓ Score Synced to Dashboard</span>}
                                        {syncStatus === 'ERROR' && <span className="text-red-500">⚠ Sync Failed - Check Connection</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-12 border-4 border-slate-900 bg-stone-100 p-1">
                            <div className={`h-full ${getScoreColor(percentage)} transition-all`} style={{ width: `${percentage}%` }} />
                        </div>
                    </div>

                    {/* QUESTION BREAKDOWN */}
                    <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-6 mb-8">
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6">ANSWER REVIEW</h3>
                        <div className="space-y-6">
                            {quiz.questions.map((q, idx) => {
                                const userAnswer = answers[q.id];
                                const isCorrect = userAnswer === q.correctAnswer;
                                const optionLabels = ['A', 'B', 'C', 'D'];

                                return (
                                    <div key={q.id} className="border-2 border-slate-900 bg-stone-50 p-5">
                                        <div className="flex items-start gap-4">
                                            {/* Question Number */}
                                            <div className={`w-10 h-10 min-w-10 border-2 border-slate-900 flex items-center justify-center font-black shadow-[2px_2px_0px_#0f172a] ${isCorrect ? 'bg-green-500' : 'bg-red-500'
                                                }`}>
                                                {idx + 1}
                                            </div>

                                            <div className="flex-1">
                                                {/* Question */}
                                                <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">QUESTION</div>
                                                <p className="text-base font-bold text-slate-800 mb-4">{q.question}</p>

                                                {/* Options */}
                                                <div className="space-y-2 mb-4">
                                                    {q.options.map((option, optIdx) => {
                                                        const isUserAnswer = userAnswer === optIdx;
                                                        const isCorrectAnswer = q.correctAnswer === optIdx;

                                                        let bgColor = 'bg-white';
                                                        let icon = null;

                                                        if (isCorrectAnswer) {
                                                            bgColor = 'bg-green-100 border-green-500';
                                                            icon = <CheckCircle className="w-5 h-5 text-green-600" />;
                                                        } else if (isUserAnswer && !isCorrect) {
                                                            bgColor = 'bg-red-100 border-red-500';
                                                            icon = <XCircle className="w-5 h-5 text-red-600" />;
                                                        }

                                                        return (
                                                            <div key={optIdx} className={`flex items-center gap-3 p-3 border-2 ${bgColor} ${isCorrectAnswer || isUserAnswer ? 'border-2' : 'border-slate-300'
                                                                }`}>
                                                                <div className={`w-7 h-7 border-2 border-slate-900 flex items-center justify-center text-xs font-black ${isCorrectAnswer ? 'bg-green-500' : isUserAnswer ? 'bg-red-500' : 'bg-stone-100'
                                                                    }`}>
                                                                    {optionLabels[optIdx]}
                                                                </div>
                                                                <span className="text-sm font-medium text-slate-800 flex-1">{option}</span>
                                                                {icon}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Explanation */}
                                                <div className="bg-sky-50 border-l-4 border-sky-300 p-4">
                                                    <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">EXPLANATION</div>
                                                    <p className="text-sm text-slate-700">{q.explanation}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-4">
                        <button
                            onClick={retryTest}
                            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 text-sm font-black uppercase tracking-widest border-2 border-slate-900 shadow-[4px_4px_0px_#0ea5e9] hover:translate-y-1 hover:shadow-none transition-all"
                        >
                            <RotateCcw className="w-5 h-5" />
                            TRY ANOTHER TEST
                        </button>
                        <button
                            onClick={() => router.push('/student/dashboard')}
                            className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-4 text-sm font-black uppercase tracking-widest border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-none transition-all"
                        >
                            <Home className="w-5 h-5" />
                            BACK TO DASHBOARD
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
