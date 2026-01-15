'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Clock, CheckCircle2, AlertCircle, Loader2, Mic, Square, Volume2,
    Home, User, FileText, Briefcase, ClipboardList, Send, Edit3, Zap
} from 'lucide-react';
import { GroupDiscussionRound } from '@/components/assessment/GroupDiscussionRound';
import CodingRound from '@/components/assessment/CodingRound';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize2, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const fullscreenExamStyle = `
/* CSS Variables for theme colors - aligned with StudentProfile's primary, gradients, and dark mode */
:root {
  --exam-bg: #f8fafc; /* slate-50 similar to bg-gray-50 */
  --exam-header-bg: white; /* Changed to white */
  --exam-header-color: #4b5563; /* Changed to gray-700 for text */
  --exam-border: #e2e8f0; /* gray-200 */
  --question-footer-bg: #ffffff; /* white */
  --question-footer-border: #e5e7eb; /* gray-300 */
  --question-content-bg: #ffffff; /* white with backdrop-blur */
  --question-content-text: #1f2937; /* gray-800 */
  --option-bg: #f9fafb; /* gray-50 */
  --option-border: #d1d5db; /* gray-300 */
  --option-text: #1f2937;
  --option-hover-bg: #f3f4f6; /* gray-100 */
  --option-selected-bg: #dbeafe; /* blue-100 */
  --option-selected-border: #3b82f6; /* blue-500 */
  --button-primary-bg: linear-gradient(to right, #3b82f6, #6366f1);
  --button-primary-text: white;
  --button-secondary-bg: #f3f4f6;
  --button-secondary-text: #4b5563;
  --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-sm */
  --hover-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* hover:shadow-md */
  --backdrop-blur: blur(8px);
}

/* Dark mode variables - matching StudentProfile dark classes */
.dark {
  --exam-bg: #0f172a; /* slate-900 */
  --exam-header-bg: #1e293b; /* Changed to slate-800 for dark gray */
  --exam-header-color: white; /* Kept as white */
  --exam-border: #334155; /* slate-700 */
  --question-footer-bg: #1e293b; /* slate-800 */
  --question-footer-border: #334155;
  --question-content-bg: #1e293b;
  --question-content-text: #f8fafc; /* slate-50 */
  --option-bg: #1e293b;
  --option-border: #475569; /* slate-600 */
  --option-text: #f8fafc;
  --option-hover-bg: #334155;
  --option-selected-bg: #1e40af; /* blue-900 */
  --option-selected-border: #60a5fa; /* blue-400 */
  --button-primary-bg: linear-gradient(to right, #2563eb, #4f46e5);
  --button-primary-text: white;
  --button-secondary-bg: #334155;
  --button-secondary-text: #e2e8f0; /* slate-300 */
}

.fullscreen-exam {
  position: fixed !important;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh;
  z-index: 9999;
  background: var(--exam-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  max-width: 100% !important;
  max-height: 100% !important;
  font-family: inherit;
}

.fullscreen-exam .exam-header {
  background: var(--exam-header-bg);
  color: var(--exam-header-color);
  border-bottom: 1px solid var(--exam-border);
  box-shadow: var(--card-shadow);
}

.fullscreen-exam .exam-content {
  flex: 1;
  display: flex;
  gap: 1rem; /* gap-4 */
  width: 100%;
  height: calc(100vh - 130px);
  overflow: hidden;
  padding: 1rem;
}

.fullscreen-exam .question-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--question-content-bg);
  border-radius: 1rem; /* rounded-xl */
  border: 1px solid var(--exam-border); /* border-gray-200/50 */
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease; /* transition-all duration-300 */
}

.fullscreen-exam .question-container:hover {
  box-shadow: var(--hover-shadow);
  transform: translateY(-2px); /* hover:-translate-y-1 */
}

.fullscreen-exam .question-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem; /* p-6 */
  background: rgba(255, 255, 255, 0.8); /* bg-white/80 */
  backdrop-filter: var(--backdrop-blur); /* backdrop-blur-sm */
  color: var(--question-content-text);
}

.dark .fullscreen-exam .question-content {
  background: rgba(31, 41, 55, 0.8); /* dark:bg-gray-800/80 */
}

.fullscreen-exam .question-footer {
  position: sticky;
  bottom: 0;
  width: 100%;
  background: var(--question-footer-bg);
  border-top: 1px solid var(--question-footer-border);
  padding: 1rem;
  box-shadow: var(--card-shadow);
}

.fullscreen-exam .question-palette {
  width: 280px;
  height: 100%;
  overflow-y: auto;
  background: var(--question-content-bg);
  border-left: 1px solid var(--exam-border);
  border-radius: 1rem;
  border: 1px solid var(--exam-border);
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
}

.fullscreen-exam .question-palette:hover {
  box-shadow: var(--hover-shadow);
}

.fullscreen-exam .option-item {
  background: var(--option-bg);
  border: 1px solid var(--option-border);
  color: var(--option-text);
  border-radius: 0.5rem; /* rounded-lg */
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
}

.fullscreen-exam .option-item:hover {
  background: var(--option-hover-bg);
  transform: translateY(-1px);
  box-shadow: var(--card-shadow);
}

.fullscreen-exam .option-item.selected {
  background: var(--option-selected-bg);
  border-color: var(--option-selected-border);
}

.fullscreen-exam button.primary {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.fullscreen-exam button.primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: var(--hover-shadow);
}

.fullscreen-exam button.secondary {
  background: var(--button-secondary-bg);
  color: var(--button-secondary-text);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.fullscreen-exam button.secondary:hover {
  background: var(--option-hover-bg);
}

@media (max-width: 1024px) {
  .fullscreen-exam .exam-content {
    flex-direction: column;
    padding: 0;
    height: calc(100vh - 60px);
  }
  .fullscreen-exam .question-palette {
    width: 100%;
    height: auto;
    max-height: 200px;
  }
}

/* Browser-specific fullscreen selectors */
:fullscreen {
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
}

:-webkit-full-screen {
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
}

:-ms-fullscreen {
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
}

.fullscreen-exam .stat-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  background: #dbeafe; /* blue-100 */
  color: #1e40af; /* blue-800 */
  border: 1px solid #93c5fd; /* blue-300 */
}

.dark .fullscreen-exam .stat-badge {
  background: #1e3a8a/30; /* primary-900/30 */
  color: #93c5fd;
}
`;

