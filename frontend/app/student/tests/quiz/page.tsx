'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { LayoutDashboard, FileText, FolderGit2, Target, MessageSquare, ChevronLeft, ChevronRight, Send, Briefcase, Code } from 'lucide-react';

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

export default function QuizPage() {
    const router = useRouter();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [currentQuestion, setCurrentQuestion] = useState(0);

    useEffect(() => {
        // Load quiz from localStorage
        const quizData = localStorage.getItem('currentQuiz');
        if (quizData) {
            setQuiz(JSON.parse(quizData));
        } else {
            // No quiz found, redirect back to tests
            router.push('/student/tests');
        }
    }, [router]);

    const handleSelectAnswer = (questionId: string, optionIndex: number) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex,
        }));
    };

    const handleSubmit = () => {
        if (!quiz) return;

        // Check if all questions are answered
        const unanswered = quiz.questions.filter(q => answers[q.id] === undefined);
        if (unanswered.length > 0) {
            alert(`Please answer all questions before submitting. ${unanswered.length} question(s) remaining.`);
            return;
        }

        // Store answers and navigate to results
        localStorage.setItem('quizAnswers', JSON.stringify(answers));
        router.push('/student/tests/results');
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

    if (!quiz) {
        return (
            <div className="min-h-screen bg-stone-50">
                <Sidebar items={sidebarItems} />
                <div className="pl-64 p-12">
                    <div className="text-center">
                        <p className="text-lg font-black uppercase text-slate-900">Loading Quiz...</p>
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = quiz.questions[currentQuestion];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / quiz.questions.length) * 100;

    return (
        <div className="min-h-screen bg-stone-50">
            <Sidebar items={sidebarItems} />

            <div className="pl-64">
                <div className="p-8 max-w-4xl mx-auto">

                    {/* HEADER */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                                {quiz.type === 'technical' ? 'TECHNICAL TEST' : 'ANALYTICAL TEST'}
                            </h1>
                            <div className="text-sm font-black uppercase text-slate-600">
                                {answeredCount} / {quiz.questions.length} ANSWERED
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-4 border-2 border-slate-900 bg-stone-100">
                            <div
                                className="h-full bg-sky-300 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* QUESTION CARD */}
                    <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-8 mb-6">
                        {/* Question Number */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 border-2 border-slate-900 bg-sky-300 flex items-center justify-center font-black text-lg shadow-[4px_4px_0px_#0f172a]">
                                {currentQuestion + 1}
                            </div>
                            <div>
                                <div className="text-xs font-black uppercase tracking-wider text-slate-500">QUESTION {currentQuestion + 1} OF {quiz.questions.length}</div>
                                <div className="text-xl font-black uppercase text-slate-900">MULTIPLE CHOICE</div>
                            </div>
                        </div>

                        {/* Question Text */}
                        <h2 className="text-2xl font-bold text-slate-800 mb-8 leading-tight">
                            {currentQ.question}
                        </h2>

                        {/* Options */}
                        <div className="space-y-3">
                            {currentQ.options.map((option, idx) => {
                                const isSelected = answers[currentQ.id] === idx;
                                const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectAnswer(currentQ.id, idx)}
                                        className={`w-full text-left p-4 border-2 border-slate-900 transition-all ${isSelected
                                            ? 'bg-sky-300 shadow-[4px_4px_0px_#0f172a]'
                                            : 'bg-white hover:bg-stone-50 shadow-[2px_2px_0px_#0f172a] hover:shadow-[4px_4px_0px_#0f172a] hover:translate-y-1'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 border-2 border-slate-900 flex items-center justify-center font-black ${isSelected ? 'bg-white' : 'bg-stone-100'
                                                }`}>
                                                {optionLabel}
                                            </div>
                                            <span className="font-medium text-slate-800">{option}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* NAVIGATION */}
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestion === 0}
                            className="flex items-center gap-2 px-6 py-3 border-2 border-slate-900 bg-white text-slate-900 font-black uppercase text-sm shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Previous
                        </button>

                        <div className="flex gap-2">
                            {quiz.questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestion(idx)}
                                    className={`w-10 h-10 border-2 border-slate-900 font-black text-sm ${idx === currentQuestion
                                        ? 'bg-slate-900 text-white'
                                        : answers[q.id] !== undefined
                                            ? 'bg-sky-300 text-slate-900'
                                            : 'bg-white text-slate-900 hover:bg-stone-100'
                                        } shadow-[2px_2px_0px_#0f172a] transition-all`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>

                        {currentQuestion < quiz.questions.length - 1 ? (
                            <button
                                onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                                className="flex items-center gap-2 px-6 py-3 border-2 border-slate-900 bg-white text-slate-900 font-black uppercase text-sm shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-none transition-all"
                            >
                                Next
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="flex items-center gap-2 px-8 py-3 border-2 border-slate-900 bg-slate-900 text-white font-black uppercase text-sm shadow-[4px_4px_0px_#0ea5e9] hover:translate-y-1 hover:shadow-none transition-all"
                            >
                                Submit Test
                                <Send className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
