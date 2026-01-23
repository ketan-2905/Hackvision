'use client';

import { useState, useEffect, useRef } from 'react';

export default function SpeechRecognition({ onTranscriptUpdate, onSendTranscript }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Check if browser supports Web Speech API
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event) => {
                    let interim = '';
                    let final = '';

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcriptPiece = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            final += transcriptPiece + ' ';
                        } else {
                            interim += transcriptPiece;
                        }
                    }

                    if (final) {
                        const newTranscript = transcript + final;
                        setTranscript(newTranscript);
                        if (onTranscriptUpdate) {
                            onTranscriptUpdate(newTranscript);
                        }
                    }
                    setInterimTranscript(interim);
                };

                recognitionRef.current.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [transcript, onTranscriptUpdate]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const clearTranscript = () => {
        setTranscript('');
        setInterimTranscript('');
        if (onTranscriptUpdate) {
            onTranscriptUpdate('');
        }
    };

    const sendTranscript = () => {
        if (transcript.trim() && onSendTranscript) {
            onSendTranscript(transcript.trim());
            clearTranscript();
        }
    };

    return (
        <div className="w-full">
            <div className="flex items-center gap-3 mb-3">
                <button
                    onClick={toggleListening}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isListening
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {isListening ? (
                        <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <rect x="6" y="4" width="8" height="12" rx="1" />
                            </svg>
                            Stop Recording
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                                <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                            </svg>
                            Start Recording
                        </>
                    )}
                </button>

                {transcript && (
                    <>
                        <button
                            onClick={sendTranscript}
                            className="px-4 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-all"
                        >
                            Send Response
                        </button>
                        <button
                            onClick={clearTranscript}
                            className="px-4 py-2 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white transition-all"
                        >
                            Clear
                        </button>
                    </>
                )}
            </div>

            {/* Transcript Display */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 min-h-[100px]">
                {transcript || interimTranscript ? (
                    <p className="text-gray-200 leading-relaxed">
                        {transcript}
                        {interimTranscript && (
                            <span className="text-gray-500 italic">{interimTranscript}</span>
                        )}
                    </p>
                ) : (
                    <p className="text-gray-500 italic">
                        Click "Start Recording" to begin speaking...
                    </p>
                )}
            </div>

            {/* Visual feedback */}
            {isListening && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                    <div className="flex gap-1">
                        <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Listening...</span>
                </div>
            )}
        </div>
    );
}
