'use client';

import { useState, useRef, useEffect, CSSProperties } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/student/TopBar';
import { LayoutDashboard, FileText, FolderGit2, Target, MessageSquare, Briefcase, Code } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// ============================================
// TYPES
// ============================================
export interface CodingProblem {
    id: number;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    input_format: string;
    output_format: string;
    sample_case?: string;
    test_cases?: { input: string; output: string }[];
}

export interface CodingRoundProps {
    problem?: CodingProblem;
    onComplete: (code: string, passed: boolean) => void;
    initialTime?: number;
    aiApiKey?: string;
    validateEndpoint?: string;
}

export interface ValidationResult {
    passed: boolean;
    score: number;
    console_output: string;
    feedback: string;
}

// ============================================
// LANGUAGES CONFIG
// ============================================
const LANGUAGES: Record<string, { name: string; ext: string; snippet: string }> = {
    javascript: { name: 'JavaScript', ext: 'js', snippet: `function solve(input) {\n    // Your logic here\n    return result;\n}` },
    python: { name: 'Python', ext: 'py', snippet: `def solve(input):\n    # Your logic here\n    pass` },
    java: { name: 'Java', ext: 'java', snippet: `public class Solution {\n    public static void main(String[] args) {\n        // Your logic here\n    }\n}` },
    cpp: { name: 'C++', ext: 'cpp', snippet: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your logic here\n    return 0;\n}` }
};

// ============================================
// AI UTILITIES
// ============================================
const validateWithAI = async (
    code: string,
    language: string,
    problem: CodingProblem,
    apiKey: string
): Promise<ValidationResult> => {
    const prompt = `You are a code validator. Analyze the following code submission for a coding problem.

PROBLEM:
Title: ${problem.title}
Description: ${problem.description}
Input Format: ${problem.input_format}
Output Format: ${problem.output_format}
${problem.test_cases ? `Test Cases: ${JSON.stringify(problem.test_cases)}` : ''}

SUBMITTED CODE (${language}):
\`\`\`${language}
${code}
\`\`\`

Evaluate the code and respond ONLY with valid JSON in this exact format:
{
    "passed": true,
    "score": 85,
    "console_output": "...",
    "feedback": "..."
}
`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                max_tokens: 500,
            }),
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        throw new Error('Invalid AI response format');
    } catch (error: any) {
        return {
            passed: false,
            score: 0,
            console_output: `[AI Validation Error] ${error.message}`,
            feedback: 'Could not validate with AI. Please check your API key or try again.',
        };
    }
};

const generateProblemWithAI = async (apiKey: string): Promise<CodingProblem> => {
    const prompt = `Generate a unique, creative coding problem for a technical interview. 
    It should be different from common problems like Two Sum or Reverse String.
    Respond ONLY with valid JSON in this exact format:
    {
        "id": number,
        "title": "Problem Title",
        "description": "Clear description with example",
        "difficulty": "easy" | "medium" | "hard",
        "input_format": "...",
        "output_format": "...",
        "test_cases": [{"input": "...", "output": "..."}]
    }`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 1000,
            }),
        });
        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        throw new Error('Invalid format');
    } catch (error) {
        return SAMPLE_PROBLEM;
    }
};

const mockValidate = async (code: string): Promise<ValidationResult> => {
    await new Promise(r => setTimeout(r, 1500));
    const hasLogic = code.length > 50 && !code.includes('// Your logic here') && !code.includes('# Your logic here');
    return {
        passed: hasLogic,
        score: hasLogic ? 100 : 0,
        console_output: hasLogic
            ? '✓ Test Case 1: Passed\n✓ Test Case 2: Passed\n✓ Test Case 3: Passed'
            : '✗ Test Case 1: Failed\n  Expected: [output]\n  Got: undefined',
        feedback: hasLogic
            ? 'Great job! All test cases passed.'
            : 'Please implement your solution logic.',
    };
};

export const SAMPLE_PROBLEM: CodingProblem = {
    id: 1,
    title: 'Two Sum',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    difficulty: 'easy',
    input_format: 'Array of integers and a target integer',
    output_format: 'Array of two indices',
    test_cases: [{ input: '[2, 7, 11, 15], 9', output: '[0, 1]' }],
};

