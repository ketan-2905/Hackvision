"use client";

import React from 'react';
import { DashboardStatus } from '@/types/resume';

interface TopBarProps {
    profileProgress: number;
    status: DashboardStatus;
    userName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ profileProgress, status, userName = "Student" }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'ANALYZED':
                return 'bg-sky-300 text-slate-900';
            case 'RESUME_UPLOADED':
                return 'bg-yellow-300 text-slate-900';
            default:
                return 'bg-slate-200 text-slate-600';
        }
    };

    return (
        <div className="bg-white border-b-2 border-slate-900 p-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Left: Profile Progress */}
                <div className="flex items-center gap-6">
                    <div className="flex-1 min-w-[300px]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Profile Progress
                            </span>
                            <span className="text-xs font-black text-slate-900">{profileProgress}%</span>
                        </div>
                        <div className="h-6 border-4 border-slate-900 bg-stone-100 p-1 rounded-none">
                            <div
                                className="h-full bg-sky-300 border-r-2 border-slate-900 transition-all duration-500"
                                style={{ width: `${profileProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`
            px-4 py-2 border-2 border-slate-900 font-black uppercase tracking-widest text-[10px]
            shadow-[4px_4px_0px_#0f172a] rounded-none
            ${getStatusColor()}
          `}>
                        {status.replace('_', ' ')}
                    </div>
                </div>

                {/* Right: User Info */}
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-black uppercase text-slate-900">{userName}</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Student</p>
                    </div>
                    <div className="w-10 h-10 border-2 border-slate-900 bg-sky-300 flex items-center justify-center">
                        <span className="text-slate-900 font-black text-sm">
                            {userName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
