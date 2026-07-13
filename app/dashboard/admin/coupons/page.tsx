'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCouponsPage() {
  const [form, setForm] = useState({
    code: '',
    discount_percent: '20',
    max_uses: '100',
  });
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!form.code) {
      toast.error('Coupon code required');
      return;
    }
    setSaving(true);
    try {
      await apiClient.adminCreatePaymentCoupon({
        code: form.code,
        discount_percent: parseFloat(form.discount_percent),
        max_uses: parseInt(form.max_uses, 10),
      });
      toast.success('Coupon created');
      setForm({ code: '', discount_percent: '20', max_uses: '100' });
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout requiredUserType="admin">
      <div className="mx-auto max-w-md space-y-6 px-4 py-6">
        <h1 className="text-2xl font-bold">Payment Coupons</h1>
        <p className="text-sm text-gray-600">Create promo codes for B2C plan checkout.</p>
        <Input placeholder="Code e.g. LAUNCH20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        <Input placeholder="Discount %" type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
        <Input placeholder="Max uses" type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
        <Button onClick={create} disabled={saving}>{saving ? 'Creating…' : 'Create coupon'}</Button>
      </div>
    </DashboardLayout>
  );
}
