'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Users,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Download,
    Eye,
    ArrowLeft,
    MessageSquare,
    UserCircle,
    Bot
} from 'lucide-react';

interface QuestionDetail {
    question_order: number;
    question_text: string;
    question_type: string;
    student_answer: string | null;
    correct_answer: string | null;
    points_earned: number | null;
    points_max: number | null;
    is_correct: boolean;
    feedback?: string;
    is_gd_turn?: boolean;  // Flag for GD conversation turns
    is_gd_summary?: boolean;  // Flag for GD evaluation summary
}

interface RoundDetail {
    round_number: number;
    round_name: string;
    round_type: string;
    questions: QuestionDetail[];
}

interface StudentData {
    attempt_id: string;
    student_id: string;
    status: string;
    overall_score: number;
    max_score: number;
    overall_percentage: number;
    pass_fail_status?: string;
    rounds_completed: number;
    round_scores: Array<{
        round_number: number;
        round_name: string;
        score: number;
        max_score: number;
        percentage: number;
    }>;
    started_at: string | null;
    completed_at: string | null;
}

interface DetailedReport {
    question_breakdown: RoundDetail[];
    rounds: Array<{
        round_number: number;
        round_name: string;
        round_type: string;
        score: number;
        max_score: number;
        percentage: number;
    }>;
}

interface PackageReport {
    package_id: string;
    assessment_name: string;
    mode: string;
    summary: {
        total_attempts: number;
        completed_attempts: number;
        evaluated_attempts: number;
        average_score: number;
        pass_count: number;
        fail_count: number;
    };
    students: StudentData[];
}

