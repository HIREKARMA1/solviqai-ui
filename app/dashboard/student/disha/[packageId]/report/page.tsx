'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    CheckCircle2,
    XCircle,
    Clock,
    Award,
    BarChart2,
    ArrowLeft,
    AlertCircle
} from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface QuestionResult {
    question_id: string;
    question_text: string;
    question_type: string;
    student_answer: string | null;
    correct_answer: string | null;
    is_correct: boolean;
    points_earned: number | null;
    points_max: number | null;
    feedback?: string;
}

interface RoundResult {
    round_number: number;
    round_name: string;
    round_type: string;
    score: number;
    max_score: number;
    percentage: number;
    questions: QuestionResult[];
}

interface AssessmentReport {
    assessment_package_id: string;
    disha_assessment_id: string;
    student_id: string;
    overall_score: number;
    overall_max_score: number;
    overall_percentage: number;
    total_rounds: number;
    completed_rounds: number;
    rounds: RoundResult[];
    pass_fail_status?: string;
    submitted_at: string;
    performance_insights?: {
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
    };
    time_analytics?: {
        total_time_seconds: number;
        avg_time_per_question: number;
    };
}

export default function StudentDishaReportPage() {
    const params = useParams();
    const router = useRouter();
    const packageId = params.packageId as string;

    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<AssessmentReport | null>(null);
    const [evaluating, setEvaluating] = useState(false);
    const [packageInfo, setPackageInfo] = useState<any>(null);

    useEffect(() => {
        const loadreport = async () => {
            try {
                setLoading(true);

                // 1. Get package status to find attempt_id
                const pkgStatus = await apiClient.getDishaPackageStatus(packageId);
                setPackageInfo(pkgStatus);

                // We need the attempt ID. In the student flow, we might need to get it 
                // from the start endpoint (if existing) or local storage.
                // Or better, use a new API that gets the current attempt for a package.
                // For now, let's try to 'start' it again to get the existing attempt ID
                // assuming the API handles idempotency returns existing attempt.
                const storedStudentId = localStorage.getItem('disha_student_id') || 'student_guest';

                try {
                    const startResponse = await apiClient.startDishaAssessment(packageId, storedStudentId);
                    const attemptId = startResponse.attempt_id;

                    if (attemptId) {
                        // 2. Fetch Report
                        try {
                            const reportData = await apiClient.getDishaReport(attemptId);
                            setReport(reportData);
                        } catch (err: any) {
                            if (err.response?.status === 400 && err.response?.data?.detail?.includes('not complete')) {
                                setEvaluating(true);
                            } else {
                                throw err;
                            }
                        }
                    }
                } catch (startErr) {
                    console.error("Failed to retrieve attempt ID", startErr);
                    toast.error("Could not retrieve assessment session");
                }

            } catch (error: any) {
                console.error('Failed to load report:', error);
                toast.error('Failed to load assessment report');
            } finally {
                setLoading(false);
            }
        };

        if (packageId) {
            loadreport();
        }
    }, [packageId]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
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

    if (evaluating) {
        return (
            <DashboardLayout requiredUserType="student">
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
                    <Loader size="xl" className="mb-6" />
                    <h2 className="text-2xl font-bold mb-2">Evaluation in Progress</h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md">
                        Your assessment is being evaluated by our systems. This may take a few minutes depending on the complexity of your answers (especially for coding or interview rounds).
                    </p>
                    <Button
                        className="mt-8"
                        onClick={() => window.location.reload()}
                    >
                        Check Again
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    if (!report) {
        return (
            <DashboardLayout requiredUserType="student">
                <div className="p-6">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-300">
                            Report not available. Please ensure you have completed the assessment.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => router.push('/dashboard/student')}
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredUserType="student">
            <div className="space-y-6 p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/student')}
                            className="mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold">{packageInfo?.assessment_name || 'Assessment Report'}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Completed on {new Date(report.submitted_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="text-right">
                        {report.pass_fail_status && (
                            <Badge className={`text-lg px-4 py-1 ${report.pass_fail_status === 'PASS'
                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                : 'bg-red-100 text-red-800 hover:bg-red-100'
                                }`}>
                                {report.pass_fail_status}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Score Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-blue-800 dark:text-blue-300">Overall Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-blue-900 dark:text-blue-100">{report.overall_percentage}%</span>
                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                    ({report.overall_score} / {report.overall_max_score})
                                </span>
                            </div>
                            <Progress value={report.overall_percentage} className="mt-4 h-2" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-gray-500" />
                                Time Taken
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {report.time_analytics?.total_time_seconds !== undefined ? formatTime(report.time_analytics.total_time_seconds) : 'N/A'}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Avg. per question: {report.time_analytics?.avg_time_per_question !== undefined ? report.time_analytics.avg_time_per_question.toFixed(1) : '0.0'}s
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Award className="h-5 w-5 text-yellow-500" />
                                Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Rounds Completed</span>
                                    <span className="font-semibold">{report.completed_rounds} / {report.total_rounds}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Correct Answers</span>
                                    <span className="font-semibold text-green-600">
                                        {report.rounds.reduce((acc, r) => acc + r.questions.filter(q => q.is_correct).length, 0)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Insights */}
                {report.performance_insights && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base text-green-700 dark:text-green-400 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Strengths
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(report.performance_insights?.strengths?.length ?? 0) > 0 ? (
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {report.performance_insights.strengths?.map((s, i) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">No specific strengths identified yet.</p>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base text-orange-700 dark:text-orange-400 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    Areas for Improvement
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(report.performance_insights?.weaknesses?.length ?? 0) > 0 ? (
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {report.performance_insights.weaknesses?.map((w, i) => (
                                            <li key={i}>{w}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">Good job! No major weaknesses identified.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Round Details */}
                <h2 className="text-2xl font-bold mt-8 mb-4">Round Results</h2>
                <div className="space-y-4">
                    {report.rounds.map((round) => (
                        <Card key={round.round_number} className="overflow-hidden">
                            <CardHeader className="bg-gray-50 dark:bg-gray-800/50 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">
                                            Round {round.round_number}: {round.round_name}
                                        </CardTitle>
                                        <CardDescription className="capitalize">
                                            {round.round_type.replace('_', ' ')}
                                        </CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold">{(round.percentage ?? 0).toFixed(0)}%</p>
                                        <p className="text-sm text-gray-500">
                                            {round.score} / {round.max_score} pts
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Accordion type="single" collapsible>
                                    <AccordionItem value="details" className="border-b-0">
                                        <AccordionTrigger className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                            View Question Breakdown ({round.questions.length})
                                        </AccordionTrigger>
                                        <AccordionContent className="px-6 pt-2 pb-6">
                                            <div className="space-y-4">
                                                {round.questions.map((q, idx) => (
                                                    <div key={q.question_id} className="border rounded-lg p-4">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                                                        Q{idx + 1}
                                                                    </span>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {q.question_type}
                                                                    </Badge>
                                                                </div>
                                                                <p className="font-medium text-base mb-3">{q.question_text}</p>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                                                        <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Correct Answer:</p>
                                                                        <p className="text-sm font-medium text-red-900 dark:text-red-100 break-words">
                                                                            {q.correct_answer || <span className="italic text-gray-400">N/A</span>}
                                                                        </p>
                                                                    </div>
                                                                    <div className={`border rounded-lg p-3 ${
                                                                        q.is_correct 
                                                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                                                            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                                    }`}>
                                                                        <p className={`text-xs font-semibold mb-1 ${
                                                                            q.is_correct 
                                                                                ? 'text-green-700 dark:text-green-300' 
                                                                                : 'text-gray-700 dark:text-gray-300'
                                                                        }`}>
                                                                            Your Answer:
                                                                        </p>
                                                                        <p className={`text-sm font-medium break-words ${
                                                                            q.is_correct 
                                                                                ? 'text-green-900 dark:text-green-100' 
                                                                                : 'text-gray-900 dark:text-gray-100'
                                                                        }`}>
                                                                            {q.student_answer || <span className="italic text-gray-400">No answer provided</span>}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {q.feedback && (
                                                                    <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
                                                                        <p className="text-xs font-semibold mb-1">Feedback:</p>
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
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
