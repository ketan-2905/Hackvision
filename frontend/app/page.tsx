// "use client";

// import React from 'react';
// import {
//   ArrowRight,
//   Cpu,
//   Target,
//   BookOpen,
//   MessageSquare,
//   LineChart,
//   ShieldCheck,
//   Zap,
//   LayoutDashboard,
//   GraduationCap,
//   Library,
//   FileSearch,
//   CheckSquare,
//   BarChart3,
//   ChevronRight,
//   Compass,
//   TrendingUp
// } from 'lucide-react';
// import AscendingPlaneScene from '@/components/Plane';

// // --- Structured Layout Components ---

// const Navbar = () => (
//   <nav className="sticky top-0 z-50 bg-white border-b-2 border-slate-900">
//     <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
//       <div className="flex items-center gap-3">
//         <div className="w-10 h-10 bg-slate-900 flex items-center justify-center">
//           <GraduationCap className="text-white" size={24} />
//         </div>
//         <span className="text-2xl font-bold tracking-tighter text-slate-900 uppercase">Ascendra</span>
//       </div>
//       <div className="hidden md:flex items-center gap-1">
//         {['Competency', 'Outcomes', 'Roadmap', 'ROI'].map((item) => (
//           <a key={item} href="#" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
//             {item}
//           </a>
//         ))}
//       </div>
//       {/* Changed emerald-600/700/900 to sky-300/700/900 */}
//       <a href="/login" className="bg-sky-300 text-white px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-sky-700 transition-all border-b-4 border-sky-900 active:border-b-0 active:translate-y-1 inline-block">
//         Student Portal
//       </a>
//     </div>
//   </nav>
// );


// export default function AscendraAcademic() {
//   return (
//     // Changed selection color to sky-200
//     <div className="min-h-screen bg-stone-50 text-slate-900 font-sans selection:bg-sky-200">
//       <Navbar />

//       {/* Hero Section - The "Abstract" */}
//       <section className="relative py-32 lg:py-56 border-b-2 border-slate-900 bg-white overflow-hidden">
//         <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a05_1px,transparent_1px),linear-gradient(to_bottom,#0f172a05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
//         {/* 1. THE UNBOUND PLANE: It now lives in a full-section container */}
//         <div className="absolute inset-0 z-0 pointer-events-none">
//           <AscendingPlaneScene
//             modelScale={0.023}
//             /* X: Positive is Right, Negative is Left
//                Y: Positive is Up, Negative is Down 
//             */
//             modelPosition={[2, -0.5, 0]}
//           />
//         </div>

//         <div className="max-w-7xl mx-auto px-6 relative z-10">
//           {/* Left Content */}
//           <div className="max-w-3xl">
//             <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-300 text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-8">
//               <Library size={12} /> Institutional Intelligence Platform
//             </div>

//             <h1 className="text-6xl lg:text-9xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.8] uppercase">
//               Competency <br />
//               <span className="text-sky-500 italic">Architecture.</span>
//             </h1>

//             <p className="max-w-lg text-lg text-slate-600 font-medium leading-relaxed mb-10">
//               Mapping student potential through a **Unified Feature Vector**. We bridge the gap between academic theory and market-ready placement readiness.
//             </p>

//             <div className="flex flex-wrap gap-4">
//               <button className="px-10 py-5 bg-slate-900 text-white font-bold uppercase tracking-widest text-sm shadow-[6px_6px_0px_#0ea5e9]">
//                 Begin Assessment <ArrowRight className="inline ml-2" size={18} />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Subtle background blueprint detail */}
//         <div className="absolute bottom-10 right-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] select-none">
//           Trajectory // Ascending_Vector_01
//         </div>

//         {/* Optional: Subtle Blueprint Grid Background */}

//       </section>

//       {/* Feature Grid - The "Curriculum" */}
//       <section className="py-24 bg-stone-50 overflow-hidden">
//         <div className="max-w-7xl mx-auto px-6">
//           {/* Header with improved hierarchy */}
//           <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
//             {/* Changed border-emerald-600 to border-sky-300 */}
//             <div className="border-l-8 border-sky-300 pl-8">
//               <h2 className="text-4xl lg:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none">
//                 Intelligence <br /> Systems
//               </h2>
//               <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-4">
//                 Proprietary ML Core v2.0
//               </p>
//             </div>
//             <div className="hidden lg:block">
//               {/* Changed shadow hex from emerald to a dark sky blue hex (#075985) */}
//               <div className="px-6 py-4 border-2 border-slate-900 bg-white text-slate-900 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#075985]">
//                 Status: Operational
//               </div>
//             </div>
//           </div>

