'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { apiClient } from '@/lib/api';
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
type AgentMsg = { name: string; text: string; style?: string };
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
  const transcriptRef = useRef<HTMLDivElement>(null);
  const holdMicRef = useRef(false);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    return new Promise<void>((resolve) => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }, []);

  const playAgentMessages = useCallback(
    async (agents: AgentMsg[]) => {
      for (const agent of agents) {
        const label = parsePersonaName(agent.name);
        setActiveSpeaker(label);
        if (agent.text) await speak(agent.text);
      }
      setActiveSpeaker(null);
    },
    [speak]
  );

  const hydrateSession = useCallback(
    async (data: any, playOpening: boolean) => {
      setSession(data);
      setOpeningAgents(data.opening_agents || []);
      setTurns(data.turns || []);
      setUserTurnCount(data.user_turn_count || (data.turns || []).length);
      if (playOpening && (data.opening_agents || []).length > 0 && !(data.turns || []).length) {
        await playAgentMessages(data.opening_agents);
      }
    },
    [playAgentMessages]
  );

  useEffect(() => {
    if (!contextId) return;
    const join = driveAttemptId
      ? apiClient.joinPlacementDriveGD(driveAttemptId)
      : apiClient.joinSimulationGD(runId!);
    join
      .then((data) => hydrateSession(data, !data.resumed))
      .catch((e) => alert(e?.response?.data?.error || e?.response?.data?.detail || 'Could not start GD room'))
      .finally(() => setLoading(false));
  }, [contextId, driveAttemptId, runId, hydrateSession]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, openingAgents, answer]);

  const { isListening, start, stop, reset, partial } = useTranscription({
    onFinal: (text) => setAnswer((prev) => (prev ? `${prev} ${text}` : text)),
  });

  useEffect(() => {
    if (partial && isListening) {
      setAnswer((prev) => {
        const base = prev.split('…')[0] || prev;
        return `${base} ${partial}`.trim();
      });
    }
  }, [partial, isListening]);

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

      <div className="rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 overflow-hidden shadow-xl">
        <div className="border-b border-slate-700 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Topic</p>
          <p className="text-lg font-semibold leading-snug">{topic?.title || 'Discussion Topic'}</p>
          {topic?.background && (
            <p className="mt-2 text-sm text-slate-400 line-clamp-2">{topic.background}</p>
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
          className="mx-4 mb-4 max-h-52 overflow-y-auto rounded-lg bg-slate-950/60 p-3 space-y-2 text-sm"
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
            <p className="text-slate-500 text-center py-4">Panelists are joining…</p>
          )}
        </div>

        <div className="border-t border-slate-700 p-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isListening
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
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
      className={`rounded-xl border p-4 flex flex-col items-center text-center transition-all ${
        isHuman
          ? active
            ? 'border-emerald-400 bg-emerald-950/40 ring-2 ring-emerald-500/60'
            : 'border-emerald-700/50 bg-slate-800/80'
          : active
            ? 'border-violet-400 bg-violet-950/40 ring-2 ring-violet-500/60'
            : 'border-slate-700 bg-slate-800/60'
      }`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full text-xs font-bold mb-2 ${
          isHuman ? 'bg-emerald-600 text-white' : 'bg-violet-600 text-white'
        }`}
      >
        {initials}
      </div>
      <p className="font-semibold text-sm">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
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
    <div className={`rounded-lg px-3 py-2 ${isBot ? 'bg-slate-800 ml-2' : 'bg-emerald-900/40'}`}>
      <span className={`font-medium text-xs ${isBot ? 'text-violet-300' : 'text-emerald-300'}`}>
        {name}:{' '}
      </span>
      <span className="text-slate-200">{text}</span>
    </div>
  );
}
