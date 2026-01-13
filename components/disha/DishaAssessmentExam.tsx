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
                <div className="w-full max-w-7xl mx-auto px-4 py-8">
                    <GroupDiscussionRound
                        roundId={currentRound.round_id}
                        assessmentId={packageId}
                    />
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
                <div className="min-h-screen bg-gray-100 flex flex-col">
                    <div className="bg-indigo-600 text-white p-3 sm:p-4 shadow-md z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center max-w-7xl mx-auto gap-2 sm:gap-0">
                            <h1 className="text-lg font-semibold">
                                Round {packageInfo?.current_round}: Coding Challenge
                            </h1>
                            <div className="flex items-center gap-4">
                                <div className="text-sm font-medium bg-indigo-700 px-3 py-1 rounded-full border border-indigo-500">
                                    Time Left: <span className="font-bold">{formatTime(timeRemaining)}</span>
                                </div>
                                <button
                                    onClick={toggleFullscreen}
                                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-sm transition"
                                >
                                    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        <div className="absolute inset-0 overflow-y-auto">
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
            <div className="min-h-screen bg-gray-100 select-none flex flex-col">
                {/* Header */}
                <div className="bg-blue-600 text-white p-3 sm:p-4">
                    <div className="flex justify-between items-center w-full px-3 sm:px-6 gap-2 sm:gap-3">
                        <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate">
                            Round {packageInfo?.current_round}: {currentRound.round_name || 'Assessment'}
                        </h1>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <button
                                onClick={toggleFullscreen}
                                className="bg-white/15 hover:bg-white/25 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm whitespace-nowrap"
                                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                            >
                                <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
                                <span className="sm:hidden">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden">
                    {/* Main Question Area */}
                    <div className="flex-1 bg-white p-3 sm:p-4 md:p-6 flex flex-col overflow-y-auto">
                        <div className="max-w-none">
                            <div className="mb-4 sm:mb-6">
                                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                                    Question No {currentQuestionIndex + 1}
                                </h2>

                                <div className="bg-gray-50 p-3 sm:p-4 border rounded mb-4 sm:mb-6">
                                    {/* Question Text */}
                                    <p className="text-sm sm:text-base font-medium text-gray-800 mb-3 sm:mb-4 select-none" onCopy={(e) => e.preventDefault()}>
                                        {currentQuestion.question_text}
                                    </p>

                                    {/* MCQ Options */}
                                    {/* MCQ / Aptitude / Soft Skills / Technical MCQ */}
                                    {['mcq', 'aptitude', 'technical_mcq', 'soft_skills'].includes(String(currentQuestion.question_type || '').toLowerCase()) && (
                                        (() => {
                                            const mcqOptions = normalizeMcqOptions(currentQuestion);
                                            if (!mcqOptions || mcqOptions.length === 0) {
                                                return <div className="text-sm text-gray-500">No options available for this question.</div>;
                                            }
                                            return (
                                                <div className="space-y-2">
                                                    {mcqOptions.map((option: any, index: number) => {
                                                        const optionLetter = String.fromCharCode(65 + index);
                                                        const optionText = typeof option === 'string'
                                                            ? option
                                                            : (option?.text ?? option?.label ?? JSON.stringify(option));

                                                        const isSelected = userAnswers[currentQuestion.question_id] === optionText;

                                                        return (
                                                            <label
                                                                key={index}
                                                                className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-gray-200'}`}
                                                            >
                                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                                </div>
                                                                <input
                                                                    type="radio"
                                                                    name={`question-${currentQuestion.question_id}`}
                                                                    value={optionText}
                                                                    checked={isSelected}
                                                                    onChange={(e) => handleAnswer(currentQuestion.question_id, e.target.value)}
                                                                    className="hidden"
                                                                />
                                                                <span className="flex-1 select-none text-sm sm:text-base text-gray-800" onCopy={(e) => e.preventDefault()}>
                                                                    {optionLetter}) {optionText}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()
                                    )}

                                    {/* Text Input */}
                                    {currentQuestion.question_type === 'text' && (
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                                                <p className="text-xs sm:text-sm text-blue-800 flex items-center gap-2">
                                                    <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                                    Write your answer below:
                                                </p>
                                            </div>
                                            <textarea
                                                className="w-full h-24 sm:h-32 p-2 sm:p-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Type your answer here..."
                                                value={userAnswers[currentQuestion.question_id] || ''}
                                                onChange={(e) => handleAnswer(currentQuestion.question_id, e.target.value)}
                                            />
                                            <p className="text-xs text-gray-500">
                                                Word count: {(userAnswers[currentQuestion.question_id] || '').split(/\s+/).filter(Boolean).length} words
                                            </p>
                                        </div>
                                    )}

                                    {/* Dictation / Voice Types handles */}
                                    {currentQuestion.question_type === 'dictation' && (
                                        <div className="space-y-3 sm:space-y-4">
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                                <button
                                                    onClick={() => playQuestionAudio(currentQuestion.question_text)}
                                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                                >
                                                    <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    <span>Play Audio</span>
                                                </button>
                                            </div>
                                            <textarea
                                                className="w-full h-20 sm:h-24 p-2 sm:p-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                                placeholder="Type what you hear..."
                                                value={userAnswers[currentQuestion.question_id] || ''}
                                                onChange={(e) => handleAnswer(currentQuestion.question_id, e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Question Palette */}
                    <div className="w-full lg:w-80 bg-white border-l border-t lg:border-t-0 p-3 sm:p-4 overflow-y-auto max-h-[400px] lg:max-h-[calc(100vh-64px)]">
                        <div className="mb-4 sm:mb-6">
                            <div className="mt-1">
                                <div className="text-xs font-semibold text-gray-600 text-center mb-2">Time Left</div>
                                <div className="flex justify-center gap-3 sm:gap-6">
                                    <div className="text-center">
                                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t.hours}</div>
                                        <div className="text-[10px] sm:text-[11px] text-gray-500">hours</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t.minutes}</div>
                                        <div className="text-[10px] sm:text-[11px] text-gray-500">minutes</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isTimeUp ? 'text-red-600' : 'text-gray-900'}`}>{t.seconds}</div>
                                        <div className="text-[10px] sm:text-[11px] text-gray-500">seconds</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-left justify-left gap-2 mt-4 sm:mt-6 text-left border-t pt-4">
                                <span className="text-xs sm:text-sm text-gray-600 font-bold">Candidate: {packageInfo?.assessment_name || 'Student'}</span>
                            </div>
                        </div>

                        <div className="mb-4 sm:mb-6">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">Legend</h3>
                            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-green-600 text-white rounded flex items-center justify-center text-xs font-medium flex-shrink-0">
                                        {counts.answered}
                                    </div>
                                    <span className="text-gray-700 font-medium">Answered</span>
                                </div>
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-red-600 text-white rounded flex items-center justify-center text-xs font-medium flex-shrink-0">
                                        {counts.notAnswered}
                                    </div>
                                    <span className="text-gray-700 font-medium">Not Answered</span>
                                </div>
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-purple-600 text-white rounded flex items-center justify-center text-xs font-medium flex-shrink-0">
                                        {counts.marked}
                                    </div>
                                    <span className="text-gray-700 font-medium">Marked</span>
                                </div>
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-400 text-white rounded flex items-center justify-center text-xs font-medium flex-shrink-0">
                                        {counts.notVisited}
                                    </div>
                                    <span className="text-gray-700 font-medium">Not Visited</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4 sm:mb-6">
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Question Palette:</p>
                            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                                {currentRound.questions.map((q, index) => {
                                    const status = getQuestionStatus(index);
                                    const isCurrent = index === currentQuestionIndex;
                                    let bgColor = 'bg-gray-300 text-gray-700';

                                    if (isCurrent) bgColor = 'bg-blue-600 text-white border-2 border-blue-900';
                                    else if (status === 'answered') bgColor = 'bg-green-600 text-white';
                                    else if (status === 'marked') bgColor = 'bg-purple-600 text-white';
                                    else if (status === 'notAnswered') bgColor = 'bg-red-600 text-white';

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => navigateToQuestion(index)}
                                            className={`w-8 h-8 text-xs font-medium rounded flex items-center justify-center ${bgColor}`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-3 mt-auto">
                            <button
                                onClick={handleSubmitWithConfirmation}
                                disabled={isSubmitting}
                                className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-sm ${!isSubmitting
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Round'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="w-full border-t bg-gray-50 sticky bottom-0 z-10 p-3 sm:px-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="flex gap-3">
                            <button
                                onClick={handleMarkForReview}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm transition"
                            >
                                {markedQuestions.has(currentQuestionIndex) ? 'Unmark' : 'Mark for Review'}
                            </button>
                            <button
                                onClick={handleClearResponse}
                                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded text-sm transition"
                            >
                                Clear
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => navigateToQuestion(Math.max(0, currentQuestionIndex - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 px-4 py-2 rounded text-sm transition"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => navigateToQuestion(Math.min(currentRound.questions.length - 1, currentQuestionIndex + 1))}
                                disabled={currentQuestionIndex === currentRound.questions.length - 1}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded text-sm transition"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
