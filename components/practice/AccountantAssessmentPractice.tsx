'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { FileSpreadsheet, Clock, CheckCircle, ArrowRight, Trophy, Sparkles, RotateCcw, Award, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import ExcelInterface from '@/components/excel-assessment/ExcelInterface'

interface ExcelAssessment {
    id: string
    title: string
    description: string
    status: string
    total_score: number
    max_possible_score: number
    percentage_score: number
    created_at: string
    submitted_at: string | null
    total_time_minutes: number | null
    question_ids: string[]
}

interface Question {
    id: string
    title: string
    description: string
    instructions: string
    sample_data?: any
    difficulty: string
    max_score: number
}

interface PracticeAssessment {
    id: string
    question: Question
}

interface AccountantAssessmentPracticeProps {
    onBack?: () => void
}

export default function AccountantAssessmentPractice({ onBack }: AccountantAssessmentPracticeProps) {
    const [assessments, setAssessments] = useState<ExcelAssessment[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [practiceMode, setPracticeMode] = useState(false)
    const [practiceAssessment, setPracticeAssessment] = useState<PracticeAssessment | null>(null)
    const [practiceLoading, setPracticeLoading] = useState(false)
    const [evaluation, setEvaluation] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchAssessments()
    }, [])

    const fetchAssessments = async () => {
        try {
            const data = await apiClient.excelAssessment.getAssessments()
            setAssessments(data)
        } catch (error) {
            console.error('Error fetching assessments:', error)
            toast.error('Failed to load assessments')
        } finally {
            setLoading(false)
        }
    }

    const createNewAssessment = async () => {
        setCreating(true)
        try {
            const newAssessment = await apiClient.excelAssessment.createAssessment({
                title: 'Accountant Assessment',
                description: 'Test your Excel skills with practical accounting scenarios',
                num_questions: 1,
                difficulty_level: 'intermediate'
            })

            // Redirect to the new assessment
            window.location.href = `/dashboard/student/excel-assessment/${newAssessment.id}`
        } catch (error) {
            console.error('Error creating assessment:', error)
            toast.error('Failed to create assessment')
            setCreating(false)
        }
    }

    const startPractice = async () => {
        setPracticeLoading(true)
        setEvaluation(null)
        try {
            // Create a temporary practice assessment
            const newAssessment = await apiClient.excelAssessment.createAssessment({
                title: 'Practice Session',
                description: 'Practice Excel skills with instant AI feedback',
                num_questions: 1,
                difficulty_level: 'intermediate'
            })

            // Start the assessment
            await apiClient.excelAssessment.startAssessment(newAssessment.id)

            // Wait a moment for the assessment to be fully initialized
            await new Promise(resolve => setTimeout(resolve, 500))

            // Get assessment details to get the question
            const assessmentDetails = await apiClient.excelAssessment.getAssessment(newAssessment.id)

            if (assessmentDetails.questions && assessmentDetails.questions.length > 0) {
                // Verify assessment is in progress
                if (assessmentDetails.status !== 'in_progress') {
                    console.warn('Assessment status:', assessmentDetails.status)
                    // Try to start again if not in progress
                    await apiClient.excelAssessment.startAssessment(newAssessment.id)
                }

                setPracticeAssessment({
                    id: newAssessment.id,
                    question: assessmentDetails.questions[0]
                })
                setPracticeMode(true)
                toast.success('Practice session started!')
            } else {
                throw new Error('No question generated')
            }
        } catch (error: any) {
            console.error('Error starting practice:', error)
            toast.error(error.response?.data?.detail || error.message || 'Failed to start practice session')
        } finally {
            setPracticeLoading(false)
        }
    }

    const handlePracticeSubmit = async (spreadsheetData: any) => {
        if (!practiceAssessment) return

        setSubmitting(true)
        try {
            // Verify assessment is still in progress before submitting
            const assessmentDetails = await apiClient.excelAssessment.getAssessment(practiceAssessment.id)

            if (assessmentDetails.status !== 'in_progress') {
                // If not in progress, try to start it
                await apiClient.excelAssessment.startAssessment(practiceAssessment.id)
                await new Promise(resolve => setTimeout(resolve, 300))
            }

            const result = await apiClient.excelAssessment.submitSpreadsheetData(
                practiceAssessment.id,
                practiceAssessment.question.id,
                spreadsheetData
            )

            if (result.evaluation) {
                setEvaluation(result.evaluation)
                toast.success('Solution evaluated successfully!')
            } else {
                throw new Error('No evaluation received from server')
            }
        } catch (error: any) {
            console.error('Error submitting solution:', error)
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to evaluate solution'
            toast.error(errorMessage)

            // If assessment not found or not in progress, show helpful message
            if (error.response?.status === 404 || errorMessage.includes('not found')) {
                toast.error('Assessment not found. Please start a new practice session.')
            } else if (errorMessage.includes('not in progress')) {
                toast.error('Assessment not started. Please try again.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const tryAnotherQuestion = async () => {
        setEvaluation(null)
        setPracticeAssessment(null)
        await startPractice()
    }

    const exitPractice = () => {
        setPracticeMode(false)
        setPracticeAssessment(null)
        setEvaluation(null)
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
            not_started: { label: 'Not Started', color: 'bg-gray-500', icon: Clock },
            in_progress: { label: 'In Progress', color: 'bg-blue-500', icon: Clock },
            submitted: { label: 'Submitted', color: 'bg-yellow-500', icon: CheckCircle },
            evaluated: { label: 'Evaluated', color: 'bg-green-500', icon: Trophy }
        }

        const config = statusConfig[status] || statusConfig.not_started
        const Icon = config.icon

        return (
            <Badge className={`${config.color} text-white flex items-center gap-1 shadow-sm`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }

    // Practice Mode - Show Excel Interface with evaluation
    if (practiceMode && practiceAssessment) {
        return (
            <div className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-8">
                <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                                <FileSpreadsheet className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                                    Practice Mode
                                </h1>
                                <p className="text-muted-foreground text-base sm:text-lg mt-1">
                                    Practice Excel skills with instant AI feedback
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={exitPractice}
                            variant="outline"
                            className="border-gray-300"
                        >
                            Exit Practice
                        </Button>
                    </div>

                    {/* Question Card */}
                    <Card className="shadow-lg border-2 border-green-100 dark:border-green-900">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-t-lg">
                            <div className="flex items-start justify-between mb-2">
                                <Badge className="bg-purple-600">
                                    {practiceAssessment.question.difficulty}
                                </Badge>
                                <Badge variant="outline">
                                    {practiceAssessment.question.max_score} points
                                </Badge>
                            </div>
                            <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">{practiceAssessment.question.title}</CardTitle>
                            <CardDescription className="text-base mt-2 text-gray-700 dark:text-gray-300">
                                {practiceAssessment.question.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {/* Excel Interface */}
                            <ExcelInterface
                                questionId={practiceAssessment.question.id}
                                assessmentId={practiceAssessment.id}
                                instructions={practiceAssessment.question.instructions}
                                sampleData={practiceAssessment.question.sample_data}
                                onSubmit={handlePracticeSubmit}
                                isSubmitted={!!evaluation}
                                evaluation={evaluation}
                            />
                        </CardContent>
                    </Card>

                    {/* Evaluation Results */}
                    {evaluation && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="shadow-lg border-2 border-primary">
                                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
                                    <CardTitle className="text-2xl flex items-center gap-2">
                                        <Award className="w-6 h-6 text-primary" />
                                        Evaluation Results
                                    </CardTitle>
                                    <CardDescription>AI feedback on your solution</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    {/* Score */}
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                                        <span className="text-lg font-semibold">Overall Score:</span>
                                        <Badge className="text-2xl px-4 py-2 bg-green-600">
                                            {evaluation.score?.toFixed(1) || 0}/10
                                        </Badge>
                                    </div>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center border border-blue-200 dark:border-blue-800">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                Correctness
                                            </div>
                                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                {evaluation.correctness_score || 0}%
                                            </div>
                                        </div>
                                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center border border-purple-200 dark:border-purple-800">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                Formula Accuracy
                                            </div>
                                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                                {evaluation.formula_accuracy || 0}%
                                            </div>
                                        </div>
                                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center border border-yellow-200 dark:border-yellow-800">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                Formatting
                                            </div>
                                            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                                {evaluation.formatting_score || 0}%
                                            </div>
                                        </div>
                                        <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-center border border-pink-200 dark:border-pink-800">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                Efficiency
                                            </div>
                                            <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                                                {evaluation.efficiency_score || 0}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feedback */}
                                    {evaluation.feedback && (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                AI Feedback
                                            </h4>
                                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                {evaluation.feedback}
                                            </p>
                                        </div>
                                    )}

                                    {/* Mistakes */}
                                    {evaluation.mistakes && evaluation.mistakes.length > 0 && (
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-800 dark:text-red-300">
                                                <AlertCircle className="w-4 h-4" />
                                                Mistakes Found
                                            </h4>
                                            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                                {evaluation.mistakes.map((mistake: string, idx: number) => (
                                                    <li key={idx}>{mistake}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Suggestions */}
                                    {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-800 dark:text-green-300">
                                                <Sparkles className="w-4 h-4" />
                                                Suggestions for Improvement
                                            </h4>
                                            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                                {evaluation.suggestions.map((suggestion: string, idx: number) => (
                                                    <li key={idx}>{suggestion}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 justify-center pt-4">
                                        <Button
                                            onClick={tryAnotherQuestion}
                                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                        >
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Try Another Question
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-8">
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="flex justify-center items-center min-h-[400px]">
                        <Loader size="lg" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50/30 pb-8">
            <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                            <FileSpreadsheet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                                Accountant Assessment Practice
                            </h1>
                            <p className="text-muted-foreground text-base sm:text-lg mt-1">
                                Test your Excel skills with AI-generated accounting scenarios
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <Button
                        onClick={startPractice}
                        disabled={practiceLoading}
                        size="lg"
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-50 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                        {practiceLoading ? (
                            <>
                                <Loader size="sm" className="mr-2" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Practice Now
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={createNewAssessment}
                        disabled={creating}
                        size="lg"
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                        {creating ? (
                            <>
                                <Loader size="sm" className="mr-2" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <FileSpreadsheet className="w-5 h-5 mr-2" />
                                New Assessment
                            </>
                        )}
                    </Button>
                </div>

                {/* Assessment Grid */}
                {assessments.length === 0 ? (
                    <Card className="p-12 text-center border-2 border-dashed border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-xl mb-6 transform hover:scale-110 transition-transform duration-300">
                            <FileSpreadsheet className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-gray-900">No Assessments Yet</h3>
                        <p className="text-gray-600 mb-6 text-lg">
                            Start your first Accountant assessment to test your accounting skills
                        </p>
                        <Button
                            onClick={createNewAssessment}
                            disabled={creating}
                            size="lg"
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                            <FileSpreadsheet className="w-5 h-5 mr-2" />
                            Create Your First Assessment
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assessments.map((assessment, index) => (
                            <motion.div
                                key={assessment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-l-4 border-l-green-500 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <FileSpreadsheet className="w-8 h-8 text-green-600" />
                                            {getStatusBadge(assessment.status)}
                                        </div>
                                        <CardTitle className="text-xl text-gray-900">{assessment.title}</CardTitle>
                                        <CardDescription className="line-clamp-2 text-gray-700">
                                            {assessment.description || 'Accountant assessment for accounting professionals'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-6">
                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                <div className="text-xs text-gray-600 mb-1 font-medium">Questions</div>
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {assessment.question_ids?.length || 0}
                                                </div>
                                            </div>
                                            {assessment.status === 'evaluated' && (
                                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                    <div className="text-xs text-gray-600 mb-1 font-medium">Score</div>
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {assessment.percentage_score.toFixed(0)}%
                                                    </div>
                                                </div>
                                            )}
                                            {assessment.total_time_minutes && (
                                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                                    <div className="text-xs text-gray-600 mb-1 font-medium">Time</div>
                                                    <div className="text-lg font-bold text-purple-600 flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {assessment.total_time_minutes}m
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        <Link href={
                                            assessment.status === 'evaluated'
                                                ? `/dashboard/student/excel-assessment/${assessment.id}/report`
                                                : `/dashboard/student/excel-assessment/${assessment.id}`
                                        }>
                                            <Button
                                                className="w-full group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300"
                                                variant={assessment.status === 'evaluated' ? 'outline' : 'default'}
                                            >
                                                {assessment.status === 'not_started' && 'Start Assessment'}
                                                {assessment.status === 'in_progress' && 'Continue Assessment'}
                                                {assessment.status === 'evaluated' && 'View Report'}
                                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>

                                        {/* Date */}
                                        <div className="text-xs text-gray-500 text-center">
                                            Created {new Date(assessment.created_at).toLocaleDateString()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

