'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, Camera, CameraOff, Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Participant {
  id: number | string;
  name: string;
  avatar: string;
}

interface ScriptItem {
  id: number | string;
  text: string;
}

export default function PracticeGroupDiscussion() {
  const [topic, setTopic] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [script, setScript] = useState<ScriptItem[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  
  const [camOn, setCamOn] = useState<boolean>(true);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const userResponsesRef = useRef<string[]>([]);

  // Initialize camera
  const initCameraStream = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera not supported in this browser.');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      localStreamRef.current = stream;
      setCameraReady(false);
      setCameraError(null);
      return true;
    } catch (error) {
      setCameraReady(false);
      const message = error instanceof DOMException
        ? error.message || 'Camera permission denied.'
        : 'Camera not available. Please allow access.';
      setCameraError(message);
      toast.error(message);
      return false;
    }
  };

  // Start GD session
  const handleStart = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/practice/gd/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ topic: '' }), // Empty topic = auto-generate
      });

      if (!res.ok) {
        throw new Error('Failed to start GD session');
      }

      const data = await res.json();
      setTopic(data.topic);
      setParticipants(data.participants || []);
      setScript(data.script || []);
      setHasStarted(true);
      setCurrentStep(0);
      userResponsesRef.current = [];

      // Initialize camera
      await initCameraStream();

      toast.success('GD session started! Click "Start GD" to begin.');
    } catch (error) {
      toast.error('Failed to start GD session');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Play script sequentially using TTS
  const playScript = async () => {
    if (!script.length || currentStep >= script.length) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const currentItem = script[currentStep];

    // If it's a user turn, stop and wait for recording
    if (currentItem.id === 'user') {
      setIsPlaying(false);
      toast('Your turn! Click Record to speak.', { icon: '🎤' });
      return;
    }

    // Find participant for this turn
    const participant = participants.find(p => p.id === currentItem.id);
    const participantName = participant?.name || 'Participant';

    // Use Web Speech API for TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentItem.text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        // Move to next step after a short delay
        setTimeout(() => {
          setCurrentStep(prev => {
            const next = prev + 1;
            if (next < script.length) {
              playScript(); // Continue playing
            } else {
              setIsPlaying(false);
              toast.success('Script completed! You can evaluate your performance.');
            }
            return next;
          });
        }, 500);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        toast.error('Speech synthesis error');
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback: just show text and auto-advance
      toast(`${participantName}: ${currentItem.text}`, { icon: '💬' });
      setTimeout(() => {
        setCurrentStep(prev => {
          const next = prev + 1;
          if (next < script.length) {
            playScript();
          } else {
            setIsPlaying(false);
          }
          return next;
        });
      }, 3000);
    }
  };

  // Start recording user audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await submitResponse(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording... Click Stop when done.');
    } catch (error) {
      toast.error('Failed to start recording. Check microphone permissions.');
      console.error(error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Submit user response
  const submitResponse = async (audioBlob?: Blob) => {
    try {
      const formData = new FormData();
      formData.append('topic', topic);
      formData.append('script_step', currentStep.toString());
      
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
      } else {
        // For text input (if we add that feature)
        formData.append('text', 'User response');
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/practice/gd/response`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to submit response');
      }

      const data = await res.json();
      toast.success('Response submitted!');

      // Move to next step
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next < script.length) {
          // Continue playing script
          setTimeout(() => playScript(), 1000);
        }
        return next;
      });
    } catch (error) {
      toast.error('Failed to submit response');
      console.error(error);
    }
  };

  // Evaluate session
  const handleEvaluate = async () => {
    if (!userResponsesRef.current.length) {
      toast.error('Please participate in the discussion first');
      return;
    }

    setIsEvaluating(true);
    try {
      // Combine all user responses into transcript
      const transcript = userResponsesRef.current.join(' ');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/practice/gd/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          topic: topic,
          transcript: transcript,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to evaluate');
      }

      const data = await res.json();
      setEvaluation(data);
      toast.success('Evaluation complete!');
    } catch (error) {
      toast.error('Failed to evaluate session');
      console.error(error);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Reset session
  const handleReset = () => {
    setHasStarted(false);
    setTopic('');
    setParticipants([]);
    setScript([]);
    setCurrentStep(0);
    setIsPlaying(false);
    setIsRecording(false);
    setEvaluation(null);
    userResponsesRef.current = [];
    
    // Stop camera
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    
    // Stop speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Video element setup
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStreamRef.current]);

  // Camera toggle
  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      if (camOn && hasStarted) {
        initCameraStream();
      }
      return;
    }
    stream.getVideoTracks().forEach((t) => (t.enabled = camOn));
  }, [camOn, hasStarted]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Initial setup screen
  if (!hasStarted) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Generated Group Discussion</h2>
          <p className="text-gray-600 mb-4">
            Practice with AI-generated participants. A complete script will be generated, and you'll take turns speaking.
          </p>

          <button
            onClick={handleStart}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isLoading ? 'Starting...' : 'Start GD Session'}
          </button>
        </div>
      </div>
    );
  }

  // Evaluation screen
  if (evaluation) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Group Discussion Results</h2>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <RotateCcw className="h-4 w-4" />
            Start New Session
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow border-2 border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Overall Score</div>
              <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {evaluation.score}%
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border-2 border-green-200 p-5 rounded-xl">
            <div className="font-semibold text-green-800 mb-2">Key Strengths</div>
            <ul className="list-disc list-inside text-green-900 text-sm space-y-1">
              {evaluation.strengths?.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="bg-orange-50 border-2 border-orange-200 p-5 rounded-xl">
            <div className="font-semibold text-orange-800 mb-2">Areas for Improvement</div>
            <ul className="list-disc list-inside text-orange-900 text-sm space-y-1">
              {evaluation.improvements?.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {evaluation.summary && (
          <div className="bg-blue-50 border-2 border-blue-200 p-5 rounded-xl">
            <div className="font-semibold text-blue-800 mb-2">Summary</div>
            <p className="text-blue-900 text-sm">{evaluation.summary}</p>
          </div>
        )}
      </div>
    );
  }

  // Main GD interface
  const currentItem = script[currentStep];
  const isUserTurn = currentItem?.id === 'user';
  const currentParticipant = participants.find(p => p.id === currentItem?.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Group Discussion</h2>
          <p className="text-sm text-gray-600">{topic}</p>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* AI Participants */}
        {participants.map((participant) => {
          const isActive = currentItem && currentItem.id === participant.id && isPlaying;
          const participantScript = script.find(s => s.id === participant.id && s.id === currentItem?.id);
          
          return (
            <div
              key={participant.id}
              className={`relative rounded-xl overflow-hidden aspect-video border-2 bg-gradient-to-br from-blue-600 to-indigo-600 transition-all ${
                isActive ? 'ring-4 ring-yellow-400 shadow-xl' : 'border-gray-300 shadow'
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className={`text-center ${isActive ? 'animate-pulse' : ''}`}>
                  <div className="text-4xl mb-2">{participant.avatar}</div>
                  <div className="font-semibold text-lg">{participant.name}</div>
                </div>
              </div>
              
              {/* Transcript overlay */}
              {isActive && currentItem && (
                <div className="absolute bottom-0 w-full bg-black/70 text-white p-3 text-xs">
                  <div className="flex items-start gap-2">
                    <Volume2 className="w-4 h-4 mt-0.5 opacity-80" />
                    <p className="whitespace-pre-wrap">{currentItem.text}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* User Box */}
        <div className="relative rounded-xl overflow-hidden aspect-video border-2 border-blue-400 bg-gray-900">
          {localStreamRef.current && camOn ? (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                onLoadedMetadata={() => setCameraReady(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  cameraReady ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <CameraOff className="w-10 h-10 opacity-80" />
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <CameraOff className="w-10 h-10 mx-auto mb-2 opacity-80" />
                <span className="text-sm">Camera {camOn ? 'loading...' : 'off'}</span>
              </div>
            </div>
          )}
          
          <div className="absolute top-2 left-2 bg-black/55 text-white text-xs px-2 py-1 rounded">
            You
          </div>
          
          {isUserTurn && (
            <div className="absolute bottom-0 w-full bg-black/70 text-white p-3 text-xs">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                <span>Your turn to speak</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="sticky bottom-0 bg-white rounded-xl p-4 border shadow-lg">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!isUserTurn && (
            <button
              onClick={() => {
                if (isPlaying) {
                  window.speechSynthesis.cancel();
                  setIsPlaying(false);
                } else {
                  playScript();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start GD
                </>
              )}
            </button>
          )}

          {isUserTurn && (
            <>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  <Mic className="w-4 h-4" />
                  Record
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-700 hover:bg-red-800 text-white font-semibold animate-pulse"
                >
                  <MicOff className="w-4 h-4" />
                  Stop Recording
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setCamOn((v) => !v)}
            className={`px-4 py-2 rounded-md font-semibold transition ${
              camOn ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-gray-800 text-white hover:bg-gray-900'
            }`}
          >
            {camOn ? (
              <span className="inline-flex items-center gap-2">
                <Camera className="w-4 h-4" /> Camera on
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <CameraOff className="w-4 h-4" /> Camera off
              </span>
            )}
          </button>

          {currentStep >= script.length - 1 && (
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating}
              className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                'Evaluate Performance'
              )}
            </button>
          )}
        </div>

        {/* Progress indicator */}
        <div className="mt-3 text-center text-xs text-gray-500">
          Step {currentStep + 1} of {script.length}
        </div>
      </div>
    </div>
  );
}
