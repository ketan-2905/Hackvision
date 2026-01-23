"use client";

import { useState } from "react";
import {
    Briefcase,
    Users,
    Search,
    TrendingUp,
    Award,
    Brain,
    AlertCircle,
    Target,
    CheckCircle,
} from "lucide-react";

// Mock Data - Indian Localized
const MOCK_JOBS = [
    {
        id: 1,
        title: "SENIOR FRONTEND ENGINEER",
        department: "ENGINEERING",
        location: "MUMBAI, MAHARASHTRA",
        openings: 3,
        applicants: 47,
        fulfillmentRate: 68,
        postedDays: 12,
    },
    {
        id: 2,
        title: "PRODUCT DESIGNER",
        department: "DESIGN",
        location: "BANGALORE, KARNATAKA",
        openings: 2,
        applicants: 89,
        fulfillmentRate: 85,
        postedDays: 8,
    },
    {
        id: 3,
        title: "DATA SCIENTIST",
        department: "AI/ML",
        location: "PUNE, MAHARASHTRA",
        openings: 1,
        applicants: 34,
        fulfillmentRate: 42,
        postedDays: 5,
    },
    {
        id: 4,
        title: "BACKEND ENGINEER",
        department: "ENGINEERING",
        location: "HYDERABAD, TELANGANA",
        openings: 4,
        applicants: 62,
        fulfillmentRate: 73,
        postedDays: 15,
    },
    {
        id: 5,
        title: "DEVOPS ENGINEER",
        department: "INFRASTRUCTURE",
        location: "MUMBAI, MAHARASHTRA",
        openings: 2,
        applicants: 28,
        fulfillmentRate: 55,
        postedDays: 6,
    },
    {
        id: 6,
        title: "MOBILE DEVELOPER",
        department: "ENGINEERING",
        location: "BANGALORE, KARNATAKA",
        openings: 2,
        applicants: 41,
        fulfillmentRate: 61,
        postedDays: 10,
    },
];

