"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { 
    FileSpreadsheet, 
    Upload, 
    Download, 
    CheckCircle2, 
    AlertCircle,
    Calculator,
    Clock,
    Award
} from 'lucide-react';

export type TallyExcelRoundProps = {
    assessmentId: string;
    roundData: any;
    onSubmitted?: (result: any) => void;
};

export function TallyExcelRound({ assessmentId, roundData, onSubmitted }: TallyExcelRoundProps) {
    const [selectedQuestion, setSelectedQuestion] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
    const [evaluations, setEvaluations] = useState<Record<string, any>>({});
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const [submitting, setSubmitting] = useState(false);

    const questions = roundData?.questions || [];
    const currentQuestion = questions[selectedQuestion];

    const handleFileSelect = (questionId: string, file: File | null) => {
        if (file) {
            setUploadedFiles(prev => ({ ...prev, [questionId]: file }));
        }
    };

    const handleUploadAndEvaluate = async (questionId: string) => {
        const file = uploadedFiles[questionId];
        if (!file) {
            toast.error('Please select an Excel file first');
            return;
        }

        setUploading(prev => ({ ...prev, [questionId]: true }));
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('question_id', questionId);

            const response = await apiClient.client.post(
                `/assessments/rounds/${roundData.round_id}/upload-excel`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setEvaluations(prev => ({
                ...prev,
                [questionId]: response.data.evaluation
            }));

            toast.success('Solution uploaded and evaluated!', { duration: 4000 });
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error(error.response?.data?.detail || 'Failed to upload solution');
        } finally {
            setUploading(prev => ({ ...prev, [questionId]: false }));
        }
    };

    const handleDownloadTemplate = async (questionId: string) => {
        try {
            toast.loading('Generating template...', { id: 'download' });
            
            const response = await apiClient.client.get(
                `/assessments/rounds/${roundData.round_id}/download-template/${questionId}`,
                { responseType: 'blob' }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `accounting_task_${questionId.slice(0, 8)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Template downloaded!', { id: 'download' });
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download template', { id: 'download' });
        }
    };

    const handleSubmitAllSolutions = async () => {
        // Check if all questions have been attempted
        const allAttempted = questions.every((q: any) => evaluations[q.id]);
        
        if (!allAttempted) {
            toast.error('Please complete all tasks before submitting');
            return;
        }

        setSubmitting(true);
        
        try {
            // Calculate total score
            const totalScore = Object.values(evaluations).reduce(
                (sum: number, evaluation: any) => sum + (evaluation.score || 0),
                0
            );

            toast.success('All solutions submitted successfully!', { duration: 3000 });
            
            if (onSubmitted) {
                onSubmitted({ totalScore, evaluations });
            }
        } catch (error) {
            console.error('Submission failed:', error);
            toast.error('Failed to submit solutions');
        } finally {
            setSubmitting(false);
        }
    };

    const getMetadata = (question: any) => question?.metadata || {};

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                                <Calculator className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Tally/Excel Practical Assessment
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Complete accounting tasks using Excel
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                                {roundData?.time_limit || 45} minutes
                            </span>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Progress</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {Object.keys(evaluations).length} / {questions.length} completed
                            </span>
                        </div>
                        <Progress 
                            value={(Object.keys(evaluations).length / questions.length) * 100} 
                            className="h-2"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Question List */}
                    <div className="lg:col-span-1">
                        <Card className="p-4 bg-white dark:bg-gray-800 shadow-lg">
                            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                                Tasks
                            </h3>
                            <div className="space-y-2">
                                {questions.map((q: any, idx: number) => {
                                    const metadata = getMetadata(q);
                                    const evaluation = evaluations[q.id];
                                    
                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => setSelectedQuestion(idx)}
                                            className={`w-full p-4 rounded-xl text-left transition-all ${
                                                selectedQuestion === idx
                                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`p-2 rounded-lg ${
                                                        selectedQuestion === idx
                                                            ? 'bg-white/20'
                                                            : 'bg-blue-100 dark:bg-blue-900/30'
                                                    }`}>
                                                        <FileSpreadsheet className={`w-5 h-5 ${
                                                            selectedQuestion === idx
                                                                ? 'text-white'
                                                                : 'text-blue-600 dark:text-blue-400'
                                                        }`} />
                                                    </div>
                                                    <div>
                                                        <p className={`font-semibold ${
                                                            selectedQuestion === idx
                                                                ? 'text-white'
                                                                : 'text-gray-900 dark:text-white'
                                                        }`}>
                                                            Task {idx + 1}
                                                        </p>
                                                        <p className={`text-xs ${
                                                            selectedQuestion === idx
                                                                ? 'text-white/80'
                                                                : 'text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                            {q.points} points
                                                        </p>
                                                    </div>
                                                </div>
                                                {evaluation && (
                                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                                )}
                                            </div>
                                            
                                            {/* Difficulty Badge */}
                                            {metadata.difficulty && (
                                                <div className="mt-2">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                        metadata.difficulty === 'easy'
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                            : metadata.difficulty === 'medium'
                                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                        {metadata.difficulty}
                                                    </span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Submit All Button */}
                            {Object.keys(evaluations).length === questions.length && (
                                <Button
                                    onClick={handleSubmitAllSolutions}
                                    disabled={submitting}
                                    className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                    size="lg"
                                >
                                    {submitting ? 'Submitting...' : 'Submit All Solutions'}
                                </Button>
                            )}
                        </Card>
                    </div>

                    {/* Question Detail */}
                    <div className="lg:col-span-2">
                        {currentQuestion && (
                            <Card className="p-6 bg-white dark:bg-gray-800 shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Task {selectedQuestion + 1} of {questions.length}
                                    </h2>
                                    <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                                        <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                            {currentQuestion.points} points
                                        </span>
                                    </div>
                                </div>

                                {/* Question Description */}
                                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Task Description:
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                        {getMetadata(currentQuestion).description || currentQuestion.question_text}
                                    </p>
                                </div>

                                {/* Required Formulas */}
                                {getMetadata(currentQuestion).required_formulas && (
                                    <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                                        <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                                            📝 Required Excel Formulas:
                                        </h3>
                                        <ul className="list-disc list-inside space-y-1">
                                            {getMetadata(currentQuestion).required_formulas.map((formula: string, idx: number) => (
                                                <li key={idx} className="text-gray-700 dark:text-gray-300">
                                                    {formula}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="space-y-4">
                                    {/* Download Template */}
                                    <Button
                                        onClick={() => handleDownloadTemplate(currentQuestion.id)}
                                        variant="outline"
                                        className="w-full border-2 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                        size="lg"
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        Download Excel Template
                                    </Button>

                                    {/* Upload Solution */}
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                                        <label className="cursor-pointer block">
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls"
                                                onChange={(e) => handleFileSelect(currentQuestion.id, e.target.files?.[0] || null)}
                                                className="hidden"
                                            />
                                            <div className="flex flex-col items-center space-y-3">
                                                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {uploadedFiles[currentQuestion.id]
                                                            ? uploadedFiles[currentQuestion.id].name
                                                            : 'Click to select Excel file'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        .xlsx or .xls files only
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Upload and Evaluate Button */}
                                    {uploadedFiles[currentQuestion.id] && (
                                        <Button
                                            onClick={() => handleUploadAndEvaluate(currentQuestion.id)}
                                            disabled={uploading[currentQuestion.id]}
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                            size="lg"
                                        >
                                            {uploading[currentQuestion.id] ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                    Evaluating...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                                    Upload & Evaluate Solution
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>

                                {/* Evaluation Results */}
                                {evaluations[currentQuestion.id] && (
                                    <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-300 dark:border-green-800">
                                        <div className="flex items-center space-x-3 mb-4">
                                            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                            <h3 className="text-lg font-bold text-green-900 dark:text-green-300">
                                                Evaluation Results
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
                                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {evaluations[currentQuestion.id].score} / {currentQuestion.points}
                                                </p>
                                            </div>
                                            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {evaluations[currentQuestion.id].accuracy_percentage}%
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {evaluations[currentQuestion.id].strengths?.length > 0 && (
                                                <div>
                                                    <p className="font-semibold text-green-800 dark:text-green-300 mb-2">
                                                        ✅ Strengths:
                                                    </p>
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {evaluations[currentQuestion.id].strengths.map((s: string, idx: number) => (
                                                            <li key={idx} className="text-gray-700 dark:text-gray-300 text-sm">
                                                                {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {evaluations[currentQuestion.id].improvements?.length > 0 && (
                                                <div>
                                                    <p className="font-semibold text-orange-800 dark:text-orange-300 mb-2">
                                                        💡 Areas for Improvement:
                                                    </p>
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {evaluations[currentQuestion.id].improvements.map((i: string, idx: number) => (
                                                            <li key={idx} className="text-gray-700 dark:text-gray-300 text-sm">
                                                                {i}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {evaluations[currentQuestion.id].detailed_feedback && (
                                                <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {evaluations[currentQuestion.id].detailed_feedback}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-6">
                                    <Button
                                        onClick={() => setSelectedQuestion(Math.max(0, selectedQuestion - 1))}
                                        disabled={selectedQuestion === 0}
                                        variant="outline"
                                    >
                                        ← Previous Task
                                    </Button>
                                    <Button
                                        onClick={() => setSelectedQuestion(Math.min(questions.length - 1, selectedQuestion + 1))}
                                        disabled={selectedQuestion === questions.length - 1}
                                        variant="outline"
                                    >
                                        Next Task →
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TallyExcelRound;