interface Question {
    question_id: string;
    question_text: string;
    question_type: string;
    question_order: number;
    points: number;
    options?: string[];
    question_metadata?: any;
}

interface Round {
    round_id: string;
    round_number: number;
    round_name: string;
    round_type?: string;
    duration_minutes: number;
    round_start_time?: string;
    max_score: number;
    questions: Question[];
}

interface PackageInfo {
    package_id: string;
    assessment_name: string;
    total_rounds: number;
    current_round: number;
    round_details?: {
        round_id: string;
        round_number: number;
        duration_minutes: number;
    };
}

// Speech Recognition Types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: any) => void;
    onend: () => void;
}

type ExamState = 'instructions' | 'round_instructions' | 'exam' | 'round_complete' | 'assessment_complete';

interface DishaAssessmentExamProps {
    packageId: string;
    studentId: string;
    onComplete?: () => void;
}

export default function DishaAssessmentExam({ packageId, studentId, onComplete }: DishaAssessmentExamProps) {
    const router = useRouter();

    // State
    const [examState, setExamState] = useState<ExamState>('instructions');
    const [loading, setLoading] = useState(false);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
    const [currentRound, setCurrentRound] = useState<Round | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [audioPlayed, setAudioPlayed] = useState(false);
    const [overallTimeRemaining, setOverallTimeRemaining] = useState<number | null>(null);
    const [timeWindowRemaining, setTimeWindowRemaining] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roundScore, setRoundScore] = useState<number | null>(null);

    // UI State
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
    const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));

    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const overallTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const roundStartTimeRef = useRef<Date | null>(null);
    const attemptStartTimeRef = useRef<Date | null>(null);
    const [isExitingFullscreen, setIsExitingFullscreen] = useState(false);
    const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    // Helper to add/remove a class to body for hiding sidebar
    function setSidebarHidden(hidden: boolean) {
        if (typeof document !== 'undefined') {
            if (hidden) {
                document.body.classList.add('hide-sidebar')
            } else {
                document.body.classList.remove('hide-sidebar')
            }
        }
    }

    // Live Transcription States
    const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
    const isTranscribingRef = useRef(false);

    // Initialize Web Speech API
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    let interim = '';
                    let final = '';

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            final += transcript + ' ';
                        } else {
                            interim += transcript;
                        }
                    }

                    setInterimTranscript(interim);
                    if (final) {
                        setLiveTranscript(prev => {
                            const newTranscript = prev + final;
                            // Auto-update the answer
                            if (currentRound && currentRound.questions[currentQuestionIndex]) {
                                handleAnswer(currentRound.questions[currentQuestionIndex].question_id, newTranscript + interim);
                            }
                            return newTranscript;
                        });
                    } else {
                        // Update with interim
                        if (currentRound && currentRound.questions[currentQuestionIndex]) {
                            handleAnswer(currentRound.questions[currentQuestionIndex].question_id, liveTranscript + interim);
                        }
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    if (event.error === 'not-allowed') {
                        toast.error('Microphone permission denied');
                        setIsLiveTranscribing(false);
                    }
                };

                recognition.onend = () => {
                    if (isTranscribingRef.current && speechRecognitionRef.current === recognition) {
                        try {
                            recognition.start();
                        } catch (e) {
                            // Ignore re-start errors
                        }
                    }
                };

                speechRecognitionRef.current = recognition;
            }
        }

        return () => {
            if (speechRecognitionRef.current) {
                try {
                    speechRecognitionRef.current.stop();
                } catch (e) { }
            }
        };
    }, [currentRound, currentQuestionIndex]);

    // Add styles to head
    useEffect(() => {
        let styleTag: HTMLStyleElement | null = null;
        if (typeof document !== 'undefined') {
            styleTag = document.createElement('style');
            styleTag.innerHTML = fullscreenExamStyle;
            document.head.appendChild(styleTag);
        }
        return () => {
            if (styleTag && document.head.contains(styleTag)) {
                document.head.removeChild(styleTag);
            }
        };
    }, []);

    // Fullscreen auto-enter
    useEffect(() => {
        if (examState === 'exam' && !isFullscreen) {
            toggleFullscreen();
        }
    }, [examState]);

    useEffect(() => {
        // Cleanup fullscreen on unmount
        return () => {
            setSidebarHidden(false);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
        };
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const fs = !!document.fullscreenElement;
            setIsFullscreen(fs);
            setSidebarHidden(fs);
            if (!fs && examState === 'exam') {
                // If exited fullscreen manually
                // You might want to warn or auto-submit here
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [examState]);

    // Normalize options from various backend formats
    const normalizeMcqOptions = (q: any): string[] => {
        if (!q) return []
        // 1) Array of strings/objects
        if (Array.isArray(q.options)) {
            return q.options.map((o: any) => typeof o === 'string' ? o : (o?.text ?? o?.label ?? JSON.stringify(o)))
        }
        // 2) 'choices' array
        if (Array.isArray(q.choices)) {
            return q.choices.map((o: any) => typeof o === 'string' ? o : (o?.text ?? o?.label ?? JSON.stringify(o)))
        }
        // 3) JSON string in options/options_json
        const jsonCandidate = q.options_json || q.options
        if (typeof jsonCandidate === 'string') {
            try {
                const parsed = JSON.parse(jsonCandidate)
                if (Array.isArray(parsed)) {
                    return parsed.map((o: any) => typeof o === 'string' ? o : (o?.text ?? o?.label ?? JSON.stringify(o)))
                }
                if (parsed && typeof parsed === 'object') {
                    const vals = Object.values(parsed as Record<string, any>)
                    return vals.map((o: any) => typeof o === 'string' ? o : (o?.text ?? o?.label ?? JSON.stringify(o)))
                }
            } catch { }
        }
        // 4) option_a/option_b/option_c/option_d fields
        const keySet = ['option_a', 'option_b', 'option_c', 'option_d']
        const fromFields = keySet.map(k => q[k]).filter(Boolean)
        if (fromFields.length > 0) return fromFields
        // 5) options as object {A: '...', B: '...'}
        if (q.options && typeof q.options === 'object') {
            return Object.values(q.options)
        }
        return []
    }

    // Fullscreen toggle
    const toggleFullscreen = async () => {
        try {
            if (!isFullscreen) {
                const elem: any = document.documentElement;
                if (elem.requestFullscreen) await elem.requestFullscreen();
                else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) await document.exitFullscreen();
                else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
            }
            // Update state slightly delayed to catch the change
            setTimeout(() => {
                const fs = !!document.fullscreenElement;
                setIsFullscreen(fs);
            }, 100);
        } catch (e) {
            console.error('Fullscreen toggle failed', e);
        }
    };

    const startLiveTranscription = () => {
        if (!speechRecognitionRef.current) {
            toast.error('Speech recognition not supported in this browser');
            return;
        }

        // Load existing answer into transcript so we append to it
        const currentId = currentRound?.questions[currentQuestionIndex]?.question_id;
        const currentAnswer = currentId ? userAnswers[currentId] || '' : '';
        setLiveTranscript(currentAnswer.endsWith(' ') ? currentAnswer : currentAnswer + ' ');

        setInterimTranscript('');
        isTranscribingRef.current = true;
        try {
            speechRecognitionRef.current.start();
            setIsLiveTranscribing(true);
        } catch (e) {
            console.error(e);
        }
    };

    const stopLiveTranscription = () => {
        if (!speechRecognitionRef.current) return;
        isTranscribingRef.current = false;
        try {
            speechRecognitionRef.current.stop();
        } catch (e) { }

        setIsLiveTranscribing(false);
        setInterimTranscript('');

        // Final update
        if (currentRound && currentRound.questions[currentQuestionIndex]) {
            const final = (liveTranscript + interimTranscript).trim();
            handleAnswer(currentRound.questions[currentQuestionIndex].question_id, final);
        }
    };

    // Load saved answers from localStorage
    useEffect(() => {
        if (attemptId && currentRound) {
            const saved = localStorage.getItem(`disha-answers-${attemptId}-${currentRound.round_id}`);
            if (saved) {
                try {
                    setUserAnswers(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to load saved answers', e);
                }
            }
        }
    }, [attemptId, currentRound?.round_id]);

    // Save answers to localStorage
    useEffect(() => {
        if (attemptId && currentRound && Object.keys(userAnswers).length > 0) {
            localStorage.setItem(`disha-answers-${attemptId}-${currentRound.round_id}`, JSON.stringify(userAnswers));
        }
    }, [userAnswers, attemptId, currentRound?.round_id]);

    // Fetch round details when in round_instructions state
    useEffect(() => {
        const fetchRoundDetails = async () => {
            if (examState === 'round_instructions' && attemptId && packageInfo && !packageInfo.round_details) {
                try {
                    setLoading(true);
                    const packageStatus = await apiClient.getDishaPackageStatus(packageId);
                    if (packageStatus.rounds_progress && packageStatus.rounds_progress.length > 0) {
                        const currentRoundData = packageStatus.rounds_progress.find(
                            (r: any) => r.round_number === (packageInfo.current_round || 1)
                        );
                        if (currentRoundData) {
                            setPackageInfo(prev => prev ? {
                                ...prev,
                                round_details: {
                                    round_id: currentRoundData.round_id,
                                    round_number: currentRoundData.round_number,
                                    duration_minutes: currentRoundData.duration_minutes
                                }
                            } : null);
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch round details:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchRoundDetails();
    }, [examState, attemptId, packageInfo?.current_round, packageId]);

    // Refs for timer logic to avoid dependency cycles
    const overallTimeRef = useRef<number | null>(null);
    const timeWindowRef = useRef<number | null>(null);
    const isSubmittingRef = useRef(isSubmitting);

    // Update refs when state changes
    useEffect(() => {
        overallTimeRef.current = overallTimeRemaining;
    }, [overallTimeRemaining]);

    useEffect(() => {
        timeWindowRef.current = timeWindowRemaining;
    }, [timeWindowRemaining]);

    useEffect(() => {
        isSubmittingRef.current = isSubmitting;
    }, [isSubmitting]);

    // Round timer countdown
    useEffect(() => {
        if (examState === 'exam' && currentRound && roundStartTimeRef.current) {
            const updateTimer = () => {
                const now = new Date();
                const elapsed = Math.floor((now.getTime() - roundStartTimeRef.current!.getTime()) / 1000);
                const remaining = (currentRound.duration_minutes * 60) - elapsed;

                // Check overall time using refs to avoid re-triggering effect
                let shouldAutoSubmit = remaining <= 0;

                if (attemptId) {
                    const overall = overallTimeRef.current;
                    const window = timeWindowRef.current;

                    if (overall !== null || window !== null) {
                        const effectiveRemaining = overall !== null
                            ? Math.min(overall, window || Infinity)
                            : window;

                        if (effectiveRemaining !== null && effectiveRemaining <= 0) {
                            shouldAutoSubmit = true;
                        }
                    }
                }

                if (shouldAutoSubmit) {
                    // Prevent duplicate submission calls
                    if (!isSubmittingRef.current) {
                        isSubmittingRef.current = true; // Local lock
                        setTimeRemaining(0);
                        handleAutoSubmit();
                    }
                } else {
                    setTimeRemaining(Math.max(0, remaining));
                }
            };

            updateTimer();
            timerIntervalRef.current = setInterval(updateTimer, 1000);

            return () => {
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                }
            };
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        }
    }, [examState, currentRound, attemptId]); // Removed unstable dependencies

    // Overall attempt timer countdown
    useEffect(() => {
        if (!attemptId || examState === 'instructions' || examState === 'assessment_complete') {
            return;
        }

        const updateOverallTimer = async () => {
            try {
                const status = await apiClient.getDishaAttemptStatus(packageId, attemptId);
                if (status.overall_time_remaining_seconds !== null && status.overall_time_remaining_seconds !== undefined) {
                    setOverallTimeRemaining(status.overall_time_remaining_seconds);
                }
                if (status.time_window_remaining_seconds !== null && status.time_window_remaining_seconds !== undefined) {
                    setTimeWindowRemaining(status.time_window_remaining_seconds);
                }
            } catch (error) {
                console.error('Failed to update overall timer:', error);
            }
        };

        // Update immediately
        updateOverallTimer();

        // Then update every 10 seconds (reduced frequency)
        overallTimerIntervalRef.current = setInterval(updateOverallTimer, 10000);

        return () => {
            if (overallTimerIntervalRef.current) {
                clearInterval(overallTimerIntervalRef.current);
            }
        };
    }, [attemptId, examState, packageId]); // Removed currentRound and isSubmitting to prevent spam

    const startAssessment = async () => {
        try {
            setLoading(true);
            const response = await apiClient.startDishaAssessment(packageId, studentId);
            setAttemptId(response.attempt_id);
            setPackageInfo(response);
            attemptStartTimeRef.current = new Date();

            // Fetch initial time remaining
            const status = await apiClient.getDishaAttemptStatus(packageId, response.attempt_id);
            if (status.overall_time_remaining_seconds !== null) {
                setOverallTimeRemaining(status.overall_time_remaining_seconds);
            }
            if (status.time_window_remaining_seconds !== null) {
                setTimeWindowRemaining(status.time_window_remaining_seconds);
            }

            setExamState('round_instructions');
        } catch (error: any) {
            console.error('Failed to start assessment:', error);
            toast.error(error.response?.data?.detail || 'Failed to start assessment');
        } finally {
            setLoading(false);
        }
    };

    const startRound = async (roundId: string) => {
        try {
            setLoading(true);
            const response = await apiClient.getDishaRoundQuestions(packageId, roundId, attemptId!);

            // Parse round_start_time
            if (response.round_start_time) {
                roundStartTimeRef.current = new Date(response.round_start_time);
            } else {
                roundStartTimeRef.current = new Date();
            }

            // Update overall time remaining from response
            if (response.overall_time_remaining_seconds !== null && response.overall_time_remaining_seconds !== undefined) {
                setOverallTimeRemaining(response.overall_time_remaining_seconds);
            }
            if (response.time_window_remaining_seconds !== null && response.time_window_remaining_seconds !== undefined) {
                setTimeWindowRemaining(response.time_window_remaining_seconds);
            }

            setCurrentRound(response);
            setTimeRemaining(response.duration_minutes * 60);
            setCurrentQuestionIndex(0);
            // Reset visited/marked questions for new round
            setVisitedQuestions(new Set([0]));
            setMarkedQuestions(new Set());
            setUserAnswers({});
            setExamState('exam');
        } catch (error: any) {
            console.error('Failed to start round:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to start round';
            toast.error(errorMsg);

            // If error is about insufficient time, redirect to complete screen
            if (errorMsg.includes('time') || errorMsg.includes('expired')) {
                setExamState('assessment_complete');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId: string, answer: string) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleAutoSubmit = async () => {
        if (isSubmitting || !currentRound || examState !== 'exam') return;

        setIsSubmitting(true);
        toast.success('Time is up! Submitting your answers...');

        try {
            await submitRound();
        } catch (error) {
            console.error('Auto-submit failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitRound = async () => {
        if (!currentRound || !attemptId) return;

        try {
            setIsSubmitting(true);
            const response = await apiClient.submitDishaRound(
                packageId,
                currentRound.round_id,
                attemptId,
                userAnswers
            );

            // Clear saved answers
            localStorage.removeItem(`disha-answers-${attemptId}-${currentRound.round_id}`);

            if (response.assessment_complete) {
                setExamState('assessment_complete');
                toast.success('Assessment completed! Evaluation in progress...');

                // Poll for evaluation status
                pollEvaluationStatus();
            } else {
                // Round score might not be available immediately if evaluation is async
                // Check if score is in response, otherwise set to null
                setRoundScore(null);
                setExamState('round_complete');
                toast.success('Round submitted successfully!');
            }
        } catch (error: any) {
            console.error('Failed to submit round:', error);
            toast.error(error.response?.data?.detail || 'Failed to submit round');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Explicit submit handler for button click
    const handleSubmitWithConfirmation = () => {
        const stats = getQuestionCounts();
        const unansweredCount = stats.notVisited + stats.notAnswered + stats.marked;

        if (unansweredCount > 0) {
            const message = `⚠️ You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}.\n\nUnanswered questions will be scored as 0.\n\nDo you want to submit anyway?`;

            if (window.confirm(message)) {
                submitRound();
            }
        } else {
            submitRound();
        }
    };

    const pollEvaluationStatus = async () => {
        if (!attemptId) return;

        const maxAttempts = 30; // 30 seconds max
        let attempts = 0;

        const poll = setInterval(async () => {
            attempts++;
            try {
                const status = await apiClient.getDishaAttemptStatus(packageId, attemptId);
                if (status.status === 'EVALUATED' || status.status === 'COMPLETED') {
                    clearInterval(poll);
                    toast.success('Evaluation complete!');
                    if (onComplete) {
                        onComplete();
                    }
                }
            } catch (error) {
                console.error('Failed to check status:', error);
            }

            if (attempts >= maxAttempts) {
                clearInterval(poll);
            }
        }, 1000);
    };

    const continueToNextRound = async () => {
        if (!packageInfo || !attemptId) return;

        const nextRoundNumber = (packageInfo.current_round || 0) + 1;
        if (nextRoundNumber > packageInfo.total_rounds) {
            setExamState('assessment_complete');
        } else {
            try {
                setLoading(true);
                // Fetch package status to get next round details
                const packageStatus = await apiClient.getDishaPackageStatus(packageId);
                if (packageStatus.rounds_progress && packageStatus.rounds_progress.length > 0) {
                    const nextRoundData = packageStatus.rounds_progress.find(
                        (r: any) => r.round_number === nextRoundNumber
                    );
                    if (nextRoundData) {
                        setPackageInfo(prev => prev ? {
                            ...prev,
                            current_round: nextRoundNumber,
                            round_details: {
                                round_id: nextRoundData.round_id,
                                round_number: nextRoundData.round_number,
                                duration_minutes: nextRoundData.duration_minutes
                            }
                        } : null);
                        setExamState('round_instructions');
                        setRoundScore(null);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch next round:', error);
                toast.error('Failed to load next round');
            } finally {
                setLoading(false);
            }
        }
    };

    const playQuestionAudio = (text: string) => {
        if (audioPlayed) return;

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            // Try to find a good English voice
            const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                voices.find(v => v.lang.startsWith('en'));
            if (preferred) utterance.voice = preferred;

            utterance.rate = 0.9; // Slightly slower for dictation
            window.speechSynthesis.speak(utterance);
            // setAudioPlayed(true); // Allow replaying safely
        } else {
            toast.error('Audio not supported');
        }
    };

    // UI Helpers
    const formatTime = (seconds: number | null): string => {
        if (seconds === null) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const splitTime = (seconds: number | null) => {
        if (seconds === null) {
            return { hours: '--', minutes: '--', seconds: '--' };
        }
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return {
            hours: hours.toString().padStart(2, '0'),
            minutes: minutes.toString().padStart(2, '0'),
            seconds: secs.toString().padStart(2, '0')
        };
    };

    const navigateToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
        setVisitedQuestions(prev => new Set([...Array.from(prev), index]));
    };

    const handleMarkForReview = () => {
        setMarkedQuestions(prev => {
            const newMarked = new Set(prev);
            if (newMarked.has(currentQuestionIndex)) {
                newMarked.delete(currentQuestionIndex);
            } else {
                newMarked.add(currentQuestionIndex);
            }
            return newMarked;
        });
        // Auto advance if not last
        if (currentRound && currentQuestionIndex < currentRound.questions.length - 1) {
            navigateToQuestion(currentQuestionIndex + 1);
        }
    };

    const handleClearResponse = () => {
        const currentQ = currentRound?.questions[currentQuestionIndex];
        if (!currentQ) return;

        setUserAnswers(prev => {
            const newAnswers = { ...prev };
            delete newAnswers[currentQ.question_id];
            return newAnswers;
        });
    };

    const getQuestionStatus = (index: number) => {
        if (!currentRound?.questions[index]) return 'notVisited';

        const questionId = currentRound.questions[index].question_id;
        const isAnswered = !!userAnswers[questionId];
        const isMarked = markedQuestions.has(index);
        const isVisited = visitedQuestions.has(index);

        if (isAnswered && !isMarked) return 'answered';
        if (isMarked) return 'marked';
        if (isVisited) return 'notAnswered';
        return 'notVisited';
    };

    const getQuestionCounts = () => {
        let answered = 0;
        let notAnswered = 0;
        let marked = 0;
        let notVisited = 0;

        if (currentRound?.questions) {
            currentRound.questions.forEach((_, index) => {
                const status = getQuestionStatus(index);
                if (status === 'answered') answered++;
                else if (status === 'marked') marked++;
                else if (status === 'notAnswered') notAnswered++;
                else notVisited++;
            });
        }
        return { answered, notAnswered, marked, notVisited };
    };

    // Instructions Screen
    if (examState === 'instructions') {
        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                    <h2 className="text-3xl font-bold mb-4">Assessment Instructions</h2>
                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <p>Please read the following instructions carefully before starting:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>This assessment consists of multiple rounds that must be completed sequentially.</li>
                            <li>Each round has a specific time limit. The timer starts when you click "Start Round".</li>
                            <li>You can submit a round before the time expires.</li>
                            <li>If time runs out, your answers will be automatically submitted.</li>
                            <li>You cannot go back to previous rounds once submitted.</li>
                            <li>Make sure you have a stable internet connection.</li>
                        </ul>
                    </div>
                    <button
                        onClick={startAssessment}
                        disabled={loading}
                        className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Starting...</span>
                            </>
                        ) : (
                            <span>Start Assessment</span>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Round Instructions Screen
    if (examState === 'round_instructions' && packageInfo) {
        const roundDetails = packageInfo.round_details;
        if (!roundDetails) {
            return (
                <div className="w-full max-w-4xl mx-auto p-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p>Loading round details...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                    <h2 className="text-3xl font-bold mb-4">
                        Round {packageInfo.current_round} of {packageInfo.total_rounds}
                    </h2>
                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <p className="text-lg">
                            <strong>Duration:</strong> {roundDetails.duration_minutes} minutes
                        </p>
                        <p>Click "Start Round" when you are ready to begin. The timer will start immediately.</p>
                    </div>
                    <button
                        onClick={() => startRound(roundDetails.round_id)}
                        disabled={loading}
                        className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Loading...</span>
                            </>
                        ) : (
                            <span>Start Round</span>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Round Complete Screen
    if (examState === 'round_complete') {
        const isLastRound = packageInfo && packageInfo.current_round >= packageInfo.total_rounds;

        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-4">Round Completed!</h2>
                    {roundScore !== null && (
                        <p className="text-xl mb-4">
                            Score: <span className="font-bold">{roundScore}</span> / {currentRound?.max_score}
                        </p>
                    )}
                    {isLastRound ? (
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            All rounds completed! Your assessment is being evaluated.
                        </p>
                    ) : (
                        <button
                            onClick={continueToNextRound}
                            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Continue to Next Round
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Assessment Complete Screen
    if (examState === 'assessment_complete') {
        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-4">Assessment Complete!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Your assessment has been submitted and is being evaluated. Results will be available shortly.
                    </p>
                    {onComplete && (
                        <button
                            onClick={onComplete}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            View Results
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Exam View
    if (examState === 'exam' && currentRound) {
        // Special Round: Group Discussion
        if (currentRound.round_type === 'group_discussion') {
            return (
                <div className="fullscreen-exam">
                    {/* Header */}
                    <div className="exam-header p-4 shadow-sm">
                        <div className="flex items-center justify-between max-w-7xl mx-auto">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                    Round {packageInfo?.current_round || 1}: {currentRound.round_name} (Group Discussion)
                                </h1>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 mb-1">Time Remaining</div>
                                    <div className={`text-xl font-mono font-bold ${timeRemaining !== null && timeRemaining <= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                        {formatTime(timeRemaining)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="exam-content">
                        <div className="question-container">
                            <div className="question-content">
                                <GroupDiscussionRound
                                    roundId={currentRound.round_id}
                                    assessmentId={packageId}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Special Round: Coding
        if (currentRound.round_type === 'coding') {
            // Map Disha round data to CodingRound format
            const codingRoundData = {
                ...currentRound,
                questions: currentRound.questions.map(q => ({
                    id: q.question_id,
                    question_text: q.question_text,
                    metadata: q.question_metadata || {},
                }))
            };

            const handleCodingSubmit = async (responses: any[]) => {
                await submitRound();
            };

            const handleCodingChange = (qid: string, code: string, language: string) => {
                const payload = JSON.stringify({ language, code });
                handleAnswer(qid, payload);
            };

            return (
                <div className="fullscreen-exam">
                    {/* Header */}
                    <div className="exam-header p-4 shadow-sm">
                        <div className="flex items-center justify-between max-w-7xl mx-auto">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                    Round {packageInfo?.current_round || 1}: {currentRound.round_name} (Coding)
                                </h1>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 mb-1">Time Remaining</div>
                                    <div className={`text-xl font-mono font-bold ${timeRemaining !== null && timeRemaining <= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                        {formatTime(timeRemaining)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="exam-content p-0">
                        {/* Coding round takes full space, no palette/padding needed usually as it has its own panels */}
                        <div className="flex-1 w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
                            <CodingRound
                                assessmentId={packageId}
                                roundData={codingRoundData}
                                submitFn={handleCodingSubmit}
                                onChange={handleCodingChange}
                                showSubmitButton={true}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // Generic Round (MCQ, Aptitude, Soft Skills, etc.) - Uses New UI
        const currentQuestion = currentRound.questions[currentQuestionIndex];
        const counts = getQuestionCounts();
        const t = splitTime(timeRemaining);
        const isTimeUp = timeRemaining !== null && timeRemaining <= 0;

        return (
            <div className="fullscreen-exam font-sans bg-gray-50 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <div className="bg-[#2563EB] text-white h-16 shrink-0 flex items-center px-6 justify-between shadow-md z-20 relative">
                    <h1 className="text-xl font-bold truncate">
                        Round {packageInfo?.current_round || 1}: {currentRound!.round_name}
                    </h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleFullscreen}
                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 w-full flex overflow-hidden">
                    {/* Main Content Area */}
                    <div className="flex-1 bg-white flex flex-col min-h-0 relative transition-all duration-300 z-40">
                        {/* Sidebar Toggle Button */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-gray-50 focus:outline-none transition-transform duration-300 ${isSidebarOpen ? 'translate-x-1/2' : '-translate-x-2'}`}
                            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                        >
                            {isSidebarOpen ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                        </button>

                        {/* Scrollable Content Wrapper */}
                        <div className="flex-1 flex flex-col p-6 overflow-hidden min-h-0">
                            {/* Question Header */}
                            <div className="mb-4 flex-shrink-0">
                                <h2 className="text-lg font-bold text-gray-800">
                                    Question {currentQuestionIndex + 1} of {currentRound!.questions.length}
                                </h2>
                                <div className="h-px bg-gray-200 mt-2 w-full"></div>
                            </div>

                            {/* Unified Question Card Container */}
                            <div className="flex-1 flex flex-col border border-gray-300 rounded-sm overflow-hidden min-h-0 bg-white shadow-sm relative z-10">
                                {/* Split Pane Content */}
                                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                                    {/* Left Pane: Question Text */}
                                    <div className="flex-1 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-300 bg-white">
                                        {currentQuestion.question_type !== 'dictation' ? (
                                            <p className="text-lg font-medium text-gray-800 leading-relaxed select-none">
                                                {currentQuestion.question_text}
                                            </p>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-lg font-bold text-blue-600">
                                                    🎧 Listening Exercise
                                                </p>
                                                <p className="text-gray-700">
                                                    Click the button below to hear a sentence. Listen carefully and type exactly what you hear in the box.
                                                </p>
                                                <button
                                                    onClick={() => playQuestionAudio(currentQuestion.question_text)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium"
                                                >
                                                    <Volume2 className="h-5 w-5" />
                                                    <span>Play Audio</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Pane: Options / Input */}
                                    <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
                                        {/* MCQ Options */}
                                        {['mcq', 'aptitude', 'technical_mcq', 'soft_skills'].includes(String(currentQuestion.question_type || '').toLowerCase()) && (
                                            <div className="space-y-4">
                                                {(() => {
                                                    const mcqOptions = normalizeMcqOptions(currentQuestion);
                                                    if (!mcqOptions || mcqOptions.length === 0) {
                                                        return <div className="text-sm text-gray-500">No options available.</div>;
                                                    }
                                                    
                                                    // Sort options to ensure A, B, C, D order (remove randomization)
                                                    // Extract option letter from option text and remove the prefix
                                                    const extractOptionLetterAndText = (optionText: string, index: number): { letter: string; cleanText: string } => {
                                                        // Match patterns like "A. ", "A) ", "A ", etc. at the START of the string
                                                        // Only match A-D letters to avoid false matches (e.g., "SELECT" starting with S)
                                                        const match = optionText.match(/^([A-D])[\.\)\s]+\s*(.+)$/i);
                                                        if (match) {
                                                            const matchedLetter = match[1].toUpperCase();
                                                            // Double-check it's A, B, C, or D
                                                            if (['A', 'B', 'C', 'D'].includes(matchedLetter)) {
                                                                return {
                                                                    letter: matchedLetter,
                                                                    cleanText: match[2].trim() // Remove the letter prefix
                                                                };
                                                            }
                                                        }
                                                        // If no A-D prefix found, assign letter based on index position (A=0, B=1, C=2, D=3)
                                                        // This ensures we always get A, B, C, D even if option text doesn't have prefix
                                                        const letter = String.fromCharCode(65 + Math.min(index, 3)); // A=65, B=66, C=67, D=68
                                                        return {
                                                            letter: letter,
                                                            cleanText: optionText.trim() // Keep original text if no prefix found
                                                        };
                                                    };
                                                    
                                                    // First, try to extract letters from option text and sort by extracted letter
                                                    // If extraction fails, use index-based assignment
                                                    const optionsWithLetters = mcqOptions.map((option: any, index: number) => {
                                                        const optionText = typeof option === 'string'
                                                            ? option
                                                            : (option?.text ?? option?.label ?? JSON.stringify(option));
                                                        const { letter, cleanText } = extractOptionLetterAndText(optionText, index);
                                                        return {
                                                            letter: letter,
                                                            text: cleanText, // Use cleaned text without letter prefix
                                                            originalIndex: index
                                                        };
                                                    });
                                                    
                                                    // Sort by option letter (A, B, C, D) to ensure consistent order
                                                    // This handles cases where backend sends randomized options
                                                    optionsWithLetters.sort((a, b) => {
                                                        return a.letter.localeCompare(b.letter);
                                                    });
                                                    
                                                    return optionsWithLetters.map((optionData, index: number) => {
                                                        const optionLetter = optionData.letter;
                                                        const optionText = optionData.text; // Already cleaned (no letter prefix)
                                                        // Store answer as option letter (A, B, C, D) not full text
                                                        const isSelected = userAnswers[currentQuestion.question_id] === optionLetter;

                                                        return (
                                                            <label
                                                                key={index}
                                                                className={`flex items-start space-x-3 p-4 rounded-lg cursor-pointer transition-all border ${isSelected
                                                                    ? 'bg-blue-50 border-blue-500 shadow-sm'
                                                                    : 'bg-white border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                                                    }`}
                                                            >
                                                                <div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                    <input
                                                                        type="radio"
                                                                        name={`question-${currentQuestion.question_id}`}
                                                                        value={optionLetter}
                                                                        checked={isSelected}
                                                                        onChange={() => handleAnswer(currentQuestion.question_id, optionLetter)}
                                                                        className="peer appearance-none w-5 h-5 border-2 border-gray-400 rounded-full checked:border-blue-600 checked:border-[6px] transition-all bg-white"
                                                                    />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <span className="font-bold text-gray-700 mr-2">{optionLetter})</span>
                                                                    <span className="text-gray-800 text-base">{optionText}</span>
                                                                </div>
                                                            </label>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        )}

                                        {/* Text Input */}
                                        {currentQuestion.question_type === 'text' && (
                                            <div className="h-full flex flex-col">
                                                <label className="text-sm font-semibold text-gray-600 mb-2">Your Answer:</label>
                                                <textarea
                                                    className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
                                                    placeholder="Type your answer here..."
                                                    value={userAnswers[currentQuestion.question_id] || ''}
                                                    onChange={(e) => handleAnswer(currentQuestion.question_id, e.target.value)}
                                                />
                                                <div className="text-right text-xs text-gray-500 mt-2">
                                                    {(userAnswers[currentQuestion.question_id] || '').length} characters
                                                </div>
                                            </div>
                                        )}

                                        {/* Dictation Input */}
                                        {currentQuestion.question_type === 'dictation' && (
                                            <div className="h-full flex flex-col">
                                                <label className="text-sm font-semibold text-gray-600 mb-2">Type what you hear:</label>
                                                <textarea
                                                    className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-base"
                                                    placeholder="Type here..."
                                                    value={userAnswers[currentQuestion.question_id] || ''}
                                                    onChange={(e) => handleAnswer(currentQuestion.question_id, e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Footer: Action Buttons */}
                                <div className="shrink-0 h-16 bg-white border-t border-gray-300 flex items-center justify-between px-6 z-20">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleMarkForReview}
                                            className="bg-[#DC2626] hover:bg-red-700 text-white px-6 py-2 rounded text-sm font-semibold transition-colors shadow-sm"
                                        >
                                            Mark for review & Next
                                        </button>
                                        <button
                                            onClick={handleClearResponse}
                                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded text-sm font-semibold transition-colors shadow-sm"
                                        >
                                            Clear Response
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => navigateToQuestion(Math.max(0, currentQuestionIndex - 1))}
                                            disabled={currentQuestionIndex === 0}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded text-sm font-semibold transition-colors"
                                        >
                                            Previous
                                        </button>
                                        {currentQuestionIndex < currentRound!.questions.length - 1 ? (
                                            <button
                                                onClick={() => navigateToQuestion(Math.min(currentRound!.questions.length - 1, currentQuestionIndex + 1))}
                                                className="bg-[#16A34A] hover:bg-green-700 text-white px-8 py-2 rounded text-sm font-semibold transition-colors shadow-sm"
                                            >
                                                Save & Next
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleSubmitWithConfirmation}
                                                className="bg-[#16A34A] hover:bg-green-700 text-white px-8 py-2 rounded text-sm font-semibold transition-colors shadow-sm"
                                            >
                                                Submit Round
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className={`${isSidebarOpen ? 'w-80 border-l' : 'w-0 border-l-0'} bg-[#E6F3FF] border-gray-200 flex flex-col h-full overflow-hidden flex-shrink-0 font-sans transition-all duration-300`}>
                        {/* Profile & Timer Section */}
                        <div className="p-4 border-b border-gray-200 border-dashed border-blue-300 m-2 rounded-lg relative">
                            <div className="flex items-start gap-4">
                                {/* Large Black User Silhouette */}
                                <div className="w-20 h-20 bg-black rounded-xl overflow-hidden shadow-sm flex items-end justify-center flex-shrink-0">
                                    <User className="w-16 h-16 text-gray-400 mb-[-4px]" fill="currentColor" />
                                </div>

                                <div className="flex-1 text-center">
                                    <div className="text-lg font-bold text-gray-900 mb-1">Time Left</div>
                                    <div className="flex justify-center gap-2 items-start">
                                        <div className="flex flex-col items-center">
                                            <div className="text-2xl font-bold leading-none text-black">{t.hours}</div>
                                            <div className="text-xs text-black font-medium mt-1">Hr</div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="text-2xl font-bold leading-none text-black">{t.minutes}</div>
                                            <div className="text-xs text-black font-medium mt-1">Min</div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="text-2xl font-bold leading-none text-black">{t.seconds}</div>
                                            <div className="text-xs text-black font-medium mt-1">Sec</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="w-3 h-3 text-gray-500" />
                                </div>
                                <span className="font-normal text-gray-700 text-sm">
                                    {packageInfo?.assessment_name || 'Candidate'}
                                </span>
                            </div>
                        </div>

                        {/* Legend section */}
                        <div className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#16A34A] text-white text-sm font-bold flex items-center justify-center rounded-md shadow-sm">
                                        {counts.answered}
                                    </div>
                                    <span className="text-sm font-medium text-black">Answered</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-8 h-8 bg-[#DC2626] text-white text-sm font-bold flex items-center justify-center shadow-sm"
                                        style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)' }}
                                    >
                                        <span className="-mt-1">{counts.notAnswered}</span>
                                    </div>
                                    <span className="text-sm font-medium text-black">Not Answered</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#9333EA] text-white text-sm font-bold flex items-center justify-center rounded-full shadow-sm">
                                        {counts.marked}
                                    </div>
                                    <span className="text-sm font-medium text-black">Marked</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center rounded-md shadow-sm">
                                        {counts.notVisited}
                                    </div>
                                    <span className="text-sm font-medium text-black">Not Visited</span>
                                </div>
                            </div>
                        </div>

                        {/* Palette Section */}
                        <div className="flex-1 px-6 overflow-y-auto">
                            <h3 className="font-bold text-black mb-4 text-base">Question Palette:</h3>
                            <div className="grid grid-cols-5 gap-3 content-start pb-4">
                                {currentRound!.questions.map((_: any, index: number) => {
                                    const status = getQuestionStatus(index);
                                    const isCurrent = index === currentQuestionIndex;

                                    let baseClasses = "w-9 h-9 flex items-center justify-center text-sm font-bold shadow-sm transition-all";
                                    let style = {};
                                    let content = <span className={status === 'notAnswered' ? "-mt-1" : ""}>{index + 1}</span>;

                                    if (status === 'answered') {
                                        baseClasses += " bg-[#16A34A] text-white rounded-md";
                                    } else if (status === 'notAnswered') {
                                        baseClasses += " bg-[#DC2626] text-white";
                                        style = { clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)' };
                                    } else if (status === 'marked') {
                                        baseClasses += " bg-[#9333EA] text-white rounded-full";
                                    } else {
                                        baseClasses += " bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300";
                                    }

                                    if (isCurrent) {
                                        baseClasses += " ring-2 ring-offset-1 ring-blue-600 transform scale-105 z-10";
                                    }

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => navigateToQuestion(index)}
                                            className={baseClasses}
                                            style={style}
                                            title={`Q${index + 1}`}
                                        >
                                            {content}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Submit Section */}
                        <div className="p-6 bg-[#E6F3FF]">
                            <button
                                onClick={handleSubmitWithConfirmation}
                                disabled={isSubmitting}
                                className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 rounded shadow-md transition-colors text-base"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Submitting...</span>
                                    </div>
                                ) : (
                                    'Submit Section'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