export const SAMPLE_PROBLEMS: CodingProblem[] = [
    SAMPLE_PROBLEM,
    { id: 2, title: 'Reverse String', description: 'Write a function that reverses a string in-place.', difficulty: 'easy', input_format: 'Array of characters', output_format: 'Reversed array of characters', test_cases: [{ input: '["h","e","l","l","o"]', output: '["o","l","l","e","h"]' }] },
    { id: 3, title: 'Valid Parentheses', description: 'Given a string containing just the characters brackets, determine if the input string is valid.', difficulty: 'medium', input_format: 'String containing brackets', output_format: 'Boolean', test_cases: [{ input: '"()"', output: 'true' }] },
];

export default function CodingPage() {
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

    const sidebarItems = [
        { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, isActive: false },
        { label: 'Tests', href: '/student/tests', icon: FileText, isActive: false },
        { label: 'Interview', href: '/student/interview', icon: MessageSquare, isActive: false },
        { label: 'Projects', href: '/student/projects', icon: FolderGit2, isActive: false },
        { label: 'IUTS', href: '/student/iuts', icon: Target, isActive: false },
        { label: 'Skill Gap', href: '/student/interview/skillgap', icon: Target, isActive: false },
        { label: 'Opportunities', href: '/student/oppurtunits', icon: Briefcase, isActive: false },
        { label: 'Code', href: '/student/code', icon: Code, isActive: true }
    ];

    return (
        <div className="min-h-screen bg-stone-50">
            <Sidebar items={sidebarItems} userName={realName} />
            <div className="pl-64">
                <TopBar profileProgress={profileProgress} status="ANALYZED" userName={realName} />
                <div className="p-0"> {/* Remove padding as instructions mostly want full layout or we need to adjust styles */}
                    <CodingRoundWrapper />
                </div>
            </div>
        </div>
    );
}

function CodingRoundWrapper() {
    // Wrapper to hold state for CodingRound
    const handleComplete = (code: string, passed: boolean) => {
        console.log('Round Complete:', passed);
    };

    return (
        <CodingRound
            onComplete={handleComplete}
        />
    )
}

