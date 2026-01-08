'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import DishaAssessmentExam from '@/components/disha/DishaAssessmentExam';
import { apiClient } from '@/lib/api';
import { Loader } from '@/components/ui/loader';
import toast from 'react-hot-toast';

export default function AdminDishaExamPage() {
    const params = useParams();
    const router = useRouter();
    const packageId = params.packageId as string;

    const [loading, setLoading] = useState(true);
    const [packageInfo, setPackageInfo] = useState<any>(null);
    const [adminId, setAdminId] = useState<string>('');

    useEffect(() => {
        const loadPackage = async () => {
            try {
                setLoading(true);
                const info = await apiClient.getDishaPackageStatus(packageId);
                setPackageInfo(info);

                // Use admin ID - you may need to get this from auth context
                const storedAdminId = localStorage.getItem('admin_id') || 'admin_' + Date.now();
                setAdminId(storedAdminId);
            } catch (error: any) {
                console.error('Failed to load package:', error);
                toast.error('Failed to load assessment package');
                router.push('/dashboard/admin/disha');
            } finally {
                setLoading(false);
            }
        };

        if (packageId) {
            loadPackage();
        }
    }, [packageId, router]);

    const handleComplete = () => {
        router.push(`/dashboard/admin/disha/${packageId}/reports`);
    };

    if (loading) {
        return (
            <DashboardLayout requiredUserType="admin">
                <div className="flex justify-center items-center min-h-screen">
                    <Loader size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    if (!packageInfo || !adminId) {
        return (
            <DashboardLayout requiredUserType="admin">
                <div className="p-6">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-300">Failed to load assessment package.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredUserType="admin">
            <DishaAssessmentExam
                packageId={packageId}
                studentId={adminId}
                onComplete={handleComplete}
            />
        </DashboardLayout>
    );
}

