'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Clock, CheckCircle2, AlertCircle, Loader2, Mic, Square, Volume2,
    Home, User, FileText, Briefcase, ClipboardList, Send, Edit3, Zap, Trash2,
    Video, MessageCircle, MoreVertical, Users, MicOff, PhoneOff
} from 'lucide-react';
import { GroupDiscussionRound } from '@/components/assessment/GroupDiscussionRound';
import CodingRound from '@/components/assessment/CodingRound';
import { VoiceResponseArea } from './VoiceResponseArea';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import {
    ArrowLeft, Maximize2, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Shield, Wifi, MonitorX, Timer, MousePointerClick, AlertTriangle, MonitorPlay
} from 'lucide-react';

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
    id?: string; // Legacy/Backend compatibility
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
    const [showTerminationModal, setShowTerminationModal] = useState(false);
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
    const [clearSignal, setClearSignal] = useState<number>(0);
    const hasEnteredFullscreenRef = useRef(false);

    // Speech Recognition State
    const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef<any>(null);
    const isLiveTranscribingRef = useRef(false);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event: any) => {
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

                    if (final) {
                        setLiveTranscript(prev => prev + final);
                        setInterimTranscript('');
                    } else {
                        setInterimTranscript(interim);
                    }
                };

                recognition.onerror = (event: any) => {
                    // console.error("Speech recognition error", event.error);
                    if (event.error === 'not-allowed') {
                        toast.error('Microphone access denied');
                        setIsLiveTranscribing(false);
                        isLiveTranscribingRef.current = false;
                    }
                };

                recognition.onend = () => {
                    if (isLiveTranscribingRef.current) {
                        try {
                            recognition.start();
                        } catch (e) { }
                    } else {
                        setIsLiveTranscribing(false);
                    }
                };

                recognitionRef.current = recognition;
            }
        }

        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) { }
            }
        };
    }, []);

    const startLiveTranscription = () => {
        if (!recognitionRef.current) {
            toast.error('Speech recognition is not supported in this browser.');
            return;
        }

        try {
            recognitionRef.current.start();
            setIsLiveTranscribing(true);
            isLiveTranscribingRef.current = true;
            // toast.success('Listening... Speak clearly.');
        } catch (e) {
            console.error(e);
            toast.error('Could not start microphone.');
        }
    };

    const stopLiveTranscription = () => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
        }
        setIsLiveTranscribing(false);
        isLiveTranscribingRef.current = false;

        // Combine final transcript with any remaining interim
        const finalContent = liveTranscript + interimTranscript;

        // Save to current question answer
        if (currentRound && currentRound.questions[currentQuestionIndex]) {
            const qId = currentRound.questions[currentQuestionIndex].question_id;

            // Append to existing answer if any, or separate? 
            // We'll append for now to not lose data
            const currentAns = userAnswers[qId] || '';
            const newAnswer = currentAns ? (currentAns + ' ' + finalContent) : finalContent;

            handleAnswer(qId, newAnswer);

            setLiveTranscript('');
            setInterimTranscript('');
            // toast.success('Response saved.');
        }
    };
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
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Monitor Fullscreen Exit for strict proctoring
    useEffect(() => {
        if (isFullscreen) {
            hasEnteredFullscreenRef.current = true;
        } else {
            // If we were in fullscreen, and now we are not, and we are not submitting...
            // We only terminate if the user explicitly exits fullscreen during an active exam.
            if (examState === 'exam' && hasEnteredFullscreenRef.current && !isSubmitting && !loading && !showTerminationModal) {
                console.warn('?? User exited fullscreen - Warning User');
                setShowTerminationModal(true);
            }
        }
    }, [isFullscreen, examState, isSubmitting, loading, showTerminationModal]);

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

    // Clear live transcript when changing questions to prevent data bleed
    useEffect(() => {
        setLiveTranscript('');
        setInterimTranscript('');
    }, [currentQuestionIndex]);

    // Save answers to localStorage
    useEffect(() => {
        if (attemptId && currentRound && Object.keys(userAnswers).length > 0) {
            const timeoutId = setTimeout(() => {
                localStorage.setItem(`disha-answers-${attemptId}-${currentRound.round_id}`, JSON.stringify(userAnswers));
            }, 1000); // 1-second debounce to avoid main thread blocking
            return () => clearTimeout(timeoutId);
        }
    }, [userAnswers, attemptId, currentRound?.round_id]);

    const loadPackage = async () => {
        try {
            setLoading(true);
            const packageStatus = await apiClient.getDishaPackageStatus(packageId);
            // Logic to merge status? For now just log, as this was missing.
            // Or better, update packageInfo if needed.
            // Assuming this is used to refresh state after GD submit
            if (packageStatus) {
                // simplified sync - exact logic depends on structure
            }
        } catch (error) {
            console.error('Failed to load package:', error);
        } finally {
            setLoading(false);
        }
    };

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
            const message = `?? You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}.\n\nUnanswered questions will be scored as 0.\n\nDo you want to submit anyway?`;

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
                    // Removed automatic onComplete() to prevent auto-redirection
                    /*
                    if (onComplete) {
                        onComplete();
                    }
                    */
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
                        // Reset fullscreen trigger strictness for the new round
                        hasEnteredFullscreenRef.current = false;
                        setShowTerminationModal(false);
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

    const stopQuestionAudio = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    };

    const playQuestionAudio = (text: string) => {
        if ('speechSynthesis' in window) {
            // Stop any existing
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            // Try to find a good English voice
            const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                voices.find(v => v.lang.startsWith('en'));
            if (preferred) utterance.voice = preferred;

            utterance.rate = 0.9; // Slightly slower for dictation/listening
            window.speechSynthesis.speak(utterance);
        } else {
            toast.error('Audio not supported');
        }
    };

    // Extract sentence from listening question text (for audio playback)
    // Example: "Listen and write down the following sentence: 'Clear communication is essential...'"
    const extractSentenceFromListeningQuestion = (questionText: string): string => {
        // Try to find text inside quotes
        const singleQuoteMatch = questionText.match(/'([^']+)'/);
        const doubleQuoteMatch = questionText.match(/"([^"]+)"/);
        const colonMatch = questionText.match(/:\s*(.+?)(?:\.|$)/);

        if (singleQuoteMatch) return singleQuoteMatch[1].trim();
        if (doubleQuoteMatch) return doubleQuoteMatch[1].trim();
        if (colonMatch) return colonMatch[1].trim();

        // If no quotes found, return the text after the colon or the whole text
        return questionText;
    };

    // Hide sentence from question display (show only instructions)
    // Example: "Listen and write down the following sentence: 'Clear communication is essential...'" -> "Listen and write down the following sentence:"
    const hideSentenceFromDisplay = (questionText: string): string => {
        // Remove text inside single quotes (including the quotes)
        let displayText = questionText.replace(/'[^']+'/g, '');
        // Remove text inside double quotes (including the quotes)
        displayText = displayText.replace(/"[^"]+"/g, '');
        // Remove trailing periods and extra spaces after colon
        displayText = displayText.replace(/:\s*\.+$/, ':');
        displayText = displayText.replace(/:\s+$/, ':');
        // Clean up extra spaces
        displayText = displayText.replace(/\s+/g, ' ').trim();

        // Ensure it ends with colon or period for proper formatting
        if (!displayText.endsWith(':') && !displayText.endsWith('.')) {
            displayText += ':';
        }

        // If nothing meaningful left, return a generic instruction
        if (!displayText || displayText.length < 10 || displayText === ':') {
            return "Listen and write down the sentence you hear:";
        }

        return displayText;
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
        // Auto-stop recording if user navigates away while speaking
        if (isLiveTranscribing) {
            stopLiveTranscription();
        }

        setCurrentQuestionIndex(index);
        setVisitedQuestions(prev => new Set([...Array.from(prev), index]));
        // Reset audio played state when navigating to a new question
        setAudioPlayed(false);
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
        setClearSignal(Date.now());
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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">

                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Assessment Protocol</h2>
                            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                                Please review the following guidelines carefully to ensure a secure and smooth examination process.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10">
                        {/* Key Instructions Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-lg shrink-0">
                                    <MonitorPlay className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Sequential Rounds</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        This assessment consists of multiple rounds. You must complete them in the specified order and cannot return to a previous round once submitted.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30">
                                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-lg shrink-0">
                                    <Timer className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Timed Assessment</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Each round has a strict time limit. The timer starts immediately upon clicking "Start". Answers are auto-submitted when time expires.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                                <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-lg shrink-0">
                                    <CheckCircle2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Proctored Environment</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        We monitor your tab activity and full-screen status. Ensure your environment is quiet and free from distractions.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2.5 rounded-lg shrink-0">
                                    <Wifi className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Stable Connection</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        A stable internet connection is required. We recommend using Chrome or Edge for the best compatibility.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Critical Warning */}
                        <div className="mb-10 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-5 md:p-6 flex items-start md:items-center gap-5">
                            <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-full shrink-0 animate-pulse">
                                <MonitorX className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Security Violation Policy
                                </h3>
                                <p className="text-red-800/80 dark:text-red-300">
                                    Strict full-screen mode is enforced. <strong className="text-red-900 dark:text-red-200">If you attempt to exit full-screen mode or switch tabs, your test will be automatically submitted</strong> and this round will be terminated immediately.
                                </p>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={startAssessment}
                                disabled={loading}
                                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-full md:w-auto min-w-[300px] py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <div className="relative flex items-center justify-center gap-3">
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                            <span>Initializing Environment...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Begin Assessment</span>
                                            <div className="bg-white/20 p-1 rounded-md">
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </button>
                            <p className="text-xs text-gray-400 mt-2">
                                By clicking above, you agree to our proctoring and data terms.
                            </p>
                        </div>
                    </div>
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
            <div className="fixed inset-0 z-[9999] bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
                <div className="w-full max-w-4xl bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
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
                        onClick={() => startRound(roundDetails.round_id || '')}
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
                    <h2 className="text-3xl font-bold mb-4">Assessment Submitted</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                        Your exam has been successfully submitted.
                        <br />
                        You may now close this window.
                    </p>

                    {/* Buttons removed as per request */}
                </div>
            </div>
        );
    }

    // Exam View
    if (examState === 'exam' && currentRound) {
        // Define termination modal
        const terminationModal = showTerminationModal && (
            <div className="fixed inset-0 z-[10000] bg-gray-900/95 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border-2 border-red-500 animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Fullscreen Required
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        You have exited fullscreen mode.
                        <br />
                        <strong>If you exit now, your exam will be auto-submitted.</strong>
                        <br /><br />
                        Do you want to submit and exit?
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                hasEnteredFullscreenRef.current = false;
                                toggleFullscreen();
                                setShowTerminationModal(false);
                            }}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-all"
                        >
                            No, Resume
                        </button>
                        <button
                            onClick={() => {
                                setShowTerminationModal(false);

                                submitRound();
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-red-500/30"
                        >
                            Yes, Submit
                        </button>
                    </div>
                </div>
            </div>
        );

        // Special Round: Group Discussion
        console.log('━'.repeat(100));
        console.log('🔍 [GD DETECTION] Starting Group Discussion round check...');
        console.log('📦 [GD DETECTION] Full currentRound object:', JSON.stringify(currentRound, null, 2));
        console.log('📌 [GD DETECTION] round_type:', currentRound.round_type);
        console.log('📌 [GD DETECTION] round_name:', currentRound.round_name);
        console.log('📌 [GD DETECTION] questions count:', currentRound.questions?.length);

        const roundType = currentRound.round_type?.toLowerCase() || '';
        const roundName = currentRound.round_name?.toLowerCase() || '';
        const isGroupDiscussion = roundType === 'group_discussion' || roundType.includes('group') || roundType.includes('discussion') || roundName.includes('gd') || roundName.includes('group discussion');

        console.log('🎯 [GD DETECTION] roundType (lowercase):', roundType);
        console.log('🎯 [GD DETECTION] roundName (lowercase):', roundName);
        console.log('✅ [GD DETECTION] Is Group Discussion?', isGroupDiscussion);
        console.log('━'.repeat(100));


        if (isGroupDiscussion) {
            return (
                <div className="fullscreen-exam">
                    <GroupDiscussionRound
                        roundId={currentRound.round_id || currentRound.id || ''}
                        assessmentId={packageId}
                        mode="assessment"
                        isDisha={true}
                        attemptId={attemptId || undefined}
                        packageId={packageId}
                        onNextRound={async () => {
                            // Advance to next round
                            await continueToNextRound();
                        }}
                        onComplete={async (responses) => {
                            try {
                                setIsSubmitting(true);
                                // GD Round calls its own evaluate endpoint which handles submission
                                // We just need to refresh the package status
                                // toast.success('Discussion round completed successfully!'); // Optional: remove if user wants no success toasts

                                // Wait briefly for user to see success message
                                await new Promise(resolve => setTimeout(resolve, 500));

                                await continueToNextRound();
                            } catch (error: any) {
                                console.error('Error completing discussion round:', error);
                                toast.error('Failed to update status');
                            } finally {
                                setIsSubmitting(false);
                            }
                        }}
                    />
                    {terminationModal}
                </div>
            );
        }

        // Special Round: Coding
        console.log('[DEBUG] Round type:', currentRound.round_type, 'Round name:', currentRound.round_name);
        if (currentRound.round_type?.toLowerCase() === 'coding' || currentRound.round_name?.toLowerCase().includes('coding')) {
            // Transform data to match Solviq structure - same as assessment/round/page.tsx
            const codingRoundData = {
                round_id: currentRound.round_id || currentRound.id || '',
                round_type: currentRound.round_type,
                round_name: currentRound.round_name,
                questions: currentRound.questions.map(q => {
                    // Ensure metadata structure matches what CodingRound expects
                    const metadata = q.question_metadata || {};
                    // If metadata is a string, parse it
                    let parsedMetadata = metadata;
                    if (typeof metadata === 'string') {
                        try {
                            parsedMetadata = JSON.parse(metadata);
                        } catch (e) {
                            parsedMetadata = {};
                        }
                    }

                    // Sanitize starter_code: Replace complete solutions with template
                    const sanitizeStarterCode = (code: string | undefined, lang: string): string | undefined => {
                        if (!code) return undefined;
                        const codeLower = code.toLowerCase();
                        // Check if it's a complete solution (has function definitions with implementations)
                        const hasFunctionDef = /def |function |public |int |void |class /.test(codeLower);
                        const hasReturn = codeLower.includes('return ');
                        const hasComplexLogic = /if |for |while |sort\(|max\(|min\(/.test(codeLower);
                        const hasTodo = /# todo|\/\/ todo/.test(codeLower);

                        // If it looks like a complete solution, return undefined to use template
                        if (hasFunctionDef && (hasReturn || hasComplexLogic) && !hasTodo) {
                            return undefined;
                        }
                        return code;
                    };

                    // Sanitize starter_code: preserve original or use template
                    const originalStarterCode = parsedMetadata.starter_code || {};
                    const defaultStarterCode = {
                        python: '# Read input\ninput_data = input()\n\n# TODO: Process and solve\n\n# Print output\nprint(result)\n',
                        javascript: '// Read input\nconst readline = require(\'readline\');\nconst rl = readline.createInterface({\n  input: process.stdin,\n  output: process.stdout\n});\n\nrl.on(\'line\', (input_data) => {\n  // TODO: Process and solve\n  \n  // Print output\n  console.log(result);\n  rl.close();\n});\n',
                        java: 'import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Read input\n        Scanner scanner = new Scanner(System.in);\n        String inputData = scanner.nextLine();\n        \n        // TODO: Process and solve\n        \n        // Print output\n        System.out.println(result);\n    }\n}\n',
                        cpp: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    // Read input\n    string inputData;\n    getline(cin, inputData);\n    \n    // TODO: Process and solve\n    \n    // Print output\n    cout << result << endl;\n    return 0;\n}\n',
                    };

                    // Build sanitized starter_code
                    const sanitizedStarterCode: Record<string, string> = {};
                    for (const lang of ['python', 'javascript', 'java', 'cpp', 'typescript']) {
                        const originalCode = originalStarterCode[lang];
                        const sanitized = sanitizeStarterCode(originalCode, lang);
                        sanitizedStarterCode[lang] = sanitized || defaultStarterCode[lang as keyof typeof defaultStarterCode] || defaultStarterCode.python;
                    }
                    // Ensure typescript uses javascript template if not provided
                    if (!sanitizedStarterCode.typescript) {
                        sanitizedStarterCode.typescript = sanitizedStarterCode.javascript;
                    }

                    return {
                        id: q.question_id,
                        question_text: q.question_text,
                        metadata: {
                            ...parsedMetadata,
                            // Use sanitized starter_code
                            starter_code: sanitizedStarterCode,
                            title: parsedMetadata.title || q.question_text.slice(0, 50),
                            examples: parsedMetadata.examples || [],
                            constraints: parsedMetadata.constraints || [],
                            tests: parsedMetadata.tests || []
                        }
                    };
                })
            };

            // Custom execute function for Disha - uses the new executeDishaCode endpoint
            const handleExecuteCode = async (payload: { question_id: string; language: string; code: string; stdin?: string }) => {
                return await apiClient.executeDishaCode(packageId, codingRoundData.round_id, payload);
            };


            const handleCodingSubmit = async (responses: any[]) => {
                await submitRound();
            };

            const handleCodingChange = (qid: string, code: string, language: string) => {
                const payload = JSON.stringify({ language, code });
                handleAnswer(qid, payload);
            };

            // Get the current coding question based on currentQuestionIndex
            const codingQuestions = codingRoundData.questions || [];
            const currentCodingQuestion = codingQuestions[currentQuestionIndex];
            const totalCodingQuestions = codingQuestions.length;

            return (
                <div className="fullscreen-exam">
                    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
                        {/* Header - Matching Solviq style */}
                        <div className="bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white h-16 shrink-0 shadow-md flex items-center justify-between px-6 z-20">
                            <div className="flex items-center gap-4">
                                <h1 className="text-xl font-bold tracking-tight">
                                    Round {packageInfo?.current_round || 1}: {currentRound.round_name || 'Coding Challenge'}
                                </h1>
                                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                                    Question {currentQuestionIndex + 1} of {totalCodingQuestions}
                                </span>
                            </div>
                            <div className="bg-white text-blue-600 px-4 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm">
                                <Clock className="w-4 h-4" />
                                <span>{timeRemaining !== null ? `${Math.floor(timeRemaining / 60)}m ${(timeRemaining % 60).toString().padStart(2, '0')}s` : '--:--'}</span>
                            </div>
                        </div>

                        {/* Coding Question Workspace - Show one question at a time */}
                        <div className="flex-1 overflow-hidden relative">
                            <CodingRound
                                assessmentId={packageId}
                                roundData={codingRoundData}
                                executeCodeFn={handleExecuteCode}
                                submitFn={handleCodingSubmit}
                                onChange={handleCodingChange}
                                showSubmitButton={false}
                                hideFooter={true}
                                activeQuestionId={currentCodingQuestion?.id}
                                onSubmitted={() => {
                                    // submitRound() already handles state transitions
                                    // This callback is called after successful submission
                                    toast.success('Round submitted successfully!');
                                }}
                            />
                        </div>

                        {/* Bottom Navigation Bar for Coding Questions */}
                        <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                            <div className="flex items-center gap-4">
                                {/* Previous Button */}
                                <button
                                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                    disabled={currentQuestionIndex === 0}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200 text-gray-700"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>

                                {/* Question Counter (Mobile) */}
                                <div className="md:hidden flex items-center gap-2 text-sm font-medium text-gray-600">
                                    <span className="bg-gray-100 px-3 py-1 rounded-full">
                                        {currentQuestionIndex + 1} / {totalCodingQuestions}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Next Button */}
                                {currentQuestionIndex < totalCodingQuestions - 1 ? (
                                    <button
                                        onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : null}

                                {/* Submit Button - Always visible */}
                                <button
                                    onClick={handleSubmitWithConfirmation}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all bg-green-600 hover:bg-green-700 text-white shadow-sm disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit Round
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    {terminationModal}
                </div>
            );
        }

        // Voice/Interview Round (HR/Technical)
        const isVoiceRound = currentRound.round_type === 'technical_interview' || currentRound.round_type === 'hr_interview';
        if (isVoiceRound) {
            const isHR = currentRound.round_type === 'hr_interview';
            const headerTitle = isHR ? 'HR Interview' : 'Technical Interview';
            const currentQ = currentRound.questions[currentQuestionIndex];
            const counts = getQuestionCounts();

            return (
                <div className="fullscreen-exam">
                    <div className="flex flex-col h-screen font-sans bg-white overflow-hidden">
                        {/* Header Bar - Matching Screenshot Blue/Purple Gradient */}
                        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center px-6 shrink-0 z-20 shadow-md justify-between">
                            <h1 className="text-xl font-bold tracking-wide">
                                Round {packageInfo?.current_round || 1}: {headerTitle}
                            </h1>
                            <div className="items-center gap-6 hidden md:flex">
                                <div className="text-right">
                                    <div className="text-xs text-blue-100 mb-1">Time Remaining</div>
                                    <div className="text-xl font-mono font-bold text-white">
                                        {formatTime(timeRemaining)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-1 overflow-hidden relative">
                            {/* Main Content Area (Left) */}
                            <div className="flex-1 flex flex-col overflow-y-auto bg-white relative">
                                <div className="p-6 pb-24">
                                    {/* Top Section: Question */}
                                    <div className="flex flex-col lg:flex-row gap-6 mb-8">
                                        {/* Question Column */}
                                        <div className="flex-1">
                                            {/* Question Badge */}
                                            <div className="bg-[#0288D1] text-white px-4 py-1.5 rounded-md inline-block mb-4 font-bold text-sm shadow-sm">
                                                Question {currentQuestionIndex + 1}
                                            </div>

                                            {/* Question Text */}
                                            <h2 className="text-xl font-bold text-gray-800 leading-relaxed mb-6">
                                                {currentQ?.question_text || "Loading question..."}
                                            </h2>

                                            {/* Progress Bar */}
                                            <div className="bg-gray-100 rounded-xl p-4 w-full max-w-md">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-semibold text-gray-700">Questions {currentQuestionIndex + 1}/{currentRound.questions.length}</span>
                                                </div>
                                                <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-200">
                                                    <div
                                                        className="h-full bg-gray-200 rounded-full"
                                                        style={{ width: `${((currentQuestionIndex + 1) / currentRound.questions.length) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-200 w-full mb-8" />

                                    {/* Voice Response Area */}
                                    <div className="flex-1 min-h-[400px]">
                                        <VoiceResponseArea
                                            questionId={currentQ.question_id}
                                            initialAnswer={userAnswers[currentQ.question_id] || ''}
                                            onAnswerChange={(ans) => handleAnswer(currentQ.question_id, ans)}
                                            clearSignal={clearSignal}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Sidebar - Progress */}
                            <div className="hidden lg:block w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Progress</h3>
                                    <p className="text-gray-500 mb-6">{counts.answered} Of {currentRound.questions.length} answered</p>

                                    {/* Grid */}
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {currentRound.questions.map((_: any, idx: number) => {
                                            const status = getQuestionStatus(idx);
                                            let bgClass = "bg-[#E5E7EB] text-gray-500";
                                            if (status === 'answered') bgClass = "bg-[#10B981] text-white";
                                            else if (idx === currentQuestionIndex) bgClass = "bg-[#3B82F6] text-white";

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => navigateToQuestion(idx)}
                                                    className={`w-10 h-10 rounded-md flex items-center justify-center font-bold text-sm transition-colors ${bgClass}`}
                                                >
                                                    {idx + 1}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Legend */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-[#10B981] text-white flex items-center justify-center font-bold text-sm">1</div>
                                            <span className="font-medium text-gray-700">Answered</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-[#EF4444] text-white flex items-center justify-center font-bold text-sm">0</div>
                                            <span className="font-medium text-gray-700">Not Answered</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-[#E5E7EB] text-gray-500 flex items-center justify-center font-bold text-sm">0</div>
                                            <span className="font-medium text-gray-700">Not Answered</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer - Sticky Bottom Bar */}
                        <div className="bg-[#4F46E5] h-20 shrink-0 flex items-center justify-between px-6 z-30">
                            {/* Clear Button */}
                            <button
                                onClick={handleClearResponse}
                                className="bg-white text-gray-800 hover:bg-gray-100 px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
                            >
                                <Trash2 size={18} className="text-gray-600" />
                                <span>Clear Response</span>
                            </button>

                            <div className="flex items-center gap-4">
                                {/* Next Button */}
                                <button
                                    onClick={() => {
                                        if (currentQuestionIndex < currentRound.questions.length - 1) {
                                            navigateToQuestion(currentQuestionIndex + 1);
                                        }
                                    }}
                                    disabled={currentQuestionIndex >= currentRound.questions.length - 1}
                                    className="bg-[#E5E5E5] hover:bg-white text-gray-800 px-6 py-2.5 rounded-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                                >
                                    Next Question
                                </button>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmitWithConfirmation}
                                    disabled={isSubmitting}
                                    className="bg-[#10B981] hover:bg-green-600 text-white px-8 py-2.5 rounded-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Submit Section
                                </button>
                            </div>
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
                        {/* Fullscreen button removed as requested */}
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
                                        {!currentQuestion ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                                <AlertTriangle className="w-12 h-12 mb-2 text-yellow-500" />
                                                <p className="font-medium">No active question found</p>
                                                <p className="text-xs mt-1">Please try refreshing or contact support.</p>
                                            </div>
                                        ) : currentQuestion.question_type === 'dictation' ? (
                                            <div className="space-y-4">
                                                <p className="text-lg font-bold text-blue-600">
                                                    ?? Listening Exercise
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
                                        ) : (() => {
                                            // Check if this is a listening question (by type or question text pattern)
                                            const questionType = String(currentQuestion?.question_type || '').toLowerCase();
                                            const questionText = currentQuestion?.question_text || '';
                                            const isListeningQuestion = questionType === 'listening' ||
                                                questionType === 'listening_question' ||
                                                questionText.toLowerCase().includes('listen and write') ||
                                                questionText.toLowerCase().includes('listen and write down');

                                            if (isListeningQuestion) {
                                                const sentenceToPlay = extractSentenceFromListeningQuestion(questionText);
                                                const displayText = hideSentenceFromDisplay(questionText);

                                                return (
                                                    <div className="space-y-4">
                                                        <p className="text-lg font-medium text-gray-800 leading-relaxed select-none">
                                                            {displayText}
                                                        </p>
                                                        <div className="flex items-center gap-4">
                                                            <button
                                                                onClick={() => {
                                                                    if (!audioPlayed) {
                                                                        setAudioPlayed(true);
                                                                        playQuestionAudio(sentenceToPlay);
                                                                    }
                                                                }}
                                                                disabled={audioPlayed}
                                                                className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all shadow-md ${audioPlayed
                                                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                                                                    }`}
                                                            >
                                                                <Volume2 className="h-5 w-5" />
                                                                <span>{audioPlayed ? 'Audio Played' : 'Play Audio'}</span>
                                                            </button>
                                                            {audioPlayed && (
                                                                <span className="text-sm text-gray-500 italic">
                                                                    Audio has been played. Type your answer in the box below.
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Default: show question text normally
                                            return (
                                                <p className="text-lg font-medium text-gray-800 leading-relaxed select-none">
                                                    {currentQuestion.question_text}
                                                </p>
                                            );
                                        })()}

                                    </div>

                                    {/* Right Pane: Options / Input */}
                                    <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
                                        {/* Speaking Questions for Soft Skills */}
                                        {(() => {
                                            // Detect if this is a speaking question (check for keywords in question text or if no options available)
                                            const questionText = (currentQuestion?.question_text || '').toLowerCase();
                                            const questionType = String(currentQuestion?.question_type || '').toLowerCase();
                                            const mcqOptions = normalizeMcqOptions(currentQuestion);
                                            const hasNoOptions = !mcqOptions || mcqOptions.length === 0;

                                            // Detect Listening Questions explicitly first
                                            const isListeningQuestion =
                                                questionType === 'listening' ||
                                                questionType === 'listening_question' ||
                                                questionText.includes('listen and write');

                                            // Check if it's a soft skills question and has speaking keywords OR has no options (likely a speaking question)
                                            // BUT NOT if it is a listening question
                                            // Check if it's a speaking question
                                            // 1. Explicit Soft Skills type
                                            // 2. Keywords in text (speak, read aloud, etc.)
                                            // 3. No options available (implies subjective/speaking)
                                            const hasSpeakingKeywords =
                                                questionText.includes('speak') ||
                                                questionText.includes('read aloud') ||
                                                /read[\s\S]*?aloud/i.test(questionText) || // specific regex for "read ... aloud"
                                                questionText.includes('read the following') ||
                                                questionText.includes('verbal') ||
                                                questionText.includes('tell us') ||
                                                questionText.includes('describe') ||
                                                questionText.includes('explain verbally');

                                            // Check for writing-specific keywords to prevent false positives in Soft Skills round
                                            const hasWritingKeywords = /\b(write|type)\b/i.test(questionText) &&
                                                !questionText.includes('listen and write');

                                            const isSpeakingQuestion = !isListeningQuestion && !hasWritingKeywords && (
                                                (questionType === 'soft_skills' && hasNoOptions) ||
                                                (hasSpeakingKeywords && (questionType === 'soft_skills' || hasNoOptions)) ||
                                                // Fallback: if we are in soft skills round and there are no options, assume speaking
                                                (currentRound?.round_name?.toLowerCase().includes('soft skill') && hasNoOptions)
                                            );

                                            if (isSpeakingQuestion) {
                                                // Show speaking interface for soft skills speaking questions
                                                return (
                                                    <div className="h-full flex flex-col space-y-4">
                                                        {/* Instruction Box */}
                                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                                            <p className="text-sm text-gray-700 mb-2">
                                                                <strong>Instructions:</strong> Click "Start Speaking" when ready. Speak clearly and organize your thoughts.
                                                            </p>
                                                            <p className="text-xs text-gray-600">
                                                                Tip: Organize your thoughts, speak clearly, and use relevant examples.
                                                            </p>
                                                        </div>

                                                        {/* Mic Button */}
                                                        <div className="flex justify-center">
                                                            {!isLiveTranscribing ? (
                                                                <button
                                                                    onClick={startLiveTranscription}
                                                                    className="bg-[#EF4444] hover:bg-red-600 text-white px-8 py-4 rounded-lg font-bold flex items-center gap-3 transition-all shadow-lg hover:shadow-xl"
                                                                >
                                                                    <div className="w-4 h-4 bg-white rounded-full"></div>
                                                                    <span>Start Speaking</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={stopLiveTranscription}
                                                                    className="bg-[#EF4444] hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold flex items-center gap-3 transition-all animate-pulse shadow-lg"
                                                                >
                                                                    <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                                                                    <span>Stop & Save</span>
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Live Transcript Display */}
                                                        {(isLiveTranscribing || liveTranscript) && (
                                                            <div className="flex-1 flex flex-col bg-[#ECFDF5] border border-green-200 rounded-lg p-4 min-h-[200px]">
                                                                <h3 className="text-[#10B981] font-bold text-sm uppercase tracking-wide mb-3">
                                                                    Speaking... (Live transcription):
                                                                </h3>
                                                                <div className="flex-1 overflow-y-auto bg-white rounded p-4 border border-green-100">
                                                                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                                                        {liveTranscript ? (
                                                                            liveTranscript
                                                                        ) : interimTranscript ? (
                                                                            <span className="text-gray-500 italic">
                                                                                {interimTranscript}
                                                                            </span>
                                                                        ) : (
                                                                            "Listening..."
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Read-only Transcript Display (when not recording) */}
                                                        {!isLiveTranscribing && (liveTranscript || userAnswers[currentQuestion.question_id]) && (
                                                            <div className="flex-1 flex flex-col bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                                <label className="text-sm font-semibold text-gray-700 mb-2">Your Response:</label>
                                                                <div className="flex-1 w-full p-4 border border-gray-300 rounded-lg bg-white resize-none text-base overflow-y-auto min-h-[200px] text-gray-700 whitespace-pre-wrap">
                                                                    {userAnswers[currentQuestion.question_id] || liveTranscript || ''}
                                                                </div>
                                                                <div className="text-right text-xs text-gray-500 mt-2">
                                                                    {(userAnswers[currentQuestion.question_id] || liveTranscript || '').length} characters
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }


                                            if (isListeningQuestion) {
                                                return (
                                                    <div className="h-full flex flex-col">
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                                            <p className="text-sm text-gray-700">
                                                                <strong>Instructions:</strong> Listen to the audio and type exactly what you hear in the box below.
                                                            </p>
                                                        </div>
                                                        <label className="text-sm font-semibold text-gray-600 mb-2">Type what you heard:</label>
                                                        <textarea
                                                            className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
                                                            placeholder="Type sentence here..."
                                                            value={userAnswers[currentQuestion.question_id] || ''}
                                                            onChange={(e) => handleAnswer(currentQuestion.question_id, e.target.value)}
                                                        />
                                                        <div className="text-right text-xs text-gray-500 mt-2">
                                                            {(userAnswers[currentQuestion.question_id] || '').length} characters
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return null; // Continue with MCQ rendering
                                        })()}

                                        {/* MCQ Options */}
                                        {['mcq', 'aptitude', 'technical_mcq', 'soft_skills'].includes(String(currentQuestion.question_type || '').toLowerCase()) && (() => {
                                            // Skip MCQ rendering if this is a speaking question
                                            const questionText = (currentQuestion?.question_text || '').toLowerCase();
                                            const questionType = String(currentQuestion?.question_type || '').toLowerCase();
                                            const mcqOptions = normalizeMcqOptions(currentQuestion);
                                            const hasNoOptions = !mcqOptions || mcqOptions.length === 0;

                                            const hasSpeakingKeywords =
                                                questionText.includes('speak') ||
                                                questionText.includes('read aloud') ||
                                                /read[\s\S]*?aloud/i.test(questionText) ||
                                                questionText.includes('read the following') ||
                                                questionText.includes('verbal') ||
                                                questionText.includes('tell us') ||
                                                questionText.includes('describe') ||
                                                questionText.includes('explain verbally');

                                            const isListeningQuestion =
                                                questionType === 'listening' ||
                                                questionType === 'listening_question' ||
                                                questionText.includes('listen and write');

                                            const hasWritingKeywords = /\b(write|type)\b/i.test(questionText) && !questionText.includes('listen and write');

                                            const isSpeakingQuestion = !isListeningQuestion && !hasWritingKeywords && (
                                                (questionType === 'soft_skills' && hasNoOptions) ||
                                                (hasSpeakingKeywords && (questionType === 'soft_skills' || hasNoOptions)) ||
                                                (currentRound?.round_name?.toLowerCase().includes('soft skill') && hasNoOptions)
                                            );

                                            if (isSpeakingQuestion || isListeningQuestion) return null; // Already rendered as speaking/listening question

                                            return (
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
                                            );
                                        })()}

                                        {/* Fallback for questions without options */}
                                        {!['mcq', 'aptitude', 'technical_mcq', 'soft_skills'].includes(String(currentQuestion.question_type || '').toLowerCase()) && (() => {
                                            const questionTextLower = (currentQuestion.question_text || '').toLowerCase();
                                            const isDistation = currentQuestion.question_type === 'dictation' ||
                                                questionTextLower.includes('listen and write');

                                            // Check for explicit voice types OR instructional keywords
                                            const isVoiceType = ['speaking', 'voice', 'interview'].some(t =>
                                                currentQuestion.question_type?.toLowerCase().includes(t)
                                            );
                                            const isVoiceInstruction = questionTextLower.startsWith('speak') ||
                                                questionTextLower.includes('record your answer') ||
                                                questionTextLower.includes('oral response');

                                            // Enable voice if it matches voice type OR instruction, BUT NOT if it's explicitly dictation
                                            const isVoiceEnabled = (isVoiceType || isVoiceInstruction) && !isDistation;

                                            // Handle dictation specifically
                                            if (isDistation) {
                                                return (
                                                    <div className="h-full flex flex-col">
                                                        <label className="text-sm font-semibold text-gray-600 mb-2">Type what you hear:</label>
                                                        <textarea
                                                            className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-base"
                                                            placeholder="Type here..."
                                                            value={userAnswers[currentQuestion.question_id] || ''}
                                                            onChange={(e) => handleAnswer(currentQuestion.question_id, e.target.value)}
                                                        />
                                                    </div>
                                                );
                                            }

                                            // Handle listening questions
                                            const questionType = String(currentQuestion?.question_type || '').toLowerCase();
                                            const questionText = currentQuestion?.question_text || '';
                                            const isListeningQuestion = questionType === 'listening' ||
                                                questionType === 'listening_question' ||
                                                questionText.toLowerCase().includes('listen and write') ||
                                                questionText.toLowerCase().includes('listen and write down');

                                            if (isListeningQuestion) {
                                                return (
                                                    <div className="h-full flex flex-col">
                                                        <label className="text-sm font-semibold text-gray-600 mb-2">Type what you heard:</label>
                                                        <textarea
                                                            className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
                                                            placeholder="Listen to the audio and type the sentence here..."
                                                            value={userAnswers[currentQuestion.question_id] || ''}
                                                            onChange={(e) => handleAnswer(currentQuestion.question_id, e.target.value)}
                                                        />
                                                        <div className="text-right text-xs text-gray-500 mt-2">
                                                            {(userAnswers[currentQuestion.question_id] || '').length} characters
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Use VoiceResponseArea for voice-enabled questions
                                            const label = isVoiceEnabled
                                                ? "Your Answer (Speak or Type):"
                                                : "Your Answer (Type):";

                                            return (
                                                <div className="h-full flex flex-col">
                                                    <label className="text-sm font-semibold text-gray-600 mb-2">{label}</label>
                                                    <div className="flex-1 min-h-[200px]">
                                                        <VoiceResponseArea
                                                            questionId={currentQuestion.question_id}
                                                            initialAnswer={userAnswers[currentQuestion.question_id] || ''}
                                                            onAnswerChange={(ans) => handleAnswer(currentQuestion.question_id, ans)}
                                                            clearSignal={clearSignal}
                                                            onRecordingStart={stopQuestionAudio}
                                                            enableVoice={isVoiceEnabled}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })()}
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
                                                disabled={isSubmitting}
                                                className="bg-[#16A34A] hover:bg-green-700 text-white px-8 py-2 rounded text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
                                            >
                                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
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
                </div >
                {terminationModal}
            </div >
        );
    }

    return null;
}
