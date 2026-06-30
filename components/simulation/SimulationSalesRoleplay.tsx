'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Handshake, User } from 'lucide-react';

type Turn = { role: string; text: string };

type Props = {
  runId: string;
  onComplete: (run: any) => void;
};

export function SimulationSalesRoleplay({ runId, onComplete }: Props) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [pitch, setPitch] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    apiClient
      .startSimulationSales(runId)
      .then((res) => {
        setSession(res);
        const opening = res.scenario?.opening;
        if (opening) {
          setTurns([{ role: 'customer', text: opening }]);
        }
      })
      .catch((e) => alert(e?.response?.data?.detail || 'Could not start sales roleplay'))
      .finally(() => setLoading(false));
  }, [runId]);

  const submitPitch = useCallback(async () => {
    if (!pitch.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiClient.simulationSalesResponse(runId, { text: pitch.trim() });
      setTurns((prev) => [
        ...prev,
        { role: 'candidate', text: pitch.trim() },
        { role: 'customer', text: res.customer_reply },
      ]);
      setPitch('');
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Could not send pitch');
    } finally {
      setSubmitting(false);
    }
  }, [pitch, runId, submitting]);

  const finish = useCallback(async () => {
    const pitches = turns.filter((t) => t.role === 'candidate');
    if (pitches.length < 1) {
      alert('Complete at least one sales pitch turn before finishing.');
      return;
    }
    setFinishing(true);
    try {
      const updated = await apiClient.evaluateSimulationSales(runId);
      onComplete(updated);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Could not evaluate roleplay');
    } finally {
      setFinishing(false);
    }
  }, [runId, turns, onComplete]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  const scenario = session?.scenario || {};

  return (
    <div className="space-y-4 rounded-xl border p-6 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
          <Handshake className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-semibold">Sales Roleplay</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{scenario.objective}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{scenario.product}</Badge>
            <Badge variant="secondary">
              <User className="mr-1 h-3 w-3 inline" />
              {scenario.customer_name} · {scenario.customer_role}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
        {turns.map((t, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-sm ${
              t.role === 'customer'
                ? 'bg-white border dark:bg-gray-800 dark:border-gray-700 ml-0 mr-8'
                : 'bg-primary/10 ml-8 mr-0'
            }`}
          >
            <span className="text-xs font-medium uppercase text-gray-500">
              {t.role === 'customer' ? scenario.customer_name || 'Customer' : 'You'}
            </span>
            <p className="mt-1">{t.text}</p>
          </div>
        ))}
      </div>

      <Textarea
        placeholder="Your pitch or response to the customer…"
        value={pitch}
        onChange={(e) => setPitch(e.target.value)}
        rows={3}
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={submitPitch} disabled={submitting || !pitch.trim()}>
          {submitting ? 'Sending…' : 'Send pitch'}
        </Button>
        <Button variant="outline" onClick={finish} disabled={finishing}>
          {finishing ? 'Evaluating…' : 'Finish roleplay'}
        </Button>
      </div>
    </div>
  );
}