export default function AdminDishaReportsPage() {
    const params = useParams();
    const router = useRouter();
    const packageId = params.packageId as string;

    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<PackageReport | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
    const [detailedReport, setDetailedReport] = useState<DetailedReport | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        const loadReport = async () => {
            try {
                setLoading(true);
                const data = await apiClient.getDishaPackageReport(packageId);
                setReport(data);
            } catch (error: any) {
                console.error('Failed to load report:', error);
                toast.error('Failed to load assessment report');
            } finally {
                setLoading(false);
            }
        };

        if (packageId) {
            loadReport();
        }
    }, [packageId]);

    const exportToCSV = () => {
        if (!report) return;

        const headers = ['Student ID', 'Status', 'Overall Score', 'Max Score', 'Percentage', 'Pass/Fail', 'Rounds Completed'];
        const rows = report.students.map(s => [
            s.student_id,
            s.status,
            s.overall_score.toString(),
            s.max_score.toString(),
            s.overall_percentage.toFixed(2),
            s.pass_fail_status || 'N/A',
            s.rounds_completed.toString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.assessment_name}_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
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

    if (!report) {
        return (
            <DashboardLayout requiredUserType="admin">
                <div className="p-6">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-300">Failed to load report.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredUserType="admin">
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/admin/disha')}
                            className="mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Packages
                        </Button>
                        <h1 className="text-3xl font-bold">{report.assessment_name}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Assessment Report</p>
                    </div>
                    <Button onClick={exportToCSV} className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total Attempts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                <span className="text-2xl font-bold">{report.summary.total_attempts}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Completed</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <span className="text-2xl font-bold">{report.summary.completed_attempts}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Average Score</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                                <span className="text-2xl font-bold">{report.summary.average_score.toFixed(1)}%</span>
                            </div>
                        </CardContent>
                    </Card>
                    {report.mode === 'HIRING' && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Pass / Fail</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="text-xl font-bold">{report.summary.pass_count}</span>
                                    <span className="text-gray-400">/</span>
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    <span className="text-xl font-bold">{report.summary.fail_count}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Students Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Student Results</CardTitle>
                        <CardDescription>
                            {report.students.length} student{report.students.length !== 1 ? 's' : ''} appeared
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3">Student ID</th>
                                        <th className="text-left p-3">Status</th>
                                        <th className="text-left p-3">Score</th>
                                        <th className="text-left p-3">Percentage</th>
                                        {report.mode === 'HIRING' && (
                                            <th className="text-left p-3">Pass/Fail</th>
                                        )}
                                        <th className="text-left p-3">Rounds</th>
                                        <th className="text-left p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.students.map((student) => (
                                        <tr key={student.attempt_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="p-3">{student.student_id}</td>
                                            <td className="p-3">
                                                <Badge variant={
                                                    student.status === 'COMPLETED' || student.status === 'EVALUATED'
                                                        ? 'default'
                                                        : 'secondary'
                                                }>
                                                    {student.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                {student.overall_score.toFixed(1)} / {student.max_score}
                                            </td>
                                            <td className="p-3">
                                                <span className={`font-semibold ${student.overall_percentage >= 80
                                                    ? 'text-green-600'
                                                    : student.overall_percentage >= 60
                                                        ? 'text-yellow-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    {student.overall_percentage.toFixed(1)}%
                                                </span>
                                            </td>
                                            {report.mode === 'HIRING' && (
                                                <td className="p-3">
                                                    {student.pass_fail_status ? (
                                                        <Badge variant={student.pass_fail_status === 'PASS' ? 'default' : 'destructive'}>
                                                            {student.pass_fail_status}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="p-3">{student.rounds_completed}</td>
                                            <td className="p-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={async () => {
                                                        setSelectedStudent(student);
                                                        // Fetch detailed report
                                                        try {
                                                            setLoadingDetails(true);
                                                            const details = await apiClient.getDishaIndividualStudentReport(
                                                                packageId,
                                                                student.attempt_id
                                                            );
                                                            setDetailedReport(details);
                                                        } catch (error: any) {
                                                            console.error('Failed to load detailed report:', error);
                                                            toast.error('Failed to load detailed report');
                                                        } finally {
                                                            setLoadingDetails(false);
                                                        }
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Report Modal */}
                {selectedStudent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Student Report: {selectedStudent.student_id}</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedStudent(null);
                                            setDetailedReport(null);
                                        }}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Overall Score</p>
                                        <p className="text-2xl font-bold">
                                            {selectedStudent.overall_score.toFixed(1)} / {selectedStudent.max_score}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Percentage</p>
                                        <p className="text-2xl font-bold">{selectedStudent.overall_percentage.toFixed(1)}%</p>
                                    </div>
                                    {selectedStudent.pass_fail_status && (
                                        <div>
                                            <p className="text-sm text-gray-500">Status</p>
                                            <Badge variant={selectedStudent.pass_fail_status === 'PASS' ? 'default' : 'destructive'}>
                                                {selectedStudent.pass_fail_status}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Round-wise Scores</h3>
                                    <div className="space-y-2">
                                        {selectedStudent.round_scores.map((round) => (
                                            <div
                                                key={round.round_number}
                                                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold">
                                                            Round {round.round_number}: {round.round_name}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold">
                                                            {round.score.toFixed(1)} / {round.max_score}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {round.percentage.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Question Breakdown */}
                                {loadingDetails ? (
                                    <div className="flex justify-center py-8">
                                        <Loader />
                                    </div>
                                ) : detailedReport && detailedReport.question_breakdown ? (
                                    <div className="mt-6">
                                        <h3 className="text-lg font-semibold mb-4">Question Breakdown</h3>
                                        <div className="space-y-4">
                                            {detailedReport.question_breakdown.map((round) => (
                                                <div key={round.round_number} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                                                    <h4 className="font-semibold mb-3 text-base">
                                                        Round {round.round_number}: {round.round_name}
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {/* Special display for Group Discussion rounds */}
                                                        {round.round_type === 'group_discussion' ? (
                                                            <div className="space-y-4">
                                                                {round.questions.map((q, idx) => (
                                                                    <div key={idx} className={`rounded-lg p-4 border ${(q as any).is_gd_summary
                                                                        ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800'
                                                                        : 'bg-white dark:bg-gray-900'
                                                                        }`}>
                                                                        {/* GD Summary Card */}
                                                                        {(q as any).is_gd_summary ? (
                                                                            <div>
                                                                                <div className="flex items-center gap-2 mb-3">
                                                                                    <MessageSquare className="h-5 w-5 text-purple-600" />
                                                                                    <h5 className="font-semibold text-purple-800 dark:text-purple-300">Discussion Evaluation Summary</h5>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-4 mb-3">
                                                                                    <div>
                                                                                        <p className="text-xs text-gray-500">Participation</p>
                                                                                        <p className="font-medium">{q.student_answer}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs text-gray-500">Score</p>
                                                                                        <p className="font-bold text-lg text-purple-600">
                                                                                            {(q.points_earned ?? 0).toFixed(1)} / {(q.points_max ?? 0).toFixed(1)}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                {q.feedback && (
                                                                                    <div className="bg-white/50 dark:bg-gray-800/50 rounded p-3 text-sm">
                                                                                        <p className="font-semibold mb-1 text-purple-700 dark:text-purple-300">Evaluation Feedback:</p>
                                                                                        <p className="text-gray-700 dark:text-gray-300">{q.feedback}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            /* GD Conversation Turn */
                                                                            <div>
                                                                                <div className="flex items-center gap-2 mb-3">
                                                                                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                                                                        Turn {q.question_order}
                                                                                    </Badge>
                                                                                    {idx === 0 && q.question_text.includes('Topic:') && (
                                                                                        <span className="text-xs text-gray-500">
                                                                                            {q.question_text.split('Topic:')[1]?.trim()}
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Student Response */}
                                                                                <div className="flex gap-3 mb-3">
                                                                                    <div className="flex-shrink-0">
                                                                                        <UserCircle className="h-8 w-8 text-green-600" />
                                                                                    </div>
                                                                                    <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                                                                                        <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Student:</p>
                                                                                        <p className="text-sm text-gray-800 dark:text-gray-200">
                                                                                            {q.student_answer || <span className="italic text-gray-400">No response</span>}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>

                                                                                {/* AI Agent Responses */}
                                                                                {q.feedback && (
                                                                                    <div className="flex gap-3 ml-6">
                                                                                        <div className="flex-shrink-0">
                                                                                            <Bot className="h-8 w-8 text-blue-600" />
                                                                                        </div>
                                                                                        <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                                                                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">AI Participants:</p>
                                                                                            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                                                                                {q.feedback.split(' | ').map((response: string, i: number) => (
                                                                                                    <span key={i} className="block mb-1 last:mb-0">
                                                                                                        {response}
                                                                                                    </span>
                                                                                                ))}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            /* Standard question display for non-GD rounds */
                                                            round.questions.map((q, idx) => (
                                                                <div key={idx} className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                                                                    <div className="flex items-start justify-between gap-4">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">
                                                                                    Q{idx + 1}
                                                                                </span>
                                                                                <Badge variant="outline" className="text-xs capitalize">
                                                                                    {q.question_type.replace('_', ' ')}
                                                                                </Badge>
                                                                            </div>
                                                                            <p className="font-medium text-sm mb-3">{q.question_text}</p>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                                                                                    <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Correct Answer:</p>
                                                                                    <p className="text-sm font-medium text-red-900 dark:text-red-100 break-words">
                                                                                        {q.correct_answer || <span className="italic text-gray-400">N/A</span>}
                                                                                    </p>
                                                                                </div>
                                                                                <div className={`border rounded p-3 ${q.is_correct
                                                                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                                                                    }`}>
                                                                                    <p className={`text-xs font-semibold mb-1 ${q.is_correct
                                                                                        ? 'text-green-700 dark:text-green-300'
                                                                                        : 'text-gray-700 dark:text-gray-300'
                                                                                        }`}>
                                                                                        Your Answer:
                                                                                    </p>
                                                                                    <p className={`text-sm font-medium break-words ${q.is_correct
                                                                                        ? 'text-green-900 dark:text-green-100'
                                                                                        : 'text-gray-900 dark:text-gray-100'
                                                                                        }`}>
                                                                                        {q.student_answer || <span className="italic text-gray-400">No answer provided</span>}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {q.feedback && (
                                                                                <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2 text-xs text-blue-800 dark:text-blue-300">
                                                                                    <p className="font-semibold mb-1">Feedback:</p>
                                                                                    {q.feedback}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-right min-w-[100px]">
                                                                            {q.is_correct ? (
                                                                                <div className="flex flex-col items-end text-green-600 dark:text-green-400">
                                                                                    <CheckCircle2 className="h-6 w-6 mb-1" />
                                                                                    <span className="font-bold text-lg">+{(q.points_earned ?? 0).toFixed(1)}</span>
                                                                                    <span className="text-xs text-gray-500">/ {(q.points_max ?? 0).toFixed(1)}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col items-end text-red-600 dark:text-red-400">
                                                                                    <XCircle className="h-6 w-6 mb-1" />
                                                                                    <span className="font-bold text-lg">{(q.points_earned ?? 0).toFixed(1)}</span>
                                                                                    <span className="text-xs text-gray-500">/ {(q.points_max ?? 0).toFixed(1)}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