//           {/* The "Index" Layout: 2-column list with shared borders */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 border-t-2 border-slate-900">
//             {[
//               {
//                 id: "MOD_01",
//                 title: "Resume Analytics",
//                 desc: "NER models extract skills, activities, and internship depth for a unified feature vector.",
//                 icon: <FileSearch size={24} />
//               },
//               {
//                 id: "MOD_02",
//                 title: "Competency Scoring",
//                 desc: "Placement readiness scores from 0-100 across technical and soft-skill domains.",
//                 icon: <BarChart3 size={24} />
//               },
//               {
//                 id: "MOD_03",
//                 title: "Outcome Mapping",
//                 desc: "Top 3 Company and Masters program suggestions based on competency-to-role fit.",
//                 icon: <Target size={24} />
//               },
//               {
//                 id: "MOD_04",
//                 title: "ROI Roadmap",
//                 desc: "Course recommendations ranked by market demand growth and salary uplift proxies.",
//                 icon: <BookOpen size={24} />
//               },
//               {
//                 id: "MOD_05",
//                 title: "Interview Simulation",
//                 desc: "AI-driven evaluation of content relevance, clarity, and structural answer quality.",
//                 icon: <MessageSquare size={24} />
//               },
//               {
//                 id: "MOD_06",
//                 title: "Market Dashboards",
//                 desc: "Real-time trends in role demand and skill growth to validate career trajectories.",
//                 icon: <LineChart size={24} />
//               }
//             ].map((item, idx) => (
//               <div
//                 key={item.id}
//                 className={`group flex border-b-2 border-slate-900 p-8 hover:bg-white transition-colors
//             ${idx % 2 === 0 ? 'lg:border-r-2' : ''}
//           `}
//               >
//                 {/* Vertical Index Marker */}
//                 <div className="flex flex-col items-center justify-start mr-8">
//                   <span className="text-[10px] font-black text-slate-400 rotate-180 [writing-mode:vertical-lr] mb-4">
//                     {item.id}
//                   </span>
//                   {/* Changed group-hover:bg-emerald-600 to group-hover:bg-sky-300 */}
//                   <div className="w-px h-full bg-slate-200 group-hover:bg-sky-300 transition-colors" />
//                 </div>

//                 <div className="flex-grow">
//                   <div className="flex items-center gap-4 mb-4">
//                     <div className="w-10 h-10 border border-slate-900 flex items-center justify-center bg-white group-hover:bg-slate-900 group-hover:text-white transition-all shadow-[2px_2px_0px_#0f172a] group-hover:shadow-none">
//                       {item.icon}
//                     </div>
//                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none pt-1">
//                       {item.title}
//                     </h3>
//                   </div>
//                   <p className="text-slate-500 text-sm font-medium leading-relaxed italic pr-4">
//                     {item.desc}
//                   </p>
//                 </div>

//                 <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
//                   {/* Changed text-emerald-600 to text-sky-300 */}
//                   <ArrowRight className="text-sky-300" size={20} />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* The Lifecycle - "The Workflow" */}

