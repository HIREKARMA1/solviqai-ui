'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, Square, CheckCircle2 } from 'lucide-react';
import { config } from '@/lib/config';
import SubscriptionRequiredModal from '../subscription/SubscriptionRequiredModal';

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

interface Question {
    id?: string;
    exam_type: string;
    topic: string;
    difficulty: string;
    question_type: string;
    question_text: string;
    options?: string[] | null;
    correct_answer?: string | null;
    explanation?: string;
    is_ai_generated: boolean;
}

export default function AssessmentSkillsPractice() {
    const [assessmentType, setAssessmentType] = useState<'aptitude' | 'soft_skills'>('aptitude');
    const [topic, setTopic] = useState<string>('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [numQuestions, setNumQuestions] = useState<number>(5);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [audioPlayed, setAudioPlayed] = useState<Record<number, boolean>>({});
    const [subscriptionType, setSubscriptionType] = useState<string>('free');
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

    // Live Transcription States
    const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
    const isTranscribingRef = useRef(false); // Track state via ref to avoid stale closures

    const fetchQuestions = async () => {
        setLoading(true);
        const startTime = Date.now();
        try {
            const token = localStorage.getItem('access_token');
            if (!token) throw new Error("Please log in");

            const params = new URLSearchParams({
                exam_type: assessmentType,
                difficulty,
                limit: numQuestions.toString(),
            });
            if (topic.trim()) {
                params.append('topic', topic.trim());
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(
                `${config.api.fullUrl}/api/v1/practice/assessment?${params}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 403 || response.status === 402) {
                    setShowSubscriptionModal(true);
                    throw new Error("Subscription limit reached");
                }
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();
            const elapsed = Date.now() - startTime;
            console.log(`Questions loaded in ${elapsed}ms`);

            setQuestions(data.items || []);
            setCurrentQuestionIndex(0);
            setUserAnswers({});
            setShowResults(false);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                alert('Request timeout. Please try again with fewer questions.');
            } else if (error.message !== "Subscription limit reached") {
                console.error('Failed to fetch questions:', error);
                alert('Failed to load questions. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const startLiveTranscription = () => {
        if (!speechRecognitionRef.current) {
            alert('Speech recognition not available. Use Chrome or Edge browser.');
            return;
        }

        if (isLiveTranscribing) {
            return; // Already recording
        }

        try {
            // Clear previous transcripts
            setLiveTranscript('');
            setInterimTranscript('');

            // Update ref before starting
            isTranscribingRef.current = true;

            // Start recognition
            speechRecognitionRef.current.start();
            setIsLiveTranscribing(true);
        } catch (error: any) {
            console.error('Error starting speech recognition:', error);
            isTranscribingRef.current = false;
            // If already started, just set the state
            if (error.message && error.message.includes('already')) {
                setIsLiveTranscribing(true);
                isTranscribingRef.current = true;
            } else {
                alert('Failed to start recording. Please try again.');
            }
        }
    };

    const stopLiveTranscription = () => {
        if (!speechRecognitionRef.current || !isLiveTranscribing) {
            return;
        }

        // Update ref immediately to prevent restart
        isTranscribingRef.current = false;

        try {
            speechRecognitionRef.current.stop();
        } catch (e) {
            console.log('Error stopping recognition:', e);
        }

        // Use a timeout to ensure we get the final transcript
        setTimeout(() => {
            setIsLiveTranscribing(false);

            // Get the final transcript
            const fullTranscript = (liveTranscript + ' ' + interimTranscript).trim();

            if (fullTranscript) {
                handleAnswer(fullTranscript);
            }

            // Clear transcripts after saving
            setLiveTranscript('');
            setInterimTranscript('');
        }, 100);
    };

    const handleAnswer = (answer: string) => {
        setUserAnswers((prev) => ({
            ...prev,
            [currentQuestionIndex]: answer,
        }));
    };

    // Initialize speech synthesis voices
    useEffect(() => {
        if ('speechSynthesis' in window) {
            // Load voices when they become available
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    console.log('Voices loaded:', voices.length);
                }
            };
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // Check Subscription Status
    useEffect(() => {
        const checkUser = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                const response = await fetch(`${config.api.fullUrl}/api/v1/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const userData = await response.json();
                    const sub = userData.subscription_type || 'free';
                    setSubscriptionType(sub);

                    // Force limit to 2 for free users
                    if (sub === 'free') {
                        setNumQuestions(2);
                    }
                }
            } catch (err) {
                console.error("Failed to check subscription", err);
            }
        };
        checkUser();
    }, []);

    // Initialize Web Speech API for voice recording (only once on mount)
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

                    setInterimTranscript(interim);

                    if (final) {
                        setLiveTranscript(prev => prev + final);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    if (event.error === 'no-speech') {
                        // Don't show alert for no-speech, it's common during pauses
                        console.log('No speech detected');
                    } else if (event.error === 'audio-capture') {
                        alert('No microphone found. Check your device.');
                        setIsLiveTranscribing(false);
                    } else if (event.error === 'not-allowed') {
                        alert('Microphone permission denied. Please allow access.');
                        setIsLiveTranscribing(false);
                    } else if (event.error === 'aborted') {
                        // Recognition was stopped, this is normal
                        console.log('Recognition aborted');
                    } else {
                        console.error('Speech recognition error:', event.error);
                    }
                };

                recognition.onend = () => {
                    // Only restart if we're still supposed to be transcribing
                    // Use ref to check current state (avoids stale closure)
                    if (isTranscribingRef.current && speechRecognitionRef.current === recognition) {
                        try {
                            recognition.start();
                        } catch (e: any) {
                            // If already started or aborted, that's fine
                            if (e.message && !e.message.includes('already') && !e.message.includes('aborted')) {
                                console.log('Recognition restart skipped:', e);
                            }
                        }
                    }
                };

                speechRecognitionRef.current = recognition;
            } else {
                console.warn('Web Speech API not supported in this browser');
            }
        }

        return () => {
            if (speechRecognitionRef.current) {
                try {
                    speechRecognitionRef.current.stop();
                } catch (e) {
                    // Already stopped
                }
                speechRecognitionRef.current = null;
            }
        };
    }, []); // Only run once on mount

    // Handle isLiveTranscribing changes separately
    useEffect(() => {
        if (!speechRecognitionRef.current) return;

        // This effect handles the restart logic when isLiveTranscribing changes
        // but doesn't recreate the recognition instance
    }, [isLiveTranscribing]);

    // Reset transcription when question changes
    useEffect(() => {
        if (speechRecognitionRef.current && isLiveTranscribing) {
            isTranscribingRef.current = false;
            try {
                speechRecognitionRef.current.stop();
            } catch (e) {
                console.log('Already stopped');
            }
            setIsLiveTranscribing(false);
        }
        setLiveTranscript('');
        setInterimTranscript('');
    }, [currentQuestionIndex]);

    const playDictationAudio = (text: string, retryCount: number = 0) => {
        console.log('🔊 TTS called with text:', text);

        if (!text || text.trim() === '') {
            console.error('❌ Empty or undefined text');
            alert('No text to play!');
            return;
        }

        if (!('speechSynthesis' in window)) {
            console.error('❌ Speech synthesis not supported');
            alert('Text-to-speech not supported. Try Chrome or Edge.');
            return;
        }

        if (retryCount >= 3) {
            console.error('❌ Max retries reached');
            alert('Unable to play audio. Please try refreshing the page.');
            return;
        }

        // Cancel any ongoing speech first
        window.speechSynthesis.cancel();

        // Small delay to ensure cancellation completes
        setTimeout(() => {
            try {
                // Get available voices and prefer high-quality ones
                const voices = window.speechSynthesis.getVoices();
                const preferredVoice = voices.find(v =>
                    v.lang.startsWith('en') &&
                    (v.name.toLowerCase().includes('neural') ||
                        v.name.toLowerCase().includes('premium') ||
                        v.name.toLowerCase().includes('enhanced'))
                ) || voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));

                const utterance = new SpeechSynthesisUtterance(text.trim());

                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                    utterance.lang = preferredVoice.lang;
                } else {
                    utterance.lang = 'en-US';
                }

                // Optimized settings for clarity
                utterance.rate = 0.88;  // Slightly slower for better comprehension
                utterance.pitch = 1.0;
                utterance.volume = 1.0;  // Maximum volume

                let hasStarted = false;
                const timeout = setTimeout(() => {
                    if (!hasStarted && retryCount < 2) {
                        console.warn('TTS timeout, retrying...');
                        window.speechSynthesis.cancel();
                        playDictationAudio(text, retryCount + 1);
                    }
                }, 2000);

                utterance.onstart = () => {
                    hasStarted = true;
                    clearTimeout(timeout);
                    console.log('✅ Speech STARTED');
                    // Mark audio as played for the current question
                    setAudioPlayed(prev => ({
                        ...prev,
                        [currentQuestionIndex]: true
                    }));
                };

                utterance.onend = () => {
                    clearTimeout(timeout);
                    console.log('✅ Speech ENDED');
                };

                utterance.onerror = (event: any) => {
                    clearTimeout(timeout);
                    console.error('❌ TTS Error:', event.error, event);

                    // Retry on certain errors
                    if ((event.error === 'synthesis-failed' ||
                        event.error === 'synthesis-unavailable' ||
                        event.error === 'audio-busy') && retryCount < 2) {
                        console.log('Retrying TTS...');
                        setTimeout(() => {
                            playDictationAudio(text, retryCount + 1);
                        }, 500);
                    } else {
                        alert(`Audio error: ${event.error || 'Unknown error'}`);
                    }
                };

                console.log('📢 Calling speak()...');
                window.speechSynthesis.speak(utterance);
                console.log('📢 speak() called successfully');
            } catch (err) {
                console.error('Error creating utterance:', err);
                if (retryCount < 2) {
                    setTimeout(() => {
                        playDictationAudio(text, retryCount + 1);
                    }, 500);
                } else {
                    alert('Failed to play audio. Please try again.');
                }
            }
        }, 150);
    };

    const goToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
    };

    const handleSubmit = () => {
        setShowResults(true);
    };

    const calculateScore = () => {
        let correct = 0;
        questions.forEach((q, idx) => {
            const userAnswer = userAnswers[idx];
            if (!userAnswer) return;

            if (q.question_type === 'dictation') {
                // For dictation, compare case-insensitively and normalize whitespace
                const normalizedUser = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
                const normalizedCorrect = (q.correct_answer || q.question_text || '').trim().toLowerCase().replace(/\s+/g, ' ');
                if (normalizedUser === normalizedCorrect) {
                    correct++;
                }
            } else if (q.correct_answer && userAnswer === q.correct_answer) {
                correct++;
            }
        });
        return correct;
    };

    const currentQuestion = questions[currentQuestionIndex];
    const isAnswered = currentQuestionIndex in userAnswers;
    const correctCount = calculateScore();
    const scorePercentage = Math.round((correctCount / questions.length) * 100);

    // Results Review Page
    if (showResults) {
        const incorrectCount = questions.length - correctCount;
        const unansweredCount = questions.length - Object.keys(userAnswers).length;
        const getScoreColor = () => {
            if (scorePercentage >= 80) return 'text-green-600';
            if (scorePercentage >= 60) return 'text-yellow-600';
            return 'text-red-600';
        };
        const getScoreBg = () => {
            if (scorePercentage >= 80) return 'bg-green-50 border-green-200';
            if (scorePercentage >= 60) return 'bg-yellow-50 border-yellow-200';
            return 'bg-red-50 border-red-200';
        };

        return (
            <div className="w-full max-w-4xl mx-auto">
                {/* Score Summary */}
                <div className={`bg-white p-8 rounded-lg shadow-lg mb-6 border-2 ${getScoreBg()}`}>
                    <div className="text-center mb-6">
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">Assessment Complete! 🎉</h2>
                        <p className="text-gray-600">Review your performance and learn from the explanations</p>
                    </div>

                    {/* Main Score Display */}
                    <div className="text-center mb-6">
                        <p className="text-gray-600 text-sm font-medium mb-2">Your Score</p>
                        <p className={`text-6xl font-bold ${getScoreColor()}`}>{scorePercentage}%</p>
                        <p className="text-gray-500 text-sm mt-2">
                            {correctCount} out of {questions.length} questions correct
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-center mb-2">
                                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-xs font-medium mb-1">Correct</p>
                            <p className="text-3xl font-bold text-green-600">{correctCount}</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-center mb-2">
                                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-xs font-medium mb-1">Incorrect</p>
                            <p className="text-3xl font-bold text-red-600">{incorrectCount}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-center mb-2">
                                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-xs font-medium mb-1">Unanswered</p>
                            <p className="text-3xl font-bold text-gray-600">{unansweredCount}</p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => {
                            setQuestions([]);
                            setUserAnswers({});
                            setShowResults(false);
                        }}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Practice Again
                    </button>
                </div>

                {/* Review All Answers */}
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">Review Your Answers</h3>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                <span>Correct</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-500 rounded"></div>
                                <span>Incorrect</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                                <span>Not Answered</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {questions.map((question, idx) => {
                            const userAnswer = userAnswers[idx];
                            let isCorrect = false;
                            if (question.question_type === 'dictation') {
                                // For dictation, compare case-insensitively
                                const normalizedUser = (userAnswer || '').trim().toLowerCase().replace(/\s+/g, ' ');
                                const normalizedCorrect = (question.correct_answer || question.question_text || '').trim().toLowerCase().replace(/\s+/g, ' ');
                                isCorrect = normalizedUser === normalizedCorrect;
                            } else {
                                isCorrect = userAnswer === question.correct_answer;
                            }
                            const isAnswered = idx in userAnswers;

                            return (
                                <div
                                    key={idx}
                                    className={`p-6 border-l-4 rounded-lg shadow-sm transition-all hover:shadow-md ${isAnswered && isCorrect
                                        ? 'border-green-600 bg-green-50'
                                        : isAnswered && !isCorrect
                                            ? 'border-red-600 bg-red-50'
                                            : 'border-gray-300 bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isAnswered && isCorrect
                                                    ? 'bg-green-600 text-white'
                                                    : isAnswered && !isCorrect
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-gray-500 text-white'
                                                    }`}>
                                                    Question {idx + 1}
                                                </span>
                                                {isAnswered && isCorrect && (
                                                    <span className="flex items-center gap-1 text-green-700 font-semibold">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Correct
                                                    </span>
                                                )}
                                                {isAnswered && !isCorrect && (
                                                    <span className="flex items-center gap-1 text-red-700 font-semibold">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                        Incorrect
                                                    </span>
                                                )}
                                                {!isAnswered && (
                                                    <span className="flex items-center gap-1 text-gray-600 font-semibold">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                        </svg>
                                                        Not Answered
                                                    </span>
                                                )}
                                            </div>
                                            {question.question_type === 'dictation' ? (
                                                <h4 className="text-lg font-semibold text-gray-900 leading-relaxed">
                                                    Listen and write down the following sentence:
                                                </h4>
                                            ) : (
                                                <h4 className="text-lg font-semibold text-gray-900 leading-relaxed">{question.question_text}</h4>
                                            )}
                                        </div>
                                    </div>

                                    {/* MCQ Options Display */}
                                    {question.question_type === 'mcq' && question.options ? (
                                        <div className="space-y-3 mb-4">
                                            {question.options.map((option, optIdx) => {
                                                const optionLetter = String.fromCharCode(65 + optIdx);
                                                const isUserSelected = userAnswer === optionLetter;
                                                const isCorrectAnswer = optionLetter === question.correct_answer;

                                                // Clean option text - remove any existing letter prefix (A., B., etc.)
                                                let cleanOption = String(option).trim();
                                                // Remove patterns like "A. ", "A.", "A) ", "A)", etc.
                                                const letterPrefixPattern = /^[A-Z]\.?\s*/i;
                                                if (letterPrefixPattern.test(cleanOption)) {
                                                    cleanOption = cleanOption.replace(letterPrefixPattern, '').trim();
                                                }

                                                return (
                                                    <div
                                                        key={optIdx}
                                                        className={`p-4 rounded-lg border-2 transition-all ${isCorrectAnswer
                                                            ? 'border-green-600 bg-green-100 shadow-sm'
                                                            : isUserSelected && !isCorrect
                                                                ? 'border-red-600 bg-red-100 shadow-sm'
                                                                : 'border-gray-300 bg-white'
                                                            }`}
                                                    >
                                                        <div className="flex items-start">
                                                            <span className={`font-bold mr-3 mt-1 ${isCorrectAnswer
                                                                ? 'text-green-700'
                                                                : isUserSelected && !isCorrect
                                                                    ? 'text-red-700'
                                                                    : 'text-gray-600'
                                                                }`}>
                                                                {optionLetter}.
                                                            </span>
                                                            <span className="flex-1 text-gray-800">{cleanOption}</span>
                                                            {isCorrectAnswer && (
                                                                <svg className="w-5 h-5 text-green-600 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                            {isUserSelected && !isCorrect && (
                                                                <svg className="w-5 h-5 text-red-600 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        // Text/Dictation/Voice answer display
                                        <div className="mb-4 space-y-3">
                                            <div className="p-4 bg-white rounded-lg border-2 border-gray-300">
                                                <p className="text-sm font-semibold text-gray-700 mb-2">Your Answer:</p>
                                                {question.question_type === 'voice_reading' || question.question_type === 'voice_speaking' ? (
                                                    <div className="space-y-2">
                                                        <p className="text-sm text-gray-800">{userAnswer || 'No answer provided'}</p>
                                                        {userAnswer && (
                                                            <p className="text-xs text-gray-500 italic">
                                                                (Transcribed from your voice recording)
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-800">{userAnswer || 'No answer provided'}</p>
                                                )}
                                            </div>
                                            {question.question_type === 'dictation' && (question.correct_answer || question.question_text) && (
                                                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                                                    <p className="text-sm font-semibold text-green-700 mb-2">Correct Answer:</p>
                                                    <p className="text-sm text-green-800">{question.correct_answer || question.question_text}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Explanation */}
                                    {question.explanation && (
                                        <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                <p className="text-sm font-semibold text-blue-900">Explanation</p>
                                            </div>
                                            <p className="text-sm text-blue-800 leading-relaxed">{question.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Initial Form Screen
    if (questions.length === 0) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 via-white to-blue-50/30 rounded-2xl shadow-xl border border-blue-100/50">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        <h2 className="text-3xl font-bold">
                            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">AI-Powered</span>{' '}
                            <span className="text-blue-400">Assessment Practice</span>
                        </h2>
                    </div>
                </div>

                {/* Assessment Type Selector with Sliding Indicator */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                        Assessment Type
                    </label>
                    <div className="relative flex gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200/50 shadow-lg">
                        {/* Sliding Background Indicator */}
                        <div
                            className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 shadow-lg transition-all duration-500 ease-out z-0"
                            style={{
                                width: 'calc(50% - 8px)',
                                left: assessmentType === 'aptitude' ? '4px' : 'calc(50% + 4px)',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                            }}
                        ></div>
                        <button
                            onClick={() => setAssessmentType('aptitude')}
                            className={`relative z-10 flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${assessmentType === 'aptitude'
                                ? 'text-white scale-105 shadow-md'
                                : 'text-gray-700 hover:scale-[1.02]'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                                Aptitude
                            </div>
                        </button>
                        <button
                            onClick={() => setAssessmentType('soft_skills')}
                            className={`relative z-10 flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${assessmentType === 'soft_skills'
                                ? 'text-white scale-105 shadow-md'
                                : 'text-gray-700 hover:scale-[1.02]'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Soft Skills
                            </div>
                        </button>
                    </div>
                </div>

                {/* Topic Input */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                        Topic (Optional)
                    </label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={
                            assessmentType === 'aptitude'
                                ? "e.g., 'work and time', 'percentages' — leave empty for AI-curated mix"
                                : "e.g., 'communication', 'leadership' — leave empty for AI-curated mix"
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md bg-white/90 backdrop-blur-sm text-gray-900"
                    />
                </div>

                {/* Difficulty Level with Sliding Indicator */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                        Difficulty Level
                    </label>
                    <div className="relative flex gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200/50 shadow-lg">
                        {/* Sliding Background Indicator */}
                        <div
                            className="absolute top-1 bottom-1 rounded-lg shadow-lg transition-all duration-500 ease-out z-0"
                            style={{
                                width: 'calc(33.333% - 8px)',
                                left: difficulty === 'easy'
                                    ? '4px'
                                    : difficulty === 'medium'
                                        ? 'calc(33.333% + 4px)'
                                        : 'calc(66.666% + 4px)',
                                background: difficulty === 'easy'
                                    ? 'linear-gradient(to right, #3b82f6, #2563eb)'
                                    : difficulty === 'medium'
                                        ? 'linear-gradient(to right, #10b981, #059669)'
                                        : 'linear-gradient(to right, #1f2937, #111827)',
                                boxShadow: difficulty === 'easy'
                                    ? '0 4px 12px rgba(37, 99, 235, 0.4)'
                                    : difficulty === 'medium'
                                        ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                                        : '0 4px 12px rgba(31, 41, 55, 0.4)',
                            }}
                        ></div>
                        {(['easy', 'medium', 'hard'] as const).map((level) => {
                            const isSelected = difficulty === level;
                            const icons = {
                                easy: (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                ),
                                medium: (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                    </svg>
                                ),
                                hard: (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                ),
                            };
                            const colors = {
                                easy: isSelected ? 'text-white' : 'text-green-600',
                                medium: isSelected ? 'text-white' : 'text-orange-600',
                                hard: isSelected ? 'text-white' : 'text-gray-700',
                            };
                            return (
                                <button
                                    key={level}
                                    onClick={() => setDifficulty(level)}
                                    className={`relative z-10 flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 capitalize flex items-center justify-center gap-2 ${isSelected
                                        ? 'scale-105 shadow-md'
                                        : 'hover:scale-102'
                                        } ${colors[level]}`}
                                >
                                    {icons[level]}
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Number of Questions */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                        Number of Questions
                        {subscriptionType === 'free' && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold">
                                Free Limit: 2
                            </span>
                        )}
                    </label>
                    <div className={`relative ${subscriptionType === 'free' ? 'opacity-60 grayscale' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-medium">{subscriptionType === 'free' ? '2 questions' : '1 question'}</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                                {numQuestions}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">{subscriptionType === 'free' ? 'Max 2' : '25 questions'}</span>
                        </div>
                        <input
                            type="range"
                            min={subscriptionType === 'free' ? "2" : "1"}
                            max={subscriptionType === 'free' ? "2" : "25"}
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                            disabled={subscriptionType === 'free'}
                            className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${subscriptionType === 'free' ? 'cursor-not-allowed' : ''}`}
                            style={{
                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${subscriptionType === 'free' ? 100 : ((numQuestions - 1) / 24) * 100}%, #e5e7eb ${subscriptionType === 'free' ? 100 : ((numQuestions - 1) / 24) * 100}%, #e5e7eb 100%)`,
                            }}
                        />
                        {subscriptionType === 'free' && (
                            <p className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                                🔒 <strong>Free Plan Limit Check:</strong> You can only generate 2 questions. Upgrade to Premium for up to 30/day!
                            </p>
                        )}
                    </div>
                </div>

                {/* Fetch Button */}
                <button
                    onClick={fetchQuestions}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none ${loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
                        }`}
                >
                    {loading ? (
                        <>
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            <span>Loading Questions... (may take 10-15s)</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>Start AI Practice Session</span>
                        </>
                    )}
                </button>
            </div>
        );
    }

    // Questions View
    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Header */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                    {assessmentType === 'aptitude' ? 'Aptitude Practice' : 'Soft Skills Practice'}
                                </h2>
                                <p className="text-gray-600">
                                    Question <span className="font-semibold text-blue-600">{currentQuestionIndex + 1}</span> of{' '}
                                    <span className="font-semibold">{questions.length}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 mb-1">Difficulty</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                    difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    {difficulty.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete
                        </p>
                    </div>

                    {/* Question Display */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="mb-6">
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full mb-4">
                                Question {currentQuestionIndex + 1}
                            </span>
                            {/* Hide question text for DICTATION - it's the answer! */}
                            {currentQuestion.question_type !== 'dictation' && (
                                <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
                                    {currentQuestion.question_text}
                                </h3>
                            )}
                            {currentQuestion.question_type === 'dictation' && (
                                <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
                                    Listen and write down the following sentence:
                                </h3>
                            )}
                        </div>

                        {/* MCQ Options */}
                        {currentQuestion.question_type === 'mcq' && currentQuestion.options ? (
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, idx) => {
                                    const optionLetter = String.fromCharCode(65 + idx);
                                    const isSelected = userAnswers[currentQuestionIndex] === optionLetter;

                                    // Clean option text - remove any existing letter prefix (A., B., etc.)
                                    let cleanOption = String(option).trim();
                                    // Remove patterns like "A. ", "A.", "A) ", "A)", etc.
                                    const letterPrefixPattern = /^[A-Z]\.?\s*/i;
                                    if (letterPrefixPattern.test(cleanOption)) {
                                        cleanOption = cleanOption.replace(letterPrefixPattern, '').trim();
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(optionLetter)}
                                            className={`w-full text-left p-4 border-2 rounded-lg transition-all duration-200 ${isSelected
                                                ? 'border-blue-600 bg-blue-50 shadow-md transform scale-[1.01]'
                                                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-start">
                                                <span className={`font-bold mr-3 mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'
                                                    }`}>
                                                    {optionLetter}.
                                                </span>
                                                <span className="flex-1 text-gray-800">{cleanOption}</span>
                                                {isSelected && (
                                                    <svg className="w-5 h-5 text-blue-600 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : currentQuestion.question_type === 'dictation' ? (
                            // Dictation Question - Listen and Type
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800 mb-3 flex items-center gap-2">
                                        🎧 Click the button below to hear a sentence. Listen carefully and type exactly what you hear.
                                    </p>
                                    <p className="text-xs text-blue-700 mb-3">
                                        <strong>Note:</strong> You can only play the audio once. Listen carefully and type every word correctly, including punctuation.
                                    </p>
                                    <button
                                        onClick={() => {
                                            // Use question_text (the sentence) for TTS
                                            const textToSpeak = currentQuestion.question_text || currentQuestion.correct_answer || '';
                                            console.log('Playing dictation:', textToSpeak);
                                            playDictationAudio(textToSpeak);
                                        }}
                                        disabled={audioPlayed[currentQuestionIndex] === true}
                                        className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all flex items-center justify-center gap-2 shadow-md ${audioPlayed[currentQuestionIndex] === true
                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                                            }`}
                                    >
                                        <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span>{audioPlayed[currentQuestionIndex] === true ? 'Audio Already Played' : 'Play Audio'}</span>
                                    </button>
                                    {audioPlayed[currentQuestionIndex] === true && (
                                        <p className="text-xs text-red-600 mt-2 font-medium">
                                            ⚠️ Audio has been played. You cannot replay it.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Answer
                                    </label>
                                    <textarea
                                        value={userAnswers[currentQuestionIndex] || ''}
                                        onChange={(e) => handleAnswer(e.target.value)}
                                        placeholder="Type the sentence you heard here..."
                                        className="w-full h-24 p-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 font-mono bg-white text-gray-900 placeholder:text-gray-400"
                                    />
                                    {userAnswers[currentQuestionIndex] && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            {userAnswers[currentQuestionIndex].length} characters
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : currentQuestion.question_type === 'voice_reading' ? (
                            // Voice Reading Question - Read Aloud
                            <div className="space-y-3 sm:space-y-4">
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                                    <p className="text-xs sm:text-sm text-purple-800 mb-2 sm:mb-3">
                                        📖 Read the text above aloud clearly. Click "Start Recording" when ready.
                                    </p>
                                </div>

                                {!isLiveTranscribing ? (
                                    <button
                                        onClick={startLiveTranscription}
                                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-medium transition-all shadow-md flex items-center justify-center gap-2 sm:gap-3"
                                    >
                                        <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span>Start Recording</span>
                                    </button>
                                ) : (
                                    <div className="space-y-2 sm:space-y-3">
                                        <button
                                            onClick={stopLiveTranscription}
                                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-medium transition-all shadow-md animate-pulse flex items-center justify-center gap-2 sm:gap-3"
                                        >
                                            <Square className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span>Stop Recording</span>
                                        </button>

                                        {/* Live Transcription Display */}
                                        <div className="bg-gray-50 border rounded-lg p-3 sm:p-4 min-h-[60px]">
                                            <p className="text-xs sm:text-sm text-gray-600 mb-2">Recording... (Live transcription):</p>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                {liveTranscript}
                                                {interimTranscript && (
                                                    <span className="text-gray-500 italic"> {interimTranscript}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {userAnswers[currentQuestionIndex] && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                                        <p className="text-xs sm:text-sm text-green-800 mb-2 flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                            Your recorded response:
                                        </p>
                                        <p className="text-sm sm:text-base text-gray-800">{userAnswers[currentQuestionIndex]}</p>
                                    </div>
                                )}
                            </div>
                        ) : currentQuestion.question_type === 'voice_speaking' ? (
                            // Voice Speaking Question - Spontaneous Speech
                            <div className="space-y-3 sm:space-y-4">
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                                    <p className="text-xs sm:text-sm text-orange-800 mb-2">
                                        🎤 Speak for 45-60 seconds on the topic above. Click "Start Speaking" when ready.
                                    </p>
                                    <p className="text-xs text-orange-700">
                                        Tip: Organize your thoughts, speak clearly, and use relevant examples.
                                    </p>
                                </div>

                                {!isLiveTranscribing ? (
                                    <button
                                        onClick={startLiveTranscription}
                                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-medium transition-all shadow-md flex items-center justify-center gap-2 sm:gap-3"
                                    >
                                        <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span>Start Speaking</span>
                                    </button>
                                ) : (
                                    <div className="space-y-2 sm:space-y-3">
                                        <button
                                            onClick={stopLiveTranscription}
                                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-medium transition-all shadow-md animate-pulse flex items-center justify-center gap-2 sm:gap-3"
                                        >
                                            <Square className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span>Stop & Save</span>
                                        </button>

                                        {/* Live Transcription Display */}
                                        <div className="bg-gray-50 border rounded-lg p-3 sm:p-4 min-h-[80px] sm:min-h-[100px]">
                                            <p className="text-xs sm:text-sm text-gray-600 mb-2">Speaking... (Live transcription):</p>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                {liveTranscript}
                                                {interimTranscript && (
                                                    <span className="text-gray-500 italic"> {interimTranscript}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {userAnswers[currentQuestionIndex] && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                                        <p className="text-xs sm:text-sm text-green-800 mb-2 flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                            Your recorded response:
                                        </p>
                                        <p className="text-sm sm:text-base text-gray-800">{userAnswers[currentQuestionIndex]}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Text / Open-ended question
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Answer
                                </label>
                                <textarea
                                    value={userAnswers[currentQuestionIndex] || ''}
                                    onChange={(e) => handleAnswer(e.target.value)}
                                    placeholder="Type your answer here..."
                                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-gray-900 placeholder:text-gray-400 text-base"
                                    rows={6}
                                    style={{
                                        color: '#111827',
                                        backgroundColor: '#ffffff',
                                        fontFamily: 'inherit',
                                        fontSize: '16px',
                                        lineHeight: '1.5',
                                    }}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    {userAnswers[currentQuestionIndex]?.length || 0} characters
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition font-medium flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                                disabled={currentQuestionIndex === questions.length - 1}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition font-medium flex items-center gap-2"
                            >
                                Next
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            {currentQuestionIndex === questions.length - 1 && (
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg ml-auto hover:bg-green-700 transition font-semibold flex items-center gap-2 shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Submit & Review
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
                                        setQuestions([]);
                                        setUserAnswers({});
                                        setShowResults(false);
                                    }
                                }}
                                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Exit
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Question Navigator */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-lg sticky top-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Progress
                        </h4>
                        <p className="text-xs text-gray-500 mb-4">
                            {Object.keys(userAnswers).filter(idx => userAnswers[parseInt(idx)]?.trim() !== '').length} of {questions.length} answered
                        </p>
                        <div className="grid grid-cols-5 gap-2 mb-4">
                            {questions.map((_, idx) => {
                                const isCurrent = currentQuestionIndex === idx;
                                const isAnswered = idx in userAnswers && (userAnswers[idx]?.trim() !== '');

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => goToQuestion(idx)}
                                        className={`w-full aspect-square rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-110 ${isCurrent
                                            ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                                            : isAnswered
                                                ? 'bg-yellow-500 text-white shadow-md'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
                                            }`}
                                        title={isAnswered ? `Question ${idx + 1} - Answered (Marked for Review)` : `Question ${idx + 1} - Not answered`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-3">Legend</p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-600 rounded flex-shrink-0"></div>
                                    <span className="text-gray-600">Current</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded flex-shrink-0"></div>
                                    <span className="text-gray-600">Answered (Marked for Review)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-gray-200 rounded flex-shrink-0"></div>
                                    <span className="text-gray-600">Not Answered</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <SubscriptionRequiredModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                feature="premium assessment practice"
            />
        </div>
    );
}