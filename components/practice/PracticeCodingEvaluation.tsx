'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Code, Lightbulb, ArrowLeft, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface EvaluationData {
    score: number;
    feedback: string;
    suggestions: string[];
    analyses: Array<{
        question_id: string;
        score: number;
        feedback: string;
        strengths?: string[];
        improvements?: string[];
        code_suggestions?: string;
    }>;
}

interface PracticeCodingEvaluationProps {
    branch: string;
    difficulty: string;
    submissions: Array<{
        question_id: string;
        question_text: string;
        code: string;
        language: string;
        test_results?: any;
    }>;
    questions: Array<{
        id: string;
        question_text: string;
        metadata?: any;
    }>;
    onBack: () => void;
    onPracticeMore: () => void;
}

export default function PracticeCodingEvaluation({
    branch,
    difficulty,
    submissions,
    questions,
    onBack,
    onPracticeMore,
}: PracticeCodingEvaluationProps) {
    const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        evaluateSubmissions();
    }, []);

    const evaluateSubmissions = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiClient.evaluatePracticeCodingSubmission({
                branch,
                difficulty,
                items: submissions,
            });
            setEvaluation(result.evaluation);
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || 'Failed to evaluate submissions';
            setError(msg);
            console.error('Evaluation error:', e);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
        if (score >= 60) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
        return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Needs Improvement';
        return 'Keep Practicing';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-100/50 p-8 max-w-md w-full text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Evaluating Your Code</h3>
                    <p className="text-gray-600">Analyzing your solutions and generating feedback...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl border-2 border-red-100/50 p-8 max-w-md w-full">
                    <div className="text-center">
                        <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Evaluation Error</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={evaluateSubmissions}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4 inline mr-2" />
                                Retry
                            </button>
                            <button
                                onClick={onBack}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 inline mr-2" />
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!evaluation) {
        return null;
    }

    const scoreColor = getScoreColor(evaluation.score);
    const scoreLabel = getScoreLabel(evaluation.score);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-100/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Evaluation</h1>
                            <p className="text-gray-600">
                                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level - {branch}
                            </p>
                        </div>
                        <button
                            onClick={onBack}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    </div>

                    {/* Overall Score Card */}
                    <div className={`${scoreColor.bg} ${scoreColor.border} border-2 rounded-xl p-6 mb-6`}>
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white mb-4 shadow-lg">
                                <TrendingUp className={`w-10 h-10 ${scoreColor.text}`} />
                            </div>
                            <div className="text-5xl font-bold mb-2">
                                <span className={scoreColor.text}>{evaluation.score}</span>
                                <span className="text-2xl text-gray-600">/100</span>
                            </div>
                            <h2 className={`text-2xl font-semibold mb-4 ${scoreColor.text}`}>{scoreLabel}</h2>
                            <p className="text-gray-700 text-lg max-w-2xl mx-auto">{evaluation.feedback}</p>
                        </div>
                    </div>

                    {/* General Suggestions */}
                    {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                            <div className="flex items-start gap-3">
                                <Lightbulb className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-amber-900 mb-3">General Suggestions</h3>
                                    <ul className="space-y-2">
                                        {evaluation.suggestions.map((suggestion, idx) => (
                                            <li key={idx} className="text-amber-800 flex items-start gap-2">
                                                <span className="text-amber-600 mt-1">•</span>
                                                <span>{suggestion}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Per-Question Analysis */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Question Analysis</h2>
                    {evaluation.analyses.map((analysis, idx) => {
                        const question = questions.find(q => q.id === analysis.question_id);
                        const submission = submissions.find(s => s.question_id === analysis.question_id);
                        const qScoreColor = getScoreColor(analysis.score);

                        return (
                            <div key={analysis.question_id} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
                                {/* Question Header */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b-2 border-gray-200">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold">
                                                    Question {idx + 1}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${qScoreColor.bg} ${qScoreColor.text} ${qScoreColor.border} border`}>
                                                    {analysis.score}/100
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {question?.metadata?.title || `Problem ${idx + 1}`}
                                            </h3>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap">{question?.question_text || ''}</p>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Feedback */}
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-blue-600" />
                                            Feedback
                                        </h4>
                                        <p className="text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            {analysis.feedback}
                                        </p>
                                    </div>

                                    {/* Strengths */}
                                    {analysis.strengths && analysis.strengths.length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                Strengths
                                            </h4>
                                            <ul className="space-y-2">
                                                {analysis.strengths.map((strength, sIdx) => (
                                                    <li key={sIdx} className="text-gray-700 bg-green-50 rounded-lg p-3 border border-green-200 flex items-start gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                                        <span>{strength}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Improvements */}
                                    {analysis.improvements && analysis.improvements.length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-amber-600" />
                                                Areas for Improvement
                                            </h4>
                                            <ul className="space-y-2">
                                                {analysis.improvements.map((improvement, iIdx) => (
                                                    <li key={iIdx} className="text-gray-700 bg-amber-50 rounded-lg p-3 border border-amber-200 flex items-start gap-2">
                                                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                        <span>{improvement}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Code Suggestions */}
                                    {analysis.code_suggestions && (
                                        <div>
                                            <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                                <Code className="w-5 h-5 text-blue-600" />
                                                Code Suggestions
                                            </h4>
                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                                                    {analysis.code_suggestions}
                                                </pre>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submitted Code */}
                                    {submission && (
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <Code className="w-5 h-5 text-gray-600" />
                                                Your Solution ({submission.language})
                                            </h4>
                                            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                                                <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono overflow-x-auto">
                                                    {submission.code}
                                                </pre>
                                            </div>
                                        </div>
                                    )}

                                    {/* Test Results */}
                                    {submission?.test_results && submission.test_results.total !== undefined && (
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Test Results</h4>
                                            <div className={`rounded-lg p-4 border-2 ${submission.test_results.passed === submission.test_results.total
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-red-50 border-red-200'
                                                }`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-gray-900">
                                                        Passed {submission.test_results.passed} / {submission.test_results.total} tests
                                                    </span>
                                                    {submission.test_results.passed === submission.test_results.total ? (
                                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                                    ) : (
                                                        <XCircle className="w-6 h-6 text-red-600" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-100/50 p-6">
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={onPracticeMore}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Practice More
                        </button>
                        <button
                            onClick={onBack}
                            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                        >
                            Back to Practice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

