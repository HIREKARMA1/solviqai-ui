'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Inquiry = {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  education: string;
  graduation_year: number;
  target_role: string;
  composite_score: number | null;
  aptitude_score: number | null;
  resume_strength_score: number | null;
  status: string;
  created_at: string | null;
};

export default function AdminGuestInquiriesPage() {
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.adminListGuestInquiries({ limit: 200 });
      setInquiries(data.inquiries || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardLayout requiredUserType="admin">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guest Readiness Queries</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Leads from the free readiness check on the landing page. Resume files are not stored here.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader size="lg" />
            </div>
          ) : inquiries.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">No guest queries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-950/50">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 font-semibold">Education</th>
                    <th className="px-4 py-3 font-semibold">Target Role</th>
                    <th className="px-4 py-3 font-semibold">Score</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.full_name}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 dark:text-gray-100">{row.email}</div>
                        <div className="text-xs text-gray-500">{row.mobile}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {row.education}
                        <div className="text-xs text-gray-500">Class of {row.graduation_year}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.target_role}</td>
                      <td className="px-4 py-3">
                        {row.composite_score != null ? (
                          <span className="font-semibold text-brand-blue">{Math.round(row.composite_score)}%</span>
                        ) : (
                          <span className="text-gray-400">?</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={row.status === 'completed' ? 'default' : 'secondary'}>{row.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {row.created_at ? new Date(row.created_at).toLocaleString() : '?'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {!loading && total > 0 && (
          <p className="text-xs text-gray-500">Showing {inquiries.length} of {total} inquiries</p>
        )}
      </div>
    </DashboardLayout>
  );
}
