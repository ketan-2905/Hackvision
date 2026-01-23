'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Type declarations for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface UseSpeechOptions {
    onTranscriptComplete?: (transcript: string) => void;
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
    silenceThreshold?: number; // milliseconds of silence before auto-submit
}

interface UseSpeechReturn {
    // TTS (Text-to-Speech)
    speakText: (text: string) => Promise<void>;
    stopSpeaking: () => void;
    isSpeaking: boolean;
    isMuted: boolean;
    toggleMute: () => void;

    // STT (Speech-to-Text)
    startListening: () => void;
    stopListening: () => void;
    isListening: boolean;
    transcript: string;
    interimTranscript: string;

    // Status
    isSupported: boolean;
    error: string | null;
}

export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
    const {
        onTranscriptComplete,
        onSpeechStart,
        onSpeechEnd,
        silenceThreshold = 2000,
    } = options;

    // TTS State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

    // STT State
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // General State
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check for Web Speech API support
        const hasSpeechSynthesis = 'speechSynthesis' in window;
        const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

        setIsSupported(hasSpeechSynthesis && hasSpeechRecognition);

        if (!hasSpeechRecognition) {
            setError('Speech Recognition not supported in this browser');
            return;
        }

        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
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
                setTranscript((prev) => prev + final);
            }

            setInterimTranscript(interim);
        };

        recognitionRef.current.onerror = (event: any) => {
            // Suppress common non-critical errors
            const suppressedErrors = ['no-speech', 'aborted', 'audio-capture'];

            if (!suppressedErrors.includes(event.error)) {
                console.error('Speech recognition error:', event.error);
                setError(`Speech recognition error: ${event.error}`);
            }
        };

        recognitionRef.current.onend = () => {
            // If we are supposed to be listening (manual control), restart
            // Note: simplistic approach. For manual toggle, usually we set isListening false on stop.
            // But if it stops unexpectedly, we might want to know.
            // For now, let's allow it to stop if the engine stops, but we'll reflect state.
            // Actually, standard behavior: if user didn't stop it, but it stopped, update state.
            setIsListening(false);
        };

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [transcript]);

    // Load and select best voice for TTS
    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();

            // Preferred voices (professional-sounding)
            const preferredVoices = [
                'Google US English',
                'Microsoft David Desktop',
                'Microsoft Zira Desktop',
                'Alex',
                'Samantha',
                'Daniel',
                'Karen',
            ];

            // Find the best available voice
            const voice = voices.find((v) =>
                preferredVoices.some((pref) => v.name.includes(pref))
            ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

            selectedVoiceRef.current = voice;
        };

        loadVoices();

        // Chrome requires waiting for voices to load
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // TTS: Speak text
    const speakText = useCallback(async (text: string): Promise<void> => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            setError('Speech Synthesis not supported');
            return;
        }

        if (isMuted) {
            console.log('TTS muted, skipping speech');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utteranceRef.current = utterance;

            // Configure utterance
            if (selectedVoiceRef.current) {
                utterance.voice = selectedVoiceRef.current;
            }
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => {
                setIsSpeaking(true);
                if (onSpeechStart) onSpeechStart();
            };

            utterance.onend = () => {
                setIsSpeaking(false);
                if (onSpeechEnd) onSpeechEnd();
                resolve();
            };

            utterance.onerror = (event) => {
                setIsSpeaking(false);
                // Suppress non-critical TTS errors
                if (event.error !== 'canceled' && event.error !== 'interrupted') {
                    console.error('TTS error:', event.error);
                    setError(`Speech synthesis error: ${event.error}`);
                }
                reject(event);
            };

            window.speechSynthesis.speak(utterance);
        });
    }, [isMuted, onSpeechStart, onSpeechEnd]);

    // TTS: Stop speaking
    const stopSpeaking = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    // TTS: Toggle mute
    const toggleMute = useCallback(() => {
        setIsMuted((prev) => !prev);
        if (!isMuted && isSpeaking) {
            stopSpeaking();
        }
    }, [isMuted, isSpeaking, stopSpeaking]);

    // STT: Start listening
    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            setError('Speech Recognition not initialized');
            return;
        }

        try {
            setTranscript('');
            setInterimTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
            setError(null);
        } catch (err: any) {
            // Already started - ignore
            if (err.message?.includes('already started')) {
                setIsListening(true);
            } else {
                setError(`Failed to start listening: ${err.message}`);
            }
        }
    }, []);

    // STT: Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (err) {
                // Ignore
            }
        }
        setIsListening(false);
        // Return the final transcript via callback or state
        // usage in component: wait for isListening to allow sending
    }, []);

    return {
        // TTS
        speakText,
        stopSpeaking,
        isSpeaking,
        isMuted,
        toggleMute,

        // STT
        startListening,
        stopListening,
        isListening,
        transcript,
        interimTranscript,

        // Status
        isSupported,
        error,
    };
}
