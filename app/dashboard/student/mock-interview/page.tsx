'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Input } from '@/components/ui/input';
import { MockInterviewRoom } from '@/components/interview/MockInterviewRoom';
import { ExamFocusShell } from '@/components/exam/ExamFocusShell';
import { Badge } from '@/components/ui/badge';

export default function StandaloneMockInterviewPage() {
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [company, setCompany] = useState('');
  const [persona, setPersona] = useState<'technical' | 'hr'>('technical');
  const [started, setStarted] = useState(false);
  const [report, setReport] = useState<any>(null);

  if (report) {
    return (
      <DashboardLayout requiredUserType="student">
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
          <h1 className="text-2xl font-bold">Interview Report</h1>
          {(report.ai_mode === 'fallback' || report.report?.ai_mode === 'fallback') && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Demo mode — not full AI evaluation. {report.fallback_reason || report.report?.fallback_reason || 'Add Anthropic credits for real scoring.'}
            </p>
          )}
          <p className="text-3xl font-bold text-indigo-600">{report.overall_score ?? report.report?.overall_score}/100</p>
          <p>{report.report?.summary || report.summary}</p>
          <button type="button" className="text-indigo-600 underline" onClick={() => { setStarted(false); setReport(null); }}>
            Start another interview
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (started) {
    return (
      <ExamFocusShell
        title="AI Mock Interview"
        subtitle={`${persona === 'hr' ? 'HR' : 'Technical'} · ${targetRole}${company ? ` · ${company}` : ''}`}
      >
        <div className="h-full overflow-y-auto p-4 md:p-6">
          <MockInterviewRoom
            persona={persona}
            targetRole={targetRole}
            company={company || undefined}
            onComplete={(r) => setReport(r)}
          />
        </div>
      </ExamFocusShell>
    );
  }

  return (
    <DashboardLayout requiredUserType="student">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">AI Mock Interview</h1>
          <p className="text-gray-600">Adaptive Claude interviewer with voice input (STT) and spoken questions (TTS).</p>
        </div>

        <div className="rounded-xl border p-6 space-y-4 dark:border-gray-700">
          <Input placeholder="Target role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
          <Input placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} />
          <div className="flex gap-2">
            <Badge
              className={`cursor-pointer ${persona === 'technical' ? 'bg-indigo-600' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setPersona('technical')}
            >
              Technical
            </Badge>
            <Badge
              className={`cursor-pointer ${persona === 'hr' ? 'bg-indigo-600' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setPersona('hr')}
            >
              HR
            </Badge>
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-indigo-600 py-3 text-white font-medium"
            onClick={() => setStarted(true)}
          >
            Begin interview
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
