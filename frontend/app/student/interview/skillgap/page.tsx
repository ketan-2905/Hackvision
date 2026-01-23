"use client";

import { useState, useEffect } from "react";
import { getGapAnalysis, getCourseRecommendations } from "./actions";
import { parseJD } from "../actions/parseJD";
import {
    Brain,
    Activity,
    ChevronRight,
    Terminal,
    ArrowRight,
    Zap,
    Loader2,
    AlertCircle,
    LayoutDashboard, FileText, FolderGit2, Target, MessageSquare, Briefcase, Code
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/student/TopBar';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- styled-components (shadcn-like) ---

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
    return (
        <input
            className={cn(
                "flex h-12 w-full border-2 border-slate-900 bg-white px-3 py-2 text-sm md:text-base font-bold text-slate-900 placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-0 focus:border-sky-600 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium",
                className
            )}
            {...props}
        />
    )
}

const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div
            className={cn("animate-pulse rounded-none bg-slate-200", className)}
            {...props}
        />
    )
}

// --- Neo-Brutalist Components ---

function BrutalistCard({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "border-2 border-slate-900 bg-white shadow-[4px_4px_0px_#0f172a] rounded-none transition-all hover:translate-y-1 hover:shadow-none",
                className
            )}
        >
            {children}
        </div>
    );
}

function StructuralProgressBar({
    label,
    value,
    benchmark,
}: {
    label: string;
    value: number;
    benchmark: number;
}) {
    const safeValue = Math.min(Math.max(value, 0), 100);
    const safeBenchmark = Math.min(Math.max(benchmark, 0), 100);

    return (
        <div className="space-y-1 font-mono">
            <div className="flex justify-between text-xs font-black uppercase tracking-tight text-slate-700">
                <span>{label}</span>
                <span className="text-slate-900">
                    {safeValue}% / <span className="text-slate-400">{safeBenchmark}% REQ</span>
                </span>
            </div>
            <div className="h-10 border-4 border-slate-900 bg-stone-100 p-1 relative overflow-hidden">
                {/* Grid Overlay */}
                <div className="absolute inset-0 grid grid-cols-10 divide-x-2 divide-slate-200/50 z-10 pointer-events-none">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} />
                    ))}
                </div>

                {/* Student Fill */}
                <div
                    className="h-full bg-sky-300 border-r-4 border-slate-900 relative z-0"
                    style={{ width: `${safeValue}%` }}
                />

                {/* Benchmark Marker */}
                <div
                    className="absolute top-0 bottom-0 border-l-4 border-dashed border-red-500/50 z-20 mix-blend-multiply"
                    style={{ left: `${safeBenchmark}%` }}
                />
            </div>
        </div>
    );
}



function FeatureIcon({ icon: Icon }: { icon: any }) {
    return (
        <div className="w-12 h-12 border-2 border-slate-900 flex items-center justify-center bg-white shadow-[4px_4px_0px_#0f172a] shrink-0">
            <Icon className="w-6 h-6 text-slate-900" />
        </div>
    );
}

// --- Main Page Component ---

type GapAnalysisData = {
    radarData: { skill: string; student: number; benchmark: number }[];
    upskillingPlan: { step: string; title: string; description: string }[];
};

