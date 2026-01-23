"use client";

import React from 'react';
import { ResumeAnalysis } from '@/types/resume';
import { TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';

interface ResumeInsightsProps {
    analysis: ResumeAnalysis;
}

export const ResumeInsights: React.FC<ResumeInsightsProps> = ({ analysis }) => {
    return (
        <div className="space-y-6">
            {/* ATS Score & Key Metrics */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* ATS Score */}
                <div className="border-2 border-slate-900 bg-white shadow-[8px_8px_0px_#0f172a] rounded-none p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
                            ATS Score
                        </h3>
                        <Target className="text-sky-300" size={24} />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black text-slate-900">{analysis.atsScore}</span>
                        <span className="text-2xl font-black text-slate-400">/100</span>
                    </div>

                    {/* Analysis Source Verification Badge */}
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 border-2 border-slate-900 bg-stone-100 uppercase text-[10px] font-black tracking-wider">
                        <span className="text-slate-500">ENGINE:</span>
                        <span className="text-sky-600">{analysis.analysisSource}</span>
                    </div>

                    <p className="mt-4 text-sm font-medium text-slate-600">
                        Your resume's compatibility with Applicant Tracking Systems
                    </p>
                </div>

                {/* Skill Distribution Graph */}
                <div className="border-2 border-slate-900 bg-white shadow-[8px_8px_0px_#0f172a] rounded-none p-8">
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6">
                        Skill Distribution
                    </h3>
                    <div className="space-y-4">
                        {analysis.graphs.skillDistribution.map((skill, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-black uppercase text-slate-600">{skill.label}</span>
                                    <span className="text-xs font-black text-slate-900">{skill.value}%</span>
                                </div>
                                <div className="h-4 border-2 border-slate-900 bg-stone-100 p-0.5 rounded-none">
                                    <div
                                        className="h-full bg-sky-300 transition-all duration-500"
                                        style={{ width: `${skill.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Section Scores */}
            <div className="border-2 border-slate-900 bg-white shadow-[8px_8px_0px_#0f172a] rounded-none p-8">
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6">
                    Section Scores
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {analysis.graphs.sectionScores.map((section, index) => (
                        <div key={index} className="border-2 border-slate-900 bg-stone-50 p-4 rounded-none">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                {section.label}
                            </p>
                            <p className="text-3xl font-black text-slate-900">{section.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strengths, Gaps, Suggestions - Horizontal Layout */}
            <div className="border-2 border-slate-900 bg-white shadow-[8px_8px_0px_#0f172a] rounded-none p-8 space-y-8">
                {/* Strengths */}
                <div>
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-slate-900">
                        <div className="w-10 h-10 border-2 border-slate-900 bg-green-300 flex items-center justify-center">
                            <TrendingUp size={20} className="text-slate-900" />
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">
                            Strengths
                        </h4>
                    </div>
                    <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                        {analysis.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <span className="text-green-600 font-black text-lg flex-shrink-0">✓</span>
                                <span className="text-sm font-medium text-slate-600">{strength}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Gaps */}
                <div>
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-slate-900">
                        <div className="w-10 h-10 border-2 border-slate-900 bg-yellow-300 flex items-center justify-center">
                            <AlertTriangle size={20} className="text-slate-900" />
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">
                            Gaps
                        </h4>
                    </div>
                    <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                        {analysis.gaps.map((gap, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <span className="text-yellow-600 font-black text-lg flex-shrink-0">!</span>
                                <span className="text-sm font-medium text-slate-600">{gap}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Suggestions */}
                <div>
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-slate-900">
                        <div className="w-10 h-10 border-2 border-slate-900 bg-sky-300 flex items-center justify-center">
                            <Lightbulb size={20} className="text-slate-900" />
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">
                            Suggestions
                        </h4>
                    </div>
                    <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                        {analysis.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <span className="text-sky-600 font-black text-lg flex-shrink-0">→</span>
                                <span className="text-sm font-medium text-slate-600">{suggestion}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
