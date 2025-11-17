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
  
  // Mic test states
  const [showMicTest, setShowMicTest] = useState<boolean>(false);
  const [isTestingMic, setIsTestingMic] = useState<boolean>(false);
  const [micTestPassed, setMicTestPassed] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [micTestError, setMicTestError] = useState<string | null>(null);
  const [testCountdown, setTestCountdown] = useState<number>(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const userResponsesRef = useRef<string[]>([]);
  const micTestStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize camera
  const initCameraStream = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera not supported in this browser.');
      setCameraError('Camera not supported');
      return false;
    }
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      
      // Stop any existing stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      
      localStreamRef.current = stream;
      setCameraError(null);
      
      // Set video source immediately
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().then(() => {
          setCameraReady(true);
        }).catch((err) => {
          console.error('Video play error:', err);
          setCameraReady(false);
        });
      }
      
      return true;
    } catch (error: any) {
      setCameraReady(false);
      const message = error instanceof DOMException
        ? error.message || 'Camera permission denied.'
        : 'Camera not available. Please allow access.';
      setCameraError(message);
      toast.error(message);
      console.error('Camera initialization error:', error);
      return false;
    }
  };

  // Mic test function
  const testMicrophone = async () => {
    setIsTestingMic(true);
    setMicTestError(null);
    setMicLevel(0);
    setMicTestPassed(false);

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      micTestStreamRef.current = stream;

      // Create audio context for level detection
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3; // Lower for more responsive detection
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start monitoring audio levels using time domain data (better for voice detection)
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let maxLevel = 0;
      let sampleCount = 0;
      let audioSamples = 0;
      let isActive = true; // Use local flag instead of state
      
      const updateMicLevel = () => {
        if (!analyserRef.current || !isActive) {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          return;
        }
        
        // Use time domain data for better voice detection
        analyserRef.current.getByteTimeDomainData(dataArray);
        
        // Calculate RMS (Root Mean Square) for audio level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const level = Math.min(100, rms * 200); // Scale to 0-100
        
        maxLevel = Math.max(maxLevel, level);
        setMicLevel(level);
        
        sampleCount++;
        // Count samples where we detected audio (threshold: 1% for very quiet mics)
        if (level > 1) {
          audioSamples++;
        }
        
        animationFrameRef.current = requestAnimationFrame(updateMicLevel);
      };
      
      updateMicLevel();

      // Countdown timer
      let countdown = 5;
      setTestCountdown(countdown);
      const countdownInterval = setInterval(() => {
        countdown--;
        setTestCountdown(countdown);
        if (countdown <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);

      // Test for 5 seconds (longer for better detection)
      setTimeout(() => {
        clearInterval(countdownInterval);
        isActive = false;
        stopMicTest();
        setTestCountdown(0);
        // Pass if we detected audio in at least 15% of samples OR max level > 2%
        const audioRatio = sampleCount > 0 ? audioSamples / sampleCount : 0;
        console.log('Mic test results:', { maxLevel, audioRatio, audioSamples, sampleCount });
        if (maxLevel > 2 || audioRatio > 0.15) {
          setMicTestPassed(true);
          toast.success('Microphone test passed!');
        } else {
          setMicTestError('No audio detected. Please speak louder or check your microphone connection.');
          toast.error('Microphone test failed - no audio detected');
        }
      }, 5000);

    } catch (error: any) {
      setIsTestingMic(false);
      stopMicTest();
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicTestError('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setMicTestError('No microphone found. Please connect a microphone.');
      } else {
        setMicTestError('Failed to access microphone: ' + (error.message || 'Unknown error'));
      }
      toast.error('Microphone test failed');
    }
  };

  // Stop mic test
  const stopMicTest = () => {
    setIsTestingMic(false);
    setTestCountdown(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micTestStreamRef.current) {
      micTestStreamRef.current.getTracks().forEach(track => track.stop());
      micTestStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  // Start GD session
  const handleStart = async () => {
    setIsLoading(true);
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please log in to start a GD session');
        // Optionally redirect to login
        // window.location.href = '/login';
        setIsLoading(false);
        return;
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/practice/gd/join`;
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic: '' }), // Empty topic = auto-generate
      });

      if (!res.ok) {
        // Handle specific error cases
        if (res.status === 401) {
          const errorData = await res.json().catch(() => ({ detail: 'Unauthorized' }));
          toast.error('Session expired. Please log in again.');
          // Clear invalid token
          localStorage.removeItem('access_token');
          // Optionally redirect to login
          // window.location.href = '/login';
          setIsLoading(false);
          return;
        } else if (res.status === 403) {
          toast.error('Access denied. Student access required.');
          setIsLoading(false);
          return;
        } else if (res.status === 500) {
          const errorData = await res.json().catch(() => ({ detail: 'Server error' }));
          toast.error(errorData.detail || 'Server error. Please try again later.');
          setIsLoading(false);
          return;
        } else {
          const errorData = await res.json().catch(() => ({ detail: 'Failed to start GD session' }));
          throw new Error(errorData.detail || `Failed to start GD session: ${res.status} ${res.statusText}`);
        }
      }

      const data = await res.json();
      
      // Validate response data
      if (!data.topic || !data.participants || !data.script) {
        throw new Error('Invalid response from server. Missing required data.');
      }

      setTopic(data.topic);
      setParticipants(data.participants || []);
      setScript(data.script || []);
      setHasStarted(true);
      setCurrentStep(0);
      userResponsesRef.current = [];

      // Initialize camera
      await initCameraStream();

      toast.success('GD session started! Click "Start GD" to begin.');
    } catch (error: any) {
      console.error('GD session start error:', error);
      const errorMessage = error.message || 'Failed to start GD session. Please try again.';
      toast.error(errorMessage);
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
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please log in to submit your response');
        return;
      }

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
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Session expired. Please log in again.');
          localStorage.removeItem('access_token');
          return;
        }
        const errorData = await res.json().catch(() => ({ detail: 'Failed to submit response' }));
        throw new Error(errorData.detail || 'Failed to submit response');
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
    } catch (error: any) {
      console.error('Submit response error:', error);
      toast.error(error.message || 'Failed to submit response');
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
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please log in to evaluate your session');
        setIsEvaluating(false);
        return;
      }

      // Combine all user responses into transcript
      const transcript = userResponsesRef.current.join(' ');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/practice/gd/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: topic,
          transcript: transcript,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Session expired. Please log in again.');
          localStorage.removeItem('access_token');
          setIsEvaluating(false);
          return;
        }
        const errorData = await res.json().catch(() => ({ detail: 'Failed to evaluate' }));
        throw new Error(errorData.detail || 'Failed to evaluate');
      }

      const data = await res.json();
      
      // Validate response
      if (!data.score && data.score !== 0) {
        throw new Error('Invalid evaluation response from server');
      }

      setEvaluation(data);
      toast.success('Evaluation complete!');
    } catch (error: any) {
      console.error('Evaluation error:', error);
      toast.error(error.message || 'Failed to evaluate session');
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

  // Video element setup - ensure video is always connected to stream
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      localVideoRef.current.play().then(() => {
        setCameraReady(true);
      }).catch((err) => {
        console.error('Video play error:', err);
      });
    }
  }, [localStreamRef.current, hasStarted]);

  // Camera toggle
  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      if (camOn && hasStarted) {
        initCameraStream();
      }
      return;
    }
    stream.getVideoTracks().forEach((t) => {
      t.enabled = camOn;
      if (camOn && !t.enabled) {
        // Re-initialize if track was disabled
        initCameraStream();
      }
    });
  }, [camOn, hasStarted]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (micTestStreamRef.current) {
        micTestStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Check if user is logged in
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('access_token');

  // Initial setup screen
  if (!hasStarted) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50/30 rounded-2xl shadow-xl border border-blue-100/50 p-6 sm:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
              <h2 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">AI-Generated</span>{' '}
                <span className="text-blue-400">Group Discussion</span>
              </h2>
            </div>
            <p className="text-gray-600">
              Practice with AI-generated participants. A complete script will be generated, and you'll take turns speaking.
            </p>
          </div>

          {/* Login Warning */}
          {!isLoggedIn && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-yellow-800 mb-1">Login Required</p>
                  <p className="text-sm text-yellow-700">
                    Please log in to start a GD session. Your session may have expired.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mic Test Section */}
          {!showMicTest ? (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Before You Start
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">1.</span>
                    <span>Ensure your microphone is connected and working properly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">2.</span>
                    <span>Grant microphone permissions when prompted by your browser</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">3.</span>
                    <span>Test your microphone to ensure it's working correctly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">4.</span>
                    <span>Use Chrome or Edge browser for best experience</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowMicTest(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <Mic className="w-5 h-5" />
                  Test Microphone
                </button>
                <button
                  onClick={handleStart}
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start GD Session
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Mic Test Interface */
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Microphone Test</h3>
                <p className="text-gray-600">Speak into your microphone to test if it's working properly</p>
              </div>

              {/* Mic Level Indicator */}
              <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 border-4 border-blue-200 flex items-center justify-center">
                    {isTestingMic ? (
                      <div className="absolute inset-0 rounded-full">
                        <div
                          className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 transition-all duration-100"
                          style={{
                            clipPath: `circle(${micLevel}% at 50% 50%)`,
                          }}
                        ></div>
                        <Mic className="w-12 h-12 text-blue-600 relative z-10" />
                      </div>
                    ) : (
                      <Mic className={`w-12 h-12 ${micTestPassed ? 'text-green-600' : 'text-gray-400'}`} />
                    )}
                  </div>
                </div>

                {/* Audio Level Bars */}
                {isTestingMic && (
                  <div className="flex items-end justify-center gap-1 h-20 mb-4">
                    {Array.from({ length: 20 }).map((_, i) => {
                      // Each bar represents 5% of the total range (0-100%)
                      const barThreshold = i * 5;
                      const nextThreshold = (i + 1) * 5;
                      
                      // Calculate bar height based on current mic level
                      let barHeight = 10; // Minimum height
                      if (micLevel >= nextThreshold) {
                        barHeight = 100; // Full height
                      } else if (micLevel > barThreshold) {
                        // Partial height based on how much of this bar's range is covered
                        const rangeCovered = (micLevel - barThreshold) / 5;
                        barHeight = 10 + (rangeCovered * 90); // Scale from 10% to 100%
                      }
                      
                      // Color based on level
                      const isHigh = micLevel > 50 && i >= 10;
                      const isMedium = micLevel > 20 && i >= 4 && !isHigh;
                      
                      return (
                        <div
                          key={i}
                          className="w-2.5 rounded-full transition-all duration-100"
                          style={{
                            height: `${barHeight}%`,
                            backgroundColor: isHigh 
                              ? '#3b82f6' 
                              : isMedium 
                                ? '#60a5fa' 
                                : '#bfdbfe',
                            minHeight: '8px',
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Status Messages */}
                <div className="text-center">
                  {isTestingMic ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        <p className="text-blue-600 font-semibold">Listening... Please speak now</p>
                      </div>
                      {testCountdown > 0 && (
                        <div className="text-3xl font-bold text-blue-600">
                          {testCountdown}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">Speak clearly into your microphone</p>
                    </div>
                  ) : micTestPassed ? (
                    <p className="text-green-600 font-semibold flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Microphone test passed!
                    </p>
                  ) : micTestError ? (
                    <div className="space-y-2">
                      <p className="text-red-600 font-semibold text-sm">{micTestError}</p>
                      <p className="text-xs text-gray-500">Make sure your microphone is not muted and try again</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Click "Start Test" to begin</p>
                  )}
                </div>
              </div>

              {/* Test Instructions */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-5">
                <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Click "Start Test" button below</li>
                  <li>Allow microphone access when prompted by your browser</li>
                  <li>Speak clearly into your microphone for 5 seconds (count aloud: "1, 2, 3, 4, 5")</li>
                  <li>You'll see audio level indicators (blue bars) if your mic is working</li>
                  <li>The circular indicator will fill up as you speak</li>
                  <li>Once test passes, you can proceed to start the GD session</li>
                </ol>
                <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                  <p className="text-xs text-blue-900 font-medium">
                    💡 Tip: Speak at normal volume. The test will detect even quiet speech. Make sure your microphone is not muted.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {!isTestingMic && !micTestPassed ? (
                  <button
                    onClick={testMicrophone}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <Mic className="w-5 h-5" />
                    Start Test
                  </button>
                ) : isTestingMic ? (
                  <button
                    onClick={stopMicTest}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-red-700 hover:to-red-600 transition-all duration-300"
                  >
                    <MicOff className="w-5 h-5" />
                    Stop Test
                  </button>
                ) : null}

                <button
                  onClick={() => {
                    setShowMicTest(false);
                    setMicTestPassed(false);
                    setMicTestError(null);
                    setMicLevel(0);
                    setTestCountdown(0);
                    stopMicTest();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-200 transition-all duration-300"
                >
                  <RotateCcw className="w-5 h-5" />
                  Back
                </button>

                {micTestPassed && (
                  <button
                    onClick={handleStart}
                    disabled={isLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Start GD Session
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
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
  
  // Calculate round number (each round = 4 turns: 3 AI + 1 user)
  const roundNumber = Math.floor(currentStep / 4) + 1;
  const totalRounds = Math.ceil(script.length / 4);
  const progressPercentage = ((currentStep + 1) / script.length) * 100;

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/20 overflow-hidden">
      {/* Header - Compact */}
      <div className="bg-white border-b-2 border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">AI Group Discussion</h2>
          </div>
          <div className="hidden sm:block h-6 w-px bg-gray-300"></div>
          <p className="hidden sm:block text-sm text-gray-600 truncate max-w-xs">{topic}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Round Info */}
          <div className="text-right">
            <div className="text-xs text-gray-500">Round</div>
            <div className="text-sm font-bold text-blue-600">
              {roundNumber} / {totalRounds}
            </div>
          </div>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 sm:px-6 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="w-full bg-gray-100 rounded-full h-2 border border-gray-200">
          <div
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
          <span>{Math.round(progressPercentage)}% Complete</span>
          <span>Turn {currentStep + 1} of {script.length}</span>
        </div>
      </div>

      {/* 2x2 Grid - Fixed Height */}
      <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6 overflow-hidden min-h-0">
        {/* AI Participants */}
        {participants.filter(p => p.id !== 'user').map((participant) => {
          const isActive = currentItem && currentItem.id === participant.id && isPlaying;
          
          return (
            <div
              key={participant.id}
              className={`relative rounded-xl overflow-hidden border-2 bg-gradient-to-br from-blue-600 to-indigo-600 transition-all flex flex-col ${
                isActive ? 'ring-4 ring-yellow-400 shadow-xl scale-[1.02]' : 'border-gray-300 shadow-md'
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white z-10">
                <div className={`text-center ${isActive ? 'animate-pulse' : ''}`}>
                  <div className="text-3xl sm:text-4xl mb-1">{participant.avatar}</div>
                  <div className="font-semibold text-sm sm:text-base">{participant.name}</div>
                </div>
              </div>
              
              {/* Transcript overlay */}
              {isActive && currentItem && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-2 text-xs z-20 max-h-20 overflow-y-auto">
                  <div className="flex items-start gap-2">
                    <Volume2 className="w-3 h-3 mt-0.5 opacity-80 flex-shrink-0" />
                    <p className="whitespace-pre-wrap leading-tight">{currentItem.text}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* User Box */}
        <div className="relative rounded-xl overflow-hidden border-2 border-blue-400 bg-gray-900 flex flex-col">
          {localStreamRef.current && camOn ? (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                onLoadedMetadata={() => {
                  setCameraReady(true);
                }}
                onCanPlay={() => {
                  setCameraReady(true);
                }}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  cameraReady ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
                  <div className="text-center">
                    <CameraOff className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-80" />
                    <span className="text-xs sm:text-sm">Loading camera...</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
              <div className="text-center">
                <CameraOff className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-80" />
                <span className="text-xs sm:text-sm">Camera {camOn ? 'loading...' : 'off'}</span>
              </div>
            </div>
          )}
          
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-semibold z-10">
            You
          </div>
          
          {isUserTurn && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-2 text-xs z-10">
              <div className="flex items-center gap-2">
                <Mic className="w-3 h-3 flex-shrink-0" />
                <span>Your turn to speak</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls - Fixed at Bottom */}
      <div className="bg-white border-t-2 border-gray-200 px-4 sm:px-6 py-3 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
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
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Start GD</span>
                  <span className="sm:hidden">Start</span>
                </>
              )}
            </button>
          )}

          {isUserTurn && (
            <>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Record</span>
                  <span className="sm:hidden">Record</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white font-semibold shadow-lg animate-pulse"
                >
                  <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Stop Recording</span>
                  <span className="sm:hidden">Stop</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={() => {
              setCamOn((v) => !v);
              if (!camOn && !localStreamRef.current) {
                initCameraStream();
              }
            }}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
              camOn 
                ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-2 border-gray-300' 
                : 'bg-gray-800 text-white hover:bg-gray-900 border-2 border-gray-700'
            }`}
          >
            {camOn ? (
              <span className="inline-flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Camera on</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <CameraOff className="w-4 h-4" />
                <span className="hidden sm:inline">Camera off</span>
              </span>
            )}
          </button>

          {currentStep >= script.length - 1 && (
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating}
              className="px-4 sm:px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Evaluating...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Evaluate Performance</span>
                  <span className="sm:hidden">Evaluate</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
