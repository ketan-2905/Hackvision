'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/student/TopBar';
import { LayoutDashboard, FileText, FolderGit2, Target, MessageSquare } from 'lucide-react';
import WebcamContainer from './components/WebcamContainer';
import { useSpeech } from './hooks/useSpeech';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// Ascendra UI: Neo-Brutalist / Industrial Intelligence Aesthetic

export default function InterviewPage() {
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [weaknessInput, setWeaknessInput] = useState('');
  const [averageAnxietyScore, setAverageAnxietyScore] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewData, setInterviewData] = useState<{
    questions: string[];
    answers: string[];
    anxietyLevels: number[];
    startTime: number | null;
    endTime: number | null;
    weaknesses: string[];
  }>({
    questions: [],
    answers: [],
    anxietyLevels: [],
    startTime: null,
    endTime: null,
    weaknesses: [],
  });

  const lastSpokenMessageIdRef = useRef<string | null>(null);

  // Ref for anxiety samples to avoid re-renders
  const anxietySamplesRef = useRef<number[]>([]);
  const isListeningRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    startListening,
    stopListening,
    isListening,
    transcript,
    interimTranscript,
    speakText
  } = useSpeech({
    onTranscriptComplete: async (finalTranscript) => {
      // Manual control handles this now
    },
    onSpeechEnd: () => {
      // Manual control handles this now
    }
  });

  // Sync isListening ref
  useEffect(() => {
    isListeningRef.current = isListening;
    if (isListening) {
      // Clear samples on start
      anxietySamplesRef.current = [];
    }
  }, [isListening]);

  // Stable callback for anxiety updates
  const handleAnxietyUpdate = useCallback((score: number) => {
    setAverageAnxietyScore(score);
    if (isListeningRef.current) {
      anxietySamplesRef.current.push(score);
    }
  }, []);

  const saveInterviewLog = async (text: string, samples: number[]) => {
    try {
      const average = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
      const min = samples.length ? Math.min(...samples) : 0;
      const max = samples.length ? Math.max(...samples) : 0;

      const logData = {
        timestamp: new Date().toISOString(),
        transcript: text,
        anxietyData: {
          average,
          min,
          max,
          count: samples.length
        }
      };

      await fetch('/api/logs/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
    } catch (error) {
      console.error('Failed to save log:', error);
    }
  };

  // Simplified chat implementation without xAI dependency
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [realName, setRealName] = useState<string>("Student");
  const [profileProgress, setProfileProgress] = useState(25);

  // Track current user and their data for TopBar/Sidebar consistency
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Track user document for name and progress
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();

            // Update Name
            if (userData.full_name) {
              setRealName(userData.full_name);
            }

            // Calculate Dynamic Progress
            let progress = 25; // Base level
            if (userData.resume_url || userData.personal_info?.full_name) progress += 25;
            const hasQuiz = userData.history?.some((h: any) => h.type === 'quiz');
            if (hasQuiz) progress += 25;
            const hasInterview = userData.history?.some((h: any) => h.type === 'interview');
            if (hasInterview) progress += 25;
            setProfileProgress(progress);
          }
        });

        return () => unsubscribeDoc();
      } else {
        setRealName("Student");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Question pools based on topics
  const questionPools = {
    react: [
      "Explain how React's virtual DOM works and why it's beneficial.",
      "What's the difference between controlled and uncontrolled components?",
      "How would you optimize a slow-rendering React component?",
      "Describe the useEffect hook and common pitfalls.",
    ],
    typescript: [
      "What are the benefits of using TypeScript over JavaScript?",
      "Explain type guards and when you would use them.",
      "How do you handle type safety with API responses?",
      "What are generics and when would you use them?",
    ],
    default: [
      "Tell me about a challenging bug you fixed recently.",
      "How do you approach debugging complex issues?",
      "Describe your testing strategy for frontend applications.",
      "What's your experience with state management?",
    ],
  };

  const getNextQuestion = () => {
    // Select from question pool based on weaknesses
    const topicKey = weaknesses[0]?.toLowerCase() || 'default';
    const pool = questionPools[topicKey as keyof typeof questionPools] || questionPools.default;
    return pool[questionCount] || pool[questionCount % pool.length];
  };

  const sendMessage = async (message: { text: string; isHidden?: boolean }) => {
    try {
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message.text,
      };

      // Add user message
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      // Store answer and anxiety level
      setInterviewData(prev => ({
        ...prev,
        answers: [...prev.answers, message.text],
        anxietyLevels: [...prev.anxietyLevels, averageAnxietyScore],
      }));

      // Increment question count
      const newCount = questionCount + 1;
      setQuestionCount(newCount);

      // Simulate AI response
      setTimeout(() => {
        let aiResponse = '';

        if (newCount >= 4) {
          // Ending message
          aiResponse = "That concludes the interview. Thank you for your time! I'm analyzing your responses now. You did great!";

          // Store final data and navigate to results
          setTimeout(() => {
            const finalData = {
              ...interviewData,
              answers: [...interviewData.answers, message.text],
              anxietyLevels: [...interviewData.anxietyLevels, averageAnxietyScore],
              endTime: Date.now(),
            };

            localStorage.setItem('lastInterview', JSON.stringify(finalData));

            // Exit fullscreen
            if (document.fullscreenElement) {
              document.exitFullscreen();
            }

            // Navigate to results
            window.location.href = '/student/interview/results';
          }, 3000);
        } else {
          // Next question
          aiResponse = getNextQuestion();

          // Store question
          setInterviewData(prev => ({
            ...prev,
            questions: [...prev.questions, aiResponse],
          }));
        }

        const aiMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse,
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);

        // Trigger TTS
        speakText(aiMessage.content).catch(err => {
          if (err?.error !== 'interrupted') {
            console.error('TTS error:', err);
          }
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  const addWeakness = () => {
    if (weaknessInput.trim() && !weaknesses.includes(weaknessInput.trim())) {
      setWeaknesses([...weaknesses, weaknessInput.trim()]);
      setWeaknessInput('');
    }
  };

  const removeWeakness = (weakness: string) => {
    setWeaknesses(weaknesses.filter((w) => w !== weakness));
  };

  const startInterview = async () => {
    setInterviewStarted(true);

    // Initialize interview data
    const startData = {
      questions: [],
      answers: [],
      anxietyLevels: [],
      startTime: Date.now(),
      endTime: null,
      weaknesses: weaknesses,
    };
    setInterviewData(startData);

    // Greeting message
    const greeting = `Hello! I'll be conducting your technical interview today. I'll ask you 4 questions${weaknesses.length > 0 ? ` focusing on ${weaknesses.join(', ')}` : ''}. Please speak clearly and take your time to answer each question. Ready? Let's begin!`;

    const greetingMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: greeting,
    };

    setMessages([greetingMessage]);
    speakText(greeting).catch(err => {
      if (err?.error !== 'interrupted') {
        console.error('TTS error:', err);
      }
    });

    // First question after greeting
    setTimeout(() => {
      const firstQuestion = getNextQuestion();
      const questionMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: firstQuestion,
      };

      setMessages(prev => [...prev, questionMessage]);
      setInterviewData(prev => ({
        ...prev,
        questions: [firstQuestion],
      }));

      speakText(firstQuestion).catch(err => {
        if (err?.error !== 'interrupted') {
          console.error('TTS error:', err);
        }
      });
    }, 4000);
  };

  // Automatically speak AI responses
  useEffect(() => {
    if (messages.length === 0 || !interviewStarted) return;

    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage.role === 'assistant' &&
      lastMessage.id !== lastSpokenMessageIdRef.current &&
      !isLoading
    ) {
      lastSpokenMessageIdRef.current = lastMessage.id;
      const messageContent = (lastMessage as any).content || '';
      speakText(messageContent).catch((err) => {
        console.error('TTS error:', err);
      });
    }
  }, [messages, interviewStarted, isLoading, speakText]);

  if (!mounted) {
    return null;
  }

  const sidebarItems = [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, isActive: false },
    { label: 'Tests', href: '/student/tests', icon: FileText, isActive: false },
    { label: 'Interview', href: '/student/interview', icon: MessageSquare, isActive: true },
    { label: 'Projects', href: '/student/projects', icon: FolderGit2, isActive: false },
    { label: 'IUTS', href: '/student/iuts', icon: Target, isActive: false }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <Sidebar items={sidebarItems} userName={realName} />

      <div className="pl-64">
        <div className="min-h-screen bg-stone-50 text-slate-900 font-sans selection:bg-sky-300 selection:text-slate-900">
          {/* Header - Sticky, Ascendra Style */}
          {!interviewStarted && (
            <TopBar
              profileProgress={profileProgress}
              status="ANALYZED"
              userName={realName}
            />
          )}

          <main className={interviewStarted ? "h-screen bg-stone-50 overflow-hidden relative" : "max-w-4xl mx-auto px-6 py-12"}>
            {!interviewStarted ? (
              /* Setup Screen - Ascendra Style */
              <div className="space-y-12 animate-fade-in">
                {/* Hero Section */}
                <div className="border-l-4 border-slate-900 pl-6 space-y-2">
                  <h2 className="text-6xl font-black uppercase tracking-tighter text-slate-900 leading-[0.9]">
                    PROTOCOL <br /> INITIALIZATION
                  </h2>
                  <p className="text-lg font-medium text-slate-600 max-w-xl">
                    Calibrate your environment for the session. Face detection and voice interaction modules required.
                  </p>
                </div>

                {/* Webcam Preview - The Brutalist Card */}
                <div className="border-2 border-slate-900 bg-white p-2 shadow-[8px_8px_0px_#0f172a] hover:translate-y-1 hover:shadow-none transition-all duration-300">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <h3 className="text-xl font-black uppercase tracking-tight">VISUAL_SENSOR_CHECK</h3>
                    <span className="bg-sky-300 border-2 border-slate-900 px-2 text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_#0f172a]">
                      ACTIVE
                    </span>
                  </div>
                  <WebcamContainer onAnxietyUpdate={handleAnxietyUpdate} className="w-full border-2 border-slate-900 aspect-video" />
                  <div className="mt-2 flex justify-between px-2 font-mono text-[10px] text-slate-400">
                    <span>LATENCY: 12ms</span>
                    <span>ENCRYPTION: AES-256</span>
                  </div>
                </div>

                {/* Configuration - The Feature Vector */}
                <div className="border-2 border-slate-900 bg-stone-100 p-6 shadow-[8px_8px_0px_#0f172a]">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                    <span className="w-4 h-4 bg-sky-300 border border-slate-900 block"></span>
                    TARGET_PARAMETERS (WEAKNESSES)
                  </h3>

                  <div className="flex gap-4 mb-6">
                    <input
                      type="text"
                      value={weaknessInput}
                      onChange={(e) => setWeaknessInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addWeakness()}
                      placeholder="ENTER_PARAM..."
                      className="flex-1 bg-white border-2 border-slate-900 px-4 py-3 font-mono text-sm placeholder:text-slate-400 focus:outline-none focus:bg-sky-50 transition-colors rounded-none shadow-[4px_4px_0px_#0f172a]"
                    />
                    <button
                      onClick={addWeakness}
                      className="bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 px-8 py-3 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_#0ea5e9] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                    >
                      Confirm
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {weaknesses.map((weakness) => (
                      <span
                        key={weakness}
                        className="group px-4 py-2 bg-white border-2 border-slate-900 flex items-center gap-3 shadow-[2px_2px_0px_#0f172a] hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <span className="font-bold uppercase tracking-wider text-xs">{weakness}</span>
                        <button
                          onClick={() => removeWeakness(weakness)}
                          className="text-slate-400 group-hover:text-red-600 font-bold"
                        >
                          X
                        </button>
                      </span>
                    ))}
                    {weaknesses.length === 0 && (
                      <div className="text-slate-500 font-mono text-xs border border-dashed border-slate-400 p-2 w-full text-center bg-stone-50">
                     // NO_DATA_INPUT_DETECTED
                      </div>
                    )}
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={startInterview}
                  className="w-full bg-sky-300 hover:bg-sky-200 text-slate-900 border-2 border-slate-900 py-6 font-black text-2xl uppercase tracking-tighter shadow-[8px_8px_0px_#0f172a] hover:translate-y-1 hover:translate-x-1 hover:shadow-none active:bg-sky-400 transition-all"
                >
                  INITIALIZE_SESSION_ {">>"}
                </button>
              </div>
            ) : (
              /* Interview Screen - Full Screen Mode (Ascendra Styles) */
              <div className="fixed inset-0 z-50 bg-stone-50 p-4">

                {/* Webcam Frame - Heavy Borders */}
                <div className="relative w-full h-full border-4 border-slate-900 bg-slate-900 shadow-[8px_8px_0px_#0f172a] overflow-hidden">
                  <WebcamContainer onAnxietyUpdate={handleAnxietyUpdate} className="w-full h-full" showOverlay={true} />

                  {/* Dark Gradient Overlay for readability of white text if needed, but we use Cards now. 
                   Let's keep a subtle one for depth. */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/50 via-transparent to-slate-900/30" />
                </div>

                {/* Header Overlay */}
                <div className="absolute top-8 left-8 right-8 z-20 flex justify-between items-start pointer-events-none">
                  <div className="bg-white border-2 border-slate-900 p-4 shadow-[4px_4px_0px_#0f172a]">
                    <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900">
                      INTERVIEW_MODE
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 bg-red-500 animate-pulse"></span>
                      <p className="text-[10px] font-mono text-slate-500">LIVE_FEED_ACTIVE</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-slate-900 border-2 border-slate-900 p-3 shadow-[4px_4px_0px_#0ea5e9]">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest">CURRENT_ANXIETY</span>
                        <span className={`font-black text-xl ${averageAnxietyScore > 0.6 ? 'text-red-500' : 'text-white'}`}>
                          {(averageAnxietyScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat/Question Overlay - Centered */}
                <div className="absolute top-32 left-0 right-0 px-4 z-20 flex justify-center pointer-events-none">
                  <div className="max-w-4xl w-full flex flex-col gap-6 pointer-events-auto">
                    {messages.length > 0 && (
                      <div className="flex flex-col gap-4">
                        {/* Show only the latest AI message */}
                        {messages.filter(m => m.role === 'assistant').slice(-1).map((m) => (
                          <div key={m.id} className="bg-white border-2 border-slate-900 p-6 shadow-[8px_8px_0px_#0f172a]">
                            <div className="flex items-center gap-2 mb-3 border-b-2 border-slate-100 pb-2">
                              <span className="w-3 h-3 bg-slate-900"></span>
                              <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">AI_INTERVIEWER</h3>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-slate-800 leading-tight">
                              {(m as any).content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Transcript Overlay - Intelligence Log Style */}
                {isListening && (
                  <div className="absolute bottom-40 left-0 right-0 px-4 z-20 flex justify-center pointer-events-none">
                    <div className="bg-slate-900 border-2 border-slate-900 p-4 max-w-2xl w-full shadow-[4px_4px_0px_#0ea5e9] pointer-events-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest">AUDIO_STREAM_DETECTED</span>
                        <div className="flex gap-1">
                          <div className="w-1 h-3 bg-sky-400 animate-pulse"></div>
                          <div className="w-1 h-3 bg-sky-400 animate-pulse delay-75"></div>
                          <div className="w-1 h-3 bg-sky-400 animate-pulse delay-150"></div>
                        </div>
                      </div>
                      <p className="font-mono text-sm text-sky-100 leading-relaxed border-l-2 border-sky-500 pl-3">
                        "{transcript || "..."}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom Controls */}
                <div className="absolute bottom-12 left-0 right-0 z-30 flex justify-center items-center gap-6 pointer-events-none">
                  <button
                    onClick={async () => {
                      if (isListening) {
                        stopListening();
                        const finalMessage = (transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
                        if (finalMessage) {
                          await saveInterviewLog(finalMessage, anxietySamplesRef.current);
                          await sendMessage({ text: finalMessage });
                        }
                      } else {
                        startListening();
                      }
                    }}
                    className={`pointer-events-auto group relative flex items-center gap-4 px-10 py-5 font-black text-xl uppercase tracking-widest border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all ${isListening
                      ? 'bg-red-500 text-white shadow-[6px_6px_0px_#7f1d1d]'
                      : 'bg-sky-300 text-slate-900 hover:bg-sky-200'
                      }`}
                  >
                    {isListening ? (
                      <>
                        <span className="w-4 h-4 bg-white border-2 border-slate-900 animate-pulse"></span>
                        TERMINATE_RECORDING
                      </>
                    ) : (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-slate-900 bg-red-500"></span>
                        INITIATE_RESPONSE
                      </>
                    )}
                  </button>
                </div>

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="absolute bottom-48 left-0 right-0 flex justify-center z-10 pointer-events-none">
                    <div className="bg-white border-2 border-slate-900 px-4 py-2 flex items-center gap-3 shadow-[4px_4px_0px_#0f172a]">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-900 animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-900 animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-slate-900 animate-bounce delay-200"></div>
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-900">PROCESSING_NEURAL_RESPONSE...</span>
                    </div>
                  </div>
                )}

              </div>
            )}
          </main>
        </div>

      </div>
    </div>
  );
}