const MOCK_CANDIDATES = [
    {
        id: 1,
        name: "ARYAN KULKARNI",
        college: "IIT BOMBAY",
        degree: "B.TECH COMPUTER SCIENCE",
        competencyScore: 92,
        anxietyScore: 23,
        skills: ["REACT", "TYPESCRIPT", "NODE.JS", "SYSTEM DESIGN", "AWS"],
        experience: "3 YEARS",
        appliedFor: "SENIOR FRONTEND ENGINEER",
    },
    {
        id: 2,
        name: "ISHITA SHARMA",
        college: "VJTI",
        degree: "B.E. INFORMATION TECHNOLOGY",
        competencyScore: 88,
        anxietyScore: 31,
        skills: ["PYTHON", "TENSORFLOW", "SQL", "STATISTICS", "SPARK"],
        experience: "4 YEARS",
        appliedFor: "DATA SCIENTIST",
    },
    {
        id: 3,
        name: "ROHAN DESHMUKH",
        college: "SPIT",
        degree: "B.E. ELECTRONICS ENGINEERING",
        competencyScore: 85,
        anxietyScore: 28,
        skills: ["KUBERNETES", "DOCKER", "TERRAFORM", "CI/CD", "LINUX"],
        experience: "5 YEARS",
        appliedFor: "DEVOPS ENGINEER",
    },
    {
        id: 4,
        name: "ANANYA IYER",
        college: "KJSCE",
        degree: "B.TECH COMPUTER SCIENCE",
        competencyScore: 90,
        anxietyScore: 19,
        skills: ["FIGMA", "UI/UX", "PROTOTYPING", "DESIGN SYSTEMS", "RESEARCH"],
        experience: "2 YEARS",
        appliedFor: "PRODUCT DESIGNER",
    },
    {
        id: 5,
        name: "SAMEER KHAN",
        college: "DJSCE",
        degree: "B.E. COMPUTER ENGINEERING",
        competencyScore: 87,
        anxietyScore: 25,
        skills: ["JAVA", "SPRING BOOT", "MICROSERVICES", "POSTGRESQL", "REDIS"],
        experience: "6 YEARS",
        appliedFor: "BACKEND ENGINEER",
    },
    {
        id: 9,
        name: "MOKSH JHAVERI",
        college: "DJSCE",
        degree: "EXTC ENGINEERING",
        competencyScore: 80,
        anxietyScore: 25,
        skills: ["JAVA", "SPRING BOOT", "MICROSERVICES", "POSTGRESQL", "REDIS"],
        experience: "1 YEARS",
        appliedFor: "BACKEND ENGINEER",
    },
    {
        id: 10,
        name: "HITANSH DHOLAKIA",
        college: "DJSCE",
        degree: "B.E. COMPUTER SCIENCE AND ENGINEERING(DATA SCIENCE)",
        competencyScore: 75,
        anxietyScore: 14,
        skills: ["PYTHON", "DATA SCIENCE", "MACHINE LEARNING", "DEEP LEARNING", "AI"],
        experience: "1 YEARS",
        appliedFor: "DATA SCIENTIST",
    },
    {
        id: 12,
        name: "KETAN GAIKWAD",
        college: "DJSCE",
        degree: "B.E. COMPUTER SCIENCE AND ENGINEERING(DATA SCIENCE)",
        competencyScore: 80,
        anxietyScore: 12,
        skills: ["JAVA", "SPRING BOOT", "MICROSERVICES", "POSTGRESQL", "REDIS"],
        experience: "1 YEARS",
        appliedFor: "BACKEND ENGINEER",
    },
    {
        id: 11,
        name: "MEGH DAVE",
        college: "DJSCE",
        degree: "B.E. COMPUTER SCIENCE AND ENGINEERING(DATA SCIENCE)",
        competencyScore: 78,
        anxietyScore: 24,
        skills: ["PYTHON", "DATA SCIENCE", "MACHINE LEARNING", "DEEP LEARNING", "AI"],
        experience: "1 YEARS",
        appliedFor: "DATA SCIENTIST",
    },
    {
        id: 6,
        name: "PRIYANKA JOSHI",
        college: "TSEC",
        degree: "B.E. INFORMATION TECHNOLOGY",
        competencyScore: 91,
        anxietyScore: 22,
        skills: ["FLUTTER", "REACT NATIVE", "FIREBASE", "REST API", "KOTLIN"],
        experience: "3 YEARS",
        appliedFor: "MOBILE DEVELOPER",
    },
    {
        id: 7,
        name: "RAHUL GUPTA",
        college: "VESIT",
        degree: "B.E. COMPUTER ENGINEERING",
        competencyScore: 86,
        anxietyScore: 27,
        skills: ["JAVASCRIPT", "VUE.JS", "TAILWIND", "GRAPHQL", "MONGODB"],
        experience: "4 YEARS",
        appliedFor: "SENIOR FRONTEND ENGINEER",
    },
    {
        id: 8,
        name: "SNEHA PATIL",
        college: "IIT BOMBAY",
        degree: "M.TECH DATA SCIENCE",
        competencyScore: 94,
        anxietyScore: 18,
        skills: ["MACHINE LEARNING", "DEEP LEARNING", "PYTORCH", "NLP", "AZURE"],
        experience: "2 YEARS",
        appliedFor: "DATA SCIENTIST",
    },
];

const COLLEGES = [
    "IIT BOMBAY",
    "VJTI",
    "SPIT",
    "KJSCE",
    "DJSCE",
    "TSEC",
    "VESIT",
];

