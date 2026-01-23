'use client';

import React, { useState, useEffect } from "react";
import { getOpportunities, StudentProfile } from "./actions";
import {
    BadgeCheck, Calendar, MapPin, Globe, Briefcase, Code, ExternalLink,
    GraduationCap, BrainCircuit, Trophy, Terminal, ArrowRight,
    LayoutDashboard, FileText, FolderGit2, Target, MessageSquare
} from "lucide-react";
import Link from "next/link";
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/student/TopBar';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// Hardcoded profile as requested for valid initial testing
const demoStudentProfile: StudentProfile = {
    skills: {
        programming_languages: ["Python", "JavaScript", "TypeScript"],
        frameworks: ["React", "Next.js", "TailwindCSS"],
        tools: ["Git", "VS Code", "Vercel"]
    },
    experience: {
        project_count: 5,
        internship_count: 1
    },
    scores: {
        aptitude: 85,
        technical: 90,
        case_study: 80
    },
    soft_skills: {
        communication: 85,
        problem_solving: 90,
        adaptability: 85,
        knowledge_depth: 80
    }
};

export default function OpportunitiesPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [realName, setRealName] = useState<string>("Student");
    const [profileProgress, setProfileProgress] = useState(25);

    // Fetch Opportunities
    useEffect(() => {
        async function fetchData() {
            try {
                const result = await getOpportunities(demoStudentProfile);
                setData(result);
            } catch (error) {
                console.error("Failed to fetch opportunities", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Auth & Profile Tracking
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        if (userData.full_name) setRealName(userData.full_name);

                        let progress = 25;
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
        return () => unsubscribeAuth();
    }, []);

    const sidebarItems = [
        { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, isActive: false },
        { label: 'Tests', href: '/student/tests', icon: FileText, isActive: false },
        { label: 'Interview', href: '/student/interview', icon: MessageSquare, isActive: false },
        { label: 'Projects', href: '/student/projects', icon: FolderGit2, isActive: false },
        { label: 'IUTS', href: '/student/iuts', icon: Target, isActive: false },
        { label: 'Skill Gap', href: '/student/interview/skillgap', icon: Target, isActive: false },
        { label: 'Opportunities', href: '/student/oppurtunits', icon: Briefcase, isActive: true },
        { label: 'Code', href: '/student/code', icon: Code, isActive: false }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50">
                <Sidebar items={sidebarItems} userName={realName} />
                <div className="pl-64">
                    <TopBar profileProgress={profileProgress} status="ANALYZED" userName={realName} />
                    <div className="p-12 flex items-center justify-center min-h-[60vh]">
                        <div className="flex flex-col items-center gap-4">
                            <BrainCircuit className="w-12 h-12 text-slate-900 animate-pulse" />
                            <p className="font-black uppercase tracking-widest text-slate-500">Extracting Opportunities...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-stone-50 text-slate-900 font-sans selection:bg-sky-300 selection:text-slate-900">
            <Sidebar items={sidebarItems} userName={realName} />

            <div className="pl-64">
                <TopBar profileProgress={profileProgress} status="ANALYZED" userName={realName} />

                <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-16">

                    {/* Header Section */}
                    <header className="space-y-6 border-b-4 border-slate-900 pb-8">
                        <div className="flex items-start justify-between flex-wrap gap-8">
                            <div className="space-y-2">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 border-2 border-slate-900 bg-sky-300 flex items-center justify-center shadow-[4px_4px_0px_#0f172a]">
                                        <BrainCircuit className="w-7 h-7 text-slate-900" strokeWidth={2.5} />
                                    </div>
                                    <div className="px-3 py-1 border-2 border-slate-900 bg-slate-900 text-white font-mono text-xs uppercase tracking-widest">
                                        SYS.V1.0.4
                                    </div>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none text-slate-900">
                                    Opportunity<br />Extraction
                                </h1>
                            </div>

                            <div className="hidden md:block w-64 p-4 bg-slate-900 text-sky-400 font-mono text-[10px] border-2 border-slate-900 shadow-[8px_8px_0px_#cbd5e1]">
                                <div className="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                                    <Terminal className="w-3 h-3" />
                                    <span>INTELLIGENCE_LOG</span>
                                </div>
                                <div className="space-y-1 opacity-80">
                                    <p> TARGET: {demoStudentProfile.skills.programming_languages.join(", ")}</p>
                                    <p> SEARCH_DEPTH: ADVANCED</p>
                                    <p> STATUS: {data.hackathons.length + data.internships.length} MATCHES FOUND</p>
                                    <p> EXEC_TIME: {new Date().toLocaleTimeString()}</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <section className="grid lg:grid-cols-12 gap-8">

                        {/* Left Column - Primary Data */}
                        <div className="lg:col-span-8 space-y-12">

                            {/* Analysis Block */}
                            <div className="border-2 border-slate-900 bg-white p-8 shadow-[8px_8px_0px_#0f172a]">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 border-2 border-slate-900 flex items-center justify-center bg-sky-300">
                                        <BadgeCheck className="w-6 h-6 text-slate-900" />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Readiness Assessment</h2>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-2">Inferred Level</span>
                                        <div className="text-4xl font-black uppercase tracking-tighter bg-sky-300 inline-block px-2 border-2 border-slate-900 transform -rotate-1">
                                            {data.profile_summary.inferred_level}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-2">Confidence Score</span>
                                        <div className="h-10 border-4 border-slate-900 bg-stone-100 p-1 relative w-full">
                                            <div
                                                className="h-full bg-sky-300 border-r-2 border-slate-900 relative z-10"
                                                style={{ width: `${data.confidence_score}%` }}
                                            ></div>
                                            <div className="absolute inset-0 grid grid-cols-10 divide-x divide-slate-300/50 z-0 pointer-events-none">
                                                {[...Array(10)].map((_, i) => <div key={i}></div>)}
                                            </div>
                                        </div>
                                        <div className="text-right font-mono text-xs mt-1 font-bold">{data.confidence_score}% VERIFIED</div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t-2 border-slate-100">
                                    <p className="font-medium text-slate-600 leading-relaxed border-l-4 border-slate-900 pl-4">
                                        {data.profile_summary.justification}
                                    </p>
                                </div>
                            </div>

                            {/* Hackathons Feed */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-4">
                                    <div className="w-10 h-10 border-2 border-slate-900 flex items-center justify-center bg-white shadow-[2px_2px_0px_#0f172a]">
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">Active Hackathons</h3>
                                </div>

                                <div className="grid gap-6">
                                    {data.hackathons.length === 0 ? (
                                        <EmptyState type="hackathons" />
                                    ) : (
                                        data.hackathons.map((hack: any, idx: number) => (
                                            <div key={idx} className="group border-2 border-slate-900 bg-white p-6 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-none transition-all duration-200">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="space-y-1">
                                                        <div className="flex gap-2 mb-2">
                                                            {hack.mode !== 'not specified' && (
                                                                <span className="px-2 py-0.5 border border-slate-900 bg-stone-100 text-[10px] font-black uppercase tracking-wider">
                                                                    {hack.mode}
                                                                </span>
                                                            )}
                                                            {hack.level !== 'not specified' && (
                                                                <span className="px-2 py-0.5 border border-slate-900 bg-sky-100 text-[10px] font-black uppercase tracking-wider">
                                                                    {hack.level}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className="text-xl font-black uppercase leading-tight group-hover:underline decoration-4 underline-offset-4 decoration-sky-300">
                                                            {hack.name}
                                                        </h4>
                                                    </div>
                                                    <Link href={hack.official_link} target="_blank" className="p-2 border-2 border-slate-900 text-slate-900 bg-sky-300 hover:bg-slate-900 hover:text-white transition-colors">
                                                        <ExternalLink className="w-5 h-5" />
                                                    </Link>
                                                </div>

                                                <p className="text-sm font-medium text-slate-600 mb-6 border-l-2 border-slate-200 pl-3">
                                                    {hack.theme_or_focus}
                                                </p>

                                                <div className="grid sm:grid-cols-2 gap-4 text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-slate-900" />
                                                        {hack.location}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-slate-900" />
                                                        {hack.eligibility.substring(0, 30)}...
                                                    </div>
                                                </div>

                                                {hack.key_skills_mentioned?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-dashed border-slate-200">
                                                        {hack.key_skills_mentioned.slice(0, 3).map((skill: string, i: number) => (
                                                            <span key={i} className="text-[10px] px-2 py-1 border border-slate-900 bg-white font-mono uppercase">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Secondary Data/Internships */}
                        <div className="lg:col-span-4 space-y-12">

                            {/* Domain Card */}
                            <div className="border-2 border-slate-900 bg-sky-300 p-6 shadow-[4px_4px_0px_#0f172a]">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 block mb-2">Primary Domain</span>
                                <div className="text-3xl font-black uppercase tracking-tighter leading-none break-words">
                                    {data.profile_summary.primary_domain.replace(/_/g, " ")}
                                </div>
                                <Terminal className="w-8 h-8 mt-4 text-slate-900 opacity-20" />
                            </div>

                            {/* Internships Feed */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-2">
                                    <div className="w-8 h-8 border-2 border-slate-900 flex items-center justify-center bg-white">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Internships</h3>
                                </div>

                                <div className="space-y-4">
                                    {data.internships.length === 0 ? (
                                        <EmptyState type="internships" />
                                    ) : (
                                        data.internships.map((internship: any, idx: number) => (
                                            <div key={idx} className="relative block border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0px_#0f172a] hover:translate-x-1 hover:shadow-none transition-all">
                                                <div className="mb-3">
                                                    <h4 className="text-lg font-black uppercase leading-tight mb-1">
                                                        {internship.role}
                                                    </h4>
                                                    <p className="text-sm font-bold text-sky-600 uppercase tracking-wide">
                                                        {internship.organization}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {internship.duration !== 'not specified' && (
                                                        <span className="text-[10px] font-bold border border-slate-900 px-1 bg-stone-100">
                                                            {internship.duration}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-bold border border-slate-900 px-1 bg-stone-100">
                                                        {internship.location}
                                                    </span>
                                                </div>

                                                <div className="bg-slate-50 border border-slate-200 p-3 mb-4">
                                                    <p className="text-xs font-medium text-slate-500 italic">
                                                        "{internship.why_this_matches_student}"
                                                    </p>
                                                </div>

                                                <Link
                                                    href={internship.official_link}
                                                    target="_blank"
                                                    className="flex items-center justify-center w-full py-2 border-2 border-slate-900 bg-slate-900 text-white font-black uppercase tracking-wider text-xs hover:bg-sky-300 hover:text-slate-900 transition-colors"
                                                >
                                                    Apply Now <ArrowRight className="w-3 h-3 ml-2" />
                                                </Link>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>

                    </section>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ type }: { type: string }) {
    return (
        <div className="p-8 border-2 border-dashed border-slate-300 bg-stone-50 flex flex-col items-center text-center">
            <Globe className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                No active {type} detected
            </p>
        </div>
    )
}
