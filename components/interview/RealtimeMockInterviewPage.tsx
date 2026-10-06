'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type LocalTrackPublication,
  type RemoteTrack,
} from 'livekit-client';
import {
  ArrowRight,
  Bot,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mic,
  MicOff,
  Radio,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  UserRound,
  Video,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { config } from '@/lib/config';
import type {
  MockInterviewRealtimeConnectionResponse,
  MockInterviewRealtimeEndResponse,
  MockInterviewStreamEvent,
} from '@/types/mockInterview';

type PagePhase = 'setup' | 'connecting' | 'active' | 'completed';
type RoomStatus = 'connecting' | 'connected' | 'reconnecting' | 'completed';
type Speaker = 'ai' | 'student';

type TranscriptMessage = {
  id: string;
  speaker: Speaker;
  text: string;
  time: string;
};

const TOPIC_SUGGESTIONS = [
  'Frontend system design',
  'Java backend development',
  'Data analyst interview',
  'Product manager case study',
];

function getErrorMessage(error: unknown, fallback: string): string {
  const candidate = error as { response?: { data?: { detail?: unknown } }; message?: unknown };
  const detail = candidate?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (typeof candidate?.message === 'string' && candidate.message.trim()) return candidate.message;
  return fallback;
}

function formatClock(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const remainder = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function formatMessageTime(): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

function buildWebSocketUrl(path: string, token: string, sequence: number): string {
  const baseUrl = config.api.fullUrl || window.location.origin;
  const url = new URL(path, baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('token', token);
  url.searchParams.set('last_sequence', String(sequence));
  return url.toString();
}

function eventText(event: MockInterviewStreamEvent): string {
  return (event.text || event.text_delta || '').trim();
}

function isRoomConnectionStatus(value: unknown): value is RoomStatus {
  return value === 'connecting' || value === 'connected' || value === 'reconnecting' || value === 'completed';
}

function SetupScreen({
  topic,
  setTopic,
  onStart,
  busy,
  error,
}: {
  topic: string;
  setTopic: (value: string) => void;
  onStart: (event: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  error: string | null;
}) {
  return (
    <DashboardLayout requiredUserType="student">
      <div className="min-h-[calc(100vh-5rem)] bg-[#f5f8fc] px-4 py-8 dark:bg-[#0b1424] sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#285bd7] shadow-sm dark:border-blue-900/60 dark:bg-[#111d31] dark:text-blue-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Realtime practice room
            </div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-[#13264b] dark:text-white sm:text-5xl">
              AI Mock Interview
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Practice a real conversation around the role or topic you want to master.
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 border-y border-slate-200 py-5 text-sm dark:border-slate-700">
              <div>
                <p className="font-semibold text-[#13264b] dark:text-white">Live voice</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Natural turn-taking</p>
              </div>
              <div>
                <p className="font-semibold text-[#13264b] dark:text-white">Live subtitles</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">See every turn</p>
              </div>
              <div>
                <p className="font-semibold text-[#13264b] dark:text-white">English India</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Default language</p>
              </div>
            </div>

            <div className="mt-9 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex -space-x-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#f5f8fc] bg-[#285bd7] text-white dark:border-[#0b1424]">
                  <Bot className="h-4 w-4" />
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#f5f8fc] bg-emerald-500 text-white dark:border-[#0b1424]">
                  <UserRound className="h-4 w-4" />
                </span>
              </div>
              <span>One question at a time, with room to think.</span>
            </div>
          </section>

          <section className="rounded-[10px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(24,55,105,0.08)] dark:border-slate-700 dark:bg-[#111d31] sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#285bd7]">Start session</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#13264b] dark:text-white">What are you practising?</h2>
              </div>
              <div className="rounded-lg bg-blue-50 p-2.5 text-[#285bd7] dark:bg-blue-950/40 dark:text-blue-300">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <form onSubmit={onStart}>
              <label htmlFor="practice-topic" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Job, role, or topic
              </label>
              <textarea
                id="practice-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. React performance, financial analyst, or product sense"
                maxLength={500}
                rows={4}
                className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-[#13264b] outline-none transition placeholder:text-slate-400 focus:border-[#285bd7] focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-[#0c1729] dark:text-white dark:focus:ring-blue-950"
              />
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>Questions adapt to this focus.</span>
                <span>{topic.length}/500</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {TOPIC_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setTopic(suggestion)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-[#285bd7] dark:border-slate-600 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:text-blue-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mt-5 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={busy || topic.trim().length < 2}
                className="mt-7 h-12 w-full justify-center gap-2 rounded-lg bg-[#285bd7] text-base shadow-lg shadow-blue-200 hover:bg-[#204bb5] dark:shadow-none"
              >
                {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                {busy ? 'Preparing room...' : 'Start interview'}
              </Button>
            </form>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

export function RealtimeMockInterviewPage() {
  const [phase, setPhase] = useState<PagePhase>('setup');
  const [topic, setTopic] = useState('');
  const [connection, setConnection] = useState<MockInterviewRealtimeConnectionResponse | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('connecting');
  const [subtitleStatus, setSubtitleStatus] = useState<'connected' | 'reconnecting'>('connected');
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [aiDraft, setAiDraft] = useState('');
  const [studentDraft, setStudentDraft] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioState, setAudioState] = useState<string>('ended');
  const [isEnding, setIsEnding] = useState(false);
  const [report, setReport] = useState<MockInterviewRealtimeEndResponse['report']>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [agentState, setAgentState] = useState<string | null>(null);
  const [agentJoined, setAgentJoined] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const aiVideoRef = useRef<HTMLVideoElement | null>(null);
  const aiAudioRef = useRef<HTMLAudioElement | null>(null);
  const conversationScrollRef = useRef<HTMLDivElement | null>(null);
  const sequenceRef = useRef(0);
  const endingRef = useRef(false);
  const socketRetryRef = useRef<number | null>(null);
  const agentWatchRef = useRef<number | null>(null);
  const sessionErrorSeenRef = useRef(false);
  const eventStreamTokenRef = useRef<string | null>(null);
  const eventStreamUrlRef = useRef<string | null>(null);
  const mediaReconnectInFlightRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  const showRoom = phase === 'connecting' || phase === 'active';
  const timeoutSeconds = connection?.initial_state.session_timeout_seconds ?? 20 * 60;
  const remainingSeconds = Math.max(0, timeoutSeconds - elapsedSeconds);

  const appendMessage = useCallback((speaker: Speaker, text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    setMessages((current) => [
      ...current,
      { id: `${speaker}-${Date.now()}-${Math.random()}`, speaker, text: cleaned, time: formatMessageTime() },
    ]);
  }, []);

  const attachLocalPublication = useCallback((publication: LocalTrackPublication) => {
    if (publication.source !== Track.Source.Camera || !publication.track || !localVideoRef.current) return;
    publication.track.attach(localVideoRef.current);
    localVideoRef.current.play().catch(() => undefined);
  }, []);

  const attachRemoteTrack = useCallback((track: RemoteTrack) => {
    if (track.kind === Track.Kind.Video && aiVideoRef.current) {
      track.attach(aiVideoRef.current);
      aiVideoRef.current.play().catch(() => undefined);
    }
    if (track.kind === Track.Kind.Audio && aiAudioRef.current) {
      track.attach(aiAudioRef.current);
      aiAudioRef.current.play().catch(() => undefined);
    }
  }, []);

  const connectRoom = useCallback(async (nextConnection: MockInterviewRealtimeConnectionResponse) => {
    if (!nextConnection.livekit_url || !nextConnection.livekit_token) {
      throw new Error('The realtime voice provider is not configured yet.');
    }

    const markAgentJoined = () => {
      setAgentJoined(true);
      setProviderError((current) =>
        current && current.includes('AI interviewer did not join') ? null : current,
      );
      if (agentWatchRef.current) {
        window.clearTimeout(agentWatchRef.current);
        agentWatchRef.current = null;
      }
    };

    const recoverLiveKitMedia = async () => {
      const activeSessionId = sessionIdRef.current;
      if (endingRef.current || mediaReconnectInFlightRef.current || !activeSessionId) return;
      mediaReconnectInFlightRef.current = true;
      setRoomStatus('reconnecting');
      try {
        const refreshed = await apiClient.reconnectRealtimeMockInterview(
          activeSessionId,
          sequenceRef.current,
          { redispatchAgent: true },
        );
        eventStreamTokenRef.current = refreshed.event_stream_token;
        eventStreamUrlRef.current = refreshed.event_stream_url;
        setConnection(refreshed);
        const room = roomRef.current;
        if (room && refreshed.livekit_url && refreshed.livekit_token) {
          if (room.state !== ConnectionState.Disconnected) {
            await room.disconnect();
          }
          await room.connect(refreshed.livekit_url, refreshed.livekit_token, { autoSubscribe: true });
          setRoomStatus('connected');
        }
      } catch (error) {
        setProviderError(getErrorMessage(error, 'Could not recover the LiveKit media connection.'));
      } finally {
        mediaReconnectInFlightRef.current = false;
      }
    };

    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;
    room.on(RoomEvent.Connected, () => setRoomStatus('connected'));
    room.on(RoomEvent.Reconnecting, () => setRoomStatus('reconnecting'));
    room.on(RoomEvent.SignalReconnecting, () => setRoomStatus('reconnecting'));
    room.on(RoomEvent.Reconnected, () => setRoomStatus('connected'));
    room.on(RoomEvent.ConnectionStateChanged, (state) => {
      if (state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting) {
        setRoomStatus('reconnecting');
      } else if (state === ConnectionState.Connected) {
        setRoomStatus('connected');
      }
    });
    room.on(RoomEvent.ParticipantConnected, () => {
      markAgentJoined();
    });
    room.on(RoomEvent.TrackSubscribed, (track) => {
      attachRemoteTrack(track);
      if (track.kind === Track.Kind.Audio || track.kind === Track.Kind.Video) {
        markAgentJoined();
      }
    });
    room.on(RoomEvent.LocalTrackPublished, attachLocalPublication);
    room.on(RoomEvent.Disconnected, () => {
      if (endingRef.current || mediaReconnectInFlightRef.current) return;
      setRoomStatus('reconnecting');
      void recoverLiveKitMedia();
    });

    await room.connect(nextConnection.livekit_url, nextConnection.livekit_token, {
      autoSubscribe: true,
    });
    setPhase('active');
    setRoomStatus('connected');

    if (room.remoteParticipants.size > 0) {
      markAgentJoined();
    } else {
      agentWatchRef.current = window.setTimeout(() => {
        const current = roomRef.current;
        if (!current || endingRef.current) return;
        if (current.remoteParticipants.size > 0) {
          markAgentJoined();
          return;
        }
        // Prefer a real session.error from the worker over this generic timeout.
        if (sessionErrorSeenRef.current) return;
        setProviderError((currentError) => {
          if (currentError && !currentError.includes('AI interviewer did not join')) {
            return currentError;
          }
          return 'AI interviewer did not join — ensure the agent worker is running (`python -m app.workers.mock_interview_agent start`).';
        });
      }, 20000);
    }

    try {
      await room.localParticipant.setCameraEnabled(true);
      setCameraEnabled(true);
    } catch {
      setCameraEnabled(false);
      setPermissionError('Camera permission is unavailable. You can continue with audio only or enable the camera from your browser settings.');
    }

    try {
      await room.localParticipant.setMicrophoneEnabled(true);
      setMicEnabled(true);
    } catch {
      setMicEnabled(false);
      setPermissionError((current) => current || 'Microphone permission is unavailable. Allow microphone access to speak with the interviewer.');
    }
  }, [attachLocalPublication, attachRemoteTrack]);

  const handleStreamEvent = useCallback((event: MockInterviewStreamEvent) => {
    if (event.sequence > 0) sequenceRef.current = Math.max(sequenceRef.current, event.sequence);
    const text = eventText(event);
    const data = event.data || {};

    if (event.type === 'ai.transcript.delta') {
      setAgentJoined(true);
      setAiDraft((current) => (data.replace === true ? text : `${current}${text}`));
      return;
    }
    if (event.type === 'student.transcript.delta') {
      setStudentDraft((current) => (data.replace === false ? `${current}${text}` : text));
      return;
    }
    if (event.type === 'ai.transcript.final') {
      setAgentJoined(true);
      setAiDraft('');
      appendMessage('ai', text);
      setIsAnalyzing(false);
      return;
    }
    if (event.type === 'student.transcript.final') {
      setStudentDraft('');
      appendMessage('student', text);
      return;
    }
    if (event.type === 'turn.analyzing') {
      setIsAnalyzing(true);
      return;
    }
    if (event.type === 'ai.audio.state') {
      const nextAudioState = data.state;
      if (typeof nextAudioState === 'string') setAudioState(nextAudioState);
      return;
    }
    if (event.type === 'session.state') {
      const nextStatus = data.realtime_status ?? data.status;
      // Agent RECONNECTING is media/session status — do not latch the subtitle banner.
      if (nextStatus === 'IN_PROGRESS') {
        setSubtitleStatus('connected');
        setAgentJoined(true);
        setProviderError((current) =>
          current && current.includes('AI interviewer did not join') ? null : current,
        );
      }
      if (nextStatus === 'COMPLETED') setRoomStatus('completed');
      const nextAgentState = data.agent_state;
      if (typeof nextAgentState === 'string') {
        setAgentState(nextAgentState);
        setAgentJoined(true);
        if (nextAgentState === 'speaking') setAudioState('playing');
        if (nextAgentState === 'listening' || nextAgentState === 'thinking') {
          setAudioState((current) => (current === 'playing' ? 'ended' : current));
        }
        if (nextAgentState === 'thinking') setIsAnalyzing(true);
        if (nextAgentState === 'speaking' || nextAgentState === 'listening') setIsAnalyzing(false);
      }
      return;
    }
    if (event.type === 'session.error') {
      sessionErrorSeenRef.current = true;
      if (agentWatchRef.current) {
        window.clearTimeout(agentWatchRef.current);
        agentWatchRef.current = null;
      }
      const message = data.message;
      setProviderError(
        typeof message === 'string' && message.trim()
          ? message
          : 'The realtime interviewer encountered a provider error.',
      );
      return;
    }
    if (event.type === 'session.completed') {
      setRoomStatus('completed');
    }
  }, [appendMessage]);

  useEffect(() => {
    if (!connection || !sessionId || !showRoom) return;
    eventStreamTokenRef.current = connection.event_stream_token;
    eventStreamUrlRef.current = connection.event_stream_url;
  }, [connection, sessionId, showRoom]);

  useEffect(() => {
    if (!sessionId || !showRoom) return;
    const streamUrl = eventStreamUrlRef.current || connection?.event_stream_url;
    const streamToken = eventStreamTokenRef.current || connection?.event_stream_token;
    if (!streamUrl || !streamToken) return;

    let cancelled = false;
    let pingTimer: number | null = null;

    const clearPing = () => {
      if (pingTimer != null) {
        window.clearInterval(pingTimer);
        pingTimer = null;
      }
    };

    const openSocket = (urlPath: string, token: string) => {
      clearPing();
      const url = buildWebSocketUrl(urlPath, token, sequenceRef.current);
      const socket = new WebSocket(url);
      socketRef.current = socket;
      socket.onopen = () => {
        if (cancelled) return;
        setSubtitleStatus('connected');
        setProviderError((current) =>
          current && current.includes('Could not recover the subtitle connection') ? null : current,
        );
        pingTimer = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, 15000);
      };
      socket.onmessage = (message) => {
        try {
          const payload = JSON.parse(message.data) as MockInterviewStreamEvent & { type?: string };
          if (payload?.type === 'pong') return;
          handleStreamEvent(payload as MockInterviewStreamEvent);
        } catch {
          setProviderError('The subtitle stream returned an unreadable event.');
        }
      };
      socket.onerror = () => {
        if (!cancelled) setSubtitleStatus('reconnecting');
      };
      socket.onclose = () => {
        clearPing();
        if (cancelled || endingRef.current) return;
        setSubtitleStatus('reconnecting');
        if (socketRetryRef.current) window.clearTimeout(socketRetryRef.current);
        socketRetryRef.current = window.setTimeout(async () => {
          try {
            const refreshed = await apiClient.refreshRealtimeMockInterviewToken(
              sessionId,
              sequenceRef.current,
            );
            if (cancelled || endingRef.current) return;
            eventStreamTokenRef.current = refreshed.event_stream_token;
            eventStreamUrlRef.current = refreshed.event_stream_url;
            // Refresh tokens without replacing the whole connection object (avoids WS effect churn).
            setConnection((current) =>
              current
                ? {
                    ...current,
                    event_stream_token: refreshed.event_stream_token,
                    event_stream_url: refreshed.event_stream_url,
                    livekit_token: refreshed.livekit_token,
                  }
                : refreshed,
            );
            openSocket(refreshed.event_stream_url, refreshed.event_stream_token);
          } catch (error) {
            if (!cancelled) {
              setProviderError(getErrorMessage(error, 'Could not recover the subtitle connection.'));
            }
          }
        }, 1800);
      };
    };

    openSocket(streamUrl, streamToken);
    return () => {
      cancelled = true;
      clearPing();
      if (socketRetryRef.current) window.clearTimeout(socketRetryRef.current);
      socketRetryRef.current = null;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
    // Intentionally omit `connection` and `phase` to avoid teardown on token refresh / connecting→active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleStreamEvent, sessionId, showRoom]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room || !showRoom) return;
    const localPublication = room.localParticipant.getTrackPublication(Track.Source.Camera);
    if (localPublication) attachLocalPublication(localPublication);
    room.remoteParticipants.forEach((participant) => {
      participant.getTrackPublications().forEach((publication) => {
        if (publication.track) attachRemoteTrack(publication.track as RemoteTrack);
      });
    });
  }, [attachLocalPublication, attachRemoteTrack, showRoom]);

  useEffect(() => {
    if (!showRoom || sessionStartedAt == null) return;
    const tick = () => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartedAt) / 1000));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [sessionStartedAt, showRoom]);

  useEffect(() => {
    const node = conversationScrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, aiDraft, studentDraft]);

  useEffect(() => {
    return () => {
      endingRef.current = true;
      if (agentWatchRef.current) window.clearTimeout(agentWatchRef.current);
      socketRef.current?.close();
      roomRef.current?.disconnect();
    };
  }, []);

  const toggleMic = async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(!micEnabled);
      setMicEnabled((current) => !current);
      setPermissionError(null);
    } catch {
      setPermissionError('Microphone access is blocked. Check your browser permissions and try again.');
    }
  };

  const toggleCamera = async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.localParticipant.setCameraEnabled(!cameraEnabled);
      setCameraEnabled((current) => !current);
      setPermissionError(null);
    } catch {
      setPermissionError('Camera access is blocked. Check your browser permissions and try again.');
    }
  };

  const startInterview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTopic = topic.trim();
    if (trimmedTopic.length < 2) return;
    endingRef.current = false;
    sessionErrorSeenRef.current = false;
    setProviderError(null);
    setPermissionError(null);
    setAgentJoined(false);
    setAgentState(null);
    setAudioState('ended');
    setPhase('connecting');
    setRoomStatus('connecting');
    setSubtitleStatus('connected');
    setMessages([]);
    setAiDraft('');
    setStudentDraft('');
    setElapsedSeconds(0);
    setSessionStartedAt(null);
    if (agentWatchRef.current) {
      window.clearTimeout(agentWatchRef.current);
      agentWatchRef.current = null;
    }
    try {
      const nextConnection = await apiClient.startRealtimeMockInterview({
        focus_prompt: trimmedTopic,
      });
      sessionIdRef.current = nextConnection.session_id;
      eventStreamTokenRef.current = nextConnection.event_stream_token;
      eventStreamUrlRef.current = nextConnection.event_stream_url;
      setConnection(nextConnection);
      setSessionId(nextConnection.session_id);
      setSessionStartedAt(Date.now());
      await connectRoom(nextConnection);
    } catch (error) {
      setProviderError(getErrorMessage(error, 'Could not start the realtime interview.'));
      setPhase('setup');
      setRoomStatus('connecting');
      setSessionStartedAt(null);
      sessionIdRef.current = null;
      roomRef.current?.disconnect();
      roomRef.current = null;
    }
  };

  const endInterview = async () => {
    if (!sessionId || isEnding) return;
    endingRef.current = true;
    setIsEnding(true);
    try {
      const result = await apiClient.endRealtimeMockInterview(sessionId);
      setReport(result.report ?? null);
      setRoomStatus('completed');
      setPhase('completed');
      socketRef.current?.close();
      await roomRef.current?.disconnect();
    } catch (error) {
      endingRef.current = false;
      setProviderError(getErrorMessage(error, 'Could not end the interview cleanly.'));
    } finally {
      setIsEnding(false);
    }
  };

  const reset = () => {
    endingRef.current = true;
    if (agentWatchRef.current) {
      window.clearTimeout(agentWatchRef.current);
      agentWatchRef.current = null;
    }
    socketRef.current?.close();
    roomRef.current?.disconnect();
    roomRef.current = null;
    setConnection(null);
    setSessionId(null);
    sessionIdRef.current = null;
    eventStreamTokenRef.current = null;
    eventStreamUrlRef.current = null;
    setReport(null);
    setProviderError(null);
    setPermissionError(null);
    setMessages([]);
    setAiDraft('');
    setStudentDraft('');
    setPhase('setup');
    setRoomStatus('connecting');
    setSubtitleStatus('connected');
    setMicEnabled(false);
    setCameraEnabled(false);
    setElapsedSeconds(0);
    setSessionStartedAt(null);
    setAgentJoined(false);
    setAgentState(null);
    setAudioState('ended');
    sessionErrorSeenRef.current = false;
    endingRef.current = false;
  };

  const statusLabel = useMemo(() => {
    if (roomStatus === 'reconnecting') return 'Reconnecting media';
    if (subtitleStatus === 'reconnecting') return 'Reconnecting subtitles';
    if (roomStatus === 'connecting') return 'Connecting';
    if (roomStatus === 'completed') return 'Completed';
    return 'Interview in progress';
  }, [roomStatus, subtitleStatus]);

  const showReconnectBanner = roomStatus === 'reconnecting' || subtitleStatus === 'reconnecting';
  const reconnectBannerLabel =
    roomStatus === 'reconnecting'
      ? 'Reconnecting your media session...'
      : 'Reconnecting subtitle stream...';

  const interviewerStatusLabel = useMemo(() => {
    if (audioState === 'playing' || agentState === 'speaking') return 'Speaking';
    if (isAnalyzing || agentState === 'thinking') return 'Thinking';
    if (!agentJoined && roomStatus !== 'completed') return 'Joining';
    return 'Listening';
  }, [agentJoined, agentState, audioState, isAnalyzing, roomStatus]);

  const footerStatusLabel = useMemo(() => {
    if (isAnalyzing || agentState === 'thinking') return 'Analyzing your answer...';
    if (audioState === 'playing' || agentState === 'speaking') return 'AI is speaking...';
    if (!agentJoined) return 'Waiting for the AI interviewer to join...';
    return 'Speak naturally when you are ready.';
  }, [agentJoined, agentState, audioState, isAnalyzing]);

  if (phase === 'setup') {
    return (
      <SetupScreen
        topic={topic}
        setTopic={setTopic}
        onStart={startInterview}
        busy={false}
        error={providerError}
      />
    );
  }

  if (phase === 'completed') {
    return (
      <DashboardLayout requiredUserType="student">
        <div className="min-h-[calc(100vh-5rem)] bg-[#f5f8fc] px-4 py-12 dark:bg-[#0b1424] sm:px-6">
          <section className="mx-auto max-w-2xl rounded-[10px] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_70px_rgba(24,55,105,0.08)] dark:border-slate-700 dark:bg-[#111d31]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Session complete</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#13264b] dark:text-white">Nice work.</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Your transcript and evaluation are saved to your interview history.</p>
            {report?.overall_score != null && (
              <p className="mt-7 text-5xl font-semibold text-[#285bd7]">{Math.round(report.overall_score)}%</p>
            )}
            {report?.summary && <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">{report.summary}</p>}
            <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
              {[
                { title: 'Strengths', items: report?.strengths || [], tone: 'text-emerald-700 dark:text-emerald-300' },
                { title: 'Weaknesses', items: report?.weaknesses || [], tone: 'text-rose-700 dark:text-rose-300' },
                {
                  title: 'Improvement areas',
                  items: report?.improvement_areas || report?.improvement_tips || [],
                  tone: 'text-[#285bd7] dark:text-blue-300',
                },
              ].map((section) => (
                <div key={section.title} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <h2 className={`text-sm font-semibold ${section.tone}`}>{section.title}</h2>
                  {section.items.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {section.items.slice(0, 5).map((item) => <li key={item}>- {item}</li>)}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-slate-400">No items recorded.</p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={reset} className="gap-2 rounded-lg bg-[#285bd7] hover:bg-[#204bb5]"><RotateCcw className="h-4 w-4" />Practice again</Button>
              <Button variant="outline" onClick={() => { window.location.href = '/dashboard/student'; }} className="rounded-lg">Back to dashboard</Button>
            </div>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredUserType="student" hideNavigation lockViewport>
      <div className="flex h-full min-h-[100dvh] flex-col bg-[#f5f8fc] text-[#13264b] dark:bg-[#0b1424] dark:text-white">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-[#111d31] sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#285bd7] text-white shadow-lg shadow-blue-200 dark:shadow-none"><Bot className="h-6 w-6" /></div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold sm:text-2xl">AI Mock Interview</h1>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Practice · Improve · Get hired</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold sm:flex ${showReconnectBanner ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'}`}>
              {showReconnectBanner ? <WifiOff className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
              {statusLabel}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-[#285bd7] dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
              <Clock3 className="h-4 w-4" />{formatClock(remainingSeconds)}
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-5 lg:p-6">
          <div className="mx-auto grid h-full min-h-0 w-full max-w-[1500px] gap-5 lg:grid-cols-[minmax(360px,0.92fr)_minmax(520px,1.08fr)] lg:overflow-hidden">
            <section className="min-h-0 space-y-4 overflow-y-auto lg:pr-1">
              <div className="relative aspect-video overflow-hidden rounded-[10px] bg-[#13264b] shadow-[0_16px_40px_rgba(19,38,75,0.18)]">
                <video ref={aiVideoRef} autoPlay playsInline className="relative z-10 h-full w-full object-cover" />
                <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#13264b]">
                  <div className="flex flex-col items-center gap-4 text-white/90">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-blue-200/30 bg-[#285bd7] shadow-2xl shadow-blue-900/30"><Bot className="h-12 w-12" /></div>
                    <div className="flex items-center gap-2 text-sm font-medium"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />AI interviewer</div>
                  </div>
                </div>
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#13264b]/85 px-3 py-2 text-xs font-semibold text-white backdrop-blur"><Bot className="h-4 w-4" /> AI Interviewer</div>
                <div className="absolute bottom-4 right-4 rounded-full bg-black/35 px-3 py-1.5 text-xs text-white">{interviewerStatusLabel}</div>
              </div>

              <div className="relative aspect-video overflow-hidden rounded-[10px] bg-slate-900 shadow-[0_16px_40px_rgba(19,38,75,0.14)]">
                <video ref={localVideoRef} autoPlay muted playsInline className={`h-full w-full object-cover ${cameraEnabled ? '' : 'hidden'}`} />
                {!cameraEnabled && <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-300"><CameraOff className="h-10 w-10" /><span className="text-sm">Camera off</span></div>}
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur"><UserRound className="h-4 w-4" /> You</div>
                {!micEnabled && <div className="absolute bottom-4 right-4 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white">Muted</div>}
              </div>

              <div className="flex items-center justify-center gap-3 rounded-[10px] border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#111d31] sm:gap-5">
                <button type="button" onClick={() => void toggleMic()} title={micEnabled ? 'Mute microphone' : 'Unmute microphone'} aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'} className={`flex h-14 w-14 items-center justify-center rounded-full transition ${micEnabled ? 'bg-[#7184a8] text-white hover:bg-[#5e7197]' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                  {micEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </button>
                <button type="button" onClick={() => void endInterview()} title="End interview" aria-label="End interview" disabled={isEnding} className="flex h-14 items-center gap-2 rounded-full bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60">
                  {isEnding ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}<span className="hidden sm:inline">End interview</span>
                </button>
                <button type="button" onClick={() => void toggleCamera()} title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'} aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'} className={`flex h-14 w-14 items-center justify-center rounded-full transition ${cameraEnabled ? 'bg-[#7184a8] text-white hover:bg-[#5e7197]' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                  {cameraEnabled ? <Video className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
                </button>
              </div>
            </section>

            <section className="flex max-h-[min(70dvh,720px)] min-h-[320px] flex-col overflow-hidden rounded-[10px] border border-blue-100 bg-white shadow-[0_16px_50px_rgba(24,55,105,0.08)] dark:border-slate-700 dark:bg-[#111d31] lg:max-h-none lg:h-full lg:min-h-0">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700 sm:px-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#285bd7]">Live subtitles</p>
                  <h2 className="mt-1 text-lg font-semibold">Conversation</h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><Wifi className="h-4 w-4 text-emerald-500" />{subtitleStatus === 'reconnecting' ? 'Recovering subtitles' : 'Streaming'}</div>
              </div>

              {permissionError && (
                <div className="mx-5 mt-4 flex shrink-0 gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 sm:mx-7"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{permissionError}</span></div>
              )}
              {providerError && (
                <div className="mx-5 mt-4 flex shrink-0 gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 sm:mx-7"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{providerError}</span></div>
              )}
              {showReconnectBanner && (
                <div className="mx-5 mt-4 flex shrink-0 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 sm:mx-7"><LoaderCircle className="h-4 w-4 animate-spin" /> {reconnectBannerLabel}</div>
              )}

              <div ref={conversationScrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
                {messages.length === 0 && !aiDraft && !studentDraft && (
                  <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center text-slate-400"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#285bd7] dark:bg-blue-950/40 dark:text-blue-300"><Sparkles className="h-6 w-6" /></div><p className="mt-4 text-sm font-medium">The interviewer is joining the room.</p><p className="mt-1 text-xs">Your subtitles will appear here in real time.</p></div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.speaker === 'student' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${message.speaker === 'ai' ? 'bg-[#285bd7]' : 'bg-emerald-500'}`}>{message.speaker === 'ai' ? <Bot className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}</div>
                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${message.speaker === 'ai' ? 'rounded-tl-sm bg-blue-50 text-[#163a80] dark:bg-blue-950/35 dark:text-blue-100' : 'rounded-tr-sm bg-emerald-50 text-[#106547] dark:bg-emerald-950/30 dark:text-emerald-100'}`}>
                      <div className="flex items-center justify-between gap-5 text-xs font-semibold"><span>{message.speaker === 'ai' ? 'AI Interviewer' : 'You'}</span><span className="font-normal opacity-60">{message.time}</span></div>
                      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7">{message.text}</p>
                    </div>
                  </div>
                ))}
                {aiDraft && <div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#285bd7] text-white"><Bot className="h-5 w-5" /></div><div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-blue-50 px-4 py-3 text-[#163a80] dark:bg-blue-950/35 dark:text-blue-100"><div className="flex items-center gap-2 text-xs font-semibold"><span>AI Interviewer</span><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#285bd7]" /></div><p className="mt-2 whitespace-pre-wrap text-[15px] leading-7">{aiDraft}</p></div></div>}
                {studentDraft && <div className="flex flex-row-reverse gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><UserRound className="h-5 w-5" /></div><div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-emerald-50 px-4 py-3 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"><div className="text-right text-xs font-semibold">You <span className="ml-2 font-normal opacity-60">Speaking</span></div><p className="mt-2 whitespace-pre-wrap text-[15px] leading-7">{studentDraft}</p></div></div>}
              </div>
              <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:px-7"><span>{footerStatusLabel}</span><span>{topic}</span></div>
            </section>
          </div>
        </main>
        <audio ref={aiAudioRef} autoPlay className="hidden" />
      </div>
    </DashboardLayout>
  );
}