// ============================================
// MAIN COMPONENT LOGIC (Adapted from original)
// ============================================
const CodingRound = ({
    problem,
    onComplete,
    initialTime = 600,
    aiApiKey,
    validateEndpoint,
}: CodingRoundProps) => {
    const [currentProblem, setCurrentProblem] = useState<CodingProblem>(() => {
        if (problem) return problem;
        const randomIndex = Math.floor(Math.random() * SAMPLE_PROBLEMS.length);
        return SAMPLE_PROBLEMS[randomIndex];
    });
    const [isGenerating, setIsGenerating] = useState(!problem && !!aiApiKey);
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState(LANGUAGES['javascript'].snippet);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [lastPassed, setLastPassed] = useState(false);
    const [lastScore, setLastScore] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!problem && aiApiKey) {
            setIsGenerating(true);
            generateProblemWithAI(aiApiKey).then(p => {
                setCurrentProblem(p);
                setIsGenerating(false);
            });
        }
    }, [aiApiKey, problem]);

    useEffect(() => {
        if (aiApiKey) {
            setOutput('> AI Validation Mode (Groq API)\n> Ready to evaluate your code...\n');
        } else if (validateEndpoint) {
            setOutput('> Custom API Validation Mode\n> Ready to evaluate your code...\n');
        } else {
            setOutput('> Mock Validation Mode\n> Add aiApiKey prop for AI-powered validation\n');
        }
    }, [aiApiKey, validateEndpoint]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onComplete(code, false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [code, onComplete]);

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        setCode(LANGUAGES[lang].snippet);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRun = async () => {
        setIsRunning(true);
        setOutput('[SYSTEM] Initializing environment...\n');

        try {
            let result: ValidationResult;
            if (validateEndpoint) {
                const response = await fetch(validateEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, language, problem_description: currentProblem.description, test_cases: currentProblem.test_cases || [] }),
                });
                result = await response.json();
            } else if (aiApiKey) {
                setOutput(prev => prev + '[AI] Analyzing code with LLM...\n');
                result = await validateWithAI(code, language, currentProblem, aiApiKey);
            } else {
                result = await mockValidate(code);
            }

            setLastPassed(result.passed);
            setLastScore(result.score);
            setOutput(prev => prev + `\n[STATUS] ${result.passed ? '✓ PASSED' : '✗ FAILED'}\n[SCORE] ${result.score}/100\n\n${result.console_output}\n\n[FEEDBACK] ${result.feedback}`);
        } catch (e: any) {
            setOutput(prev => prev + `\n[ERROR] ${e.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    if (isGenerating) {
        return (
            <div style={{ ...styles.container, color: '#0f172a', fontWeight: 'bold' }}>
                <div style={styles.envStatus}>[SYSTEM] GENERATING_UNIQUE_PROBLEM_VIA_AI...</div>
            </div>
        );
    }

    const lineNumbers = code.split('\n').map((_, i) => i + 1).join('\n');

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.headingMd}>CODING PROTOCOL</h2>
                    <p style={{ ...styles.label, color: aiApiKey ? '#22c55e' : '#0284c7' }}>
                        {aiApiKey ? '● AI VALIDATION ACTIVE' : validateEndpoint ? '● API VALIDATION' : '● MOCK MODE'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    {lastScore !== null && (
                        <div style={{ ...styles.label, fontSize: '1rem', color: '#0f172a' }}>
                            SCORE: <span style={{ color: '#22c55e' }}>{lastScore}</span>
                        </div>
                    )}
                    <div style={styles.timer}>{formatTime(timeLeft)}</div>
                    <button
                        style={{ ...styles.submitBtn, backgroundColor: isSubmitted ? '#64748b' : '#46b8d4ff', cursor: isSubmitted ? 'not-allowed' : 'pointer' }}
                        onClick={() => { setIsSubmitted(true); onComplete(code, lastPassed); alert(`Solution Submitted!\nStatus: ${lastPassed ? 'PASSED' : 'FAILED'}\nScore: ${lastScore ?? 0}/100`); }}
                        disabled={isSubmitted}
                    >
                        {isSubmitted ? 'SUBMITTED' : 'SUBMIT SOLUTION'}
                    </button>
                </div>
            </div>

            <div style={styles.mainGrid}>
                <div style={styles.problemPanel}>
                    <div style={styles.problemHeader}>
                        <p style={{ ...styles.label, color: '#64748b' }}>PROBLEM_SPECS</p>
                    </div>
                    <div style={styles.problemContent}>
                        <div style={styles.badgeContainer}>
                            <span style={getDifficultyStyle(currentProblem.difficulty)}>{currentProblem.difficulty.toUpperCase()}</span>
                            <span style={{ ...styles.difficultyBadge, backgroundColor: 'white' }}>CORE_SYSTEM</span>
                        </div>
                        <h3 style={styles.problemTitle}>{currentProblem.title}</h3>
                        <div style={styles.problemDescription}>{currentProblem.description}</div>
                        <div style={styles.inputFormatBox}>
                            <p style={{ ...styles.label, color: '#64748b', marginBottom: '0.5rem' }}>INPUT_FORMAT</p>
                            <code style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#334155' }}>{currentProblem.input_format}</code>
                        </div>
                    </div>
                </div>

                <div style={styles.editorPanel}>
                    <div style={styles.toolbar}>
                        <select value={language} onChange={e => handleLanguageChange(e.target.value)} style={styles.languageSelect}>
                            {Object.keys(LANGUAGES).map(l => (
                                <option key={l} value={l}>{LANGUAGES[l].name.toUpperCase()}</option>
                            ))}
                        </select>
                        <span style={styles.envStatus}>● ENV_READY</span>
                    </div>

                    <div style={styles.editorArea}>
                        <div style={styles.lineNumbers}>{lineNumbers}</div>
                        <textarea ref={textareaRef} style={styles.textarea} value={code} onChange={e => setCode(e.target.value)} spellCheck="false" />
                    </div>

                    <div style={styles.console}>
                        <div style={styles.consoleHeader}>
                            <span style={{ ...styles.label, fontSize: '8px', color: '#94a3b8' }}>STDOUT</span>
                            <button style={{ ...styles.runBtn, opacity: isRunning ? 0.5 : 1, cursor: isRunning ? 'not-allowed' : 'pointer' }} onClick={handleRun} disabled={isRunning}>
                                {isRunning ? 'EXECUTING...' : 'RUN_TESTS'}
                            </button>
                        </div>
                        <pre style={styles.consoleOutput}>{output || '> Awaiting execution instructions...'}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// STYLES & SAMPLES
// ============================================
const styles: Record<string, CSSProperties> = {
    container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)', width: '100%', padding: '2rem', backgroundColor: '#fafaf9', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' },
    header: { width: '85%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    headingMd: { fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '-0.025em', margin: 0, color: '#0f172a' },
    label: { fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#0284c7', margin: 0 },
    timer: { fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' },
    submitBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em', border: '2px solid #0f172a', backgroundColor: '#22c55e', color: 'white', cursor: 'pointer', boxShadow: '4px 4px 0px #0f172a', transition: 'all 0.15s ease' },
    mainGrid: { display: 'flex', width: '85%', height: '70vh', gap: '1rem', boxShadow: '8px 8px 0px #0f172a' },
    problemPanel: { flex: 1, backgroundColor: 'white', border: '2px solid #0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    problemHeader: { padding: '1rem', borderBottom: '2px solid #0f172a', backgroundColor: '#f5f5f4' },
    problemContent: { padding: '1.5rem', overflowY: 'auto', flex: 1 },
    badgeContainer: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
    difficultyBadge: { padding: '0.25rem 0.5rem', fontSize: '0.5rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.05em', border: '2px solid #0f172a' },
    problemTitle: { fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase' as const, marginBottom: '1rem', color: '#0f172a' },
    problemDescription: { whiteSpace: 'pre-wrap', color: '#0f172a', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.6 },
    inputFormatBox: { backgroundColor: '#f5f5f4', padding: '1rem', border: '2px solid #0f172a' },
    editorPanel: { flex: 1, backgroundColor: '#0f172a', border: '2px solid #0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    toolbar: { padding: '0.75rem', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    languageSelect: { fontFamily: 'monospace', backgroundColor: '#0f172a', color: '#94a3b8', border: '1px solid #475569', fontSize: '0.75rem', padding: '0.25rem 0.5rem' },
    envStatus: { fontSize: '9px', color: '#4ade80', fontWeight: 'bold', textTransform: 'uppercase' as const, letterSpacing: '0.1em' },
    editorArea: { flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', backgroundColor: '#0f172a' },
    lineNumbers: { fontFamily: 'monospace', width: '40px', backgroundColor: '#0f172a', color: '#475569', textAlign: 'right', padding: '1rem 0.5rem', fontSize: '12px', borderRight: '1px solid #1e293b', whiteSpace: 'pre', userSelect: 'none', lineHeight: 1.6 },
    textarea: { fontFamily: 'monospace', flex: 1, backgroundColor: 'transparent', color: '#e2e8f0', border: 'none', padding: '1rem', fontSize: '13px', resize: 'none', outline: 'none', lineHeight: 1.6 },
    console: { height: '30%', borderTop: '2px solid #1e293b', backgroundColor: 'black', display: 'flex', flexDirection: 'column' },
    consoleHeader: { display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', backgroundColor: '#1e293b', alignItems: 'center' },
    runBtn: { fontSize: '9px', padding: '0.25rem 0.75rem', backgroundColor: '#0284c7', color: 'white', border: 'none', fontWeight: 'bold', textTransform: 'uppercase' as const, letterSpacing: '0.05em', cursor: 'pointer' },
    consoleOutput: { fontFamily: 'monospace', flex: 1, padding: '1rem', color: '#4ade80', fontSize: '10px', overflowY: 'auto', margin: 0, whiteSpace: 'pre-wrap' },
};

const getDifficultyStyle = (difficulty: string): CSSProperties => {
    const base = { ...styles.difficultyBadge };
    switch (difficulty) {
        case 'easy': return { ...base, backgroundColor: '#bbf7d0', color: '#166534' };
        case 'medium': return { ...base, backgroundColor: '#fef08a', color: '#854d0e' };
        case 'hard': return { ...base, backgroundColor: '#fecaca', color: '#991b1b' };
        default: return base;
    }
};
