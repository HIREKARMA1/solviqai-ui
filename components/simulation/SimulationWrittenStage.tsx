'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';

type Task = {
  id: string;
  task_type?: string;
  prompt?: string;
  context?: string;
  options?: string[];
  sections?: Array<{ id: string; label: string; hint?: string }>;
  min_words?: number;
  max_words?: number;
  rubric?: string[];
};

type Props = {
  runId?: string;
  driveAttemptId?: string;
  stageType: string;
  onComplete: (run: any) => void;
};

const STAGE_LABELS: Record<string, string> = {
  short_answer: 'Short Answer',
  essay: 'Essay',
  prompt_engineering: 'Prompt Engineering',
  case_study: 'Case Study',
  finance: 'Finance Assessment',
};

export function SimulationWrittenStage({ runId, driveAttemptId, stageType, onComplete }: Props) {
  const contextId = driveAttemptId || runId;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sectionAnswers, setSectionAnswers] = useState<Record<string, Record<string, string>>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!contextId) return;
    const start = driveAttemptId
      ? apiClient.startPlacementDriveTextStage(driveAttemptId)
      : apiClient.startSimulationTextStage(runId!);
    start
      .then((data) => {
        setSession(data);
        const initial = (data.answers || {}) as Record<string, string>;
        setAnswers(initial);
        for (const task of data.tasks || []) {
          if (task.task_type === 'case_study' && task.sections?.length) {
            try {
              const parsed = typeof initial[task.id] === 'string' ? JSON.parse(initial[task.id]) : initial[task.id];
              if (parsed && typeof parsed === 'object') {
                setSectionAnswers((prev) => ({ ...prev, [task.id]: parsed }));
              }
            } catch {
              /* ignore */
            }
          }
        }
      })
      .catch((e) => alert(e?.response?.data?.error || e?.response?.data?.detail || 'Could not start round'))
      .finally(() => setLoading(false));
  }, [contextId, driveAttemptId, runId]);

  const buildPayload = useCallback(
    (ans: Record<string, string>, sections: Record<string, Record<string, string>>) => {
      const payload = { ...ans };
      for (const [taskId, sect] of Object.entries(sections)) {
        payload[taskId] = JSON.stringify(sect);
      }
      return payload;
    },
    []
  );

  const scheduleAutosave = useCallback(
    (payload: Record<string, string>) => {
      if (!session?.session_id) return;
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(async () => {
        try {
          const autosave = driveAttemptId
            ? apiClient.autosavePlacementDriveTextStage(driveAttemptId, {
                answers: payload,
                session_id: session.session_id,
              })
            : apiClient.autosaveSimulationTextStage(runId!, {
                answers: payload,
                session_id: session.session_id,
              });
          const res = await autosave;
          setLastSaved(res.last_saved_at || new Date().toISOString());
        } catch {
          /* silent */
        }
      }, 2500);
    },
    [contextId, driveAttemptId, runId, session?.session_id]
  );

  const updateAnswer = (taskId: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [taskId]: value };
      scheduleAutosave(buildPayload(next, sectionAnswers));
      return next;
    });
  };

  const updateSection = (taskId: string, sectionId: string, value: string) => {
    setSectionAnswers((prev) => {
      const taskSections = { ...(prev[taskId] || {}), [sectionId]: value };
      const next = { ...prev, [taskId]: taskSections };
      scheduleAutosave(buildPayload(answers, next));
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!session?.session_id || submitting) return;
    setSubmitting(true);
    try {
      const payload = buildPayload(answers, sectionAnswers);
      const duration = Math.floor((Date.now() - startedAt.current) / 1000);
      const submit = driveAttemptId
        ? apiClient.submitPlacementDriveTextStage(driveAttemptId, {
            answers: payload,
            session_id: session.session_id,
            duration_seconds: duration,
          })
        : apiClient.submitSimulationTextStage(runId!, {
            answers: payload,
            session_id: session.session_id,
            duration_seconds: duration,
          });
      const updated = await submit;
      onComplete(updated);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.response?.data?.detail || 'Submit failed';
      alert(msg === 'Stage session not started' ? `${msg}. Refresh the page to restart this round.` : msg);
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

  const tasks: Task[] = session?.tasks || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline">{STAGE_LABELS[stageType] || stageType}</Badge>
        {lastSaved && <span className="text-xs text-gray-500">Draft saved</span>}
        {session?.resumed && <Badge className="bg-blue-600">Resumed</Badge>}
      </div>

      {tasks.map((task, index) => (
        <div key={task.id} className="rounded-lg border p-4 space-y-3 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500">Question {index + 1}</p>
          <p className="font-medium">{task.prompt}</p>
          {task.context && (
            <p className="text-sm text-gray-600 bg-gray-50 dark:bg-gray-900 p-3 rounded">{task.context}</p>
          )}

          {task.task_type === 'mcq' && task.options ? (
            <div className="space-y-2">
              {task.options.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={task.id}
                    checked={answers[task.id] === opt}
                    onChange={() => updateAnswer(task.id, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : task.task_type === 'numerical' ? (
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
              placeholder="Enter numeric answer"
              value={answers[task.id] || ''}
              onChange={(e) => updateAnswer(task.id, e.target.value)}
            />
          ) : task.task_type === 'case_study' && task.sections?.length ? (
            <div className="space-y-3">
              {(task.sections || []).map((sec) => (
                <div key={sec.id}>
                  <label className="text-sm font-medium">{sec.label}</label>
                  {sec.hint && <p className="text-xs text-gray-500 mb-1">{sec.hint}</p>}
                  <Textarea
                    rows={3}
                    value={sectionAnswers[task.id]?.[sec.id] || ''}
                    onChange={(e) => updateSection(task.id, sec.id, e.target.value)}
                    placeholder={`Your ${sec.label.toLowerCase()}…`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Textarea
              rows={stageType === 'essay' ? 12 : stageType === 'prompt_engineering' ? 8 : 4}
              value={answers[task.id] || ''}
              onChange={(e) => updateAnswer(task.id, e.target.value)}
              placeholder={
                stageType === 'prompt_engineering'
                  ? 'Write your prompt here…'
                  : stageType === 'essay'
                    ? 'Write your essay…'
                    : 'Write 2–5 lines…'
              }
            />
          )}

          {task.rubric?.length ? (
            <p className="text-xs text-gray-500">Evaluated on: {task.rubric.join(', ')}</p>
          ) : null}
        </div>
      ))}

      <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'Evaluating…' : 'Submit round'}
      </Button>
    </div>
  );
}
