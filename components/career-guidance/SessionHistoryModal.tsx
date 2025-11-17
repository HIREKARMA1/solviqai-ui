"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  onLoadSession: (sessionId: string) => Promise<void>;
}

export default function SessionHistoryModal({ open, onClose, onLoadSession }: Props) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    api.careerGuidance.getSessions()
      .then((res) => {
        if (!mounted) return;
        const list = res || [];
        // Ensure newest sessions appear first (sort by created_at desc)
        list.sort((a: any, b: any) => {
          const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        });
        setSessions(list);
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [open]);

  const handleLoad = async (id: string) => {
    await onLoadSession(id);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Session History</h3>
        {loading ? (
          <div>Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No previous sessions found.</div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-auto">
            {sessions.map((s: any) => (
              <div key={s.session_id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">{s.current_stage || "Session"}</div>
                  <div className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => handleLoad(s.session_id)}>Load</Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
