"use client";

import React from 'react';

export default function AdminDashboard() {
    return (
        <div className="min-h-screen bg-stone-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="border-2 border-slate-900 bg-white shadow-[8px_8px_0px_#0f172a] rounded-none p-12">
                    <h1 className="text-5xl font-black uppercase tracking-tighter leading-none text-slate-900 mb-6">
                        ADMIN
                        <br />
                        <span className="text-sky-500">DASHBOARD.</span>
                    </h1>
                    <p className="text-slate-600 font-medium mb-8">
                        Welcome to the Ascendra College Admin Portal. This dashboard is under construction.
                    </p>
                    <div className="border-t-2 border-slate-900 pt-6">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            STATUS: OPERATIONAL
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
