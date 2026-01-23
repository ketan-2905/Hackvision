// "use client";

// import React, { useState } from 'react';
// import { Upload, FileText, AlertCircle } from 'lucide-react';

// interface ResumeUploaderProps {
//     onUpload: (file: File) => Promise<void>;
//     isAnalyzing: boolean;
// }

// export const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onUpload, isAnalyzing }) => {
//     const [dragActive, setDragActive] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     const handleDrag = (e: React.DragEvent) => {
//         e.preventDefault();
//         e.stopPropagation();
//         if (e.type === "dragenter" || e.type === "dragover") {
//             setDragActive(true);
//         } else if (e.type === "dragleave") {
//             setDragActive(false);
//         }
//     };

//     const validateFile = (file: File): boolean => {
//         const validTypes = [
//             'application/pdf',
//             'application/msword',
//             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//         ];

//         if (!validTypes.includes(file.type)) {
//             setError('INVALID_FILE_TYPE: PDF, DOC, or DOCX only');
//             return false;
//         }

//         if (file.size > 5 * 1024 * 1024) { // 5MB
//             setError('FILE_TOO_LARGE: Maximum 5MB');
//             return false;
//         }

//         setError(null);
//         return true;
//     };

//     const handleDrop = async (e: React.DragEvent) => {
//         e.preventDefault();
//         e.stopPropagation();
//         setDragActive(false);

//         if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//             const file = e.dataTransfer.files[0];
//             if (validateFile(file)) {
//                 await onUpload(file);
//             }
//         }
//     };

//     const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         e.preventDefault();
//         if (e.target.files && e.target.files[0]) {
//             const file = e.target.files[0];
//             if (validateFile(file)) {
//                 await onUpload(file);
//             }
//         }
//     };

//     return (
//         <div className="border-2 border-slate-900 bg-white shadow-[8px_8px_0px_#0f172a] rounded-none p-8">
//             <div className="flex items-center justify-between mb-6">
//                 <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
//                     Resume Upload
//                 </h3>
//                 <FileText className="text-slate-400" size={24} />
//             </div>

//             <form
//                 onDragEnter={handleDrag}
//                 onDragLeave={handleDrag}
//                 onDragOver={handleDrag}
//                 onDrop={handleDrop}
//                 className="relative"
//             >
//                 <input
//                     type="file"
//                     id="resume-upload"
//                     accept=".pdf,.doc,.docx"
//                     onChange={handleChange}
//                     disabled={isAnalyzing}
//                     className="hidden"
//                 />

//                 <label
//                     htmlFor="resume-upload"
//                     className={`
//             flex flex-col items-center justify-center
//             border-4 border-dashed border-slate-900 bg-stone-50
//             p-12 cursor-pointer transition-all rounded-none
//             ${dragActive ? 'bg-sky-100' : 'hover:bg-stone-100'}
//             ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
//           `}
//                 >
//                     <Upload className={`mb-4 ${isAnalyzing ? 'text-slate-400' : 'text-slate-900'}`} size={48} />

//                     {isAnalyzing ? (
//                         <div className="text-center">
//                             <p className="text-lg font-black uppercase text-slate-900 mb-2">ANALYZING...</p>
//                             <div className="w-48 h-2 border-2 border-slate-900 bg-white overflow-hidden">
//                                 <div className="h-full bg-sky-300 animate-pulse" style={{ width: '60%' }} />
//                             </div>
//                         </div>
//                     ) : (
//                         <>
//                             <p className="text-lg font-black uppercase text-slate-900 mb-2">
//                                 Upload Resume
//                             </p>
//                             <p className="text-sm font-medium text-slate-600 mb-4">
//                                 Drag and drop or click to browse
//                             </p>
//                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
//                                 PDF, DOC, DOCX • MAX 5MB
//                             </p>
//                         </>
//                     )}
//                 </label>
//             </form>

//             {error && (
//                 <div className="mt-4 border-2 border-red-600 bg-red-50 p-4 flex items-start gap-3 rounded-none">
//                     <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
//                     <p className="text-xs font-bold text-red-900 uppercase">{error}</p>
//                 </div>
//             )}
//         </div>
//     );
// };