//       <section className="py-24 border-y-2 border-slate-900 bg-slate-900 text-white">
//         <div className="max-w-7xl mx-auto px-6">
//           <div className="grid lg:grid-cols-2 gap-20 items-center">
//             <div>
//               <h2 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase leading-none mb-12">
//                 A Continuous <br />
//                 {/* Changed text-emerald-500 to text-sky-500 */}
//                 <span className="text-sky-500">Feedback Loop.</span>
//               </h2>
//               <div className="space-y-0">
//                 {[
//                   { t: "01 / Ingestion", d: "Sync Academic CGPA, Skills, and Coding Profiles." },
//                   { t: "02 / Processing", d: "ML models generate a unique Competency Score." },
//                   { t: "03 / Calibration", d: "Align profile with Internship and Hackathon tracks." },
//                   { t: "04 / Evaluation", d: "Practice through AI Interviews and Mock Tests." }
//                 ].map((step, i) => (
//                   <div key={i} className="group p-6 border-b border-slate-700 hover:bg-slate-800 transition-colors cursor-default">
//                     <div className="flex justify-between items-center">
//                       <div>
//                         {/* Changed text-emerald-400 to text-sky-400 */}
//                         <h4 className="text-lg font-bold uppercase tracking-widest text-sky-400 mb-1">{step.t}</h4>
//                         <p className="text-slate-400 text-sm font-medium">{step.d}</p>
//                       </div>
//                       {/* Changed text-emerald-500 to text-sky-500 */}
//                       <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity text-sky-500" />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//             {/* Changed border-emerald-500 to border-sky-500 */}
//             <div className="bg-white p-2 border-4 border-sky-500">
//               <div className="border-2 border-slate-900 p-10 text-slate-900">
//                 <div className="flex items-center gap-4 mb-8">
//                   <div className="w-12 h-12 bg-slate-100 flex items-center justify-center">
//                     <CheckSquare className="text-slate-900" />
//                   </div>
//                   <div>
//                     <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Status</div>
//                     <div className="text-xl font-bold uppercase">Placement Ready</div>
//                   </div>
//                 </div>
//                 <div className="space-y-4">
//                   <div className="h-4 bg-slate-100 border border-slate-200">
//                     {/* Changed bg-emerald-600 to bg-sky-300 */}
//                     <div className="h-full bg-sky-300 w-[85%]" />
//                   </div>
//                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
//                     <span>Tech Depth</span>
//                     <span>85 / 100</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       {/* Changed bg-emerald-600 to bg-sky-300 */}
//       <section className="py-32 bg-sky-300 text-white text-center">
//         <div className="max-w-4xl mx-auto px-6">
//           <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter mb-10">Ignite Your Academic Capital.</h2>
//           <div className="flex flex-col sm:flex-row justify-center gap-4">
//             <button className="px-12 py-6 bg-slate-900 text-white font-bold uppercase tracking-widest hover:bg-black transition-all shadow-[8px_8px_0px_rgba(0,0,0,0.2)]">
//               Begin Assessment
//             </a>
//             <button className="px-12 py-6 bg-white text-slate-900 font-bold uppercase tracking-widest hover:bg-slate-100 transition-all shadow-[8px_8px_0px_rgba(0,0,0,0.2)]">
//               Partner with Us
//             </a>
//           </div>
//           <p className="mt-12 text-[10px] font-bold uppercase tracking-[0.4em] opacity-80 italic">Standardized for the Class of 2026</p>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="py-20 border-t-2 border-slate-900 bg-white">
//         <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 items-center">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 bg-slate-900 flex items-center justify-center">
//               <Zap className="text-white" size={16} />
//             </div>
//             <span className="text-xl font-black uppercase tracking-tighter">Ascendra</span>
//           </div>
//           <div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
//             {/* Changed all hover:text-emerald-600 to hover:text-sky-300 */}
//             <a href="#" className="hover:text-sky-300 transition-colors underline decoration-2 underline-offset-4">Privacy</a>
//             <a href="#" className="hover:text-sky-300 transition-colors underline decoration-2 underline-offset-4">Research</a>
//             <a href="#" className="hover:text-sky-300 transition-colors underline decoration-2 underline-offset-4">Terms</a>
//           </div>
//           <div className="md:text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
//             © 2026 Career Intelligence Systems
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }


"use client";

import React from 'react';
import {
  ArrowRight,
  Cpu,
  Target,
  BookOpen,
  MessageSquare,
  LineChart,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  GraduationCap,
  Library,
  FileSearch,
  CheckSquare,
  BarChart3,
  ChevronRight,
  Compass,
  TrendingUp
} from 'lucide-react';
import AscendingPlaneScene from '@/components/Plane';

// --- Structured Layout Components ---

const Navbar = () => (
  <nav className="sticky top-0 z-50 bg-white border-b-2 border-slate-900">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-900 flex items-center justify-center">
          <GraduationCap className="text-white" size={24} />
        </div>
        <span className="text-2xl font-bold tracking-tighter text-slate-900 uppercase">Ascendra</span>
      </div>
      <div className="hidden md:flex items-center gap-1">
        {['Competency', 'Outcomes', 'Roadmap', 'ROI'].map((item) => (
          <a key={item} href="#" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
            {item}
          </a>
        ))}
      </div>
      {/* Changed emerald-600/700/900 to sky-300/700/900 */}
      <a href="/login" className="bg-sky-300 text-white px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-sky-700 transition-all border-b-4 border-sky-900 active:border-b-0 active:translate-y-1 inline-block">
        Login
      </a>
    </div>
  </nav>
);


