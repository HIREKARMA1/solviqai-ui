'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Briefcase, Plus } from 'lucide-react';

export default function AdminEnterprisesPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [lastCreds, setLastCreds] = useState<any>(null);
  const [form, setForm] = useState({
    organization_name: '',
    industry: '',
    website: '',
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    job_title: 'Hiring Manager',
  });

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.adminListEnterpriseOrgs();
      setOrgs(r.organizations || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.organization_name || !form.admin_name || !form.admin_email) {
      toast.error('Organization name, admin name, and email are required');
      return;
    }
    setCreating(true);
    try {
      const r = await apiClient.adminCreateEnterpriseOrg(form);
      setLastCreds(r);
      toast.success('Enterprise organization created');
      setForm({ organization_name: '', industry: '', website: '', admin_name: '', admin_email: '', admin_phone: '', job_title: 'Hiring Manager' });
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout requiredUserType="admin">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Enterprise Organizations</h1>
          <p className="text-gray-600">Onboard hiring companies with HR admin accounts for the standalone assessment platform.</p>
        </div>

        {lastCreds && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
            <p className="font-semibold">Created: {lastCreds.organization_name}</p>
            <p>HR login: <strong>{lastCreds.admin_email}</strong></p>
            <p>Temporary password: <strong>{lastCreds.temporary_password}</strong></p>
            <p className="text-xs text-gray-500 mt-2">Share these credentials with the hiring team. They log in at /auth/login (auto-detects enterprise role).</p>
          </div>
        )}

        <div className="rounded-xl border p-4 space-y-3 dark:border-gray-700">
          <h2 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> New enterprise org</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Organization name" value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} />
            <Input placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            <Input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <Input placeholder="HR admin name" value={form.admin_name} onChange={(e) => setForm({ ...form, admin_name: e.target.value })} />
            <Input placeholder="HR admin email" type="email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} />
            <Input placeholder="Phone (optional)" value={form.admin_phone} onChange={(e) => setForm({ ...form, admin_phone: e.target.value })} />
          </div>
          <Button onClick={create} disabled={creating}>{creating ? 'Creating…' : 'Create enterprise org'}</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader size="lg" /></div>
        ) : (
          <div className="space-y-3">
            {orgs.map((o) => (
              <div key={o.id} className="rounded-xl border p-4 flex justify-between items-center dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-semibold">{o.name}</p>
                    <p className="text-xs text-gray-500">{o.industry || '—'} · {o.campaign_count} campaigns · {o.admin_count} admins</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
