'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageCircle, RotateCcw, Mic, MicOff, Camera, CameraOff, PhoneOff, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGDSocket } from '@/lib/gdSocket';
import { useTranscription } from '@/hooks/useTranscription';

const defaultPayload = { mode: 'practice' };

export default function PracticeGroupDiscussion() {
  const [hasStarted, setHasStarted] = useState(false);
  const [topicPreference, setTopicPreference] = useState('');
  const [sessionKey, setSessionKey] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [topic, setTopic] = useState<{ title: string; content?: string } | null>(null);
  const [participants, setParticipants] = useState<Array<{ id: string; name: string; type: 'human' | 'bot' }>>([]);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [remoteSpeaking, setRemoteSpeaking] = useState<Record<string, boolean>>({});
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [rounds, setRounds] = useState(3);
  const [currentRound, setCurrentRound] = useState(1);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micTested, setMicTested] = useState(false);
  const [testingMic, setTestingMic] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const userIdRef = useRef<string>('you');
  const gdSocket = useGDSocket();

  const practicePayload = useMemo(() => {
    if (!topicPreference.trim()) {
      return { ...defaultPayload, rounds };
    }
    return {
      mode: 'practice',
      topic_preference: topicPreference.trim(),
      rounds,
    };
  }, [topicPreference, rounds]);

  const cleanupMicTest = () => {
    if (micIntervalRef.current) {
      clearInterval(micIntervalRef.current);
      micIntervalRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    analyserRef.current = null;
  };

  const runMicTest = async () => {
    if (testingMic) return;
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Microphone not supported in this browser.');
      return;
    }
    try {
      setTestingMic(true);
      setMicLevel(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
      if (!AudioCtx) {
        toast.error('Web Audio API not supported.');
        cleanupMicTest();
        return;
      }
      const audioCtx = audioContextRef.current ?? new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      micIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setMicLevel(Math.round((avg / 255) * 100));
      }, 150);

      await new Promise((resolve) => setTimeout(resolve, 4000));
      setMicTested(true);
      toast.success('Microphone test complete');
    } catch (error) {
      toast.error('Could not access microphone. Please check permissions.');
    } finally {
      cleanupMicTest();
      setTestingMic(false);
    }
  };

  const speakQueueRef = useRef<string[]>([]);
  const speakingRef = useRef<boolean>(false);
  const processSpeakQueue = () => {
    if (speakingRef.current) return;
    const next = speakQueueRef.current.shift();
    if (!next) return;
    speakingRef.current = true;
    try {
      const utterance = new SpeechSynthesisUtterance(next);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onend = () => {
        speakingRef.current = false;
        if (!speakQueueRef.current.length) {
          if (currentRound < rounds) {
            setCurrentRound((r) => {
              const nr = Math.min(r + 1, rounds);
              try {
                gdSocket.sendMessage('round_end', { round_index: nr });
              } catch {}
              return nr;
            });
          }
        }
        processSpeakQueue();
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      speakingRef.current = false;
      processSpeakQueue();
    }
  };

  const speakBotResponse = (text: string) => {
    if (typeof window === 'undefined') return;
    if (!text?.trim()) return;
    if (!('speechSynthesis' in window)) return;
    speakQueueRef.current.push(text);
    processSpeakQueue();
  };


  const initCameraStream = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera not supported in this browser.');
      return false;
    }
    try {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        toast.error('Camera requires a secure context (HTTPS or localhost).');
        return false;
      }
      const constraintCandidates: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        { video: { facingMode: 'user' } },
        { video: true },
      ];

      let stream: MediaStream | null = null;
      let lastError: unknown = null;
      for (const constraints of constraintCandidates) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!stream) {
        throw lastError ?? new Error('Camera stream unavailable');
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCameraReady(false);
      setCameraError(null);
      return true;
    } catch (error) {
      setCameraReady(false);
      const message =
        error instanceof DOMException
          ? error.message || 'Camera permission denied.'
          : 'Camera not available. Please allow access or reconnect your device.';
      setCameraError(message);
      toast.error(message);
      return false;
    }
  };

  const handleStart = async () => {
    if (!micTested) {
      toast.error('Please test your microphone before starting.');
      return;
    }
    try {
      setIsStarting(true);
      setEvaluation(null);
      setTranscripts({});
      setRemoteSpeaking({});

      // Join GD room
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/practice/gd/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(practicePayload),
      });
      if (!res.ok) {
        throw new Error('Failed to join GD room');
      }
      const data = await res.json();
      const rid = data.room_id as string;
      setRoomId(rid);
      const topicData = data.topic || {};
      setTopic({
        title: topicData.title || 'Group Discussion',
        content: topicData.background || topicData.content || '',
      });
      const mapped = (data.participants || []).map((p: any) => ({
        id: String(p.id || p.persona || 'bot'),
        name: String(p.persona || (p.type === 'human' ? 'You' : 'AI')),
        type: (p.type || 'bot') as 'human' | 'bot',
      }));
      const you = mapped.find((m: any) => m.type === 'human') || { id: 'you', name: 'You', type: 'human' };
      userIdRef.current = you.id || 'you';
      setParticipants(mapped.length ? mapped : [you, { id: 'bot-1', name: 'Aarav (Pro)', type: 'bot' }, { id: 'bot-2', name: 'Meera (Skeptic)', type: 'bot' }]);

      const cameraOk = await initCameraStream();
      if (!cameraOk) {
        setLocalStream(null);
      }

      gdSocket.offEvent('transcript_update');
      gdSocket.offEvent('bot_response');
      gdSocket.offEvent('user_joined');
      gdSocket.offEvent('user_left');
      gdSocket.connect(rid, userIdRef.current);

      gdSocket.onEvent('user_joined', () => {});
      gdSocket.onEvent('user_left', () => {});
      gdSocket.onEvent('transcript_update', (msg) => {
        const pid = String(msg.user_id || msg.sender || 'unknown');
        setTranscripts((prev) => ({ ...prev, [pid]: String(msg.text || '') }));
        setRemoteSpeaking((prev) => ({ ...prev, [pid]: true }));
        setTimeout(() => setRemoteSpeaking((prev) => ({ ...prev, [pid]: false })), 1200);
      });
      gdSocket.onEvent('bot_response', (msg) => {
        const name = String(msg.persona || msg.name || 'AI');
        const id = String(msg.sender || name);
        const text = String(msg.text || '');
        setTranscripts((prev) => ({ ...prev, [id]: text }));
        setRemoteSpeaking((prev) => ({ ...prev, [id]: true }));
        setTimeout(() => setRemoteSpeaking((prev) => ({ ...prev, [id]: false })), 1500);
        speakBotResponse(text);
      });

      setHasStarted(true);
      toast.success('Launching group discussion practice');
    } finally {
      setIsStarting(false);
    }
  };

  const handleRestart = () => {
    stop();
    setHasStarted(false);
    setTopicPreference('');
    setSessionKey((prev) => prev + 1);
    setRoomId(null);
    setTopic(null);
    setParticipants([]);
    setTranscripts({});
    setEvaluation(null);
    setMicOn(true);
    setCamOn(true);
    setCameraReady(false);
    setMicTested(false);
    setMicLevel(0);
    try {
      gdSocket.disconnect();
    } catch {}
    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    localStreamRef.current = null;
    setLocalStream(null);
  };

  const { isListening, partial, finalized, start, stop } = useTranscription({
    enabled: micOn,
    onPartial: (text) => {
      if (!roomId) return;
      gdSocket.sendMessage('transcript_update', { room_id: roomId, user_id: userIdRef.current, text });
    },
    onFinal: async (text) => {
      if (!text.trim() || !roomId) return;
      // Send final response to API to trigger bot messages
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/practice/gd/response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          body: JSON.stringify({
            room_id: roomId,
            text,
            personas: participants.filter((p) => p.type === 'bot').map((p) => p.name),
          }),
        });
        if (!res.ok) {
          throw new Error('Failed to process response');
        }
        const data = await res.json();
        const agents = Array.isArray(data.agents) ? data.agents : [];
        agents.forEach((a: any) => {
          const id = String(a.name || 'AI');
          setTranscripts((prev) => ({ ...prev, [id]: String(a.text || '') }));
          setRemoteSpeaking((prev) => ({ ...prev, [id]: true }));
          setTimeout(() => setRemoteSpeaking((prev) => ({ ...prev, [id]: false })), 1500);
          speakBotResponse(String(a.text || ''));
        });
      } catch (e) {
      }
    },
  });

  useEffect(() => {
    return () => {
      cleanupMicTest();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      try {
        gdSocket.disconnect();
      } catch {}
      try {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      localStreamRef.current = null;
      setLocalStream(null);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      stop();
    };
  }, [gdSocket, stop]);

  useEffect(() => {
    if (!localVideoRef.current || !localStream) {
      return;
    }
    localVideoRef.current.srcObject = localStream;
    const playPromise = localVideoRef.current.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    if (!micOn && isListening) {
      stop();
    }
  }, [micOn, isListening, stop]);

  useEffect(() => {
    const video = localVideoRef.current;
    if (!video) return;
    const handleLoaded = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => {});
      }
    };
    video.addEventListener('loadedmetadata', handleLoaded);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded);
    };
  }, []);

  // Mic/cam toggles
  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn]);
  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      if (camOn) {
        initCameraStream();
      }
      return;
    }
    stream.getVideoTracks().forEach((t) => (t.enabled = camOn));
  }, [camOn]);

  const leaveAndEvaluate = async () => {
    if (!roomId) return;
    stop();
    setEvaluating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/practice/gd/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ room_id: roomId }),
      });
      const data = await res.json();
      setEvaluation({
        score: data.overall_score ?? 0,
        criteria_scores: {
          communication: data.communication ?? 0,
          topic_understanding: data.understanding ?? 0,
          interaction: data.interaction ?? 0,
        },
        strengths: (data.feedback?.strengths || []).slice(0, 3),
        improvements: (data.feedback?.improvements || []).slice(0, 3),
      });
      toast.success('Session evaluated');
    } catch (e) {
      toast.error('Failed to evaluate discussion');
    } finally {
      setEvaluating(false);
      try {
        gdSocket.disconnect();
      } catch {}
      try {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      localStreamRef.current = null;
      setLocalStream(null);
      setCameraReady(false);
    }
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Realtime GD Practice</h2>
          <p className="text-gray-600 mb-4">
            Experience the same voice-enabled Group Discussion flow used in the assessment. Speak your
            responses, listen to AI co-participants, and receive analytics instantly.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Topic preference (optional)</label>
              <textarea
                value={topicPreference}
                onChange={(event) => setTopicPreference(event.target.value)}
                placeholder="e.g. AI regulation in India, climate change policies, digital banking trends..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                Leave blank for the system to pick a current-affairs topic automatically. Provide keywords if
                you want the AI to generate a tailored topic.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">How this works</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>The system generates a fresh GD topic (based on your preference if provided).</li>
                <li>You speak your responses; others see live transcript. AI participants reply in real-time.</li>
                <li>Choose number of rounds and submit to view detailed analytics.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-800">Test your microphone</p>
                  <p className="text-xs text-gray-500">Run a quick 4-second check before joining the discussion.</p>
                </div>
                <button
                  onClick={runMicTest}
                  disabled={testingMic}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {testingMic ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                  {testingMic ? 'Listening…' : micTested ? 'Retest mic' : 'Test mic'}
                </button>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Input level</span>
                  <span>{micLevel}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-150 ${micLevel > 60 ? 'bg-emerald-500' : micLevel > 30 ? 'bg-yellow-400' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(micLevel, 100)}%` }}
                  />
                </div>
                {!micTested && !testingMic && (
                  <p className="mt-2 text-xs text-amber-600 font-medium">Mic test required before starting.</p>
                )}
                {micTested && (
                  <p className="mt-2 text-xs text-emerald-600 font-medium">Great! We detected your microphone.</p>
                )}
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={isStarting || !micTested}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              {micTested ? 'Start Practice Session' : 'Test Mic to Continue'}
            </button>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rounds</label>
              <input
                type="number"
                min={1}
                max={10}
                value={rounds}
                onChange={(e) => setRounds(Math.max(1, Math.min(10, parseInt(e.target.value || '1', 10))))}
                className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Evaluation summary
  if (evaluation) {
    const score = Math.round(evaluation.score || 0);
    const comm = Math.round(evaluation.criteria_scores.communication || 0);
    const understand = Math.round(evaluation.criteria_scores.topic_understanding || 0);
    const interact = Math.round(evaluation.criteria_scores.interaction || 0);
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Group Discussion Results</h2>
          <button onClick={handleRestart} className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
            <RotateCcw className="h-4 w-4" />
            Start New Session
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow border-2 border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Overall Score</div>
              <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{score}%</div>
            </div>
            <div className="flex-1 ml-8">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full" style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{ name: 'Communication', val: comm }, { name: 'Topic Understanding', val: understand }, { name: 'Interaction', val: interact }].map((c) => (
            <div key={c.name} className="bg-white p-5 rounded-xl shadow border-2 border-blue-100">
              <div className="text-sm text-gray-700 mb-2">{c.name}</div>
              <div className="text-2xl font-bold text-blue-600 mb-2">{c.val}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(Math.max(c.val, 0), 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border-2 border-green-200 p-5 rounded-xl">
            <div className="font-semibold text-green-800 mb-2">Key Strengths</div>
            <ul className="list-disc list-inside text-green-900 text-sm">
              {(evaluation.strengths || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="bg-orange-50 border-2 border-orange-200 p-5 rounded-xl">
            <div className="font-semibold text-orange-800 mb-2">Areas for Improvement</div>
            <ul className="list-disc list-inside text-orange-900 text-sm">
              {(evaluation.improvements || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Live Group Discussion</h2>
          {topic && <p className="text-sm text-gray-600">{topic.title}</p>}
        </div>
        <button onClick={handleRestart} className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
          <RotateCcw className="h-4 w-4" />
          Start New Session
        </button>
      </div>

      <div className="text-sm text-gray-600">Round {currentRound} / {rounds}</div>

      {/* 2x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {participants.slice(0, 4).map((p) => {
          const isYou = p.type === 'human' && p.id === userIdRef.current;
          const speaking = remoteSpeaking[p.id] || (isYou && isListening);
          const transcript = isYou ? `${finalized}${partial}`.trim() : (transcripts[p.id] || '');
          return (
            <div
              key={p.id}
              className={`relative rounded-xl overflow-hidden aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/9] border bg-gray-900 transition-all ${
                speaking ? 'ring-4 ring-purple-400 shadow-xl' : 'border-gray-800 shadow'
              }`}
            >
              {p.type === 'human' ? (
                isYou ? (
                  <>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      key={localStream?.id || 'local-video'}
                      onLoadedMetadata={() => {
                        const videoEl = localVideoRef.current;
                        if (videoEl) {
                          const playPromise = videoEl.play();
                          if (playPromise && typeof playPromise.then === 'function') {
                            playPromise.catch(() => {});
                          }
                        }
                      }}
                      onPlaying={() => setCameraReady(true)}
                      onPause={() => setCameraReady(false)}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${cameraReady && camOn ? 'opacity-100' : 'opacity-0'}`}
                    />
                    {(!cameraReady || !camOn || !localStream) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                        <CameraOff className="w-10 h-10 opacity-80" />
                        <span className="text-sm font-medium text-center px-4">
                          {!camOn ? 'Camera off' : !localStream ? (cameraError || 'Camera permission required') : 'Camera loading…'}
                        </span>
                        <button
                          onClick={async () => {
                            if (localStreamRef.current) {
                              localStreamRef.current.getTracks().forEach((t) => t.stop());
                              localStreamRef.current = null;
                            }
                            setLocalStream(null);
                            setCameraReady(false);
                            await initCameraStream();
                          }}
                          className="mt-2 inline-flex items-center gap-2 rounded-md border border-white/40 px-3 py-1 text-xs font-semibold"
                        >
                          Retry camera
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold">
                      {p.name.charAt(0)}
                    </div>
                  </div>
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                  <div
                    className={`w-24 h-24 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-lg font-semibold tracking-wide ${
                      speaking ? 'animate-pulse' : ''
                    }`}
                  >
                    {p.name.split(' ')[0]}
                  </div>
                </div>
              )}
              {/* Name label */}
              <div className="absolute top-2 left-2 bg-black/55 text-white text-xs px-2 py-1 rounded">
                {p.name}
              </div>
              {/* Live transcript */}
              <div className="absolute bottom-0 w-full bg-black/65 text-white/90 p-3 text-xs min-h-[52px]">
                {transcript ? (
                  <div className="flex items-start gap-2">
                    <Volume2 className="w-4 h-4 mt-0.5 opacity-80" />
                    <p className="whitespace-pre-wrap">{transcript}</p>
                  </div>
                ) : (
                  <span className="opacity-60">Waiting for speech...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom controls */}
      <div className="sticky bottom-0">
        <div className="flex flex-wrap items-center justify-center gap-3 bg-white rounded-xl p-3 border shadow">
          <button
            onClick={() => {
              if (!micOn) {
                toast.error('Turn the mic on to speak.');
                return;
              }
              if (isListening) stop();
              else start();
            }}
            disabled={!micOn}
            className={`px-4 py-2 rounded-md text-white font-semibold transition ${
              isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
          >
            {isListening ? <span className="inline-flex items-center gap-2"><MicOff className="w-4 h-4" /> Stop Speaking</span> : <span className="inline-flex items-center gap-2"><Mic className="w-4 h-4" /> Start Speaking</span>}
          </button>
          <button
            onClick={() => setMicOn((v) => !v)}
            aria-pressed={!micOn}
            className={`px-4 py-2 rounded-md font-semibold transition ${micOn ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-red-600 text-white hover:bg-red-700'}`}
          >
            {micOn ? <span className="inline-flex items-center gap-2"><Mic className="w-4 h-4" /> Mic on</span> : <span className="inline-flex items-center gap-2"><MicOff className="w-4 h-4" /> Mic off</span>}
          </button>
          <button
            onClick={() => setCamOn((v) => !v)}
            aria-pressed={!camOn}
            className={`px-4 py-2 rounded-md font-semibold transition ${camOn ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-gray-800 text-white hover:bg-gray-900'}`}
          >
            {camOn ? <span className="inline-flex items-center gap-2"><Camera className="w-4 h-4" /> Camera on</span> : <span className="inline-flex items-center gap-2"><CameraOff className="w-4 h-4" /> Camera off</span>}
          </button>
          <button
            disabled={evaluating}
            onClick={leaveAndEvaluate}
            className="ml-0 sm:ml-4 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <PhoneOff className="w-4 h-4" />
            {evaluating ? 'Ending...' : 'Leave Discussion'}
          </button>
        </div>
      </div>
    </div>
  );
}