export default function SkillGapPage() {
    // File Upload State
    const [file, setFile] = useState<File | null>(null);
    const [customBenchmarks, setCustomBenchmarks] = useState<{ skill: string; benchmark: number }[] | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Main Data State
    const [data, setData] = useState<GapAnalysisData | null>(null);
    const [loading, setLoading] = useState(false);
    const [analyzingFile, setAnalyzingFile] = useState(false);

    // Course Recommendations State
    type CourseRecommendation = { title: string; platform: string; url: string };
    const [initializingModule, setInitializingModule] = useState<number | null>(null);
    const [moduleRecommendations, setModuleRecommendations] = useState<Record<number, CourseRecommendation[]>>({});

    // Auth State
    const [realName, setRealName] = useState<string>("Student");
    const [profileProgress, setProfileProgress] = useState(25);

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

    const handleInitializeModule = async (index: number, moduleName: string) => {
        setInitializingModule(index);
        try {
            const recommendations = await getCourseRecommendations(moduleName);
            setModuleRecommendations(prev => ({
                ...prev,
                [index]: recommendations
            }));
        } catch (error) {
            console.error(error);
        } finally {
            setInitializingModule(null);
        }
    };

    // Handle File Upload & Analysis
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setUploadError(null);
        setAnalyzingFile(true);
        setLoading(true);
        setData(null); // Clear previous data

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            // 1. Extract & Parse JD
            const benchmarks = await parseJD(formData);
            setCustomBenchmarks(benchmarks);

            // 2. Generate Gap Analysis based on these benchmarks
            const analysis = await getGapAnalysis(benchmarks);
            setData(analysis);
        } catch (error) {
            console.error("Error processing file:", error);
            setUploadError((error as Error).message || "Failed to analyze file. Please ensure it's a valid PDF or Text file.");
        } finally {
            setAnalyzingFile(false);
            setLoading(false);
        }
    };

    const matchPercentage = data && data.radarData.length > 0
        ? Math.round(
            (data.radarData.reduce(
                (acc, curr) => acc + Math.min(curr.student / curr.benchmark, 1),
                0
            ) /
                data.radarData.length) *
            100
        )
        : 0;

    const sidebarItems = [
        { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, isActive: false },
        { label: 'Tests', href: '/student/tests', icon: FileText, isActive: false },
        { label: 'Interview', href: '/student/interview', icon: MessageSquare, isActive: false },
        { label: 'Projects', href: '/student/projects', icon: FolderGit2, isActive: false },
        { label: 'IUTS', href: '/student/iuts', icon: Target, isActive: false },
        { label: 'Skill Gap', href: '/student/interview/skillgap', icon: Target, isActive: true },
        { label: 'Opportunities', href: '/student/oppurtunits', icon: Briefcase, isActive: false },
        { label: 'Code', href: '/student/code', icon: Code, isActive: false }
    ];

    return (
        <div className="min-h-screen bg-[#fafaf9]">
            <Sidebar items={sidebarItems} userName={realName} />

            <div className="pl-64">
                <TopBar profileProgress={profileProgress} status="ANALYZED" userName={realName} />

                <div className="p-6 md:p-12 font-sans overflow-x-hidden selection:bg-sky-300 selection:text-slate-900 text-slate-900">
                    <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">

                        {/* Control Panel (Former Sidebar) */}
                        <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-12 space-y-12 h-fit">
                            <div className="border-l-[6px] border-slate-900 pl-6 py-2">
                                <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85]">
                                    Skill Gap
                                </h1>
                            </div>

                            <div className="space-y-6">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Operation_Mode: COSTOM_JD</div>

                                {/* Input Area */}
                                <div className="relative group space-y-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Upload Manifesto (PDF/TXT)</label>
                                        <div className="flex flex-col gap-2">
                                            <Input
                                                type="file"
                                                accept=".pdf,.txt"
                                                onChange={handleFileChange}
                                                disabled={analyzingFile}
                                                className="pt-2.5 file:mr-4 file:py-1 file:px-3 file:border-2 file:border-slate-900 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-900 hover:file:bg-slate-300"
                                            />
                                            {analyzingFile && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-sky-600 animate-pulse">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    ANALYZING_JOB_DESCRIPTION...
                                                </div>
                                            )}
                                            {uploadError && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-red-500">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {uploadError}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden lg:flex items-center gap-4 text-slate-300">
                                <div className="h-[2px] w-12 bg-slate-300" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.3em] rotate-90 origin-left translate-y-8">Sys_Id: 8A-11</span>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="col-span-12 lg:col-span-8 space-y-12">

                            {/* Metrics */}
                            <div>
                                <div className="flex items-center gap-6 mb-8 transform -translate-x-2">
                                    <FeatureIcon icon={Activity} />
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Module_01</div>
                                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Vector_Analysis</h2>
                                    </div>
                                </div>

                                {loading || analyzingFile ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full border-2 border-slate-300" />)}
                                    </div>
                                ) : (
                                    <BrutalistCard className="p-8 space-y-8">
                                        <div className="grid gap-8">
                                            {data?.radarData.map((item) => (
                                                <StructuralProgressBar
                                                    key={item.skill}
                                                    label={item.skill}
                                                    value={item.student}
                                                    benchmark={item.benchmark}
                                                />
                                            ))}
                                            {data?.radarData.length === 0 && (
                                                <div className="text-center py-12 text-slate-400 font-mono text-sm uppercase">
                                                    No Data Available. Initiate Scan.
                                                </div>
                                            )}
                                        </div>

                                        {data && data.radarData.length > 0 && (
                                            <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t-2 border-slate-900 border-dashed">
                                                <div className="text-xs font-mono text-slate-500 uppercase">
                                                    Delta Variance: {(100 - matchPercentage).toFixed(2)}_
                                                </div>
                                                <div className="inline-flex items-center gap-4 bg-slate-900 text-white px-6 py-3 font-black uppercase tracking-widest shadow-[4px_4px_0px_#0ea5e9]">
                                                    <span>Composite_Score</span>
                                                    <span className="text-sky-300 text-xl">{matchPercentage}%</span>
                                                </div>
                                            </div>
                                        )}
                                    </BrutalistCard>
                                )}
                            </div>

                            {/* Action Plan */}
                            {(data || loading || analyzingFile) && (
                                <div>
                                    <div className="flex items-center gap-6 mb-8 transform -translate-x-2">
                                        <FeatureIcon icon={Brain} />
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Module_02</div>
                                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Protocol_Upgrade</h2>
                                        </div>
                                    </div>

                                    <div className="grid gap-6">
                                        {loading || analyzingFile ? (
                                            <>
                                                <Skeleton className="h-48 w-full border-2 border-slate-300" />
                                                <Skeleton className="h-48 w-full border-2 border-slate-300" />
                                                <Skeleton className="h-48 w-full border-2 border-slate-300" />
                                            </>
                                        ) : (
                                            data?.upskillingPlan.map((step, idx) => (
                                                <div key={idx} className="group relative">
                                                    <div className="absolute -left-3 -top-3 z-10 bg-sky-300 border-2 border-slate-900 w-10 h-10 flex items-center justify-center font-black shadow-[2px_2px_0px_#0f172a]">
                                                        {idx + 1}
                                                    </div>

                                                    <BrutalistCard className="p-0">
                                                        <div className="flex flex-col md:flex-row">
                                                            <div className="bg-slate-900 text-white p-2 md:w-12 flex md:flex-col items-center justify-center gap-2 border-b-2 md:border-b-0 md:border-r-2 border-slate-900">
                                                                <Zap className="w-4 h-4 text-sky-400" />
                                                            </div>

                                                            <div className="p-8 w-full">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <h3 className="text-xl md:text-2xl font-black uppercase leading-tight max-w-lg">
                                                                        {step.title}
                                                                    </h3>
                                                                </div>
                                                                <p className="text-slate-600 font-medium leading-relaxed max-w-3xl border-l-2 border-slate-200 pl-4 mb-6">
                                                                    {step.description}
                                                                </p>

                                                                <div className="flex flex-col gap-4">
                                                                    <button
                                                                        onClick={() => handleInitializeModule(idx, step.title)}
                                                                        disabled={initializingModule === idx}
                                                                        className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.25em] text-slate-900 hover:text-sky-600 hover:gap-4 transition-all group-hover:translate-x-1 disabled:opacity-50 disabled:cursor-wait"
                                                                    >
                                                                        {initializingModule === idx ? (
                                                                            <>
                                                                                SEARCHING_COURSES <Loader2 className="w-4 h-4 animate-spin" />
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                Initialize_Module <ArrowRight className="w-4 h-4 stroke-[3]" />
                                                                            </>
                                                                        )}
                                                                    </button>

                                                                    {moduleRecommendations[idx] && (
                                                                        <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                                                                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                                                                                Recommended_Protocol:
                                                                            </div>
                                                                            {moduleRecommendations[idx].map((course, i) => (
                                                                                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-stone-100 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] gap-3">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">[{course.platform}]</span>
                                                                                        <span className="font-bold text-sm leading-tight text-slate-900">{course.title}</span>
                                                                                    </div>
                                                                                    <a
                                                                                        href={course.url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="shrink-0 flex items-center justify-center bg-white border-2 border-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-slate-900 hover:text-white transition-all hover:translate-x-1 group/btn"
                                                                                    >
                                                                                        Initialize_Link <ArrowRight className="w-3 h-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                                                                    </a>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </BrutalistCard>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
