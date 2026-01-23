'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { LayoutDashboard, FileText, FolderGit2, Target, MessageSquare, Code, Brain, TrendingUp, Zap, Briefcase } from 'lucide-react';
import { TopBar } from '@/components/student/TopBar';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

type TestType = 'technical' | 'analytical';

export default function TestsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userSkills, setUserSkills] = useState<string[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [realName, setRealName] = useState<string>("Student");
    const [profileProgress, setProfileProgress] = useState(25);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);

                // Track user document for name and progress
                const userDocRef = doc(db, 'users', user.uid);
                const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();

                        // Update Name
                        if (userData.full_name) {
                            setRealName(userData.full_name);
                        }

                        // Update Skills
                        const skills = userData.skills || ['JavaScript', 'HTML', 'CSS'];
                        setUserSkills(skills);

                        // Calculate Dynamic Progress
                        let progress = 25; // Base level
                        if (userData.resume_url || userData.personal_info?.full_name) progress += 25;
                        const hasQuiz = userData.history?.some((h: any) => h.type === 'quiz');
                        if (hasQuiz) progress += 25;
                        const hasInterview = userData.history?.some((h: any) => h.type === 'interview');
                        if (hasInterview) progress += 25;
                        setProfileProgress(progress);
                    }
                });

                return () => unsubscribeDoc();
            } else {
                setRealName("Student");
            }
        });
        return () => unsubscribe();
    }, []);

    const startTest = async (type: TestType) => {
        setLoading(true);

        try {
            // Generate quiz
            const response = await fetch('/api/quiz/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    skills: type === 'technical' ? userSkills : [],
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate quiz');
            }

            const { quiz } = await response.json();

            // Store quiz in localStorage
            localStorage.setItem('currentQuiz', JSON.stringify(quiz));

            // Navigate to quiz page
            router.push('/student/tests/quiz');
        } catch (error) {
            console.error('Error starting test:', error);
            alert('Failed to generate quiz. Please try again.');
        } finally {
            setLoading(false);
        }
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

    return (
        <div className="min-h-screen bg-stone-50">
            <Sidebar items={sidebarItems} userName={realName} />

            <div className="pl-64">
                <TopBar
                    profileProgress={profileProgress}
                    status="ANALYZED"
                    userName={realName}
                />
                <div className="p-8 lg:p-12 max-w-7xl mx-auto">

                    {/* HEADER */}
                    <div className="mb-12 border-l-4 border-slate-900 pl-6">
                        <h1 className="text-6xl font-black uppercase tracking-tighter text-slate-900 leading-[0.9] mb-4">
                            SKILL <br /> ASSESSMENT
                        </h1>
                        <p className="text-lg font-medium text-slate-600 max-w-2xl">
                            Test your technical knowledge and analytical abilities with AI-generated quizzes.
                            Choose your challenge below.
                        </p>
                    </div>

                    {/* TEST CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

                        {/* TECHNICAL TEST CARD */}
                        <button
                            onClick={() => startTest('technical')}
                            disabled={loading}
                            className="group relative bg-white border-4 border-slate-900 p-8 shadow-[12px_12px_0px_#0f172a] hover:translate-y-2 hover:shadow-[6px_6px_0px_#0f172a] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                        >
                            {/* Icon */}
                            <div className="absolute -top-6 -left-6 w-16 h-16 bg-sky-300 border-4 border-slate-900 flex items-center justify-center shadow-[6px_6px_0px_#0f172a] group-hover:rotate-12 transition-transform">
                                <Code className="w-8 h-8 text-slate-900" />
                            </div>



                            {/* Content */}
                            <div className="mt-8">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-3">
                                    Technical Test
                                </h2>
                                <p className="text-sm font-medium text-slate-600 mb-6">
                                    5 questions based on your skills: {userSkills.slice(0, 3).join(', ')}
                                    {userSkills.length > 3 && ` +${userSkills.length - 3} more`}
                                </p>

                                {/* Stats */}
                                <div className="flex gap-4 mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-sky-300 border border-slate-900" />
                                        <span className="text-xs font-bold uppercase text-slate-500">5 Questions</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-sky-300 border border-slate-900" />
                                        <span className="text-xs font-bold uppercase text-slate-500">10 Minutes</span>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-sm group-hover:gap-4 transition-all">
                                    <span>Start Test</span>
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5">
                                <Code className="w-full h-full" />
                            </div>
                        </button>

                        {/* ANALYTICAL TEST CARD */}
                        <button
                            onClick={() => startTest('analytical')}
                            disabled={loading}
                            className="group relative bg-white border-4 border-slate-900 p-8 shadow-[12px_12px_0px_#0f172a] hover:translate-y-2 hover:shadow-[6px_6px_0px_#0f172a] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                        >
                            {/* Icon */}
                            <div className="absolute -top-6 -left-6 w-16 h-16 bg-purple-300 border-4 border-slate-900 flex items-center justify-center shadow-[6px_6px_0px_#0f172a] group-hover:rotate-12 transition-transform">
                                <Brain className="w-8 h-8 text-slate-900" />
                            </div>



                            {/* Content */}
                            <div className="mt-8">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-3">
                                    Analytical Test
                                </h2>
                                <p className="text-sm font-medium text-slate-600 mb-6">
                                    5 logical reasoning and problem-solving questions to test your analytical abilities
                                </p>

                                {/* Stats */}
                                <div className="flex gap-4 mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-300 border border-slate-900" />
                                        <span className="text-xs font-bold uppercase text-slate-500">5 Questions</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-300 border border-slate-900" />
                                        <span className="text-xs font-bold uppercase text-slate-500">10 Minutes</span>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-sm group-hover:gap-4 transition-all">
                                    <span>Start Test</span>
                                    <Zap className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5">
                                <Brain className="w-full h-full" />
                            </div>
                        </button>

                    </div>

                    {/* INFO SECTION */}
                    <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_#0f172a]">
                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-4">How It Works</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 border-2 border-slate-900 bg-sky-300 flex items-center justify-center font-black shadow-[2px_2px_0px_#0f172a] shrink-0">
                                    1
                                </div>
                                <div>
                                    <h4 className="font-black text-sm uppercase text-slate-900 mb-1">Choose Test</h4>
                                    <p className="text-xs text-slate-600">Select technical or analytical assessment</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-8 h-8 border-2 border-slate-900 bg-sky-300 flex items-center justify-center font-black shadow-[2px_2px_0px_#0f172a] shrink-0">
                                    2
                                </div>
                                <div>
                                    <h4 className="font-black text-sm uppercase text-slate-900 mb-1">Answer Questions</h4>
                                    <p className="text-xs text-slate-600">5 AI-generated multiple-choice questions</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-8 h-8 border-2 border-slate-900 bg-sky-300 flex items-center justify-center font-black shadow-[2px_2px_0px_#0f172a] shrink-0">
                                    3
                                </div>
                                <div>
                                    <h4 className="font-black text-sm uppercase text-slate-900 mb-1">View Results</h4>
                                    <p className="text-xs text-slate-600">Get instant feedback with explanations</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loading Overlay */}
                    {loading && (
                        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
                            <div className="bg-white border-4 border-slate-900 p-8 shadow-[8px_8px_0px_#0f172a]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-slate-900 border-t-sky-300 rounded-none animate-spin" />
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Generating Quiz</h3>
                                        <p className="text-sm text-slate-600">AI is creating your personalized questions...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

