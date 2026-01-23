'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/student/TopBar';
import { LayoutDashboard, FileText, FolderGit2, Target, MessageSquare } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

type StartupStage = 'Seed' | 'Series A' | 'Growth';
type Domain = 'Fintech' | 'Edtech' | 'SaaS' | 'Other';
type Mode = 'Framing Gym' | 'Constraint Injection' | 'Startup Simulation';
type TurnRole = 'interviewer' | 'student' | 'system';

interface Profile {
    role: string;
    stage: StartupStage;
    domain: Domain;
    stack: string[];
    mode: Mode;
}

interface Turn {
    role: TurnRole;
    content: string;
    timestamp: string;
}

interface EvaluationReport {
    scores: {
        framing: number;
        clarifying: number;
        structure: number;
        tradeoffs: number;
        recovery: number;
        communication: number;
    };
    strengths: string[];
    improvements: string[];
    nextDrills: string[];
    thinkingProfile: string;
    recruiterSummary: string;
}

type ViewState = 'setup' | 'live' | 'results';

// ============================================================================
// CONSTANTS
// ============================================================================

const STACK_OPTIONS = ['Next.js', 'React', 'Node', 'Python', 'FastAPI', 'Firebase', 'PostgreSQL', 'Docker'];

const CONSTRAINTS = [
    'You have 25 minutes total',
    'No external libraries allowed',
    'Must support 100k concurrent users',
    'Strict privacy constraints (no PII in logs)',
    'Budget limited to $500/month infrastructure',
    'Must work offline-first',
    'Zero downtime deployment required',
    'GDPR compliance mandatory',
];

const ARCHETYPES = ['Ambiguous Task', 'Over-scoped Task', 'Debug Under Pressure', 'Tradeoff Design'];

const INTERVIEWER_OPENERS: Record<string, Record<string, string[]>> = {
    'Framing Gym': {
        'Fintech': [
            "A user reports their payment failed but they were still charged. Walk me through how you'd debug this.",
            "We need to build a real-time fraud detection system. What's your approach?",
            "Design a system to handle international money transfers with currency conversion. Where do you start?",
        ],
        'Edtech': [
            "Students are complaining about video buffering during live classes. How would you investigate?",
            "We want to add an AI tutor that adapts to each student's learning pace. What's your architecture?",
            "Design a plagiarism detection system for student submissions. What are your considerations?",
        ],
        'SaaS': [
            "Our largest enterprise client needs custom SSO integration by next week. Walk me through your approach.",
            "Design a multi-tenant architecture where each client's data is completely isolated. How do you structure this?",
            "We're seeing 5-second API latencies during peak hours. How would you diagnose and fix this?",
        ],
        'Other': [
            "You have a database query that's taking 30 seconds. Walk me through your optimization strategy.",
            "Design a system to handle 10,000 concurrent WebSocket connections. What's your approach?",
            "We need to migrate from a monolith to microservices without downtime. How do you plan this?",
        ],
    },
    'Constraint Injection': {
        'Fintech': [
            "Design a payment processing pipeline. I'll add compliance requirements as we go.",
            "Build a transaction ledger system. Expect regulatory curveballs.",
            "Create a KYC verification flow. Requirements will change mid-design.",
        ],
        'Edtech': [
            "Design a live quiz system with real-time leaderboards. I'll add constraints as you go.",
            "Build a video streaming platform for lectures. Expect bandwidth limitations.",
            "Create a collaborative whiteboard feature. Requirements will evolve.",
        ],
        'SaaS': [
            "Design a webhook delivery system with guaranteed delivery. I'll inject failure scenarios.",
            "Build a usage-based billing system. Expect edge cases.",
            "Create an audit logging system. Compliance requirements incoming.",
        ],
        'Other': [
            "Design a distributed task queue. I'll add failure modes as we go.",
            "Build a caching layer with invalidation. Expect consistency requirements.",
            "Create a rate limiting solution. Constraints will be added mid-design.",
        ],
    },
    'Startup Simulation': {
        'Fintech': [
            "We just got a partnership with a major bank but they need PCI compliance in 3 weeks. What's the plan?",
            "A competitor just announced instant transfers. We have 2 weeks to match. How do we prioritize?",
            "Our fraud rate spiked 400% last night. The CEO is in a board meeting in 2 hours. What do you do?",
        ],
        'Edtech': [
            "Schools are back in session and our servers crashed from traffic. 50,000 students can't access lessons. Go.",
            "A viral TikTok is driving 100x our normal signups. Our infra wasn't designed for this. What now?",
            "Parents are complaining about data privacy. A news article drops tomorrow. How do we respond?",
        ],
        'SaaS': [
            "Our biggest client is threatening to churn unless we ship feature X in 10 days. It's not on the roadmap. What's your move?",
            "We discovered a security vulnerability. Do we patch silently or disclose? There are tradeoffs.",
            "AWS bill doubled last month. CFO wants answers and a plan by EOD. Walk me through it.",
        ],
        'Other': [
            "Production is down. 5,000 users affected. No one knows why. You're the incident commander. Go.",
            "Engineering just quit and took the documentation with them. You have the codebase. Prioritize.",
            "Investors want a demo in 48 hours but the core feature isn't working. What's your strategy?",
        ],
    },
};

