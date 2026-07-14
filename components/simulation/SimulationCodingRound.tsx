'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { CodingRound } from '@/components/assessment/CodingRound';
import { apiClient } from '@/lib/api';

type Props = {
  runId?: string;
  driveAttemptId?: string;
  onComplete: (run: any) => void;
};

export function SimulationCodingRound({ runId, driveAttemptId, onComplete }: Props) {
  const contextId = driveAttemptId || runId;
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const editorsRef = useRef<Record<string, { language: string; code: string }>>({});
  const resultsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!contextId) return;
    const start = driveAttemptId
      ? apiClient.startPlacementDriveCodingStage(driveAttemptId)
      : apiClient.startSimulationCodingStage(runId!);
    start
      .then(setPayload)
      .catch((e) => alert(e?.response?.data?.detail || 'Could not start coding round'))
      .finally(() => setLoading(false));
  }, [contextId, driveAttemptId, runId]);

  const roundData = useMemo(() => {
    if (!payload?.questions?.length) return null;
    return {
      questions: payload.questions,
      round_type: 'coding',
    };
  }, [payload]);

  const handleSubmit = useCallback(async () => {
    if (!payload || submitting) return;
    setSubmitting(true);
    try {
      const items = (payload.questions || []).map((q: any) => {
        const editor = editorsRef.current[q.id] || { language: 'python', code: '' };
        return {
          question_id: q.id,
          question_text: q.question_text,
          code: editor.code,
          language: editor.language,
          test_results: resultsRef.current[q.id],
        };
      });
      const complete = driveAttemptId
        ? apiClient.completePlacementDriveCodingStage(driveAttemptId, {
            branch: payload.branch,
            difficulty: payload.difficulty,
            items,
          })
        : apiClient.completeSimulationCodingStage(runId!, {
            branch: payload.branch,
            difficulty: payload.difficulty,
            items,
          });
      const updated = await complete;
      onComplete(updated);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Could not submit coding round');
    } finally {
      setSubmitting(false);
    }
  }, [payload, runId, driveAttemptId, submitting, onComplete]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  if (!roundData) {
    return <p className="text-sm text-gray-600">No coding questions available for this stage.</p>;
  }

  return (
    <div className="space-y-4">
      <CodingRound
        assessmentId="simulation"
        roundData={roundData}
        executeCodeFn={async (p) => {
          const res = await apiClient.executePracticeCode(p);
          if (p.question_id) {
            resultsRef.current[p.question_id] = res;
          }
          return res;
        }}
        submitFn={async () => handleSubmit()}
        showSubmitButton
        onChange={(questionId, code, language) => {
          editorsRef.current[questionId] = { code, language };
        }}
      />
      <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'Evaluating…' : 'Submit coding round'}
      </Button>
    </div>
  );
}
