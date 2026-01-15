"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiClient } from "@/lib/api";
import { Mic, MicOff, MessageCircle, Clock, Users, Volume2, ChevronDown, ChevronUp, VolumeX, Video, VideoOff, MonitorUp, Hand, Smile, PhoneOff, FileText, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';

// Type definitions for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
        AudioContext: typeof AudioContext;
        webkitAudioContext: typeof AudioContext;
    }
}

const getErrorMessage = (error: any): string => {
    if (error.error === 'no-speech') {
        return 'No speech was detected. Please try again.';
    }
    if (error.error === 'audio-capture') {
        return 'No microphone was found. Please check your device settings.';
    }
    if (error.error === 'not-allowed') {
        return 'Microphone access was not allowed. Please enable it in your browser settings.';
    }
    return 'An error occurred. Please try again.';
};

interface Topic {
    title: string;
    content: string;
    followUpQuestions?: string[];
    instructions?: string;
}

interface AIResponse {
    text: string;
    audioUrl?: string;
}

interface AgentMessage {
    name: string;
    text: string;
}

interface Turn {
    user: string;
    agents: AgentMessage[];
    timestamp: number;
}

interface EvaluationFeedback {
    criteria_scores: {
        communication: number;
        topic_understanding: number;
        interaction: number;
    };
    strengths: string[];
    improvements: string[];
}

interface GDResponse {
    userResponse: string;
    aiQuestion: string;
    evaluation?: {
        score: number;
        feedback: EvaluationFeedback;
        areasOfImprovement: string[];
        strengths: string[];
    };
}

interface AssessmentResponse {
    response_text: string;
    score?: number;
    time_taken?: number;
}

interface GroupDiscussionRoundProps {
    roundId?: string;
    assessmentId?: string;  // Optional: will fallback to URL param
    onComplete?: (responses: AssessmentResponse[]) => void;
    mode?: 'practice' | 'assessment';
    practiceJoinPayload?: any;
    isDisha?: boolean;
    maxResponses?: number;
    attemptId?: string;
    packageId?: string;  // For Disha submit
    onNextRound?: () => void;  // Callback to advance to next round
}

