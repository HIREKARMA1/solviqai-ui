'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Briefcase, CheckCircle2, Send, TrendingUp, Users } from 'lucide-react';

export default function EnterpriseDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getEnterpriseDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout requiredUserType="enterprise">
        <div className="flex justify-center py-16"><Loader size="lg" /></div>
      </DashboardLayout>
    );
  }

  const sm = data?.summary || {};

  return (
    <DashboardLayout requiredUserType="enterprise">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Hiring Hub</h1>
            <p className="text-gray-600 mt-1">
              {data?.organization?.name} — invite candidates, run skills assessments, and review hiring signals.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/enterprise/campaigns">Manage campaigns</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active campaigns', value: sm.campaigns || 0, icon: Briefcase },
            { label: 'Invites sent', value: sm.invites_sent || 0, icon: Send },
            { label: 'Completed', value: sm.completed || 0, icon: CheckCircle2 },
            { label: 'Avg score', value: `${sm.avg_score || 0}%`, icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border p-4 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">{label}</p>
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border dark:border-gray-700">
          <div className="border-b px-4 py-3 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Recent candidate results
            </h2>
            <Badge variant="secondary">{sm.recommend_count || 0} recommended</Badge>
          </div>
          {(data?.recent_results || []).length === 0 ? (
            <p className="p-8 text-center text-gray-500">No completed assessments yet. Create a campaign and send invites.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-left">
                    <th className="px-4 py-2">Candidate</th>
                    <th className="px-4 py-2">Score</th>
                    <th className="px-4 py-2">Hiring signal</th>
                    <th className="px-4 py-2">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_results.map((r: any, i: number) => (
                    <tr key={i} className="border-t dark:border-gray-800">
                      <td className="px-4 py-2">
                        <div className="font-medium">{r.candidate_name}</div>
                        <div className="text-xs text-gray-500">{r.candidate_email}</div>
                      </td>
                      <td className="px-4 py-2">{r.score != null ? `${r.score}%` : '—'}</td>
                      <td className="px-4 py-2">
                        <Badge variant={r.hiring_verdict === 'RECOMMEND' ? 'default' : r.hiring_verdict === 'CONSIDER' ? 'secondary' : 'destructive'}>
                          {r.hiring_verdict || '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">{r.completed_at ? new Date(r.completed_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
