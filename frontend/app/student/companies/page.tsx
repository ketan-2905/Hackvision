'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { LayoutDashboard, FileText, FolderGit2, Target, MessageSquare, Building2, TrendingUp, Users, Award } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Company = {
    name: string;
    logo: string;
    minScore: number;
    maxScore: number;
    roles: string[];
    benefits: string[];
    color: string;
};

type Course = {
    title: string;
    provider: string;
    level: string;
    duration: string;
    skills: string[];
    url: string;
    rating: number;
};

const COMPANIES: Company[] = [
    {
        name: "Google",
        logo: "🔷",
        minScore: 85,
        maxScore: 100,
        roles: ["Software Engineer", "Product Manager", "Data Scientist"],
        benefits: ["Competitive Salary", "Stock Options", "Health Insurance", "Learning Budget"],
        color: "bg-blue-500"
    },
    {
        name: "Microsoft",
        logo: "🟦",
        minScore: 80,
        maxScore: 100,
        roles: ["Cloud Engineer", "Full Stack Developer", "AI Researcher"],
        benefits: ["Work-Life Balance", "Remote Options", "Career Growth", "Wellness Programs"],
        color: "bg-sky-600"
    },
    {
        name: "Amazon",
        logo: "🟧",
        minScore: 75,
        maxScore: 100,
        roles: ["SDE", "DevOps Engineer", "ML Engineer"],
        benefits: ["Fast-Paced Environment", "Innovation Culture", "Global Opportunities"],
        color: "bg-orange-500"
    },
    {
        name: "Meta",
        logo: "🔵",
        minScore: 82,
        maxScore: 100,
        roles: ["Frontend Engineer", "Backend Engineer", "Security Engineer"],
        benefits: ["Cutting-Edge Tech", "Impactful Work", "Top Compensation"],
        color: "bg-indigo-500"
    },
    {
        name: "Apple",
        logo: "🍎",
        minScore: 88,
        maxScore: 100,
        roles: ["iOS Developer", "Hardware Engineer", "Design Engineer"],
        benefits: ["Premium Products", "Innovation Leader", "Employee Discounts"],
        color: "bg-slate-700"
    },
    {
        name: "Netflix",
        logo: "🔴",
        minScore: 78,
        maxScore: 100,
        roles: ["Streaming Engineer", "Content Platform Developer"],
        benefits: ["Unlimited PTO", "Freedom & Responsibility", "Top Market Salaries"],
        color: "bg-red-600"
    },
    {
        name: "Salesforce",
        logo: "☁️",
        minScore: 70,
        maxScore: 95,
        roles: ["Cloud Developer", "CRM Specialist", "Platform Engineer"],
        benefits: ["Volunteer Time Off", "Equality Programs", "Career Development"],
        color: "bg-cyan-500"
    },
    {
        name: "Adobe",
        logo: "🔶",
        minScore: 72,
        maxScore: 95,
        roles: ["Creative Cloud Engineer", "UX Engineer", "Graphics Developer"],
        benefits: ["Creative Environment", "Product Discounts", "Flex Hours"],
        color: "bg-red-500"
    },
    {
        name: "Intel",
        logo: "💎",
        minScore: 68,
        maxScore: 90,
        roles: ["Chip Designer", "Systems Engineer", "Hardware Validation"],
        benefits: ["Research Opportunities", "Patent Incentives", "Tech Leadership"],
        color: "bg-blue-700"
    },
    {
        name: "IBM",
        logo: "🟦",
        minScore: 65,
        maxScore: 90,
        roles: ["AI Consultant", "Quantum Computing Researcher", "Enterprise Developer"],
        benefits: ["Legacy & Innovation", "Global Presence", "Diverse Projects"],
        color: "bg-blue-800"
    }
];

const RECOMMENDED_COURSES: Course[] = [
    {
        title: "Google IT Automation with Python Professional Certificate",
        provider: "Coursera - Google",
        level: "Beginner",
        duration: "6 months",
        skills: ["Python", "Git", "Automation", "Troubleshooting"],
        url: "https://www.coursera.org/professional-certificates/google-it-automation",
        rating: 4.8
    },
    {
        title: "Meta Front-End Developer Professional Certificate",
        provider: "Coursera - Meta",
        level: "Beginner",
        duration: "7 months",
        skills: ["React", "JavaScript", "HTML/CSS", "Version Control"],
        url: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
        rating: 4.7
    },
    {
        title: "IBM Data Science Professional Certificate",
        provider: "Coursera - IBM",
        level: "Beginner",
        duration: "10 months",
        skills: ["Python", "SQL", "Data Analysis", "Machine Learning"],
        url: "https://www.coursera.org/professional-certificates/ibm-data-science",
        rating: 4.6
    },
    {
        title: "AWS Cloud Solutions Architect Professional Certificate",
        provider: "Coursera - AWS",
        level: "Intermediate",
        duration: "5 months",
        skills: ["Cloud Computing", "AWS", "Architecture", "DevOps"],
        url: "https://www.coursera.org/professional-certificates/aws-cloud-solutions-architect",
        rating: 4.7
    },
    {
        title: "Machine Learning Specialization",
        provider: "Coursera - Stanford & DeepLearning.AI",
        level: "Intermediate",
        duration: "3 months",
        skills: ["Machine Learning", "Neural Networks", "TensorFlow", "AI"],
        url: "https://www.coursera.org/specializations/machine-learning-introduction",
        rating: 4.9
    },
    {
        title: "Full Stack Web Development Specialization",
        provider: "Coursera - HKUST",
        level: "Intermediate",
        duration: "4 months",
        skills: ["React", "Node.js", "MongoDB", "Bootstrap"],
        url: "https://www.coursera.org/specializations/full-stack-react",
        rating: 4.8
    }
];

