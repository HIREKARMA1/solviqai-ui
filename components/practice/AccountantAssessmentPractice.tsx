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
import SubscriptionRequiredModal from '@/components/subscription/SubscriptionRequiredModal'
import { AxiosError } from 'axios'

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
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
    const [subscriptionFeature, setSubscriptionFeature] = useState('this feature')

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
            const axiosError = error as AxiosError<{ detail: string }>
            const errorDetail = axiosError.response?.data?.detail || axiosError.message || 'Failed to create assessment'

            // Check if it's a subscription error
            if (axiosError.response?.status === 403 || errorDetail.includes('Contact HireKarma') || errorDetail.includes('subscription')) {
                setSubscriptionFeature('Excel assessments')
                setShowSubscriptionModal(true)
            } else {
                toast.error('Failed to create assessment')
            }
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
            const axiosError = error as AxiosError<{ detail: string }>
            const errorDetail = axiosError.response?.data?.detail || axiosError.message || 'Failed to start practice session'

            // Check if it's a subscription error
            if (axiosError.response?.status === 403 || errorDetail.includes('Contact HireKarma') || errorDetail.includes('subscription')) {
                setSubscriptionFeature('Excel assessments')
                setShowSubscriptionModal(true)
            } else {
                toast.error(errorDetail)
            }
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
            <div className="w-full min-h-screen bg-white pb-8">
                {/* Blue Top Bar - Practice Mode */}
                <div className="w-full bg-[#007AFF] text-white p-4 px-6 shadow-md mb-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                                <FileSpreadsheet className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div>
                                    <h1 className="text-xl font-bold">Accountant Assessment Practice</h1>
                                    <p className="text-blue-100 text-xs opacity-90">Test your Excel skills with AI-generated accounting scenarios</p>
                                </div>
                                <Badge className="bg-[#A855F7] hover:bg-[#9333EA] text-white border-0 px-3 py-1 text-xs uppercase tracking-wider">
                                    {practiceAssessment.question.difficulty}
                                </Badge>
                            </div>
                        </div>
                        <Button
                            onClick={exitPractice}
                            variant="ghost"
                            className="text-white hover:bg-white/20 hover:text-white"
                        >
                            Exit Practice
                        </Button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                    {/* Question Title Section */}
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-[#00A76F]">
                            {practiceAssessment.question.title}
                        </h2>
                        <p className="text-gray-600">
                            {practiceAssessment.question.description}
                        </p>
                    </div>

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
        <div className="w-full min-h-screen bg-white pb-12">
            {/* Blue Top Bar */}
            <div className="w-full bg-[#007AFF] text-white p-4 px-6 shadow-md">
                <div className="max-w-7xl mx-auto flex items-center gap-3">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        <FileSpreadsheet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Accountant Assessment Practice</h1>
                        <p className="text-blue-100 text-xs opacity-90">Test your Excel skills with AI-generated accounting scenarios</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-8">
                {/* Page Title */}
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900">Accountant Assessment</h2>
                    <p className="text-gray-500">Test your Excel skills with AI-generated accounting scenarios</p>
                </div>

                {/* Main Card */}
                <Card className="shadow-sm border border-gray-200 overflow-hidden">
                    <CardHeader className="border-b border-gray-100 bg-white pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 border-2 border-green-500 rounded-lg">
                                <FileSpreadsheet className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-green-600">Accountant Assessment Practice</CardTitle>
                                <CardDescription>Test your Excel skills with AI-generated accounting scenarios</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {/* Empty State / Content */}
                        {assessments.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl bg-[#F0FDF4] p-12 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                                    <FileSpreadsheet className="w-8 h-8 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-gray-900">No Assessments Yet</h3>
                                    <p className="text-gray-600 max-w-md mx-auto">
                                        Start your first Accountant assessment to test your accounting skills
                                    </p>
                                </div>
                                <Button
                                    onClick={createNewAssessment}
                                    disabled={creating}
                                    className="bg-[#00A76F] hover:bg-[#008f5d] text-white px-8 py-6 text-base rounded-lg shadow-md transition-all hover:scale-105"
                                >
                                    {creating ? (
                                        <>
                                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FileSpreadsheet className="w-5 h-5 mr-2" />
                                            Create Your First Assessment
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assessments.map((assessment, index) => (
                                    <motion.div
                                        key={assessment.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="hover:shadow-md transition-all border border-gray-200 hover:border-green-300 group cursor-pointer" onClick={() => {
                                            if (assessment.status === 'not_started') startPractice(); // Simplified for demo flow
                                            // Real logic calls startAssessment
                                        }}>
                                            <CardContent className="p-6 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div className={`p-3 rounded-lg ${assessment.status === 'evaluated' ? 'bg-green-50' : 'bg-blue-50'}`}>
                                                        <FileSpreadsheet className={`w-6 h-6 ${assessment.status === 'evaluated' ? 'text-green-600' : 'text-blue-600'}`} />
                                                    </div>
                                                    {getStatusBadge(assessment.status)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 line-clamp-1">{assessment.title}</h3>
                                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{assessment.description}</p>
                                                </div>
                                                <div className="pt-2 flex items-center justify-between text-sm text-gray-400">
                                                    <span>{new Date(assessment.created_at).toLocaleDateString()}</span>
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-green-500" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                                {/* Add New Button in Grid */}
                                <button
                                    onClick={createNewAssessment}
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition-colors text-gray-400 hover:text-green-600"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <span className="font-medium">Create New Assessment</span>
                                </button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Subscription Required Modal */}
            <SubscriptionRequiredModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                feature={subscriptionFeature}
            />
        </div>
    )
}
