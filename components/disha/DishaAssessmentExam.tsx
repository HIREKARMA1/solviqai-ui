'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, AlertCircle, Loader2, Mic, Square, Volume2 } from 'lucide-react';
import { GroupDiscussionRound } from '@/components/assessment/GroupDiscussionRound';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

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
    const [rounds, setRounds] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [audioPlayed, setAudioPlayed] = useState(false);
    const [overallTimeRemaining, setOverallTimeRemaining] = useState<number | null>(null);
    const [timeWindowRemaining, setTimeWindowRemaining] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roundScore, setRoundScore] = useState<number | null>(null);

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
    }, [currentRound, currentQuestionIndex]); // Re-bind when question changes to ensure handleAnswer has correct context

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
            setAudioPlayed(true);
        } else {
            toast.error('Audio not supported');
        }
    };

    // Reset audio state on question change
    useEffect(() => {
        setAudioPlayed(false);
    }, [currentQuestionIndex]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = currentRound?.questions[currentQuestionIndex];

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
    if (examState === 'exam' && currentRound && currentQuestion) {
        // Special Handling for Group Discussion Round
        if (currentRound.round_type === 'group_discussion') {
            return (
                <div className="w-full max-w-7xl mx-auto px-4 py-8">
                    <GroupDiscussionRound
                        roundId={currentRound.round_id}
                        assessmentId={packageId}
                    // The component handles submission and redirection internally
                    />
                </div>
            );
        }

        const isRoundTimeUp = timeRemaining !== null && timeRemaining <= 0;
        const isOverallTimeUp = overallTimeRemaining !== null && overallTimeRemaining <= 0;
        const isTimeWindowUp = timeWindowRemaining !== null && timeWindowRemaining <= 0;
        const isTimeUp = isRoundTimeUp || isOverallTimeUp || isTimeWindowUp;

        // Check if it's a listening question
        const isListening = currentQuestion.question_text.includes("Listen and write down");
        const isSpeaking = currentQuestion.question_text.includes("Read aloud") || currentQuestion.question_text.includes("Speak about") || currentQuestion.question_text.includes("Describe the");
        let displayText = currentQuestion.question_text;
        let textToSpeak = currentQuestion.question_text;

        if (isListening) {
            // Hide the quoted sentence from display
            const match = currentQuestion.question_text.match(/(Listen and write down.*:)\s*['"](.*)['"]/);
            if (match) {
                displayText = match[1]; // Just the instruction
                // We keep the original text to speak so user hears "Listen and... 'Sentence'"
                textToSpeak = currentQuestion.question_text;
            }
        }

        return (
            <div className="w-full max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Header with Timer */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg sticky top-0 z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                        {currentRound.round_name || `Round ${currentRound.round_number}`}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Question <span className="font-semibold text-blue-600">{currentQuestionIndex + 1}</span> of{' '}
                                        <span className="font-semibold">{currentRound.questions.length}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {/* Round Timer */}
                                    <div className={`text-right px-4 py-2 rounded-lg ${isRoundTimeUp ? 'bg-red-100 dark:bg-red-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Round Time</p>
                                        <div className="flex items-center gap-2">
                                            <Clock className={`h-5 w-5 ${isRoundTimeUp ? 'text-red-600' : 'text-blue-600'}`} />
                                            <span className={`text-xl font-bold ${isRoundTimeUp ? 'text-red-600' : 'text-blue-600'}`}>
                                                {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
                                            </span>
                                        </div>
                                        {isRoundTimeUp && (
                                            <p className="text-xs text-red-600 mt-1">Round Time Up!</p>
                                        )}
                                    </div>
                                    {/* Overall Timer */}
                                    {overallTimeRemaining !== null && (
                                        <div className={`text-right px-4 py-2 rounded-lg ${isOverallTimeUp ? 'bg-red-100 dark:bg-red-900/20' : 'bg-purple-100 dark:bg-purple-900/20'}`}>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Overall Time</p>
                                            <div className="flex items-center gap-2">
                                                <Clock className={`h-5 w-5 ${isOverallTimeUp ? 'text-red-600' : 'text-purple-600'}`} />
                                                <span className={`text-xl font-bold ${isOverallTimeUp ? 'text-red-600' : 'text-purple-600'}`}>
                                                    {formatTime(overallTimeRemaining)}
                                                </span>
                                            </div>
                                            {isOverallTimeUp && (
                                                <p className="text-xs text-red-600 mt-1">Assessment Time Up!</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${((currentQuestionIndex + 1) / currentRound.questions.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Question Display */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                            <div className="mb-6">
                                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs font-semibold rounded-full mb-4">
                                    Question {currentQuestionIndex + 1} ({currentQuestion.points} pts)
                                </span>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">
                                    {displayText}
                                </h3>

                                {isListening && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => playQuestionAudio(textToSpeak)}
                                            disabled={audioPlayed}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${audioPlayed
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                                }`}
                                        >
                                            <Volume2 className="w-5 h-5" />
                                            {audioPlayed ? 'Audio Played' : 'Play Audio (Once)'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* MCQ Options */}
                            {currentQuestion.question_type === 'mcq' && currentQuestion.options ? (
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, idx) => {
                                        const optionLetter = String.fromCharCode(65 + idx);
                                        const isSelected = userAnswers[currentQuestion.question_id] === optionLetter;

                                        let cleanOption = String(option).trim();
                                        const letterPrefixPattern = /^[A-Z]\.?\s*/i;
                                        if (letterPrefixPattern.test(cleanOption)) {
                                            cleanOption = cleanOption.replace(letterPrefixPattern, '').trim();
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => !isTimeUp && handleAnswer(currentQuestion.question_id, optionLetter)}
                                                disabled={isTimeUp}
                                                className={`w-full text-left p-4 border-2 rounded-lg transition-all duration-200 ${isSelected
                                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                    } ${isTimeUp ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex items-start">
                                                    <span className={`font-bold mr-3 mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                                                        {optionLetter}.
                                                    </span>
                                                    <span className="flex-1 text-gray-800 dark:text-gray-200">{cleanOption}</span>
                                                    {isSelected && (
                                                        <CheckCircle2 className="w-5 h-5 text-blue-600 ml-2 flex-shrink-0" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                // Text Answer
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Your Answer
                                    </label>

                                    {isSpeaking ? (
                                        <div className={`w-full p-4 border-2 rounded-lg min-h-[160px] transition-all ${isLiveTranscribing
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                                            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                                            }`}>
                                            {userAnswers[currentQuestion.question_id] ? (
                                                <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                                                    {userAnswers[currentQuestion.question_id]}
                                                </p>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                                                    <Mic className="w-8 h-8 mb-2 opacity-50" />
                                                    <p className="text-sm italic">Click "Start Speaking" to record your answer...</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <textarea
                                            value={userAnswers[currentQuestion.question_id] || ''}
                                            onChange={(e) => {
                                                !isTimeUp && handleAnswer(currentQuestion.question_id, e.target.value);
                                                if (!isListening) setLiveTranscript(e.target.value);
                                            }}
                                            disabled={isTimeUp}
                                            placeholder="Type your answer here..."
                                            className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400"
                                            rows={6}
                                        />
                                    )}

                                    {/* Speech Controls - Show ONLY for Speaking Questions */}
                                    {isSpeaking && (
                                        <div className="mt-4 flex items-center gap-4">
                                            {!isLiveTranscribing ? (
                                                <button
                                                    onClick={startLiveTranscription}
                                                    disabled={isTimeUp}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
                                                >
                                                    <Mic className="w-5 h-5" />
                                                    <span>Start Speaking</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={stopLiveTranscription}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition animate-pulse"
                                                >
                                                    <Square className="w-5 h-5 fill-current" />
                                                    <span>Stop Recording</span>
                                                </button>
                                            )}
                                            {isLiveTranscribing && (
                                                <span className="text-sm text-gray-500 animate-pulse">
                                                    Listening... (Speak clearly)
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                    disabled={currentQuestionIndex === 0 || isTimeUp}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentQuestionIndex(Math.min(currentRound.questions.length - 1, currentQuestionIndex + 1))}
                                    disabled={currentQuestionIndex === currentRound.questions.length - 1 || isTimeUp}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={submitRound}
                                    disabled={isSubmitting || isTimeUp}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg ml-auto hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <span>Submit Round</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Question Navigator Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg sticky top-6">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Questions</h4>
                            <div className="grid grid-cols-5 gap-2">
                                {currentRound.questions.map((q, idx) => {
                                    const isCurrent = currentQuestionIndex === idx;
                                    const isAnswered = q.question_id in userAnswers && userAnswers[q.question_id]?.trim() !== '';

                                    return (
                                        <button
                                            key={q.question_id}
                                            onClick={() => !isTimeUp && setCurrentQuestionIndex(idx)}
                                            disabled={isTimeUp}
                                            className={`w-full aspect-square rounded-lg text-xs font-semibold transition-all ${isCurrent
                                                ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                                                : isAnswered
                                                    ? 'bg-yellow-500 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                } ${isTimeUp ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <div>Loading...</div>;
}

