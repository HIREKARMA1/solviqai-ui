'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useTranscription } from '@/hooks/useTranscription';
import { Mic, Square } from 'lucide-react';

type Props = {
  runId?: string;
  driveAttemptId?: string;
  stageNum: number;
  totalStages: number;
  onComplete: (run: any) => void;
};

type Persona = { name: string; style?: string; snippet?: string };
type AgentMsg = { name: string; text: string; style?: string; voice?: string; audio?: string };
type Turn = { user: string; agents: AgentMsg[]; type?: string };

function parsePersonaName(full: string): string {
  const idx = full.indexOf('(');
  return idx > 0 ? full.slice(0, idx).trim() : full;
}

function styleLabel(style?: string): string {
  if (!style) return 'AI';
  return style.replace(/_/g, ' ');
}

export function SimulationGroupDiscussion({
  runId,
  driveAttemptId,
  stageNum,
  totalStages,
  onComplete,
}: Props) {
  const contextId = driveAttemptId || runId;
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [openingAgents, setOpeningAgents] = useState<AgentMsg[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [userTurnCount, setUserTurnCount] = useState(0);
  const [openingAgentsPending, setOpeningAgentsPending] = useState<AgentMsg[] | null>(null);
  const pendingOpeningRef = useRef<AgentMsg[] | null>(null);
  const openingPlaybackIdRef = useRef(0);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const holdMicRef = useRef(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback((text: string, base64Audio?: string) => {
    if (typeof window === 'undefined') return Promise.resolve();

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    return new Promise<void>((resolve) => {
      if (base64Audio) {
        try {
          const audioSrc = `data:audio/wav;base64,${base64Audio}`;
          const audio = new Audio(audioSrc);
          audioRef.current = audio;
          audio.onended = () => resolve();
          audio.onerror = () => {
            console.warn("Failed decoding/playing audio file, falling back to speech synthesis");
            if (window.speechSynthesis) {
              const u = new SpeechSynthesisUtterance(text);
              u.rate = 0.95;
              u.onend = () => resolve();
              u.onerror = () => resolve();
              window.speechSynthesis.speak(u);
            } else {
              resolve();
            }
          };
          audio.play().catch((err) => {
            console.warn("Failed to play Sarvam base64 audio, falling back to synthesis:", err);
            if (window.speechSynthesis) {
              const u = new SpeechSynthesisUtterance(text);
              u.rate = 0.95;
              u.onend = () => resolve();
              u.onerror = () => resolve();
              window.speechSynthesis.speak(u);
            } else {
              resolve();
            }
          });
        } catch (err) {
          console.warn("Error setting up audio, fallback to speech synthesis:", err);
          if (window.speechSynthesis) {
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 0.95;
            u.onend = () => resolve();
            u.onerror = () => resolve();
            window.speechSynthesis.speak(u);
          } else {
            resolve();
          }
        }
      } else {
        if (!window.speechSynthesis) {
          resolve();
          return;
        }
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.95;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      }
    });
  }, []);

  const playAgentMessages = useCallback(
    async (agents: AgentMsg[]) => {
      for (const agent of agents) {
        const label = parsePersonaName(agent.name);
        setActiveSpeaker(label);
        if (agent.text) await speak(agent.text, agent.audio);
      }
      setActiveSpeaker(null);
    },
    [speak]
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const hydrateSession = useCallback((data: any, playOpening: boolean) => {
    setSession(data);
    setOpeningAgents(data.opening_agents || []);
    setTurns(data.turns || []);
    setUserTurnCount(data.user_turn_count || (data.turns || []).length);

    const shouldPlayOpening =
      playOpening &&
      (data.opening_agents || []).length > 0 &&
      !(data.turns || []).length;

    if (shouldPlayOpening) {
      pendingOpeningRef.current = data.opening_agents;
      setOpeningAgentsPending(data.opening_agents);
    } else {
      pendingOpeningRef.current = null;
      setOpeningAgentsPending(null);
    }
  }, []);

  useEffect(() => {
    if (!contextId) return;
    openingPlaybackIdRef.current = 0;
    pendingOpeningRef.current = null;
    const join = driveAttemptId
      ? apiClient.joinPlacementDriveGD(driveAttemptId)
      : apiClient.joinSimulationGD(runId!);
    join
      .then((data) => hydrateSession(data, !data.resumed))
      .catch((e) => alert(e?.response?.data?.error || e?.response?.data?.detail || 'Could not start GD room'))
      .finally(() => setLoading(false));
  }, [contextId, driveAttemptId, runId, hydrateSession]);

  // Show the room UI first, then play opening panelist audio after paint.
  useEffect(() => {
    if (loading) return;

    const agents = pendingOpeningRef.current;
    if (!agents?.length) return;

    const playbackId = ++openingPlaybackIdRef.current;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled || playbackId !== openingPlaybackIdRef.current) return;
        pendingOpeningRef.current = null;
        setOpeningAgentsPending(null);
        void playAgentMessages(agents);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [loading, openingAgentsPending, playAgentMessages]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, openingAgents, answer]);

  const initialTextRef = useRef('');

  const { isListening, start, stop, reset, partial, finalized } = useTranscription({
    onFinal: () => {},
  });

  useEffect(() => {
    if (isListening) {
      initialTextRef.current = answer;
    }
  }, [isListening]);

  useEffect(() => {
    if (isListening) {
      const addedText = (finalized + ' ' + partial).trim();
      setAnswer(() => {
        return initialTextRef.current ? `${initialTextRef.current} ${addedText}`.trim() : addedText;
      });
    }
  }, [finalized, partial, isListening]);

  const handleMicDown = () => {
    holdMicRef.current = true;
    reset();
    start();
    setActiveSpeaker('You');
  };

  const handleMicUp = () => {
    if (!holdMicRef.current) return;
    holdMicRef.current = false;
    stop();
    setActiveSpeaker(null);
  };

  const submitTurn = useCallback(async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    const text = answer.trim();
    setAnswer('');
    reset();
    try {
      const respond = driveAttemptId
        ? apiClient.placementDriveGDResponse(driveAttemptId, {
            text,
            room_id: session?.room_id,
          })
        : apiClient.simulationGDResponse(runId!, {
            text,
            room_id: session?.room_id,
          });
      const res = await respond;
      const agents: AgentMsg[] = res.agents || [];
      setTurns((prev) => [...prev, { user: text, agents }]);
      setUserTurnCount(res.turn_count || userTurnCount + 1);
      setActiveSpeaker('You');
      await playAgentMessages(agents);
    } catch (e: any) {
      setAnswer(text);
      alert(e?.response?.data?.error || e?.response?.data?.detail || 'Could not send response');
    } finally {
      setSubmitting(false);
      setActiveSpeaker(null);
    }
  }, [answer, driveAttemptId, runId, session?.room_id, submitting, reset, playAgentMessages, userTurnCount]);

  const finish = useCallback(async () => {
    if (userTurnCount < 1) {
      alert('Participate in at least one discussion turn before finishing.');
      return;
    }
    setFinishing(true);
    try {
      const evaluate = driveAttemptId
        ? apiClient.evaluatePlacementDriveGD(driveAttemptId)
        : apiClient.evaluateSimulationGD(runId!);
      const updated = await evaluate;
      onComplete(updated);
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.response?.data?.detail || 'Could not evaluate GD');
    } finally {
      setFinishing(false);
    }
  }, [driveAttemptId, runId, userTurnCount, onComplete]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader size="lg" />
      </div>
    );
  }

  const topic = session?.topic;
  const personas: Persona[] = session?.personas || [];
  const panelists = personas.slice(0, 5);

  const isActive = (name: string) => activeSpeaker?.toLowerCase() === name.toLowerCase();

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        Round {stageNum} of {totalStages} — Group Discussion
      </p>
      <h2 className="text-2xl font-bold">Live Discussion Room</h2>

      <div className="rounded-2xl border border-gray-200 bg-white text-gray-900 overflow-hidden shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 dark:text-slate-400">Topic</p>
          <p className="text-lg font-semibold leading-snug text-gray-900 dark:text-slate-100">{topic?.title || 'Discussion Topic'}</p>
          {topic?.background && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2 dark:text-slate-400">{topic.background}</p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
          <ParticipantTile
            label="You"
            sub="Human"
            initials="YOU"
            variant="human"
            active={isActive('You') || isListening}
          />
          {panelists.map((p) => (
            <ParticipantTile
              key={p.name}
              label={p.name}
              sub={`AI · ${styleLabel(p.style)}`}
              initials="AI"
              variant="bot"
              active={isActive(p.name)}
            />
          ))}
        </div>

        <div
          ref={transcriptRef}
          className="mx-4 mb-4 max-h-52 overflow-y-auto rounded-lg bg-gray-50 p-3 space-y-2 text-sm dark:bg-slate-950/60"
        >
          {openingAgents.map((agent, i) => (
            <MessageBubble key={`open-${i}`} speaker={agent.name} text={agent.text} isBot />
          ))}
          {turns.map((turn, i) => (
            <div key={i} className="space-y-2">
              {turn.user && <MessageBubble speaker="You" text={turn.user} />}
              {turn.agents.map((agent, j) => (
                <MessageBubble key={j} speaker={agent.name} text={agent.text} isBot />
              ))}
            </div>
          ))}
          {turns.length === 0 && openingAgents.length === 0 && (
            <p className="text-gray-400 text-center py-4 dark:text-slate-500">Panelists are joining…</p>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 flex flex-col sm:flex-row gap-2 dark:border-slate-700">
          <input
            type="text"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            placeholder="Type your point, or hold mic to speak…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitTurn();
              }
            }}
            disabled={submitting}
          />
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isListening
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
              )}
              onPointerDown={handleMicDown}
              onPointerUp={handleMicUp}
              onPointerLeave={handleMicUp}
              disabled={submitting}
              title="Hold to speak"
            >
              {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isListening ? 'Listening…' : 'Hold mic'}
            </button>
            <Button
              onClick={submitTurn}
              disabled={submitting || !answer.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 h-auto"
            >
              {submitting ? 'Sending…' : 'Speak'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          {userTurnCount < 1
            ? 'Respond to the panel at least once, then finish the discussion.'
            : `${userTurnCount} turn${userTurnCount === 1 ? '' : 's'} — aim for 2–3 for a stronger score.`}
        </p>
        <Button variant="outline" onClick={finish} disabled={finishing || userTurnCount < 1}>
          {finishing ? 'Evaluating…' : 'Finish discussion'}
        </Button>
      </div>
    </div>
  );
}

