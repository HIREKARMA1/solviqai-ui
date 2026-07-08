'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { useTranscription } from '@/hooks/useTranscription';
import { apiClient } from '@/lib/api';
import { Mic, MicOff, Volume2, Send } from 'lucide-react';

type Props = {
  persona: 'technical' | 'hr' | 'culture_fit';
  targetRole: string;
  company?: string;
  jobDescription?: string;
  driveAttemptId?: string;
  driveStageIndex?: number;
  simulationRunId?: string;
  simulationStageIndex?: number;
  maxTurns?: number;
  onSessionReady?: (sessionId: string) => void;
  onComplete: (result: {
    overall_score: number;
    report?: any;
    session_id?: string;
    ai_mode?: string;
    fallback_reason?: string;
  }) => void | Promise<void>;
};

export function MockInterviewRoom({
  persona,
  targetRole,
  company,
  jobDescription,
  driveAttemptId,
  driveStageIndex,
  simulationRunId,
  simulationStageIndex,
  maxTurns: maxTurnsProp,
  onSessionReady,
  onComplete,
}: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [maxTurns, setMaxTurns] = useState(6);
  const [aiMode, setAiMode] = useState<'cohere' | 'fallback'>('cohere');
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [finishedResult, setFinishedResult] = useState<{
    overall_score: number;
    report?: any;
  } | null>(null);
  const completingRef = useRef(false);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }, []);

  const { isListening, start, stop, reset, partial } = useTranscription({
    onFinal: (text) => setAnswer((prev) => (prev ? `${prev} ${text}` : text)),
  });

  useEffect(() => {
    if (partial) {
      setAnswer((prev) => {
        const base = prev.split('…')[0] || prev;
        return `${base} ${partial}`.trim();
      });
    }
  }, [partial]);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.startMockInterview({
          persona,
          target_role: targetRole,
          company,
          job_description: jobDescription,
          audio_consent: consent,
          max_turns: maxTurnsProp,
          drive_attempt_id: driveAttemptId,
          drive_stage_index: driveStageIndex,
          simulation_run_id: simulationRunId,
          simulation_stage_index: simulationStageIndex,
        });
        setSessionId(data.session_id);
        setMessages(data.messages || []);
        setTurnCount(data.turn_count || 0);
        setMaxTurns(data.max_turns || 6);
        if (data.session_id) onSessionReady?.(data.session_id);
        if (data.ai_mode === 'fallback') {
          setAiMode('fallback');
          setFallbackReason(
            data.fallback_reason || 'AI interviewer API unavailable — using demo interview mode.',
          );
        }
        if (data.interviewer_message) speak(data.interviewer_message);
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Could not start interview');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finalizeInterview = async (payload: {
    overall_score: number;
    report?: any;
    session_id?: string;
    ai_mode?: string;
    fallback_reason?: string;
  }) => {
    if (completingRef.current) return;
    completingRef.current = true;
    setFinishedResult({
      overall_score: payload.overall_score,
      report: payload.report,
    });
    try {
      await Promise.resolve(onComplete(payload));
    } catch (e: any) {
      completingRef.current = false;
      setError(
        e?.response?.data?.detail || e?.message || 'Interview finished, but the next step failed',
      );
    }
  };

  const sendAnswer = async () => {
    if (!sessionId || !answer.trim() || submitting || finishedResult) return;
    setSubmitting(true);
    setError(null);
    const text = answer.trim();
    setAnswer('');
    reset();
    try {
      const data = await apiClient.submitMockInterviewTurn(sessionId, text);
      setMessages(data.messages || []);
      setTurnCount(data.turn_count || 0);
      if (data.ai_mode === 'fallback') setAiMode('fallback');
      if (data.status === 'COMPLETED') {
        await finalizeInterview({
          overall_score: data.overall_score || data.report?.overall_score || 0,
          report: data.report,
          session_id: sessionId || undefined,
          ai_mode: data.ai_mode || data.report?.ai_mode,
          fallback_reason: data.fallback_reason || data.report?.fallback_reason,
        });
        return;
      }
      if (data.interviewer_message) speak(data.interviewer_message);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to send answer');
    } finally {
      setSubmitting(false);
    }
  };

  const finishEarly = async () => {
    if (!sessionId || finishedResult) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiClient.completeMockInterview(sessionId, true);
      await finalizeInterview({
        overall_score: data.overall_score || data.report?.overall_score || 0,
        report: data.report,
        session_id: sessionId || undefined,
        ai_mode: data.ai_mode || data.report?.ai_mode,
        fallback_reason: data.fallback_reason || data.report?.fallback_reason,
      });
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not complete interview');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  if (error && !sessionId) {
    return <p className="text-red-600 text-center py-8">{error}</p>;
  }

  if (finishedResult) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50/60 p-6 text-center dark:border-green-900 dark:bg-green-950/20">
        <p className="text-sm font-semibold text-green-700 dark:text-green-300">Interview completed</p>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          {Math.round(finishedResult.overall_score ?? 0)}%
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {finishedResult.report?.summary || 'Saving your placement drive progress…'}
        </p>
        {error && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-red-600">{error}</p>
            <Button
              size="sm"
              onClick={() =>
                void finalizeInterview({
                  overall_score: finishedResult.overall_score,
                  report: finishedResult.report,
                  session_id: sessionId || undefined,
                })
              }
            >
              Retry advance
            </Button>
          </div>
        )}
        {submitting && <p className="mt-3 text-xs text-gray-500">Updating drive…</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{persona === 'technical' ? 'Technical' : 'HR'} Interview</Badge>
        <Badge variant="outline">
          Turn {turnCount}/{maxTurns}
        </Badge>
        {!consent && (
          <label className="flex items-center gap-2 text-sm ml-auto">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            I consent to voice capture (browser STT)
          </label>
        )}
      </div>

      {aiMode === 'fallback' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <strong>Demo mode</strong> — AI interviewer is not active (check Cohere API key). Questions
          are scripted, not adaptive. {fallbackReason}
        </div>
      )}

      <div className="max-h-80 overflow-y-auto space-y-3 rounded-lg border p-4 bg-white dark:bg-gray-900">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'assistant' ? 'text-left' : 'text-right'}>
            <p className="text-xs text-gray-500 mb-1">
              {m.role === 'assistant' ? 'Interviewer' : 'You'}
            </p>
            <p
              className={`inline-block rounded-lg px-3 py-2 text-sm max-w-[90%] ${
                m.role === 'assistant'
                  ? 'bg-indigo-100 dark:bg-indigo-900/40'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {m.content}
            </p>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer or use the microphone..."
        rows={3}
        disabled={submitting}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => (isListening ? stop() : start())}
          disabled={!consent}
        >
          {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
          {isListening ? 'Stop mic' : 'Speak'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const last = [...messages].reverse().find((m) => m.role === 'assistant');
            if (last) speak(last.content);
          }}
        >
          <Volume2 className="h-4 w-4 mr-2" /> Replay question
        </Button>
        <Button onClick={sendAnswer} disabled={submitting || !answer.trim()} className="flex-1">
          <Send className="h-4 w-4 mr-2" /> Submit answer
        </Button>
        <Button variant="secondary" onClick={finishEarly} disabled={submitting}>
          End interview
        </Button>
      </div>
    </div>
  );
}
