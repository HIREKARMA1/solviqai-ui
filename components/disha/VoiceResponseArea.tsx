import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

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

interface VoiceResponseAreaProps {
    questionId: string;
    initialAnswer: string;
    onAnswerChange: (answer: string) => void;
    clearSignal?: number; // timestamp to trigger clear
    isMobile?: boolean;
    onRecordingStart?: () => void;
    enableVoice?: boolean;
}

export const VoiceResponseArea = ({
    questionId,
    initialAnswer,
    onAnswerChange,
    clearSignal,
    onRecordingStart,
    enableVoice = true
}: VoiceResponseAreaProps) => {
    const [localAnswer, setLocalAnswer] = useState(initialAnswer || '');
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');

    // Refs to avoid stale closures and infinite loops
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const isListeningRef = useRef(false);
    const onAnswerChangeRef = useRef(onAnswerChange);
    const localAnswerRef = useRef(localAnswer);
    const lastTranscriptUpdateRef = useRef(0);

    // Sync refs
    useEffect(() => {
        onAnswerChangeRef.current = onAnswerChange;
    }, [onAnswerChange]);

    useEffect(() => {
        localAnswerRef.current = localAnswer;
    }, [localAnswer]);

    // Update local answer when question changes (reset or load saved)
    useEffect(() => {
        setLocalAnswer(initialAnswer || '');
        setInterimTranscript('');
        // Stop recording if question changes
        if (isListeningRef.current) {
            stopRecording();
        }
    }, [questionId]); // Dependencies: only when questionId changes. WARNING: if initialAnswer changes same qID, we might overwrite user typing if not careful. Ideally initialAnswer is stable.

    // Debounced sync to parent
    // We use a simple timeout effect that runs when localAnswer changes
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (localAnswer !== initialAnswer) { // Only sync if changed
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                onAnswerChangeRef.current(localAnswer);
            }, 1000); // Debounce save to parent/storage by 1s
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [localAnswer, initialAnswer]);

    // Clear signal handler
    useEffect(() => {
        if (clearSignal) {
            setLocalAnswer('');
            setInterimTranscript('');
            onAnswerChangeRef.current('');
        }
    }, [clearSignal]);

    // Force sync on unmount or question change
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                onAnswerChangeRef.current(localAnswerRef.current);
            }
        }
    }, [questionId]);

    // Speech Recognition Setup
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

                    // Performance: Only update local state
                    if (final) {
                        setLocalAnswer(prev => {
                            const newVal = (prev || '') + final;
                            return newVal;
                        });
                        setInterimTranscript('');
                        lastTranscriptUpdateRef.current = Date.now();
                    } else {
                        // Throttle interim updates to avoid aggressive UI flashing
                        const now = Date.now();
                        if (now - lastTranscriptUpdateRef.current > 100) {
                            setInterimTranscript(interim);
                            lastTranscriptUpdateRef.current = now;
                        }
                    }
                };

                recognition.onerror = (event: any) => {
                    if (event.error === 'not-allowed') {
                        toast.error('Microphone access denied');
                        setIsListening(false);
                        isListeningRef.current = false;
                    }
                    if (event.error === 'no-speech') {
                        // ignore
                    }
                };

                recognition.onend = () => {
                    // Auto-restart if we think we are still listening
                    if (isListeningRef.current) {
                        try {
                            recognition.start();
                        } catch (e) { /* ignore */ }
                    } else {
                        setIsListening(false);
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

    const startRecording = () => {
        if (!recognitionRef.current) {
            toast.error('Browser not supported');
            return;
        }
        try {
            recognitionRef.current.start();
            setIsListening(true);
            isListeningRef.current = true;
            if (onRecordingStart) onRecordingStart();

            // Append a space if needed
            if (localAnswer && !localAnswer.endsWith(' ')) {
                setLocalAnswer(prev => prev + ' ');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const stopRecording = () => {
        if (!recognitionRef.current) return;
        isListeningRef.current = false;
        try {
            recognitionRef.current.stop();
        } catch (e) { }
        setIsListening(false);

        // Finalize interim
        if (interimTranscript) {
            setLocalAnswer(prev => prev + interimTranscript);
            setInterimTranscript('');
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalAnswer(e.target.value);
    };

    const handleClear = () => {
        setLocalAnswer('');
        onAnswerChangeRef.current(''); // Immediate sync needed for clear? Maybe not, effects will handle it.
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Record Button */}
            {enableVoice && (
                <div className="mb-6 flex items-center justify-between">
                    {!isListening ? (
                        <button
                            onClick={startRecording}
                            className="bg-[#10B981] hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
                        >
                            <Mic size={20} />
                            <span>Start Recording</span>
                        </button>
                    ) : (
                        <button
                            onClick={stopRecording}
                            className="bg-[#EF4444] hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-3 transition-all animate-pulse shadow-sm"
                        >
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                            <span>Stop Recording</span>
                        </button>
                    )}
                </div>
            )}

            {/* Transcribe Box - Overlay or Top */}
            {enableVoice && (isListening || interimTranscript) && (
                <div className="bg-[#ECFDF5] border border-green-100 rounded-t-lg p-4 mb-0 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-[#10B981] font-bold text-sm uppercase tracking-wide mb-2">Transcribing...</h3>
                    <p className="text-gray-600 text-sm leading-relaxed font-mono">
                        {interimTranscript || "Listening..."}
                    </p>
                </div>
            )}

            {/* Response Box */}
            <div className="flex flex-col flex-1">
                <label className="text-lg font-bold text-gray-900 mb-2">Your Response</label>
                <textarea
                    className={`w-full flex-1 min-h-[200px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 text-lg leading-relaxed
                        ${enableVoice && (isListening || interimTranscript) ? 'rounded-t-none border-t-0' : 'border-gray-300'}`}
                    placeholder="Type your answer here..."
                    value={localAnswer}
                    onChange={handleTextChange}
                />
            </div>

            {/* We are listening to 'initialAnswer' change to reset local state if parent clears it? */}
        </div>
    );
};