const FOLLOW_UPS = [
    "Interesting. What assumptions are you making there?",
    "How would that scale if we 10x the load?",
    "What's the tradeoff you're accepting with that approach?",
    "Can you walk me through the edge cases?",
    "How would you test that?",
    "What happens if that service goes down?",
    "How does this impact our existing architecture?",
    "What's the complexity of that solution?",
    "How would you communicate this to non-technical stakeholders?",
];

// ============================================================================
// HELPERS
// ============================================================================

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const seededRandom = (seed: string): (() => number) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash = hash & hash;
    }
    return () => {
        hash = (hash * 1103515245 + 12345) & 0x7fffffff;
        return hash / 0x7fffffff;
    };
};

const pickFrom = <T,>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)];

const downloadJson = (data: object, filename: string) => {
    const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.href = str;
    a.download = filename;
    a.click();
};

const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
};

// ============================================================================
// MOCK ENGINE
// ============================================================================

const generateMockInterviewerResponse = (
    transcript: Turn[],
    profile: Profile,
    rng: () => number
): { message: string; constraint?: string } => {
    const lastStudentMsg = transcript.filter(t => t.role === 'student').pop()?.content.toLowerCase() || '';

    // Determine if we should inject a constraint
    const shouldInjectConstraint = profile.mode === 'Constraint Injection' && rng() > 0.6;
    const constraint = shouldInjectConstraint ? pickFrom(CONSTRAINTS, rng) : undefined;

    // Generate response based on student input
    let message: string;

    if (lastStudentMsg.includes('?')) {
        message = "Good question! " + pickFrom([
            "Let me clarify—assume we have full control over the tech stack.",
            "That's actually up to you to decide. What would you recommend?",
            "Great instinct to ask. Here's the context: " + pickFrom(ARCHETYPES, rng),
        ], rng);
    } else if (lastStudentMsg.includes('assume') || lastStudentMsg.includes('assuming')) {
        message = pickFrom([
            "That's a reasonable assumption. What if it doesn't hold?",
            "I like that you're stating assumptions explicitly. Continue.",
            "Let's challenge that assumption—what's your plan B?",
        ], rng);
    } else if (lastStudentMsg.includes('tradeoff') || lastStudentMsg.includes('trade-off')) {
        message = pickFrom([
            "Good tradeoff analysis. How do you decide which path to take?",
            "You're thinking about tradeoffs—that's exactly what I want to see.",
            "What metrics would you use to evaluate that tradeoff?",
        ], rng);
    } else {
        message = pickFrom(FOLLOW_UPS, rng);
    }

    if (constraint) {
        message += ` Also, new constraint: ${constraint}`;
    }

    return { message, constraint };
};

