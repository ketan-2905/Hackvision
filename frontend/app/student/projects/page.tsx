'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/student/TopBar';
import { LayoutDashboard, FileText, FolderGit2, Target, MessageSquare, Github, ExternalLink, Download, Copy } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// --- Types ---

export type RepoInfo = {
    name: string;
    description: string;
    primaryStack: string[];
    updatedAt: string;
};

export type ScoreFactors = {
    codeQuality: number;
    commitDiscipline: number;
    architecture: number;
    projectDepth: number;
    ownershipGrowth: number;
};

export type Language = {
    name: string;
    percent: number;
    color: string;
};

export type Metrics = {
    loc: number;
    files: number;
    languages: Language[];
    testCoverageApprox: number;
    avgComplexity: number;
};

export type Milestone = {
    date: string;
    title: string;
};

export type Timeline = {
    start: string;
    milestones: Milestone[];
};

export type AnalysisData = {
    repo: RepoInfo;
    scores: ScoreFactors;
    metrics: Metrics;
    highlights: string[];
    risks: string[];
    timeline: Timeline;
    deploymentUrl?: string;
};

// --- Mock Data ---

const MOCK_ANALYSES: Record<string, AnalysisData> = {
    "mjdevs/interviewbud": {
        repo: {
            name: "interviewbud",
            description: "AI-powered mock interview platform with real-time feedback and personalized coaching for job seekers.",
            primaryStack: ["Next.js", "TypeScript", "OpenAI", "TailwindCSS"],
            updatedAt: "2025-12-20T14:30:00Z",
        },
        scores: {
            codeQuality: 8.7,
            commitDiscipline: 9.1,
            architecture: 8.5,
            projectDepth: 9.2,
            ownershipGrowth: 8.8,
        },
        metrics: {
            loc: 18200,
            files: 98,
            languages: [
                { name: "TypeScript", percent: 78, color: "#0284c7" },
                { name: "CSS", percent: 15, color: "#7dd3fc" },
                { name: "JavaScript", percent: 7, color: "#0f172a" },
            ],
            testCoverageApprox: 72,
            avgComplexity: 8,
        },
        highlights: [
            "Clean API integration with OpenAI streaming",
            "Real-time WebSocket feedback system",
            "Comprehensive accessibility features",
            "Well-documented component library"
        ],
        risks: [
            "API rate limiting not fully handled",
            "Missing mobile responsive breakpoints",
            "Some hardcoded API keys in config"
        ],
        timeline: {
            start: "2025-06-01",
            milestones: [
                { date: "2025-06-15", title: "Project scaffolding & auth setup" },
                { date: "2025-08-01", title: "AI Interview Engine v1" },
                { date: "2025-10-10", title: "Real-time feedback system" },
                { date: "2025-12-01", title: "Production deployment" },
            ],
        },
    },
    "mjdevs/qrlaugh": {
        repo: {
            name: "qrlaugh",
            description: "Fun QR code generator with meme integration and social sharing capabilities.",
            primaryStack: ["React", "Node.js", "Express", "MongoDB"],
            updatedAt: "2025-11-15T09:00:00Z",
        },
        scores: {
            codeQuality: 7.2,
            commitDiscipline: 6.8,
            architecture: 7.0,
            projectDepth: 6.5,
            ownershipGrowth: 7.5,
        },
        metrics: {
            loc: 8500,
            files: 52,
            languages: [
                { name: "JavaScript", percent: 65, color: "#0f172a" },
                { name: "TypeScript", percent: 25, color: "#0284c7" },
                { name: "CSS", percent: 10, color: "#7dd3fc" },
            ],
            testCoverageApprox: 45,
            avgComplexity: 15,
        },
        highlights: [
            "Creative use of canvas API for QR styling",
            "Social OAuth integration working",
            "Fun and engaging UI design"
        ],
        risks: [
            "Mixed JS/TS codebase needs migration",
            "Test coverage below 50%",
            "Large bundle size due to image assets",
            "No error boundary implementation"
        ],
        timeline: {
            start: "2025-07-20",
            milestones: [
                { date: "2025-07-25", title: "Initial QR generator" },
                { date: "2025-09-05", title: "Meme integration API" },
                { date: "2025-11-01", title: "Social sharing launch" },
            ],
        },
    },
    "mjdevs27/Odoo_hackathon25-26": {
        repo: {
            name: "Odoo_hackathon25-26",
            description: "Hackathon project: Custom Odoo ERP module for inventory management with AI demand forecasting.",
            primaryStack: ["Python", "Odoo", "PostgreSQL", "TensorFlow"],
            updatedAt: "2026-01-18T22:00:00Z",
        },
        scores: {
            codeQuality: 7.8,
            commitDiscipline: 8.5,
            architecture: 8.0,
            projectDepth: 8.8,
            ownershipGrowth: 6.2,
        },
        metrics: {
            loc: 12400,
            files: 67,
            languages: [
                { name: "Python", percent: 72, color: "#0284c7" },
                { name: "XML", percent: 18, color: "#7dd3fc" },
                { name: "JavaScript", percent: 10, color: "#0f172a" },
            ],
            testCoverageApprox: 58,
            avgComplexity: 18,
        },
        highlights: [
            "Novel ML model for demand prediction",
            "Clean Odoo module architecture",
            "Comprehensive data migration scripts",
            "Well-structured hackathon documentation"
        ],
        risks: [
            "Short development timeline visible in commits",
            "Limited error handling in ML pipeline",
            "Needs production hardening",
            "Single contributor pattern"
        ],
        timeline: {
            start: "2026-01-10",
            milestones: [
                { date: "2026-01-11", title: "Hackathon kickoff & planning" },
                { date: "2026-01-14", title: "Core Odoo module structure" },
                { date: "2026-01-16", title: "ML forecasting integration" },
                { date: "2026-01-18", title: "Demo & submission" },
            ],
        },
    },
};