export default function RecruiterDashboard() {
    const [activeTab, setActiveTab] = useState<"recruitments" | "candidates">(
        "recruitments"
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredCandidates, setFilteredCandidates] = useState(MOCK_CANDIDATES);

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setFilteredCandidates(MOCK_CANDIDATES);
            return;
        }
        const filtered = MOCK_CANDIDATES.filter((candidate) =>
            candidate.college.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredCandidates(filtered);
    };

    return (
        <div className="min-h-screen bg-stone-50 flex">
            {/* SIDEBAR */}
            <aside className="w-80 bg-stone-50 border-r-2 border-slate-900 flex flex-col">
                {/* HEADER */}
                <div className="p-6 border-b-2 border-slate-900 bg-sky-300">
                    <h1 className="font-black text-2xl uppercase tracking-tighter text-slate-900">
                        RECRUITER HQ
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-tight text-slate-900 mt-1">
                        ASCENDRA INTELLIGENCE
                    </p>
                </div>

                {/* NAVIGATION TABS */}
                <nav className="flex flex-col gap-0">
                    <button
                        onClick={() => setActiveTab("recruitments")}
                        className={`p-4 border-b-2 border-slate-900 font-black uppercase tracking-tighter text-left transition-all ${activeTab === "recruitments"
                            ? "bg-sky-300 text-slate-900"
                            : "bg-stone-50 text-slate-900 hover:bg-stone-100"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 border-2 border-slate-900 bg-stone-50 flex items-center justify-center">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <span>TOP RECRUITMENTS</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab("candidates")}
                        className={`p-4 border-b-2 border-slate-900 font-black uppercase tracking-tighter text-left transition-all ${activeTab === "candidates"
                            ? "bg-sky-300 text-slate-900"
                            : "bg-stone-50 text-slate-900 hover:bg-stone-100"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 border-2 border-slate-900 bg-stone-50 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                            <span>TOP CANDIDATES</span>
                        </div>
                    </button>
                </nav>

                {/* SPACER */}
                <div className="flex-1"></div>

                {/* INTELLIGENCE LOG FOOTER */}
                <div className="p-4 border-t-2 border-slate-900 bg-slate-900 text-stone-50">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 border-2 border-stone-50 bg-sky-300 flex items-center justify-center">
                            <Target className="w-3 h-3 text-slate-900" />
                        </div>
                        <span className="font-black text-xs uppercase tracking-tighter">
                            INTELLIGENCE LOG
                        </span>
                    </div>
                    <div className="space-y-1 text-xs font-mono">
                        <div className="flex justify-between">
                            <span className="text-stone-400">ACTIVE ROLES:</span>
                            <span className="font-bold text-sky-300">{MOCK_JOBS.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-400">TOTAL APPLICANTS:</span>
                            <span className="font-bold text-sky-300">
                                {MOCK_JOBS.reduce((sum, job) => sum + job.applicants, 0)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-400">AVG FULFILLMENT:</span>
                            <span className="font-bold text-sky-300">
                                {Math.round(
                                    MOCK_JOBS.reduce((sum, job) => sum + job.fulfillmentRate, 0) /
                                    MOCK_JOBS.length
                                )}
                                %
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 p-8">
                {activeTab === "recruitments" && (
                    <div>
                        {/* HEADER */}
                        <div className="mb-8">
                            <h2 className="font-black text-4xl uppercase tracking-tighter text-slate-900 mb-2">
                                ACTIVE RECRUITMENTS
                            </h2>
                            <p className="text-sm font-bold uppercase tracking-tight text-slate-700">
                                MONITORING {MOCK_JOBS.length} OPEN POSITIONS
                            </p>
                        </div>

                        {/* JOB CARDS GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {MOCK_JOBS.map((job) => (
                                <div
                                    key={job.id}
                                    className="bg-stone-50 border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_#0f172a] p-6 hover:shadow-[6px_6px_0px_#0f172a] transition-all"
                                >
                                    {/* JOB HEADER */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-black text-xl uppercase tracking-tighter text-slate-900 mb-1">
                                                {job.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight text-slate-700">
                                                <span>{job.department}</span>
                                                <span>•</span>
                                                <span>{job.location}</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 border-2 border-slate-900 bg-sky-300 flex items-center justify-center">
                                            <Briefcase className="w-6 h-6 text-slate-900" />
                                        </div>
                                    </div>

                                    {/* STATS */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="border-2 border-slate-900 p-2 bg-stone-100">
                                            <div className="text-xs font-bold uppercase tracking-tight text-slate-700">
                                                OPENINGS
                                            </div>
                                            <div className="font-black text-2xl text-slate-900">
                                                {job.openings}
                                            </div>
                                        </div>
                                        <div className="border-2 border-slate-900 p-2 bg-stone-100">
                                            <div className="text-xs font-bold uppercase tracking-tight text-slate-700">
                                                APPLICANTS
                                            </div>
                                            <div className="font-black text-2xl text-slate-900">
                                                {job.applicants}
                                            </div>
                                        </div>
                                        <div className="border-2 border-slate-900 p-2 bg-stone-100">
                                            <div className="text-xs font-bold uppercase tracking-tight text-slate-700">
                                                POSTED
                                            </div>
                                            <div className="font-black text-2xl text-slate-900">
                                                {job.postedDays}D
                                            </div>
                                        </div>
                                    </div>

                                    {/* FULFILLMENT RATE */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold uppercase tracking-tight text-slate-700">
                                                FULFILLMENT RATE
                                            </span>
                                            <span className="font-black text-sm text-slate-900">
                                                {job.fulfillmentRate}%
                                            </span>
                                        </div>
                                        {/* STRUCTURAL PROGRESS BAR */}
                                        <div className="h-6 border-2 border-slate-900 bg-stone-100 relative overflow-hidden">
                                            <div
                                                className="h-full bg-sky-300 border-r-2 border-slate-900 transition-all"
                                                style={{ width: `${job.fulfillmentRate}%` }}
                                            ></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="font-black text-xs uppercase tracking-tighter text-slate-900 mix-blend-difference">
                                                    PROGRESS
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "candidates" && (
                    <div>
                        {/* HEADER */}
                        <div className="mb-8">
                            <h2 className="font-black text-4xl uppercase tracking-tighter text-slate-900 mb-2">
                                CANDIDATE SEARCH
                            </h2>
                            <p className="text-sm font-bold uppercase tracking-tight text-slate-700">
                                FILTER BY COLLEGE NAME
                            </p>
                        </div>

                        {/* SEARCH BAR */}
                        <div className="mb-8">
                            <div className="flex gap-0 max-w-2xl">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        placeholder="ENTER COLLEGE NAME..."
                                        className="w-full px-4 py-4 border-2 border-slate-900 rounded-none font-bold uppercase tracking-tight text-slate-900 placeholder:text-slate-400 bg-stone-50 focus:outline-none focus:bg-white"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 border-2 border-slate-900 bg-sky-300 flex items-center justify-center pointer-events-none">
                                        <Search className="w-4 h-4 text-slate-900" />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSearch}
                                    className="px-6 border-2 border-l-0 border-slate-900 bg-sky-300 font-black uppercase tracking-tighter text-slate-900 hover:bg-sky-400 transition-all shadow-[4px_4px_0px_#0f172a] hover:shadow-[6px_6px_0px_#0f172a]"
                                >
                                    SEARCH
                                </button>
                            </div>

                            {/* QUICK FILTERS */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="text-xs font-bold uppercase tracking-tight text-slate-700">
                                    QUICK FILTERS:
                                </span>
                                {COLLEGES.map((college) => (
                                    <button
                                        key={college}
                                        onClick={() => {
                                            setSearchQuery(college);
                                            const filtered = MOCK_CANDIDATES.filter((candidate) =>
                                                candidate.college
                                                    .toLowerCase()
                                                    .includes(college.toLowerCase())
                                            );
                                            setFilteredCandidates(filtered);
                                        }}
                                        className="px-3 py-1 border-2 border-slate-900 bg-stone-50 font-bold text-xs uppercase tracking-tight text-slate-900 hover:bg-sky-300 transition-all"
                                    >
                                        {college}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CANDIDATE CARDS */}
                        <div className="grid grid-cols-1 gap-6">
                            {filteredCandidates.length > 0 ? (
                                filteredCandidates.map((candidate) => (
                                    <div
                                        key={candidate.id}
                                        className="bg-stone-50 border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_#0f172a] p-6 hover:shadow-[6px_6px_0px_#0f172a] transition-all"
                                    >
                                        <div className="flex items-start gap-6">
                                            {/* AVATAR */}
                                            <div className="w-20 h-20 border-2 border-slate-900 bg-sky-300 flex items-center justify-center flex-shrink-0">
                                                <Users className="w-10 h-10 text-slate-900" />
                                            </div>

                                            {/* CANDIDATE INFO */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="font-black text-2xl uppercase tracking-tighter text-slate-900 mb-1">
                                                            {candidate.name}
                                                        </h3>
                                                        <div className="text-xs font-bold uppercase tracking-tight text-slate-700">
                                                            {candidate.college} • {candidate.degree}
                                                        </div>
                                                        <div className="text-xs font-bold uppercase tracking-tight text-slate-700 mt-1">
                                                            APPLIED FOR: {candidate.appliedFor}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-10 h-10 border-2 border-slate-900 bg-stone-100 flex items-center justify-center">
                                                            <Award className="w-5 h-5 text-slate-900" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* COMPETENCY SCORE */}
                                                <div className="mb-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 border-2 border-slate-900 bg-sky-300 flex items-center justify-center">
                                                                <Brain className="w-3 h-3 text-slate-900" />
                                                            </div>
                                                            <span className="text-xs font-bold uppercase tracking-tight text-slate-700">
                                                                COMPETENCY SCORE
                                                            </span>
                                                        </div>
                                                        <span className="font-black text-sm text-slate-900">
                                                            {candidate.competencyScore}/100
                                                        </span>
                                                    </div>
                                                    {/* STRUCTURAL PROGRESS BAR */}
                                                    <div className="h-6 border-2 border-slate-900 bg-stone-100 relative overflow-hidden">
                                                        <div
                                                            className="h-full bg-sky-300 border-r-2 border-slate-900 transition-all"
                                                            style={{
                                                                width: `${candidate.competencyScore}%`,
                                                            }}
                                                        ></div>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="font-black text-xs uppercase tracking-tighter text-slate-900 mix-blend-difference">
                                                                COMPETENCY
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* METADATA ROW */}
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="flex items-center gap-2 px-3 py-1 border-2 border-slate-900 bg-stone-100">
                                                        <AlertCircle className="w-4 h-4 text-slate-900" />
                                                        <span className="text-xs font-bold uppercase tracking-tight text-slate-700">
                                                            ANXIETY:
                                                        </span>
                                                        <span className="font-black text-xs text-slate-900">
                                                            {candidate.anxietyScore}%
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1 border-2 border-slate-900 bg-stone-100">
                                                        <TrendingUp className="w-4 h-4 text-slate-900" />
                                                        <span className="text-xs font-bold uppercase tracking-tight text-slate-700">
                                                            EXP:
                                                        </span>
                                                        <span className="font-black text-xs text-slate-900">
                                                            {candidate.experience}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* TOP 3 SKILLS */}
                                                <div>
                                                    <div className="text-xs font-bold uppercase tracking-tight text-slate-700 mb-2">
                                                        TOP SKILLS:
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {candidate.skills.slice(0, 3).map((skill, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="px-3 py-2 border-2 border-slate-900 bg-sky-300 font-black text-xs uppercase tracking-tighter text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                                                            >
                                                                {skill}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="border-2 border-slate-900 bg-stone-100 p-12 text-center">
                                    <div className="w-16 h-16 border-2 border-slate-900 bg-stone-50 flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-slate-900" />
                                    </div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter text-slate-900 mb-2">
                                        NO CANDIDATES FOUND
                                    </h3>
                                    <p className="text-sm font-bold uppercase tracking-tight text-slate-700">
                                        TRY A DIFFERENT COLLEGE NAME
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