export default function AscendraAcademic() {
  const features = [
    {
      id: "MOD_01",
      title: "Resume Analytics",
      desc: "NER models extract skills, activities, and internship depth for a unified feature vector.",
      icon: <FileSearch size={24} />
    },
    {
      id: "MOD_02",
      title: "Competency Scoring",
      desc: "Placement readiness scores from 0-100 across technical and soft-skill domains.",
      icon: <BarChart3 size={24} />
    },
    {
      id: "MOD_03",
      title: "Outcome Mapping",
      desc: "Top 3 Company and Masters program suggestions based on competency-to-role fit.",
      icon: <Target size={24} />
    },
    {
      id: "MOD_04",
      title: "ROI Roadmap",
      desc: "Course recommendations ranked by market demand growth and salary uplift proxies.",
      icon: <BookOpen size={24} />
    },
    {
      id: "MOD_05",
      title: "Interview Simulation",
      desc: "AI-driven evaluation of content relevance, clarity, and structural answer quality.",
      icon: <MessageSquare size={24} />
    },
    {
      id: "MOD_06",
      title: "Market Dashboards",
      desc: "Real-time trends in role demand and skill growth to validate career trajectories.",
      icon: <LineChart size={24} />
    }
  ];

  return (
    // Changed selection color to sky-200
    <div className="min-h-screen bg-stone-50 text-slate-900 font-sans selection:bg-sky-200">
      <Navbar />

      {/* Hero Section - The "Abstract" */}
      <section className="relative py-32 lg:py-56 border-b-2 border-slate-900 bg-white overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a05_1px,transparent_1px),linear-gradient(to_bottom,#0f172a05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        {/* 1. THE UNBOUND PLANE: It now lives in a full-section container */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <AscendingPlaneScene
            modelScale={0.023}
            /* X: Positive is Right, Negative is Left
               Y: Positive is Up, Negative is Down 
            */
            modelPosition={[2, -0.5, 0]}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Left Content */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-300 text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-8">
              <Library size={12} /> Institutional Intelligence Platform
            </div>

            <h1 className="text-6xl lg:text-9xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.8] uppercase">
              Competency <br />
              <span className="text-sky-500 italic">Architecture.</span>
            </h1>

            <p className="max-w-lg text-lg text-slate-600 font-medium leading-relaxed mb-10">
              Mapping student potential through a **Unified Feature Vector**. We bridge the gap between academic theory and market-ready placement readiness.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="px-10 py-5 bg-slate-900 text-white font-bold uppercase tracking-widest text-sm shadow-[6px_6px_0px_#0ea5e9]">
                Begin Assessment <ArrowRight className="inline ml-2" size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Subtle background blueprint detail */}
        <div className="absolute bottom-10 right-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] select-none">
          Trajectory // Ascending_Vector_01
        </div>

        {/* Optional: Subtle Blueprint Grid Background */}

      </section>

      {/* Feature Grid - The "Curriculum" */}
      <section className="py-24 bg-stone-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header with improved hierarchy */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            {/* Changed border-emerald-600 to border-sky-300 */}
            <div className="border-l-8 border-sky-300 pl-8">
              <h2 className="text-4xl lg:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                Intelligence <br /> Systems
              </h2>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-4">
                Proprietary ML Core v2.0
              </p>
            </div>
            <div className="hidden lg:block">
              {/* Changed shadow hex from emerald to a dark sky blue hex (#075985) */}
              <div className="px-6 py-4 border-2 border-slate-900 bg-white text-slate-900 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#075985]">
                Status: Operational
              </div>
            </div>
          </div>

          {/* The "Index" Layout: 2-column list with shared borders */}
          {/* The "Index" Layout: Marquee rolling */}
          <div className=" overflow-hidden relative">
            <style jsx>{`
              @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-33.333333%); }
              }
              .animate-marquee {
                animation: marquee 40s linear infinite;
              }
              .animate-marquee:hover {
                animation-play-state: paused;
              }
            `}</style>
            <div className="flex animate-marquee w-max gap-2">
              {[...features, ...features, ...features].map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="w-[500px] flex-shrink-0 flex border-2 border-slate-900 p-8 group hover:bg-white transition-colors"
                >
                  {/* Vertical Index Marker */}
                  <div className="flex flex-col items-center justify-start mr-8">
                    <span className="text-[10px] font-black text-slate-400 rotate-180 [writing-mode:vertical-lr] mb-4">
                      {item.id}
                    </span>
                    {/* Changed group-hover:bg-emerald-600 to group-hover:bg-sky-300 */}
                    <div className="w-px h-full bg-slate-200 group-hover:bg-sky-300 transition-colors" />
                  </div>

                  <div className="flex-grow">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 border border-slate-900 flex items-center justify-center bg-white group-hover:bg-slate-900 group-hover:text-white transition-all shadow-[2px_2px_0px_#0f172a] group-hover:shadow-none">
                        {item.icon}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none pt-1">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed italic pr-4">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Changed text-emerald-600 to text-sky-300 */}
                    <ArrowRight className="text-sky-300" size={20} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Lifecycle - "The Workflow" */}

      <section className="py-24 border-y-2 border-slate-900 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase leading-none mb-12">
                A Continuous <br />
                {/* Changed text-emerald-500 to text-sky-500 */}
                <span className="text-sky-500">Feedback Loop.</span>
              </h2>
              <div className="space-y-0">
                {[
                  { t: "01 / Ingestion", d: "Sync Academic CGPA, Skills, and Coding Profiles." },
                  { t: "02 / Processing", d: "ML models generate a unique Competency Score." },
                  { t: "03 / Calibration", d: "Align profile with Internship and Hackathon tracks." },
                  { t: "04 / Evaluation", d: "Practice through AI Interviews and Mock Tests." }
                ].map((step, i) => (
                  <div key={i} className="group p-6 border-b border-slate-700 hover:bg-slate-800 transition-colors cursor-default">
                    <div className="flex justify-between items-center">
                      <div>
                        {/* Changed text-emerald-400 to text-sky-400 */}
                        <h4 className="text-lg font-bold uppercase tracking-widest text-sky-400 mb-1">{step.t}</h4>
                        <p className="text-slate-400 text-sm font-medium">{step.d}</p>
                      </div>
                      {/* Changed text-emerald-500 to text-sky-500 */}
                      <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity text-sky-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Changed border-emerald-500 to border-sky-500 */}
            <div className="bg-white p-2 border-4 border-sky-500">
              <div className="border-2 border-slate-900 p-10 text-slate-900">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-slate-100 flex items-center justify-center">
                    <CheckSquare className="text-slate-900" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Status</div>
                    <div className="text-xl font-bold uppercase">Placement Ready</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-slate-100 border border-slate-200">
                    {/* Changed bg-emerald-600 to bg-sky-300 */}
                    <div className="h-full bg-sky-300 w-[85%]" />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>Tech Depth</span>
                    <span>85 / 100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* Changed bg-emerald-600 to bg-sky-300 */}
      <section className="py-32 bg-sky-300 text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter mb-10">Ignite Your Academic Capital.</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-12 py-6 bg-slate-900 text-white font-bold uppercase tracking-widest hover:bg-black transition-all shadow-[8px_8px_0px_rgba(0,0,0,0.2)]">
              Begin Assessment
            </button>
            <button className="px-12 py-6 bg-white text-slate-900 font-bold uppercase tracking-widest hover:bg-slate-100 transition-all shadow-[8px_8px_0px_rgba(0,0,0,0.2)]">
              Partner with Us
            </button>
          </div>
          <p className="mt-12 text-[10px] font-bold uppercase tracking-[0.4em] opacity-80 italic">Standardized for the Class of 2026</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t-2 border-slate-900 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 flex items-center justify-center">
              <Zap className="text-white" size={16} />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter">Ascendra</span>
          </div>
          <div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {/* Changed all hover:text-emerald-600 to hover:text-sky-300 */}
            <a href="#" className="hover:text-sky-300 transition-colors underline decoration-2 underline-offset-4">Privacy</a>
            <a href="#" className="hover:text-sky-300 transition-colors underline decoration-2 underline-offset-4">Research</a>
            <a href="#" className="hover:text-sky-300 transition-colors underline decoration-2 underline-offset-4">Terms</a>
          </div>
          <div className="md:text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
            © 2026 Career Intelligence Systems
          </div>
        </div>
      </footer>
    </div>
  );
}

