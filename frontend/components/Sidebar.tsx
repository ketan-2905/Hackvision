import React from 'react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface NavItem {
    label: string;
    href: string;
    icon?: LucideIcon;
    isActive?: boolean;
}

interface SidebarProps {
    items: NavItem[];
    userName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, userName = "Admin User" }) => {
    return (
        <aside className="w-64 bg-white border-r-2 border-slate-900 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-40">
            <div className="p-6 border-b-2 border-slate-900 bg-slate-900 text-white">
                <h1 className="text-2xl font-black uppercase tracking-tighter">ASCENDRA</h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-sky-400 mt-1">System v1.0</p>
            </div>

            <nav className="flex-1">
                <ul className="flex flex-col">
                    {items.map((item, index) => (
                        <li key={index}>
                            <Link href={item.href} className={`
                                flex items-center gap-4 px-6 py-4 border-b-2 border-slate-900
                                uppercase font-black tracking-tight text-sm
                                transition-all duration-200
                                ${item.isActive
                                    ? 'bg-sky-300 text-slate-900'
                                    : 'bg-white text-slate-500 hover:bg-stone-100 hover:text-slate-900'
                                }
                            `}>
                                {item.icon && (
                                    <div className={`
                                        w-8 h-8 border-2 border-slate-900 flex items-center justify-center
                                        ${item.isActive ? 'bg-white' : 'bg-slate-100'}
                                    `}>
                                        <item.icon size={16} />
                                    </div>
                                )}
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-6 bg-slate-900 border-t-2 border-slate-900 mt-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border-2 border-sky-400 bg-slate-800 flex items-center justify-center">
                        <span className="text-sky-400 font-black text-xs">
                            {userName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <p className="text-white text-xs font-bold uppercase truncate max-w-[120px]">
                            {userName}
                        </p>
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider">Online</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};