export function GroupDiscussionRound({
    roundId,
    assessmentId: propAssessmentId,
    onComplete,
    mode = 'assessment',
    practiceJoinPayload,
    isDisha = false,
    maxResponses = 5,
    attemptId,
    packageId,
    onNextRound
}: GroupDiscussionRoundProps) {
    const router = useRouter();

    // State for managing the discussion flow
    const [loading, setLoading] = useState(false);
    const [topic, setTopic] = useState<Topic | null>(null);
    const [currentAIResponse, setCurrentAIResponse] = useState<AIResponse | null>(null);
    const [gdResponses, setGDResponses] = useState<GDResponse[]>([]);
    const [gdTurns, setGDTurns] = useState<Turn[]>([]);
    const [currentStep, setCurrentStep] = useState<'mic-test' | 'intro' | 'topic' | 'discussion' | 'evaluation'>('mic-test');
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [speakingTime, setSpeakingTime] = useState(0);
    const [speakingTimerId, setSpeakingTimerId] = useState<NodeJS.Timeout | null>(null);
    const [isTopicAnnounced, setIsTopicAnnounced] = useState(false);
    const [discussionComplete, setDiscussionComplete] = useState(false);
    const [finalEvaluation, setFinalEvaluation] = useState<any | null>(null);
    const [micTested, setMicTested] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [confidenceScore, setConfidenceScore] = useState(100);
    const [speechRate, setSpeechRate] = useState(0);

    // Enhanced features
    const [participationBalance, setParticipationBalance] = useState({ user: 0, ai: 0 });
    const [wordCount, setWordCount] = useState(0);
    const [statsCollapsed, setStatsCollapsed] = useState(false);

    // Voice synthesis states
    const [currentSpeakingAgent, setCurrentSpeakingAgent] = useState<string | null>(null);
    const [voicesLoaded, setVoicesLoaded] = useState(false);
    const [typingAgent, setTypingAgent] = useState<string | null>(null);
    const availableVoices = useRef<SpeechSynthesisVoice[]>([]);

    // Track fetch attempts
    const [fetchAttempt, setFetchAttempt] = useState(0);
    const maxRetries = 10;
    const inFlightRef = useRef(false);
    const [isCamOn, setIsCamOn] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(true);

    // Round-based state for GD flow (bots speak first, then user)
    const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
    const [currentRoundTurn, setCurrentRoundTurn] = useState<'bots' | 'user'>('bots');  // 'bots' means bots should speak first
    const [waitingForBots, setWaitingForBots] = useState(false);
    const [hasInitialBotSpoken, setHasInitialBotSpoken] = useState(false);  // Track if question was spoken by bot

    // Refs
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const transcriptRef = useRef('');

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [gdTurns, typingAgent]);

    // Initialize voices
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    availableVoices.current = voices;
                    setVoicesLoaded(true);
                    console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
                }
            };

            loadVoices();

            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }
        }
    }, []);

    // Fetch topic when entering topic step
    useEffect(() => {
        if (currentStep === 'topic' && !topic) {
            setFetchAttempt(0);
            fetchTopic();
        }

        return () => {
            setFetchAttempt(0);
        };
    }, [currentStep, topic]);

    // Handle initial bot speech when topic loads and voices are ready (for Disha)
    useEffect(() => {
        if (isDisha && topic && voicesLoaded && !hasInitialBotSpoken && currentStep === 'topic') {
            // Wait a bit for topic to fully render, then have bot speak question
            const timer = setTimeout(() => {
                const questionText = `${topic.title}. ${topic.content}`;
                setHasInitialBotSpoken(true);
                setIsTopicAnnounced(true);
                setCurrentStep('discussion');
                
                // Add initial bot message about the question
                const initialTurn: Turn = {
                    user: '',
                    agents: [{
                        name: personas[0].name,
                        text: `Our topic for discussion is: ${topic.title}. ${topic.content}`
                    }],
                    timestamp: Date.now()
                };
                setGDTurns([initialTurn]);
                
                // Speak the question, then trigger bots to speak first
                speakAgentText(personas[0].name, questionText).then(() => {
                    // After question is spoken, have all bots speak first in the round
                    setWaitingForBots(true);
                    setCurrentRoundTurn('bots');
                    handleBotsSpeakFirst();
                });
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, [topic, voicesLoaded, hasInitialBotSpoken, isDisha, currentStep]);

    const fetchTopic = async () => {
        if (loading || inFlightRef.current || fetchAttempt > maxRetries) {
            return;
        }

        if (mode === 'practice') {
            setTopic({
                title: "Practice Session",
                content: "Welcome to the practice group discussion. You can discuss any topic you like.",
                followUpQuestions: ["What are your thoughts?", "Can you elaborate?"],
                instructions: "Speak clearly and confidently."
            });
            setLoading(false);
            return;
        }

        if (!roundId) return;
        inFlightRef.current = true;
        setLoading(true);
        try {
            const timestamp = new Date().getTime();
            const response = await Promise.race([
                apiClient.client.post(
                    isDisha
                        ? `/disha/assessments/${propAssessmentId}/rounds/${roundId}/gd/topic?t=${timestamp}&refresh=false&attempt_id=${attemptId}`
                        : `/assessments/rounds/${roundId}/gd/topic?t=${timestamp}&refresh=false`
                ),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 15000))
            ]) as any;
            const topicData = response.data;

            if (topicData && topicData.status === 'error') {
                throw new Error(topicData.message || 'Failed to generate topic');
            }

            if (!topicData || (!topicData.title && !topicData.topic)) {
                throw new Error('Invalid topic data received');
            }

            if (topicData.title) {
                window.localStorage.setItem('lastGdTopicId', topicData.title);
            }

            const processedTopicData = {
                title: topicData.title || topicData.topic || "AI in the Workplace",
                content: topicData.background || topicData.description || topicData.content ||
                    "Discuss the ethical implications and practical considerations of AI in modern workplaces.",
                followUpQuestions: topicData.key_points || topicData.expected_perspectives || [],
                instructions: topicData.instructions || "Share your thoughts on this topic. You can speak briefly or in detail - it's up to you!"
            };

            setTopic(processedTopicData);
            setFetchAttempt(0);
            
            // For non-Disha: proceed normally
            if (!isDisha) {
                setIsTopicAnnounced(true);
                setCurrentStep('discussion');
            } else {
                // For Disha: Topic is set, useEffect will handle bot speech when voices are ready
                setIsTopicAnnounced(true);
                setCurrentStep('discussion');
            }

            if (topicData.audio_url) {
                fetch(topicData.audio_url).catch(console.error);
            }
        } catch (error) {
            console.error('Error fetching topic:', error);

            if (fetchAttempt < 1) {
                setFetchAttempt(prev => prev + 1);
                await new Promise(resolve => setTimeout(resolve, 2000));
                inFlightRef.current = false;
                setLoading(false);
                fetchTopic();
                return;
            }
            setTopic({
                title: "The Future of Work in a Digital Age",
                content: "Discuss how technological advancements are reshaping work environments.",
                followUpQuestions: [
                    "What skills will be most valuable?",
                    "How should education systems adapt?",
                ],
                instructions: "Share your thoughts on this topic. You can speak briefly or in detail - it's up to you!"
            });
        } finally {
            setLoading(false);
            inFlightRef.current = false;
        }
    };

    // const MAX_RESPONSES = 5; // Replaced by maxResponses prop
    const personas: AgentMessage[] = [
        { name: 'Aarav (Pro)', text: '' },
        { name: 'Meera (Skeptic)', text: '' },
        { name: 'Rahul (Balanced)', text: '' }
    ];

    const [evalAttempt, setEvalAttempt] = useState(0);
    const maxEvalRetries = 2;
    const [evaluationInitiated, setEvaluationInitiated] = useState(false);

    const getFinalEvaluation = async () => {
        if (loading) {
            return;
        }

        if (mode === 'practice') {
            toast.success('Practice session completed!');
            setLoading(false);
            if (onComplete) {
                onComplete([]);
            }
            return;
        }

        try {
            setLoading(true);
            toast.loading('Submitting your discussion...', { id: 'submitting' });

            // Get assessment ID from prop or URL
            const urlParams = new URLSearchParams(window.location.search);
            const assessmentId = propAssessmentId || urlParams.get('assessment_id') || urlParams.get('id');

            if (!assessmentId) {
                console.error('Assessment ID not found. URL params:', Object.fromEntries(urlParams));
                throw new Error('Assessment ID not found in props or URL');
            }

            if (!roundId) {
                console.error('Round ID is required');
                throw new Error('Round ID is required');
            }

            // STEP 1: Save full conversation transcript via API
            // For DISHA, use submitDishaRound endpoint directly
            if (isDisha && packageId && roundId && attemptId) {
                try {
                    // Submit GD round using Disha submit endpoint
                    const gdAnswers: Record<string, any> = {
                        conversation: gdTurns.map(turn => ({
                            user: turn.user,
                            agents: turn.agents
                        })),
                        responses: gdResponses
                    };
                    
                    await apiClient.submitDishaRound(
                        packageId,
                        roundId,
                        attemptId,
                        gdAnswers
                    );
                    console.log('GD round submitted successfully via Disha endpoint');
                } catch (saveErr) {
                    console.warn('GD Disha submit failed, proceeding to evaluation anyway:', saveErr);
                }
            } else if (!isDisha) {
                const submitPayload = [{
                    response_text: JSON.stringify({
                        turns: gdTurns,
                        responses: gdResponses
                    }),
                    score: 0,
                    time_taken: 0
                }];
                console.log('GD submit payload preview', {
                    assessmentId,
                    roundId,
                    turns: gdTurns.length,
                    responses: gdResponses.length,
                    payloadSize: JSON.stringify(submitPayload[0].response_text).length
                });

                try {
                    const submitRes = await apiClient.submitRoundResponses(
                        assessmentId,
                        roundId,
                        submitPayload
                    );
                    console.log('GD submit result', submitRes);
                } catch (saveErr) {
                    console.warn('GD transcript save failed, proceeding to evaluation anyway:', saveErr);
                    // Don't rethrow; evaluation endpoint can work from provided conversation
                }
            }

            // STEP 2: Call evaluate endpoint to complete the round and get score
            let evalScore = 0;
            try {
                toast.loading('Evaluating your discussion...', { id: 'evaluating' });
                const endpoint = isDisha
                    ? `/disha/assessments/${assessmentId}/rounds/${roundId}/evaluate-discussion`
                    : `/assessments/rounds/${roundId}/evaluate-discussion`;

                const evalResponse = await apiClient.client.post(endpoint, {
                    conversation: gdTurns
                });
                console.log('Evaluation complete:', evalResponse.data);
                evalScore = evalResponse.data?.score || 0;

                toast.dismiss('submitting');
                toast.dismiss('evaluating');
                toast.success('Discussion evaluated successfully!');
            } catch (evalError) {
                console.error('Evaluation failed:', evalError);
                toast.dismiss('evaluating');
                toast.error('Evaluation failed. Please contact support.', { id: 'evaluating' });
            }

            // Redirect to assessment page and force a fresh fetch of statuses
            if (onComplete) {
                onComplete([{
                    response_text: JSON.stringify({
                        turns: gdTurns,
                        responses: gdResponses
                    }),
                    score: evalScore,
                    time_taken: 0
                }]);
            } else {
                setTimeout(() => {
                    window.location.href = `/dashboard/student/assessment?id=${assessmentId}&ts=${Date.now()}`;
                }, 300);
            }

        } catch (error) {
            console.error('Error submitting discussion:', error);
            toast.error('Failed to submit discussion. Please try again.', { id: 'submitting' });
            setLoading(false);
        }
    };

    // Speech recognition setup
    const speechRecognition = useRef<any>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const audioAnalyser = useRef<AnalyserNode | null>(null);

    // Voice selection function
    const getVoiceForAgent = (agentName: string): SpeechSynthesisVoice | null => {
        const voices = availableVoices.current;
        if (voices.length === 0) return null;

        // Prefer high-quality neural/premium voices
        const getBestVoice = (filters: ((v: SpeechSynthesisVoice) => boolean)[]): SpeechSynthesisVoice | null => {
            for (const filter of filters) {
                const voice = voices.find(filter);
                if (voice) return voice;
            }
            return null;
        };

        if (agentName.includes('Aarav')) {
            return getBestVoice([
                v => v.lang.includes('en-IN') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('neural')),
                v => v.lang.includes('en-GB') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('neural')),
                v => v.lang.includes('en-US') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('neural')),
                v => v.lang.includes('en') && !v.name.toLowerCase().includes('female') && (v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('premium')),
                v => v.lang.includes('en') && !v.name.toLowerCase().includes('female'),
            ]) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        }
        else if (agentName.includes('Meera')) {
            return getBestVoice([
                v => v.lang.includes('en-IN') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('neural')),
                v => v.lang.includes('en-US') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('neural')),
                v => v.lang.includes('en-GB') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('neural')),
                v => v.lang.includes('en') && v.name.toLowerCase().includes('female') && (v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('premium')),
                v => v.lang.includes('en') && v.name.toLowerCase().includes('female'),
            ]) || voices.find(v => v.lang.startsWith('en') && v !== voices[0]) || voices[1] || voices[0];
        }
        else if (agentName.includes('Rahul')) {
            return getBestVoice([
                v => v.lang.includes('en-AU') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('neural')),
                v => v.lang.includes('en-US') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('neural')),
                v => v.lang.includes('en-GB') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('neural')),
                v => v.lang.includes('en') && !v.name.toLowerCase().includes('female') && (v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('premium')),
                v => v.lang.includes('en') && !v.name.toLowerCase().includes('female'),
            ]) || voices.find(v => v.lang.startsWith('en') && v !== voices[0] && v !== voices[1]) || voices[2] || voices[0];
        }

        // Default: prefer neural/premium voices
        return voices.find(v => v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('premium')) || voices[0];
    };

    // Function to speak agent text with improved quality and retry mechanism
    const speakAgentText = async (agentName: string, text: string, retryCount: number = 0): Promise<void> => {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                console.error('Speech synthesis not available');
                resolve();
                return;
            }

            // Wait for voices to load if not ready
            if (!voicesLoaded && availableVoices.current.length === 0) {
                console.log('Voices not loaded yet, waiting...');
                setTimeout(() => {
                    speakAgentText(agentName, text, retryCount).then(resolve);
                }, 500);
                return;
            }

            // Rahul's agent: allow longer sentences, chunk if needed
            let speechText = text.trim();
            if (!speechText) {
                resolve();
                return;
            }

            const MAX_SPEECH_LENGTH = agentName.includes('Rahul') ? 600 : 300;
            if (speechText.length > MAX_SPEECH_LENGTH) {
                // Split into sentences or chunks
                const sentences = speechText.match(/[^.!?]+[.!?]+/g) || [speechText];
                let idx = 0;
                const speakNext = () => {
                    if (idx >= sentences.length) {
                        setCurrentSpeakingAgent(null);
                        setIsAISpeaking(false);
                        resolve();
                        return;
                    }
                    let chunk = sentences[idx].trim();
                    if (chunk.length > MAX_SPEECH_LENGTH) {
                        chunk = chunk.substring(0, MAX_SPEECH_LENGTH) + '...';
                    }
                    if (!chunk) {
                        idx++;
                        speakNext();
                        return;
                    }

                    const speakChunk = (attempt: number = 0) => {
                        if (attempt >= 3) {
                            console.error('Failed to speak after 3 attempts');
                            idx++;
                            speakNext();
                            return;
                        }

                        try {
                            window.speechSynthesis.cancel();
                            // Small delay to ensure cancellation
                            setTimeout(() => {
                                const utterance = new SpeechSynthesisUtterance(chunk);
                                const voice = getVoiceForAgent(agentName);
                                if (voice) {
                                    utterance.voice = voice;
                                    utterance.lang = voice.lang;
                                } else {
                                    utterance.lang = 'en-US';
                                }

                                // Optimized settings for clarity
                                utterance.rate = agentName.includes('Aarav') ? 0.9 : agentName.includes('Meera') ? 1.0 : 0.95;
                                utterance.pitch = agentName.includes('Aarav') ? 0.95 : agentName.includes('Meera') ? 1.15 : 1.0;
                                utterance.volume = 1.0; // Maximum volume

                                let hasStarted = false;
                                const timeout = setTimeout(() => {
                                    if (!hasStarted) {
                                        console.warn('TTS timeout, retrying...');
                                        window.speechSynthesis.cancel();
                                        speakChunk(attempt + 1);
                                    }
                                }, 2000);

                                utterance.onstart = () => {
                                    hasStarted = true;
                                    clearTimeout(timeout);
                                    setCurrentSpeakingAgent(agentName);
                                    setIsAISpeaking(true);
                                };

                                utterance.onend = () => {
                                    clearTimeout(timeout);
                                    idx++;
                                    speakNext();
                                };

                                utterance.onerror = (event: any) => {
                                    clearTimeout(timeout);
                                    console.error('TTS error:', event.error);
                                    if (event.error === 'synthesis-failed' || event.error === 'synthesis-unavailable') {
                                        speakChunk(attempt + 1);
                                    } else {
                                        idx++;
                                        speakNext();
                                    }
                                };

                                window.speechSynthesis.speak(utterance);
                            }, 100);
                        } catch (err) {
                            console.error('Error creating utterance:', err);
                            speakChunk(attempt + 1);
                        }
                    };

                    speakChunk();
                };
                speakNext();
                return;
            }

            // Single utterance for shorter text
            const speakSingle = (attempt: number = 0) => {
                if (attempt >= 3) {
                    console.error('Failed to speak after 3 attempts');
                    setCurrentSpeakingAgent(null);
                    setIsAISpeaking(false);
                    resolve();
                    return;
                }

                try {
                    window.speechSynthesis.cancel();
                    setTimeout(() => {
                        const utterance = new SpeechSynthesisUtterance(speechText);
                        const voice = getVoiceForAgent(agentName);
                        if (voice) {
                            utterance.voice = voice;
                            utterance.lang = voice.lang;
                        } else {
                            utterance.lang = 'en-US';
                        }

                        // Optimized settings for clarity
                        utterance.rate = agentName.includes('Aarav') ? 0.9 : agentName.includes('Meera') ? 1.0 : 0.95;
                        utterance.pitch = agentName.includes('Aarav') ? 0.95 : agentName.includes('Meera') ? 1.15 : 1.0;
                        utterance.volume = 1.0; // Maximum volume

                        let hasStarted = false;
                        const timeout = setTimeout(() => {
                            if (!hasStarted) {
                                console.warn('TTS timeout, retrying...');
                                window.speechSynthesis.cancel();
                                speakSingle(attempt + 1);
                            }
                        }, 2000);

                        utterance.onstart = () => {
                            hasStarted = true;
                            clearTimeout(timeout);
                            setCurrentSpeakingAgent(agentName);
                            setIsAISpeaking(true);
                        };

                        utterance.onend = () => {
                            clearTimeout(timeout);
                            setCurrentSpeakingAgent(null);
                            setIsAISpeaking(false);
                            resolve();
                        };

                        utterance.onerror = (event: any) => {
                            clearTimeout(timeout);
                            console.error('TTS error:', event.error);
                            if (event.error === 'synthesis-failed' || event.error === 'synthesis-unavailable') {
                                speakSingle(attempt + 1);
                            } else {
                                setCurrentSpeakingAgent(null);
                                setIsAISpeaking(false);
                                resolve();
                            }
                        };

                        window.speechSynthesis.speak(utterance);
                    }, 100);
                } catch (err) {
                    console.error('Error creating utterance:', err);
                    speakSingle(attempt + 1);
                }
            };

            speakSingle();
        });
    };

    // Initialize Web Speech API
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                speechRecognition.current = new SpeechRecognition();
                speechRecognition.current.continuous = true;
                speechRecognition.current.interimResults = true;
                speechRecognition.current.lang = 'en-US';

                speechRecognition.current.onresult = (event: any) => {
                    let interimText = '';
                    let finalText = '';

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        const confidence = event.results[i][0].confidence;

                        if (event.results[i].isFinal) {
                            finalText += transcript + ' ';
                            setConfidenceScore(Math.round(confidence * 100));
                        } else {
                            interimText += transcript;
                        }
                    }

                    setInterimTranscript(interimText);
                    if (finalText) {
                        setTranscript(prev => {
                            const newText = prev + finalText;
                            transcriptRef.current = newText;
                            setWordCount(newText.trim().split(/\s+/).length);
                            return newText;
                        });
                    }
                };

                speechRecognition.current.onerror = (error: any) => {
                    console.error('Speech recognition error:', error);

                    if (transcriptRef.current.trim()) {
                        handleUserResponse(transcriptRef.current);
                    } else {
                        setIsListening(false);
                    }
                };

                speechRecognition.current.onend = () => {
                    if (isListening) {
                        try {
                            speechRecognition.current.start();
                        } catch (err) {
                            console.error('Error restarting:', err);
                            setIsListening(false);
                        }
                    }
                };
            }

            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        return () => {
            if (speechRecognition.current) {
                speechRecognition.current.stop();
            }

            if (speakingTimerId) {
                clearInterval(speakingTimerId);
            }

            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Audio level monitoring for microphone test
    const startMicTest = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = audioContext.current!;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            audioAnalyser.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const checkLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(Math.round(average));
            };

            const interval = setInterval(checkLevel, 100);

            setTimeout(() => {
                clearInterval(interval);
                stream.getTracks().forEach(track => track.stop());
                setMicTested(true);
            }, 6000);
        } catch (error) {
            console.error('Mic test error:', error);
            toast.error('Could not access microphone');
        }
    };

    if (!roundId && mode !== 'practice') {
        return (
            <Card className="p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Error</h2>
                    <p className="text-gray-600">Invalid round configuration</p>
                </div>
            </Card>
        );
    }

    const startListening = () => {
        if (!speechRecognition.current) {
            toast.error('Speech recognition not supported. Use Chrome or Edge.');
            return;
        }

        setIsListening(true);
        setTranscript('');
        transcriptRef.current = '';
        setInterimTranscript('');
        setSpeakingTime(0);
        setWordCount(0);

        const timerId = setInterval(() => {
            setSpeakingTime(prevTime => {
                const newTime = prevTime + 1;
                if (wordCount > 0) {
                    setSpeechRate(Math.round((wordCount / newTime) * 60));
                }
                return newTime;
            });
        }, 1000);

        setSpeakingTimerId(timerId);

        try {
            speechRecognition.current.start();
        } catch (err) {
            console.error('Error starting speech recognition:', err);
            setIsListening(false);
            clearInterval(timerId);
        }
    };

    const stopListening = () => {
        if (speechRecognition.current) {
            speechRecognition.current.stop();
            setIsListening(false);

            if (speakingTimerId) {
                clearInterval(speakingTimerId);
                setSpeakingTimerId(null);
            }

            setTimeout(() => {
                const finalTranscript = transcriptRef.current.trim();

                if (finalTranscript && finalTranscript.length > 0) {
                    handleUserResponse(finalTranscript);
                    setTranscript('');
                    transcriptRef.current = '';
                    setInterimTranscript('');
                }
            }, 500);
        }
    };

    const [responseAttempt, setResponseAttempt] = useState(0);
    const maxResponseRetries = 2;

    // Function to have bots speak first in a round
    const handleBotsSpeakFirst = async () => {
        if (!topic || waitingForBots || currentRoundTurn !== 'bots') return;
        
        setWaitingForBots(true);
        setLoading(true);
        
        try {
            // Generate initial bot responses for the round start
            let responseData: any;
            try {
                const endpoint = isDisha
                    ? `/disha/assessments/${propAssessmentId}/rounds/${roundId}/gd/response`
                    : `/assessments/rounds/${roundId}/gd/response`;

                const response = await Promise.race([
                    apiClient.client.post(endpoint, {
                        text: '',  // Empty text - bots speak first
                        personas: personas.map(p => p.name),
                        context: {
                            topic,
                            previousTurns: gdTurns,
                            isRoundStart: true,
                            roundNumber: currentRoundNumber
                        }
                    }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), 15000)
                    )
                ]) as any;

                responseData = response.data;
            } catch (apiError) {
                console.error('API failed for bots speak first:', apiError);
                // Fallback responses
                responseData = {
                    agents: [
                        { name: personas[0].name, text: `I'd like to start by highlighting the positive aspects of this topic.` },
                        { name: personas[1].name, text: `While I see some benefits, I'm concerned about potential challenges.` },
                        { name: personas[2].name, text: `I think we need to consider both perspectives for a balanced view.` }
                    ]
                };
            }

            const agents: AgentMessage[] = Array.isArray(responseData?.agents) && responseData.agents.length
                ? responseData.agents.slice(0, 3).map((a: any, idx: number) => ({
                    name: String(a.name || personas[idx]?.name || `Participant ${idx + 1}`),
                    text: String(a.text || a.message || a.content || '')
                }))
                : [
                    { name: personas[0].name, text: "I'd like to start by highlighting the positive aspects." },
                    { name: personas[1].name, text: "While I see benefits, I'm concerned about challenges." },
                    { name: personas[2].name, text: "We need to consider both perspectives." }
                ];

            // Create a new turn with bots speaking first (no user message yet)
            const newTurn: Turn = {
                user: '',
                agents: [],
                timestamp: Date.now()
            };
            setGDTurns(prev => [...prev, newTurn]);

            // Add bots one by one with typing indicator and speech
            if (voicesLoaded) {
                for (let i = 0; i < agents.length; i++) {
                    const agent = agents[i];

                    // Show typing indicator
                    setTypingAgent(agent.name);
                    await new Promise(resolve => setTimeout(resolve, 800));

                    // Add this agent to the turn
                    setGDTurns(prev => {
                        const updatedTurns = [...prev];
                        const lastTurnIndex = updatedTurns.length - 1;
                        if (lastTurnIndex >= 0) {
                            updatedTurns[lastTurnIndex] = {
                                ...updatedTurns[lastTurnIndex],
                                agents: [...updatedTurns[lastTurnIndex].agents, agent]
                            };
                        }
                        return updatedTurns;
                    });

                    // Remove typing indicator
                    setTypingAgent(null);

                    // Small delay to show the message appeared
                    await new Promise(resolve => setTimeout(resolve, 300));

                    // Then speak
                    if (agent.text && agent.text.trim()) {
                        await speakAgentText(agent.name, agent.text);
                    }

                    // Pause before next agent
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } else {
                // If voices not loaded, add all at once
                setGDTurns(prev => {
                    const updatedTurns = [...prev];
                    const lastTurnIndex = updatedTurns.length - 1;
                    if (lastTurnIndex >= 0) {
                        updatedTurns[lastTurnIndex] = {
                            ...updatedTurns[lastTurnIndex],
                            agents: agents
                        };
                    }
                    return updatedTurns;
                });
            }

            // After bots speak, switch to user's turn
            setCurrentRoundTurn('user');
            setWaitingForBots(false);
            
        } catch (error) {
            console.error('Error in handleBotsSpeakFirst:', error);
            setWaitingForBots(false);
            setCurrentRoundTurn('user');  // Still allow user to speak
        } finally {
            setLoading(false);
        }
    };

    const handleUserResponse = async (text: string) => {
        const trimmedText = text.trim();

        if (!trimmedText || trimmedText.length === 0) {
            return;
        }

        if (discussionComplete) {
            return;
        }

        // For Disha: Check if it's bots' turn first
        if (isDisha && currentRoundTurn === 'bots' && !waitingForBots) {
            // Bots haven't spoken yet in this round - trigger bots to speak first
            await handleBotsSpeakFirst();
            // After bots speak, user can respond, but we need to wait
            // The user response will be processed after bots finish
            return;
        }

        // If waiting for bots to finish speaking, queue the user response
        if (isDisha && waitingForBots) {
            // Store the user response and process it after bots finish
            // For now, just return and wait for bots to complete
            return;
        }

        if (responseAttempt >= maxResponseRetries) {
            setResponseAttempt(0);
            return;
        }

        try {
            setLoading(true);

            let responseData: any;
            try {
                const endpoint = isDisha
                    ? `/disha/assessments/${propAssessmentId}/rounds/${roundId}/gd/response`
                    : `/assessments/rounds/${roundId}/gd/response`;

                const response = await Promise.race([
                    apiClient.client.post(endpoint, {
                        text: trimmedText,
                        personas: personas.map(p => p.name),
                        context: {
                            topic,
                            previousTurns: gdTurns
                        }
                    }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), 15000)
                    )
                ]) as any;

                responseData = response.data;
            } catch (apiError) {
                console.error('API failed:', apiError);

                setResponseAttempt(prev => prev + 1);

                if (responseAttempt < maxResponseRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    setLoading(false);
                    handleUserResponse(trimmedText);
                    return;
                }

                const userSnippet = trimmedText.slice(0, 140);
                responseData = {
                    agents: [
                        { name: personas[0].name, text: `I agree. Building on "${userSnippet}" — the upside is clear.` },
                        { name: personas[1].name, text: `I challenge that. "${userSnippet}" overlooks risks.` },
                        { name: personas[2].name, text: `Both sides valid. Balance is key.` }
                    ]
                };

                toast.error('Using fallback response.');
            }

            const agents: AgentMessage[] = Array.isArray(responseData?.agents) && responseData.agents.length
                ? responseData.agents.slice(0, 3).map((a: any, idx: number) => ({
                    name: String(a.name || personas[idx]?.name || `Participant ${idx + 1}`),
                    text: String(a.text || a.message || a.content || '')
                }))
                : [
                    { name: personas[0].name, text: "Could you expand with an example?" },
                    { name: personas[1].name, text: "I see downsides. How would you mitigate?" },
                    { name: personas[2].name, text: "A middle path might work." }
                ];

            // Add user message first (without agents yet)
            const turnTimestamp = Date.now();
            setGDTurns(prev => [...prev, {
                user: trimmedText,
                agents: [],
                timestamp: turnTimestamp
            }]);

            setGDResponses(prev => [...prev, {
                userResponse: trimmedText,
                aiQuestion: agents.map(a => a.text).join('\n')
            }]);

            const userWords = trimmedText.split(/\s+/).length;
            const aiWords = agents.reduce((sum, a) => sum + a.text.split(/\s+/).length, 0);
            setParticipationBalance(prev => ({
                user: prev.user + userWords,
                ai: prev.ai + aiWords
            }));

            // Add agents one by one with typing indicator and speech
            if (voicesLoaded) {
                for (let i = 0; i < agents.length; i++) {
                    const agent = agents[i];

                    // Show typing indicator
                    setTypingAgent(agent.name);
                    await new Promise(resolve => setTimeout(resolve, 800));

                    // Add this agent to the turn
                    setGDTurns(prev => {
                        const updatedTurns = [...prev];
                        const lastTurnIndex = updatedTurns.length - 1;
                        if (lastTurnIndex >= 0) {
                            updatedTurns[lastTurnIndex] = {
                                ...updatedTurns[lastTurnIndex],
                                agents: [...updatedTurns[lastTurnIndex].agents, agent]
                            };
                        }
                        return updatedTurns;
                    });

                    // Remove typing indicator
                    setTypingAgent(null);

                    // Small delay to show the message appeared
                    await new Promise(resolve => setTimeout(resolve, 300));

                    // Then speak
                    if (agent.text && agent.text.trim()) {
                        await speakAgentText(agent.name, agent.text);
                    }

                    // Pause before next agent
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } else {
                // If voices not loaded, add all at once
                setGDTurns(prev => {
                    const updatedTurns = [...prev];
                    const lastTurnIndex = updatedTurns.length - 1;
                    if (lastTurnIndex >= 0) {
                        updatedTurns[lastTurnIndex] = {
                            ...updatedTurns[lastTurnIndex],
                            agents: agents
                        };
                    }
                    return updatedTurns;
                });
            }

            // After user speaks and bots respond, reset turn to 'user' for next interaction
            // Round advancement happens when user clicks "Next Question" button
            if (isDisha) {
                // Reset for next turn - bots will speak first in next round when Next Question is clicked
                setCurrentRoundTurn('bots');
            }

            if ((gdTurns.length + 1) >= maxResponses) {
                setDiscussionComplete(true);
            }

            setTranscript('');
            transcriptRef.current = '';
            setInterimTranscript('');
        } catch (error) {
            console.error('Error processing response:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        if (speakingTime < 60) return 'text-green-600';
        if (speakingTime < 120) return 'text-yellow-600';
        return 'text-red-600';
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (currentStep !== 'discussion' || !isTopicAnnounced) return;

            if (e.code === 'Space' && !discussionComplete) {
                e.preventDefault();
                if (isListening) {
                    stopListening();
                } else {
                    startListening();
                }
            }

            if (e.code === 'Escape' && isListening) {
                e.preventDefault();
                stopListening();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentStep, isTopicAnnounced, isListening, discussionComplete]);

    if (currentStep === 'mic-test') {
        return (
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 font-sans items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 shadow-2xl rounded-2xl bg-white dark:bg-gray-800 border-none">
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                            <Mic className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Microphone Check</h2>
                            <p className="text-gray-500 dark:text-gray-400">Please verify your microphone is working before we begin.</p>
                        </div>

                        <div className="bg-gray-100 dark:bg-gray-900/50 rounded-xl p-6 relative overflow-hidden">
                            <div className="flex items-center justify-center gap-4 z-10 relative">
                                <Mic className={`w-8 h-8 transition-colors ${micTested ? 'text-green-500' : 'text-gray-400'}`} />
                                <div className="flex flex-col items-start gap-1">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {micTested ? 'Microphone Detected' : 'Speak to test...'}
                                    </span>
                                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-75"
                                            style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {!micTested ? (
                                <Button
                                    onClick={startMicTest}
                                    className="w-full py-6 text-lg font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all"
                                >
                                    Start Test
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setCurrentStep('topic')}
                                    className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all animate-in zoom-in duration-300"
                                >
                                    Start Discussion
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 shrink-0 flex items-center justify-between shadow-md">
                <h1 className="text-white text-xl font-bold tracking-wide">
                    Round {currentRoundNumber}: Group Discussion
                </h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-white text-sm backdrop-blur-sm">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(speakingTime)}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden p-6 gap-6">

                {/* Left Panel: Video Grid & Transcribe */}
                <div className="flex-1 flex flex-col gap-6 min-w-0">

                    {/* Video Grid - 2x2 Layout */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative flex flex-col">

                        <div className="flex-1 grid grid-cols-2 gap-1 p-1 bg-gray-900">
                            {/* User Feed (Top Left) */}
                            <div className="relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                                {isCamOn ? (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
                                        <Users className="w-20 h-20 text-gray-400" />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                                            Y
                                        </div>
                                    </div>
                                )}
                                <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm font-medium backdrop-blur-md flex items-center gap-2">
                                    <span>You</span>
                                    {isListening && <Mic className="w-3 h-3 text-green-400 animate-pulse" />}
                                </div>
                                <div className="absolute inset-0 border-2 border-transparent transition-colors pointer-events-none"
                                    style={{ borderColor: isListening ? '#4ade80' : 'transparent' }} />
                            </div>

                            {/* Personas (Other Cells) */}
                            {personas.map((persona, idx) => {
                                const isSpeaking = currentSpeakingAgent === persona.name;
                                const bgColor = idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-indigo-600' : 'bg-red-600';

                                return (
                                    <div key={idx} className="relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                                        <div className={`w-full h-full ${bgColor} flex items-center justify-center`}>
                                            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                                <img
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${persona.name}&backgroundColor=transparent`}
                                                    alt={persona.name}
                                                    className="w-20 h-20"
                                                />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm font-medium backdrop-blur-md flex items-center gap-2">
                                            <span>{persona.name.split(' ')[0]}</span>
                                            {isSpeaking && <Volume2 className="w-3 h-3 text-white animate-pulse" />}
                                        </div>
                                        <div className="absolute inset-0 border-4 border-transparent transition-all duration-300 pointer-events-none"
                                            style={{ borderColor: isSpeaking ? '#fbbf24' : 'transparent' }} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Control Bar Overlay */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gray-900/90 p-2 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl z-20">
                            <button
                                onClick={() => isListening ? stopListening() : startListening()}
                                className={`p-3 rounded-xl transition-all ${isListening ? 'bg-white text-blue-600' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                            >
                                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => setIsCamOn(!isCamOn)}
                                className={`p-3 rounded-xl transition-all ${isCamOn ? 'bg-white text-blue-600' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                            >
                                {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                            </button>
                            <div className="w-px h-8 bg-gray-700 mx-1" />
                            <button
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                className={`p-3 rounded-xl transition-all ${isChatOpen ? 'bg-white text-blue-600' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                            >
                                <MessageCircle className="w-5 h-5" />
                            </button>
                            <button className="p-3 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition-all">
                                <Smile className="w-5 h-5" />
                            </button>
                            <button className="p-3 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition-all">
                                <MonitorUp className="w-5 h-5" />
                            </button>
                            <button className="p-3 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition-all">
                                <Hand className="w-5 h-5" />
                            </button>
                            <div className="w-px h-8 bg-gray-700 mx-1" />
                            <button
                                onClick={getFinalEvaluation}
                                className="p-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                            >
                                <PhoneOff className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Transcribe Section (Chat Window) - Scrollable */}
                    {isChatOpen && (
                        <div className="h-48 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900 p-4 flex flex-col shrink-0 animate-in slide-in-from-bottom duration-200">
                            <h3 className="text-green-800 dark:text-green-400 font-semibold mb-2 flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4" />
                                Live Transcript
                            </h3>
                            <div
                                ref={chatContainerRef}
                                className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
                            >
                                {gdTurns.length === 0 && !interimTranscript && waitingForBots && (
                                    <p className="text-gray-400 text-sm italic">Bots are speaking first in this round...</p>
                                )}
                                {gdTurns.length === 0 && !interimTranscript && !waitingForBots && (
                                    <p className="text-gray-400 text-sm italic">Conversation will appear here...</p>
                                )}

                                {gdTurns.map((turn, tIdx) => (
                                    <div key={tIdx} className="space-y-2">
                                        <div className="flex gap-2">
                                            <span className="font-bold text-blue-600 text-sm whitespace-nowrap">You:</span>
                                            <p className="text-gray-700 dark:text-gray-300 text-sm">{turn.user}</p>
                                        </div>
                                        {turn.agents.map((agent, aIdx) => (
                                            <div key={`${tIdx}-${aIdx}`} className="flex gap-2">
                                                <span className="font-bold text-purple-600 text-sm whitespace-nowrap">{agent.name.split(' ')[0]}:</span>
                                                <p className="text-gray-700 dark:text-gray-300 text-sm">{agent.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                ))}

                                {interimTranscript && (
                                    <div className="flex gap-2 opacity-70">
                                        <span className="font-bold text-blue-600 text-sm whitespace-nowrap">You (speaking):</span>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm italic">{interimTranscript}</p>
                                    </div>
                                )}
                                {typingAgent && (
                                    <div className="flex gap-2 items-center text-purple-500 text-sm">
                                        <span className="font-bold">{typingAgent.split(' ')[0]}</span>
                                        <span className="italic">is typing...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Info & Controls */}
                {/* Right Sidebar - Info & Controls */}
                <div className="w-96 flex flex-col gap-4 shrink-0 h-full">

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 min-h-0">
                        {/* Question Card */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800 shrink-0">
                            <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-3 shadow-sm">
                                Question 1
                            </div>
                            <h2 className="text-gray-900 dark:text-white font-bold text-lg mb-4 leading-snug">
                                {topic?.title || "Loading topic..."}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
                                {topic?.content?.substring(0, 150)}...
                            </p>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span>Discussion Rounds</span>
                                    <span>{gdTurns.length}/{maxResponses}</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                        style={{ width: `${(gdTurns.length / maxResponses) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Participants */}
                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-800 shrink-0">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-gray-500" />
                                Participants
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                            Y
                                        </div>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">You</span>
                                    </div>
                                    {isListening && <Mic className="w-4 h-4 text-green-500 animate-pulse" />}
                                </div>
                                {personas.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`}
                                                    alt={p.name}
                                                    className="w-full h-full"
                                                />
                                            </div>
                                            <span className="font-medium text-gray-600 dark:text-gray-300 text-sm">{p.name.split(' ')[0]}</span>
                                        </div>
                                        {currentSpeakingAgent === p.name && (
                                            <div className="flex space-x-0.5">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="w-0.5 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex gap-3 shrink-0">
                        <button
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={waitingForBots || isAISpeaking || currentRoundTurn === 'bots'}
                            onClick={async () => {
                                // For Disha: Advance to next round
                                if (isDisha && onNextRound) {
                                    // Reset round state for next round
                                    setCurrentRoundNumber(prev => prev + 1);
                                    setCurrentRoundTurn('bots');
                                    setWaitingForBots(true);
                                    // Call parent's next round handler
                                    onNextRound();
                                    // Trigger bots to speak first in new round
                                    setTimeout(() => {
                                        handleBotsSpeakFirst();
                                    }, 500);
                                } else {
                                    toast.success('Moving to next round...');
                                }
                            }}
                        >
                            Next Question
                        </button>
                        <button
                            onClick={getFinalEvaluation}
                            disabled={gdTurns.length === 0 || waitingForBots || isAISpeaking}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                        >
                            Submit Section
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