"use client";

import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface ResumeUploaderProps {
    onUpload: (file: File) => Promise<void>;
    isAnalyzing: boolean;
    serverError?: string | null;
    fileHash?: string | null;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
    onUpload,
    isAnalyzing,
    serverError,
    fileHash
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateFile = (file: File): boolean => {
        const validTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!validTypes.includes(file.type)) {
            setLocalError('INVALID_FILE_TYPE: PDF, DOC, or DOCX only');
            return false;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            setLocalError('FILE_TOO_LARGE: Maximum 5MB');
            return false;
        }

        setLocalError(null);
        return true;
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                await onUpload(file);
            }
        }
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                await onUpload(file);
            }
        }
    };

    // Determine what to show in the error box
    const displayError = localError || serverError;
    const isDuplicate = serverError === "DUPLICATE_RESUME";
    // Show hash toast whenever we have a hash, regardless of error status
    const showHashToast = fileHash;

    return (
        <div className="border-2 border-slate-900 bg-white shadow-[8px_8px_0px_#0f172a] rounded-none p-8 relative">

            {/* DOCUMENT SIGNATURE TOAST (Always show if hash exists) */}
            {showHashToast && (
                <div className="absolute top-0 right-0 left-0 z-20 animate-in fade-in slide-in-from-top-2 p-2 pointer-events-none">
                    <div className="border-2 border-slate-900 bg-stone-100 p-2 shadow-lg flex items-center justify-between mx-auto max-w-xs pointer-events-auto">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-2 h-2 bg-slate-900 rounded-full animate-pulse flex-shrink-0"></div>
                            <div className="overflow-hidden">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none mb-0.5">
                                    Signature Generated
                                </p>
                                <p className="text-[10px] font-mono font-bold text-slate-900 truncate">
                                    {fileHash}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6 mt-6">
                {/* Added mt-6 to push content down below the toast if needed, though toast is absolute */}
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
                    Resume Upload
                </h3>
                <div className="flex flex-col items-end">
                    <FileText className="text-slate-400 mb-1" size={24} />
                </div>
            </div>

            <form
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className="relative z-10"
            >
                <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={handleChange}
                    disabled={isAnalyzing}
                    className="hidden"
                />

                <label
                    htmlFor="resume-upload"
                    className={`
            flex flex-col items-center justify-center
            border-4 border-dashed border-slate-900 bg-stone-50
            p-12 cursor-pointer transition-all rounded-none
            ${dragActive ? 'bg-sky-100' : 'hover:bg-stone-100'}
            ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    <Upload className={`mb-4 ${isAnalyzing ? 'text-slate-400' : 'text-slate-900'}`} size={48} />

                    {isAnalyzing ? (
                        <div className="text-center">
                            <p className="text-lg font-black uppercase text-slate-900 mb-2">ANALYZING...</p>
                            <div className="w-48 h-2 border-2 border-slate-900 bg-white overflow-hidden">
                                <div className="h-full bg-sky-300 animate-pulse" style={{ width: '60%' }} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-lg font-black uppercase text-slate-900 mb-2">
                                Upload Resume
                            </p>
                            <p className="text-sm font-medium text-slate-600 mb-4">
                                Drag and drop or click to browse
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                PDF, DOC, DOCX • MAX 5MB
                            </p>
                        </>
                    )}
                </label>
            </form>

            {/* ERROR DISPLAY */}
            {displayError && (
                <div className={`mt-4 border-2 p-4 flex items-start gap-3 rounded-none relative z-10 ${isDuplicate ? "border-red-600 bg-red-100" : "border-red-600 bg-red-50"
                    }`}>
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    <div>
                        <p className="text-xs font-bold text-red-900 uppercase mb-1">
                            {isDuplicate ? "Duplicate resume detected" : "Upload Error"}
                        </p>
                        <p className="text-xs font-mono text-red-800 leading-tight">
                            {isDuplicate
                                ? "We are trying to temper the document. This file has already been processed."
                                : displayError}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

