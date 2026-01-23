"use client";

import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface Step {
    label: string;
    description: string;
    completed: boolean;
}

export const MockSteps: React.FC = () => {
    const steps: Step[] = [
        {
            label: "Upload Resume",
            description: "Upload your resume to get personalized insights and competency analysis",
            completed: false
        },
        {
            label: "Complete Profile",
            description: "Fill out additional information about your skills and projects",
            completed: false
        },
        {
            label: "Take Skill Assessment",
            description: "Complete our technical assessment to validate your competencies",
            completed: false
        },
        {
            label: "Connect GitHub",
            description: "Link your GitHub account to showcase your project contributions",
            completed: false
        },
        {
            label: "Practice Mock Interviews",
            description: "Improve your interview skills with AI-powered mock sessions",
            completed: false
        },
        {
            label: "Review Career Roadmap",
            description: "Explore personalized career paths and skill development recommendations",
            completed: false
        }
    ];

    return (
        <div className="border-2 border-slate-900 bg-white shadow-[8px_8px_0px_#0f172a] rounded-none p-8">
            <div className="mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">
                    Complete Your Profile
                </h3>
                <p className="text-sm font-medium text-slate-600">
                    Follow these steps to unlock the full potential of Ascendra
                </p>
            </div>

            <div className="space-y-0">
                {steps.map((step, index) => (
                    <div
                        key={index}
                        className={`
              group flex items-start gap-6 p-6 border-b-2 border-slate-900
              hover:bg-stone-50 transition-colors cursor-default
              ${index === steps.length - 1 ? 'border-b-0' : ''}
            `}
                    >
                        {/* Step Number */}
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 border-2 border-slate-900 bg-stone-100 flex items-center justify-center group-hover:bg-sky-300 transition-colors">
                                <span className="text-lg font-black text-slate-900">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                            </div>
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 pt-1">
                            <h4 className="text-base font-black uppercase tracking-tight text-slate-900 mb-2">
                                {step.label}
                            </h4>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                {step.description}
                            </p>
                        </div>

                        {/* Checkbox */}
                        <div className="flex-shrink-0 pt-2">
                            {step.completed ? (
                                <CheckSquare className="text-sky-300" size={24} />
                            ) : (
                                <Square className="text-slate-300" size={24} />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