const generateMockEvaluation = (transcript: Turn[], profile: Profile): EvaluationReport => {
    const seed = profile.role + profile.stage + profile.domain + profile.mode;
    const rng = seededRandom(seed);
    const content = transcript.map(t => t.content.toLowerCase()).join(' ');

    // Score based on cues in transcript
    const hasQuestions = (content.match(/\?/g) || []).length;
    const hasAssumptions = content.includes('assume') || content.includes('assuming');
    const hasTradeoffs = content.includes('tradeoff') || content.includes('trade-off');
    const hasEdgeCases = content.includes('edge case') || content.includes('edge cases');
    const hasTests = content.includes('test') || content.includes('testing');
    const hasComplexity = content.includes('complexity') || content.includes('o(');
    const hasPrivacy = content.includes('privacy') || content.includes('security');

    const scores = {
        framing: clamp(5 + (hasAssumptions ? 2 : 0) + rng() * 3, 0, 10),
        clarifying: clamp(4 + Math.min(hasQuestions, 3) + rng() * 2, 0, 10),
        structure: clamp(5 + (hasComplexity ? 2 : 0) + rng() * 3, 0, 10),
        tradeoffs: clamp(4 + (hasTradeoffs ? 3 : 0) + rng() * 2, 0, 10),
        recovery: clamp(5 + (hasEdgeCases ? 2 : 0) + rng() * 3, 0, 10),
        communication: clamp(6 + rng() * 3, 0, 10),
    };

    const strengths: string[] = [];
    const improvements: string[] = [];
    const nextDrills: string[] = [];

    if (hasQuestions) strengths.push('Proactively asks clarifying questions');
    if (hasAssumptions) strengths.push('Explicitly states assumptions');
    if (hasTradeoffs) strengths.push('Considers tradeoffs thoughtfully');
    if (hasEdgeCases) strengths.push('Identifies edge cases');
    if (hasTests) strengths.push('Thinks about testing strategy');
    if (hasPrivacy) strengths.push('Security-conscious mindset');

    if (strengths.length === 0) strengths.push('Engaged with the problem');

    if (!hasQuestions) improvements.push('Ask more clarifying questions before diving in');
    if (!hasTradeoffs) improvements.push('Discuss tradeoffs more explicitly');
    if (!hasComplexity) improvements.push('Mention time/space complexity');
    if (!hasEdgeCases) improvements.push('Consider edge cases earlier');

    if (improvements.length === 0) improvements.push('Continue developing structured thinking');

    nextDrills.push('Framing Gym: Ambiguous requirements practice');
    if (!hasTradeoffs) nextDrills.push('Tradeoff Design: System design decisions');
    nextDrills.push('Constraint Injection: Adapting under pressure');

    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 6;

    const thinkingProfile = avgScore >= 7
        ? `This candidate demonstrates strong structured thinking with a ${profile.domain} focus. They naturally break down problems and consider multiple angles before committing to a solution.`
        : `This candidate shows developing problem-solving skills. With practice in structured thinking and explicit tradeoff analysis, they can improve their ${profile.mode} performance.`;

    const recruiterSummary = `Candidate evaluated for ${profile.role} role (${profile.stage} stage, ${profile.domain} domain). Overall score: ${avgScore.toFixed(1)}/10. Key strength: ${strengths[0]}. Primary growth area: ${improvements[0]}. Recommended for further ${avgScore >= 6 ? 'technical interviews' : 'skill development'}.`;

    return {
        scores: {
            framing: Math.round(scores.framing * 10) / 10,
            clarifying: Math.round(scores.clarifying * 10) / 10,
            structure: Math.round(scores.structure * 10) / 10,
            tradeoffs: Math.round(scores.tradeoffs * 10) / 10,
            recovery: Math.round(scores.recovery * 10) / 10,
            communication: Math.round(scores.communication * 10) / 10,
        },
        strengths,
        improvements,
        nextDrills,
        thinkingProfile,
        recruiterSummary,
    };
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function IUTSUncertaintyTrainer() {
    // View state
    const [view, setView] = useState<ViewState>('setup');

    // Setup state
    const [role, setRole] = useState('');
    const [stage, setStage] = useState<StartupStage>('Seed');
    const [domain, setDomain] = useState<Domain>('SaaS');
    const [stack, setStack] = useState<string[]>([]);
    const [mode, setMode] = useState<Mode>('Framing Gym');
    const [useMock, setUseMock] = useState(true);
    const [chatApiUrl, setChatApiUrl] = useState('/api/iuts/chat');
    const [evaluateApiUrl, setEvaluateApiUrl] = useState('/api/iuts/evaluate');
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

    // Live state
    const [transcript, setTranscript] = useState<Turn[]>([]);
    const [currentConstraint, setCurrentConstraint] = useState<string | null>(null);
    const [studentInput, setStudentInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);

    // Results state
    const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null);

    // Derived
    const profile: Profile = useMemo(() => ({
        role, stage, domain, stack, mode
    }), [role, stage, domain, stack, mode]);

    const rng = useMemo(() => seededRandom(role + stage + domain + mode), [role, stage, domain, mode]);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const handleStartSimulation = useCallback(() => {
        const modeOpeners = INTERVIEWER_OPENERS[mode] || INTERVIEWER_OPENERS['Framing Gym'];
        const domainOpeners = modeOpeners[domain] || modeOpeners['Other'];
        const opener = pickFrom(domainOpeners, rng);
        setTranscript([{
            role: 'interviewer',
            content: opener,
            timestamp: formatTime(),
        }]);
        setCurrentConstraint(null);
        setWarning(null);
        setView('live');
    }, [mode, domain, rng]);

    const handleSendMessage = useCallback(async () => {
        if (!studentInput.trim()) return;

        const studentTurn: Turn = {
            role: 'student',
            content: studentInput.trim(),
            timestamp: formatTime(),
        };

        const newTranscript = [...transcript, studentTurn];
        setTranscript(newTranscript);
        setStudentInput('');
        setIsLoading(true);
        setWarning(null);

        if (useMock) {
            // Mock mode
            setTimeout(() => {
                const { message, constraint } = generateMockInterviewerResponse(newTranscript, profile, rng);

                const interviewerTurn: Turn = {
                    role: 'interviewer',
                    content: message,
                    timestamp: formatTime(),
                };

                setTranscript(prev => [...prev, interviewerTurn]);
                if (constraint) setCurrentConstraint(constraint);
                setIsLoading(false);
            }, 800 + Math.random() * 400);
        } else {
            // API mode
            try {
                const res = await fetch(chatApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        profile,
                        transcript: newTranscript,
                        currentConstraint,
                    }),
                });

                if (!res.ok) throw new Error('API request failed');

                const data = await res.json();

                const interviewerTurn: Turn = {
                    role: 'interviewer',
                    content: data.interviewerMessage,
                    timestamp: formatTime(),
                };

                setTranscript(prev => [...prev, interviewerTurn]);
                if (data.injectedConstraint) setCurrentConstraint(data.injectedConstraint);
                if (data.done) handleEndInterview();

            } catch {
                setWarning('API call failed. Falling back to mock mode.');
                const { message, constraint } = generateMockInterviewerResponse(newTranscript, profile, rng);

                const interviewerTurn: Turn = {
                    role: 'interviewer',
                    content: message,
                    timestamp: formatTime(),
                };

                setTranscript(prev => [...prev, interviewerTurn]);
                if (constraint) setCurrentConstraint(constraint);
            } finally {
                setIsLoading(false);
            }
        }
    }, [studentInput, transcript, useMock, profile, chatApiUrl, currentConstraint, rng]);

    const handleInjectConstraint = useCallback(() => {
        const constraint = pickFrom(CONSTRAINTS, rng);
        setCurrentConstraint(constraint);

        const systemTurn: Turn = {
            role: 'system',
            content: `⚠ NEW CONSTRAINT: ${constraint}`,
            timestamp: formatTime(),
        };
        setTranscript(prev => [...prev, systemTurn]);
    }, [rng]);

    const handleEndInterview = useCallback(async () => {
        setIsLoading(true);

        if (useMock) {
            setTimeout(() => {
                const report = generateMockEvaluation(transcript, profile);
                setEvaluation(report);
                setView('results');
                setIsLoading(false);
            }, 1000);
        } else {
            try {
                const res = await fetch(evaluateApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profile, transcript }),
                });

                if (!res.ok) throw new Error('Evaluation API failed');

                const report = await res.json();
                setEvaluation(report);
                setView('results');
            } catch {
                setWarning('Evaluation API failed. Using mock evaluation.');
                const report = generateMockEvaluation(transcript, profile);
                setEvaluation(report);
                setView('results');
            } finally {
                setIsLoading(false);
            }
        }
    }, [useMock, transcript, profile, evaluateApiUrl]);

    const handleReset = useCallback(() => {
        setView('setup');
        setTranscript([]);
        setCurrentConstraint(null);
        setEvaluation(null);
        setWarning(null);
        setStudentInput('');
    }, []);

    const toggleStack = useCallback((tag: string) => {
        setStack(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    }, []);

    // ============================================================================
    // RENDER
    // ============================================================================

    const sidebarItems = [
        { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, isActive: false },
        { label: 'Tests', href: '/student/tests', icon: FileText, isActive: false },
        { label: 'Interview', href: '/student/interview', icon: MessageSquare, isActive: false },
        { label: 'Projects', href: '/student/projects', icon: FolderGit2, isActive: false },
        { label: 'IUTS', href: '/student/iuts', icon: Target, isActive: true }
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

                <main className="p-8 lg:p-12">
                    <div className="max-w-6xl mx-auto">

                        {/* Header */}
                        <header className="mb-8 border-b-2 border-slate-900 pb-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h1 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                                        IUTS Trainer
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 ${view === 'live' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            {view === 'setup' ? 'Setup Mode' : view === 'live' ? 'Interview Active' : 'Results Ready'}
                                        </span>
                                    </div>
                                </div>
                                {view !== 'setup' && (
                                    <button
                                        onClick={handleReset}
                                        className="uppercase tracking-widest font-bold py-3 px-6 text-sm border-2 border-slate-900 bg-white text-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-none transition-all rounded-none cursor-pointer"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </header>

                        {/* Warning Banner */}
                        {warning && (
                            <div className="mb-6 p-4 bg-yellow-100 border-2 border-yellow-500 flex justify-between items-center">
                                <span className="text-sm font-bold text-yellow-800 uppercase tracking-wide">{warning}</span>
                                <button onClick={() => setWarning(null)} className="text-yellow-800 font-black">×</button>
                            </div>
                        )}

                        {/* ================================================================ */}
                        {/* SETUP VIEW */}
                        {/* ================================================================ */}
                        {view === 'setup' && (
                            <div className="space-y-6">
                                {/* Card: Profile */}
                                <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-none">
                                    <div className="border-b-2 border-slate-900 bg-stone-100 p-3 flex justify-between items-center">
                                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Candidate Profile</h3>
                                        <div className="w-3 h-3 bg-slate-900"></div>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        {/* Role */}
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                                                Candidate Role
                                            </label>
                                            <input
                                                type="text"
                                                value={role}
                                                onChange={(e) => setRole(e.target.value)}
                                                placeholder="e.g. Senior Frontend Engineer"
                                                className="w-full p-3 border-2 border-slate-900 bg-white font-mono text-sm focus:outline-none focus:border-sky-500 rounded-none"
                                            />
                                        </div>

                                        {/* Stage + Domain */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                                                    Startup Stage
                                                </label>
                                                <select
                                                    value={stage}
                                                    onChange={(e) => setStage(e.target.value as StartupStage)}
                                                    className="w-full p-3 border-2 border-slate-900 bg-white font-mono text-sm focus:outline-none focus:border-sky-500 rounded-none cursor-pointer"
                                                >
                                                    <option value="Seed">Seed</option>
                                                    <option value="Series A">Series A</option>
                                                    <option value="Growth">Growth</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                                                    Domain
                                                </label>
                                                <select
                                                    value={domain}
                                                    onChange={(e) => setDomain(e.target.value as Domain)}
                                                    className="w-full p-3 border-2 border-slate-900 bg-white font-mono text-sm focus:outline-none focus:border-sky-500 rounded-none cursor-pointer"
                                                >
                                                    <option value="Fintech">Fintech</option>
                                                    <option value="Edtech">Edtech</option>
                                                    <option value="SaaS">SaaS</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Stack Tags */}
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                                                Tech Stack
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {STACK_OPTIONS.map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => toggleStack(tag)}
                                                        className={`px-3 py-1 border-2 border-slate-900 text-xs font-bold uppercase tracking-wide transition-all rounded-none cursor-pointer ${stack.includes(tag)
                                                            ? 'bg-slate-900 text-white'
                                                            : 'bg-white text-slate-900 hover:bg-stone-100'
                                                            }`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card: Simulation Config */}
                                <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-none">
                                    <div className="border-b-2 border-slate-900 bg-stone-100 p-3 flex justify-between items-center">
                                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Simulation Config</h3>
                                        <div className="w-3 h-3 bg-slate-900"></div>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        {/* Mode */}
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                                                Training Mode
                                            </label>
                                            <select
                                                value={mode}
                                                onChange={(e) => setMode(e.target.value as Mode)}
                                                className="w-full p-3 border-2 border-slate-900 bg-white font-mono text-sm focus:outline-none focus:border-sky-500 rounded-none cursor-pointer"
                                            >
                                                <option value="Framing Gym">Framing Gym</option>
                                                <option value="Constraint Injection">Constraint Injection</option>
                                                <option value="Startup Simulation">Startup Simulation</option>
                                            </select>
                                        </div>

                                        {/* Mock Toggle */}
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setUseMock(!useMock)}
                                                className={`w-12 h-6 border-2 border-slate-900 relative transition-colors rounded-none ${useMock ? 'bg-sky-400' : 'bg-stone-200'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 bg-slate-900 absolute top-0.5 transition-all ${useMock ? 'left-6' : 'left-0.5'
                                                    }`}></div>
                                            </button>
                                            <span className="text-sm font-bold uppercase tracking-wide text-slate-700">
                                                Use Mock Engine
                                            </span>
                                        </div>

                                        {/* API URLs (if not mock) */}
                                        {!useMock && (
                                            <div className="space-y-4 p-4 bg-stone-100 border-2 border-slate-300">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                                                        Proxy Chat API URL
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={chatApiUrl}
                                                        onChange={(e) => setChatApiUrl(e.target.value)}
                                                        className="w-full p-3 border-2 border-slate-900 bg-white font-mono text-sm focus:outline-none focus:border-sky-500 rounded-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                                                        Proxy Evaluate API URL
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={evaluateApiUrl}
                                                        onChange={(e) => setEvaluateApiUrl(e.target.value)}
                                                        className="w-full p-3 border-2 border-slate-900 bg-white font-mono text-sm focus:outline-none focus:border-sky-500 rounded-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* CTA */}
                                <button
                                    onClick={handleStartSimulation}
                                    disabled={!role.trim()}
                                    className="w-full uppercase tracking-widest font-bold py-4 px-6 text-sm border-2 border-slate-900 bg-slate-900 text-white shadow-[4px_4px_0px_#0ea5e9] hover:bg-slate-800 active:translate-y-1 active:shadow-none transition-all rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Start Simulation
                                </button>
                            </div>
                        )}

                        {/* ================================================================ */}
                        {/* LIVE VIEW */}
                        {/* ================================================================ */}
                        {view === 'live' && (
                            <div className="space-y-6">
                                {/* Constraint Banner */}
                                {currentConstraint && (
                                    <div className="p-4 bg-yellow-100 border-2 border-yellow-500">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-700">Active Constraint</span>
                                        <p className="text-sm font-bold text-yellow-900 mt-1">{currentConstraint}</p>
                                    </div>
                                )}

                                {/* Chat Transcript */}
                                <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-none">
                                    <div className="border-b-2 border-slate-900 bg-stone-100 p-3 flex justify-between items-center">
                                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Interview Transcript</h3>
                                        <div className="w-3 h-3 bg-green-500 animate-pulse"></div>
                                    </div>
                                    <div className="p-4 h-96 overflow-y-auto space-y-4 bg-stone-50">
                                        {transcript.map((turn, i) => (
                                            <div
                                                key={i}
                                                className={`flex ${turn.role === 'student' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[80%] p-4 border-2 border-slate-900 ${turn.role === 'interviewer'
                                                    ? 'bg-white'
                                                    : turn.role === 'student'
                                                        ? 'bg-sky-100'
                                                        : 'bg-yellow-100'
                                                    }`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                                            {turn.role}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-slate-400">{turn.timestamp}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-800 leading-relaxed">{turn.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex justify-start">
                                                <div className="p-4 border-2 border-slate-900 bg-white">
                                                    <span className="text-sm text-slate-500 animate-pulse">Interviewer is typing...</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Input */}
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={studentInput}
                                        onChange={(e) => setStudentInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                                        placeholder="Type your response..."
                                        className="flex-1 p-4 border-2 border-slate-900 bg-white font-mono text-sm focus:outline-none focus:border-sky-500 rounded-none"
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={isLoading || !studentInput.trim()}
                                        className="uppercase tracking-widest font-bold py-3 px-6 text-sm border-2 border-slate-900 bg-slate-900 text-white shadow-[4px_4px_0px_#0ea5e9] hover:bg-slate-800 active:translate-y-1 active:shadow-none transition-all rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Send
                                    </button>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleInjectConstraint}
                                        disabled={isLoading}
                                        className="flex-1 uppercase tracking-widest font-bold py-3 px-6 text-sm border-2 border-slate-900 bg-sky-300 text-slate-900 shadow-[4px_4px_0px_#0f172a] hover:bg-sky-400 active:translate-y-1 active:shadow-none transition-all rounded-none cursor-pointer disabled:opacity-50"
                                    >
                                        Inject Random Constraint
                                    </button>
                                    <button
                                        onClick={handleEndInterview}
                                        disabled={isLoading || transcript.length < 2}
                                        className="flex-1 uppercase tracking-widest font-bold py-3 px-6 text-sm border-2 border-slate-900 bg-slate-900 text-white shadow-[4px_4px_0px_#0ea5e9] hover:bg-slate-800 active:translate-y-1 active:shadow-none transition-all rounded-none cursor-pointer disabled:opacity-50"
                                    >
                                        End & Evaluate
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ================================================================ */}
                        {/* RESULTS VIEW */}
                        {/* ================================================================ */}
                        {view === 'results' && evaluation && (
                            <div className="space-y-6">
                                {/* Score Cards */}
                                <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-none">
                                    <div className="border-b-2 border-slate-900 bg-stone-100 p-3 flex justify-between items-center">
                                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Performance Scores</h3>
                                        <div className="w-3 h-3 bg-slate-900"></div>
                                    </div>
                                    <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                                        {Object.entries(evaluation.scores).map(([key, val]) => (
                                            <div key={key} className="space-y-2">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                                        {key}
                                                    </span>
                                                    <span className="text-lg font-black text-slate-900">{val}</span>
                                                </div>
                                                <div className="h-4 bg-stone-200 border-2 border-slate-900">
                                                    <div
                                                        className={`h-full ${val >= 7 ? 'bg-green-400' : val >= 5 ? 'bg-sky-400' : 'bg-yellow-400'}`}
                                                        style={{ width: `${val * 10}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Lists Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Strengths */}
                                    <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-none">
                                        <div className="border-b-2 border-slate-900 bg-green-100 p-3">
                                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Strengths</h3>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {evaluation.strengths.map((s, i) => (
                                                <div key={i} className="flex gap-2 text-sm">
                                                    <span className="text-green-600">✓</span>
                                                    <span>{s}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Improvements */}
                                    <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-none">
                                        <div className="border-b-2 border-slate-900 bg-yellow-100 p-3">
                                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Improvements</h3>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {evaluation.improvements.map((s, i) => (
                                                <div key={i} className="flex gap-2 text-sm">
                                                    <span className="text-yellow-600">▸</span>
                                                    <span>{s}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Next Drills */}
                                    <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-none">
                                        <div className="border-b-2 border-slate-900 bg-sky-100 p-3">
                                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Next Drills</h3>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {evaluation.nextDrills.map((s, i) => (
                                                <div key={i} className="flex gap-2 text-sm">
                                                    <span className="text-sky-600">→</span>
                                                    <span>{s}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Thinking Profile */}
                                <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-none">
                                    <div className="border-b-2 border-slate-900 bg-stone-100 p-3">
                                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Thinking Profile</h3>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-sm leading-relaxed text-slate-700">{evaluation.thinkingProfile}</p>
                                    </div>
                                </div>

                                {/* Recruiter Summary */}
                                <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-none">
                                    <div className="border-b-2 border-slate-900 bg-stone-100 p-3">
                                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Recruiter Summary</h3>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-sm leading-relaxed text-slate-700 font-mono bg-stone-50 p-4 border-2 border-slate-300">
                                            {evaluation.recruiterSummary}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => copyToClipboard(evaluation.recruiterSummary)}
                                        className="uppercase tracking-widest font-bold py-3 px-6 text-sm border-2 border-slate-900 bg-sky-300 text-slate-900 shadow-[4px_4px_0px_#0f172a] hover:bg-sky-400 active:translate-y-1 active:shadow-none transition-all rounded-none cursor-pointer"
                                    >
                                        Copy Recruiter Summary
                                    </button>
                                    <button
                                        onClick={() => downloadJson({ profile, transcript, evaluation }, `iuts-report-${Date.now()}.json`)}
                                        className="uppercase tracking-widest font-bold py-3 px-6 text-sm border-2 border-slate-900 bg-slate-900 text-white shadow-[4px_4px_0px_#0ea5e9] hover:bg-slate-800 active:translate-y-1 active:shadow-none transition-all rounded-none cursor-pointer"
                                    >
                                        Download JSON Report
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="uppercase tracking-widest font-bold py-3 px-6 text-sm border-2 border-slate-900 bg-white text-slate-900 shadow-[4px_4px_0px_#0f172a] hover:bg-stone-100 active:translate-y-1 active:shadow-none transition-all rounded-none cursor-pointer"
                                    >
                                        Start New Simulation
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}