// --- Helpers ---

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

const extractRepoKey = (url: string): string | null => {
    const patterns = [
        /github\.com\/([^\/]+\/[^\/\s]+)/i,
        /^([^\/]+\/[^\/\s]+)$/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1].replace(/\.git$/, '');
        }
    }
    return null;
};

// --- Main Component ---

export default function ProjectsPage() {
    const [githubUrl, setGithubUrl] = useState('');
    const [deployUrl, setDeployUrl] = useState('');
    const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
    const [error, setError] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [realName, setRealName] = useState<string>("Student");
    const [profileProgress, setProfileProgress] = useState(25);

    // Track current user and their data for TopBar/Sidebar consistency
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Track user document for name and progress
                const userDocRef = doc(db, 'users', user.uid);
                const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();

                        // Update Name
                        if (userData.full_name) {
                            setRealName(userData.full_name);
                        }

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
        return () => unsubscribeAuth();
    }, []);

    const handleAnalyze = () => {
        setError('');
        setIsAnalyzing(true);

        setTimeout(() => {
            const repoKey = extractRepoKey(githubUrl);

            if (!repoKey) {
                setError('Invalid GitHub URL format. Try: mjdevs/interviewbud');
                setCurrentAnalysis(null);
                setIsAnalyzing(false);
                return;
            }

            const analysis = MOCK_ANALYSES[repoKey];

            if (!analysis) {
                setError(`No mock data for "${repoKey}". Available: mjdevs/interviewbud, mjdevs/qrlaugh, mjdevs27/Odoo_hackathon25-26`);
                setCurrentAnalysis(null);
                setIsAnalyzing(false);
                return;
            }

            setCurrentAnalysis({
                ...analysis,
                deploymentUrl: deployUrl || undefined,
            });
            setIsAnalyzing(false);
        }, 800);
    };

    const analysis = currentAnalysis;

    const overallScore = useMemo(() => {
        if (!analysis) return '0.0';
        const values = Object.values(analysis.scores);
        return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
    }, [analysis]);

    const handleCopySummary = () => {
        if (!analysis) return;
        const summary = `${analysis.repo.name} | Score: ${overallScore}/10 | ${analysis.metrics.loc.toLocaleString()} LOC | ${analysis.metrics.languages[0].name}`;
        navigator.clipboard.writeText(summary);
    };

    const handleDownloadJSON = () => {
        if (!analysis) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysis, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = `${analysis.repo.name}-analysis.json`;
        a.click();
    };

    const sidebarItems = [
        { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, isActive: false },
        { label: 'Tests', href: '/student/tests', icon: FileText, isActive: false },
        { label: 'Interview', href: '/student/interview', icon: MessageSquare, isActive: false },
        { label: 'Projects', href: '/student/projects', icon: FolderGit2, isActive: true },
        { label: 'IUTS', href: '/student/iuts', icon: Target, isActive: false }
    ];

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'bg-sky-300';
        if (score >= 6) return 'bg-sky-600';
        return 'bg-slate-400';
    };

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

                    {/* PAGE HEADER */}
                    <div className="mb-8">
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                            PROJECT ANALYZER
                        </h1>
                        <p className="text-sm font-medium text-slate-600">
                            Deep-dive analysis of GitHub repositories using commit patterns, code metrics, and architecture evaluation
                        </p>
                    </div>

                    {/* INPUT CARD */}
                    <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                    GitHub Repository URL
                                </label>
                                <input
                                    type="text"
                                    placeholder="mjdevs/interviewbud or https://github.com/..."
                                    value={githubUrl}
                                    onChange={(e) => setGithubUrl(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-slate-900 bg-stone-50 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                    Deployment URL (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="https://myapp.vercel.app"
                                    value={deployUrl}
                                    onChange={(e) => setDeployUrl(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-slate-900 bg-stone-50 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 items-center">
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="bg-slate-900 text-white px-6 py-3 text-sm font-black uppercase tracking-widest border-2 border-slate-900 shadow-[4px_4px_0px_#0ea5e9] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                            >
                                {isAnalyzing ? 'ANALYZING...' : 'RUN ANALYSIS'}
                            </button>
                            <span className="text-[10px] font-medium text-slate-400">
                                Available: mjdevs/interviewbud, mjdevs/qrlaugh, mjdevs27/Odoo_hackathon25-26
                            </span>
                        </div>
                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border-2 border-red-600 text-red-900 text-sm font-medium">
                                ERROR: {error}
                            </div>
                        )}
                    </div>

                    {/* ANALYSIS RESULTS */}
                    {analysis && (
                        <>
                            {/* REPO HEADER */}
                            <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-6 mb-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                                            {analysis.repo.name}
                                        </h2>
                                        <p className="text-sm font-medium text-slate-600 mb-4">
                                            {analysis.repo.description}
                                        </p>
                                        <div className="flex gap-2 flex-wrap">
                                            {analysis.repo.primaryStack.map(tech => (
                                                <span key={tech} className="px-3 py-1 border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-900">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleCopySummary} className="w-10 h-10 border-2 border-slate-900 flex items-center justify-center hover:bg-sky-300 transition-colors">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button onClick={handleDownloadJSON} className="w-10 h-10 border-2 border-slate-900 flex items-center justify-center hover:bg-sky-300 transition-colors">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* METRICS ROW */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-4">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Overall Score</div>
                                    <div className="text-4xl font-black text-slate-900">{overallScore}<span className="text-lg text-slate-400">/10</span></div>
                                </div>
                                <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-4">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Lines of Code</div>
                                    <div className="text-4xl font-black text-slate-900">{analysis.metrics.loc.toLocaleString()}</div>
                                    <div className="text-xs text-slate-500">{analysis.metrics.files} files</div>
                                </div>
                                <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-4">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Test Coverage</div>
                                    <div className="text-4xl font-black text-slate-900">{analysis.metrics.testCoverageApprox}%</div>
                                    <div className="h-2 bg-stone-100 border-2 border-slate-900 mt-2">
                                        <div className="h-full bg-sky-300" style={{ width: `${analysis.metrics.testCoverageApprox}%` }} />
                                    </div>
                                </div>
                                <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-4">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Complexity</div>
                                    <div className="text-4xl font-black text-slate-900">{analysis.metrics.avgComplexity}</div>
                                    <div className="text-xs text-slate-500">cyclomatic avg</div>
                                </div>
                            </div>

                            {/* LANGUAGE BREAKDOWN */}
                            <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-6 mb-6">
                                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-4">Language Distribution</h3>
                                <div className="h-10 border-4 border-slate-900 bg-stone-100 p-1 flex mb-4">
                                    {analysis.metrics.languages.map(lang => (
                                        <div key={lang.name} style={{ width: `${lang.percent}%`, backgroundColor: lang.color }} className="h-full border-r-2 border-slate-900 last:border-r-0" />
                                    ))}
                                </div>
                                <div className="flex gap-6">
                                    {analysis.metrics.languages.map(lang => (
                                        <div key={lang.name} className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-slate-900" style={{ backgroundColor: lang.color }} />
                                            <span className="text-sm font-black uppercase">{lang.name}</span>
                                            <span className="text-sm text-slate-500">{lang.percent}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SCORE FACTORS GRID */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                                {Object.entries(analysis.scores).map(([key, score]) => (
                                    <div key={key} className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">
                                                {key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                                            </h4>
                                            <span className="text-2xl font-black text-slate-900">{score.toFixed(1)}</span>
                                        </div>
                                        <div className="h-8 bg-stone-100 border-2 border-slate-900">
                                            <div className={`h-full ${getScoreColor(score)} transition-all`} style={{ width: `${score * 10}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* INTELLIGENCE LOG */}
                            <div className="bg-slate-900 p-4 font-mono text-[10px] text-sky-400 border-2 border-slate-900 mb-6">
                                <div className="text-white font-black mb-2">&gt;&gt; SYSTEM ANALYSIS LOG</div>
                                {analysis.highlights.map((h, i) => (
                                    <div key={`h-${i}`} className="text-green-400 mb-1">
                                        [OK] {h}
                                    </div>
                                ))}
                                {analysis.risks.map((r, i) => (
                                    <div key={`r-${i}`} className="text-yellow-300 mb-1">
                                        [WARN] {r}
                                    </div>
                                ))}
                                <span className="text-sky-400 animate-pulse">_</span>
                            </div>

                        </>
                    )}

                    {/* EMPTY STATE */}
                    {!analysis && !error && (
                        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-16 text-center">
                            <Github className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="text-sm font-medium text-slate-500">
                                Enter a GitHub repository URL above to begin analysis
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}