export default function CompaniesPage() {
    const router = useRouter();
    const [competencyScore, setCompetencyScore] = useState<number | null>(null);
    const [matchedCompanies, setMatchedCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const sidebarItems = [
        { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, isActive: false },
        { label: 'Tests', href: '/student/tests', icon: FileText, isActive: false },
        { label: 'Interview', href: '/student/interview', icon: MessageSquare, isActive: false },
        { label: 'Projects', href: '/student/projects', icon: FolderGit2, isActive: false },
        { label: 'IUTS', href: '/student/iuts', icon: Target, isActive: false }
    ];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch competency score from Firestore
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const score = userDoc.data().competency_score || 0;
                    setCompetencyScore(score);

                    // Filter and sort companies based on score
                    const eligible = COMPANIES
                        .filter(company => score >= company.minScore && score <= company.maxScore)
                        .sort((a, b) => b.minScore - a.minScore)
                        .slice(0, 3);

                    setMatchedCompanies(eligible);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50">
                <Sidebar items={sidebarItems} />
                <div className="pl-64 p-12">
                    <p className="text-lg font-black uppercase text-slate-900">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50">
            <Sidebar items={sidebarItems} />

            <div className="pl-64 p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                            Company
                            <br />
                            <span className="text-sky-500">Matches.</span>
                        </h1>
                        <p className="text-sm font-medium text-slate-600 mt-4">
                            Top companies matched to your competency score of <span className="font-black text-slate-900">{competencyScore}</span>
                        </p>
                    </div>

                    {matchedCompanies.length === 0 ? (
                        <div className="border-2 border-slate-900 bg-white p-12 text-center">
                            <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                            <p className="text-lg font-black uppercase text-slate-900 mb-2">No Matches Yet</p>
                            <p className="text-sm text-slate-600 mb-6">
                                Complete more activities to increase your competency score and unlock company matches!
                            </p>
                            <button
                                onClick={() => router.push('/student/dashboard')}
                                className="bg-slate-900 text-white px-6 py-3 text-sm font-black uppercase border-2 border-slate-900 shadow-[4px_4px_0px_#0ea5e9] hover:translate-y-1 hover:shadow-none transition-all"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-6 mb-6">
                                {matchedCompanies.map((company, index) => (
                                    <div
                                        key={company.name}
                                        className="border-2 border-slate-900 bg-white shadow-[8px_8px_0px_#0f172a] p-8"
                                    >
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-16 h-16 border-2 border-slate-900 ${company.color} flex items-center justify-center text-3xl`}>
                                                    {company.logo}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
                                                            {company.name}
                                                        </h2>
                                                        {index === 0 && (
                                                            <span className="bg-yellow-400 border-2 border-slate-900 px-3 py-1 text-xs font-black uppercase">
                                                                Best Match
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-500">
                                                        Score Range: {company.minScore}-{company.maxScore}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-2 border-2 border-slate-900 ${company.color} text-white font-black text-sm`}>
                                                {Math.round(((competencyScore || 0) / company.maxScore) * 100)}% MATCH
                                            </div>
                                        </div>

                                        {/* Roles */}
                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Users className="w-4 h-4 text-slate-900" />
                                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                                                    Open Roles
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {company.roles.map(role => (
                                                    <span
                                                        key={role}
                                                        className="bg-stone-100 border-2 border-slate-900 px-3 py-1 text-xs font-bold text-slate-700"
                                                    >
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Benefits */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Award className="w-4 h-4 text-slate-900" />
                                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                                                    Benefits
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {company.benefits.map(benefit => (
                                                    <div
                                                        key={benefit}
                                                        className="flex items-center gap-2 text-xs font-medium text-slate-600"
                                                    >
                                                        <div className="w-2 h-2 bg-sky-500 border border-slate-900" />
                                                        {benefit}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Suggested Courses Section */}
                            <div className="mb-6">
                                <div className="mb-6">
                                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                                        Suggested
                                        <span className="text-purple-500"> Courses.</span>
                                    </h2>
                                    <p className="text-sm font-medium text-slate-600">
                                        Upskill with top-rated Coursera courses to improve your competency and unlock more companies
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-6">
                                    {RECOMMENDED_COURSES.map((course) => (
                                        <a
                                            key={course.title}
                                            href={course.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="border-2 border-slate-900 bg-white p-6 hover:shadow-[8px_8px_0px_#8b5cf6] hover:translate-y-[-2px] transition-all group"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-black uppercase text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-xs font-medium text-slate-500 mb-1">
                                                        {course.provider}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 mb-3 text-xs font-bold text-slate-600">
                                                <span className="bg-stone-100 border border-slate-900 px-2 py-1">
                                                    {course.level}
                                                </span>
                                                <span>⏱️ {course.duration}</span>
                                                <span>⭐ {course.rating}</span>
                                            </div>

                                            <div className="flex flex-wrap gap-1">
                                                {course.skills.map(skill => (
                                                    <span
                                                        key={skill}
                                                        className="bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5 text-[10px] font-bold uppercase"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="mt-4 text-xs font-black uppercase text-purple-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                                                Enroll Now →
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/student/dashboard')}
                                className="w-full bg-white text-slate-900 px-6 py-4 text-sm font-black uppercase border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-none transition-all"
                            >
                                ← Back to Dashboard
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
