'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { CodingRound } from '@/components/assessment/CodingRound';
import { apiClient } from '@/lib/api';

type Props = {
  runId: string;
  onComplete: (run: any) => void;
};

export function SimulationCodingRound({ runId, onComplete }: Props) {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const editorsRef = useRef<Record<string, { language: string; code: string }>>({});
  const resultsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    apiClient
      .startSimulationCodingStage(runId)
      .then(setPayload)
      .catch((e) => alert(e?.response?.data?.detail || 'Could not start coding round'))
      .finally(() => setLoading(false));
  }, [runId]);

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
      const updated = await apiClient.completeSimulationCodingStage(runId, {
        branch: payload.branch,
        difficulty: payload.difficulty,
        items,
      });
      onComplete(updated);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Could not submit coding round');
    } finally {
      setSubmitting(false);
    }
  }, [payload, runId, submitting, onComplete]);

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
        executeCodeFn={(p) => apiClient.executePracticeCode(p)}
        submitFn={async () => handleSubmit()}
        showSubmitButton
        onChange={(questionId, code, language) => {
          editorsRef.current[questionId] = { code, language };
        }}
        onSubmitted={(result) => {
          if (result?.question_id) {
            resultsRef.current[result.question_id] = result;
          }
        }}
      />
      <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'Evaluating…' : 'Submit coding round'}
      </Button>
    </div>
  );
}