function ParticipantTile({
  label,
  sub,
  initials,
  variant,
  active,
}: {
  label: string;
  sub: string;
  initials: string;
  variant: 'human' | 'bot';
  active?: boolean;
}) {
  const isHuman = variant === 'human';
  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex flex-col items-center text-center transition-all',
        isHuman
          ? active
            ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/40 dark:border-emerald-400 dark:bg-emerald-950/40 dark:ring-emerald-500/60'
            : 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-700/50 dark:bg-slate-800/80'
          : active
            ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-500/40 dark:border-violet-400 dark:bg-violet-950/40 dark:ring-violet-500/60'
            : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/60',
      )}
    >
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full text-xs font-bold mb-2',
          isHuman ? 'bg-emerald-600 text-white' : 'bg-violet-600 text-white',
        )}
      >
        {initials}
      </div>
      <p className="font-semibold text-sm text-gray-900 dark:text-slate-100">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5 dark:text-slate-400">{sub}</p>
    </div>
  );
}

function MessageBubble({
  speaker,
  text,
  isBot,
}: {
  speaker: string;
  text: string;
  isBot?: boolean;
}) {
  const name = parsePersonaName(speaker);
  return (
    <div
      className={cn(
        'rounded-lg px-3 py-2',
        isBot
          ? 'bg-gray-100 ml-2 dark:bg-slate-800'
          : 'bg-emerald-50 dark:bg-emerald-900/40',
      )}
    >
      <span
        className={cn(
          'font-medium text-xs',
          isBot ? 'text-violet-700 dark:text-violet-300' : 'text-emerald-700 dark:text-emerald-300',
        )}
      >
        {name}:{' '}
      </span>
      <span className="text-gray-800 dark:text-slate-200">{text}</span>
    </div>
  );
}
