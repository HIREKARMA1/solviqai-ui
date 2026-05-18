'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import DishaAssessmentExam from '@/components/disha/DishaAssessmentExam';
import { apiClient } from '@/lib/api';
import { Loader } from '@/components/ui/loader';
import toast from 'react-hot-toast';

export default function StudentDishaExamPage() {
    const params = useParams();
    const router = useRouter();
    const packageId = params.packageId as string;

    const [loading, setLoading] = useState(true);
    const [packageInfo, setPackageInfo] = useState<any>(null);
    const [studentId, setStudentId] = useState<string>('');

    useEffect(() => {
        const loadPackage = async () => {
            try {
                setLoading(true);
                const info = await apiClient.getDishaPackageStatus(packageId);
                setPackageInfo(info);

                // Must match DISHA AssessmentAttempt.student_id for the results callback.
                let resolvedStudentId = localStorage.getItem('disha_student_id') || ''
                if (!resolvedStudentId) {
                    const token = localStorage.getItem('access_token')
                    if (token) {
                        try {
                            const payload = JSON.parse(atob(token.split('.')[1]))
                            resolvedStudentId =
                                payload.disha_student_id || payload.student_id || payload.sub || ''
                        } catch {
                            /* ignore decode errors */
                        }
                    }
                }
                if (!resolvedStudentId) {
                    toast.error(
                        'Your DISHA session was not found. Close this tab and open the exam again from the link HireKarma sent you.'
                    )
                    router.push('/dashboard/student')
                    return
                }
                setStudentId(resolvedStudentId)
            } catch (error: any) {
                console.error('Failed to load package:', error);
                toast.error('Failed to load assessment package');
                router.push('/dashboard/student');
            } finally {
                setLoading(false);
            }
        };

        if (packageId) {
            loadPackage();
        }
    }, [packageId, router]);

    const handleComplete = () => {
        router.push(`/dashboard/student`);
    };

    if (loading) {
        return (
            <DashboardLayout requiredUserType="student">
                <div className="flex justify-center items-center min-h-screen">
                    <Loader size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    if (!packageInfo || !studentId) {
        return (
            <DashboardLayout requiredUserType="student">
                <div className="p-6">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-300">Failed to load assessment package.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredUserType="student" hideNavigation={true}>
            <DishaAssessmentExam
                packageId={packageId}
                studentId={studentId}
                onComplete={handleComplete}
            />
        </DashboardLayout>
    );
}

