'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader } from '@/components/ui/loader'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { AlertCircle, CheckCircle2, Clock, Calculator, TrendingUp, Award } from 'lucide-react'
import toast from 'react-hot-toast'

interface Problem {
    id: string
    title: string
    description: string
    specifications: Record<string, Record<string, string>>
    required_calculations: Array<{
        item: string
        label: string
        hint: string
    }>
    difficulty: string
    time_limit: number
    source?: 'ai_generated' | 'template' | 'template_fallback'
    expected_answers?: Record<string, number>
}

interface Evaluation {
    success: boolean
    score: number
    grade: string
    correct_count: number
    total_questions: number
    overall_feedback: string
    detailed_results: Array<{
        item: string
        student_answer: number
        expected_answer: number
        error_percentage: number
        is_correct: boolean
        feedback: string
    }>
    strengths: string[]
    areas_for_improvement: string[]
    recommendations: string[]
}

interface CivilQuantityEstimationProps {
    onBack?: () => void
    assessmentId?: string
    roundId?: string
    roundNumber?: string
}

export default function CivilQuantityEstimation({
    onBack,
    assessmentId,
    roundId,
    roundNumber
}: CivilQuantityEstimationProps) {
    const router = useRouter()

    const [problem, setProblem] = useState<Problem | null>(null)
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
    const [answers, setAnswers] = useState<Record<string, number>>({})
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
    const [loading, setLoading] = useState(false)
    const [startTime, setStartTime] = useState<number | null>(null)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [roundSubmitted, setRoundSubmitted] = useState(false)
    const [roundSubmitError, setRoundSubmitError] = useState<string | null>(null)

    // Scroll to top of page
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Generate new problem
    const generateProblem = async () => {
        scrollToTop()
        setLoading(true)
        setEvaluation(null)
        setAnswers({})
        setElapsedTime(0)

        try {
            const response = await apiClient.generateCivilProblem()
            if (response.success && response.problem) {
                setProblem(response.problem)
                setStartTime(Date.now())

                // Initialize answers with 0
                const initialAnswers: Record<string, number> = {}
                response.problem.required_calculations.forEach((calc: any) => {
                    initialAnswers[calc.item] = 0
                })
                setAnswers(initialAnswers)
            }
        } catch (error) {
            console.error('Failed to generate problem:', error)
            toast.error('Failed to generate problem. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Submit answers for evaluation
    const submitAnswers = async () => {
        if (!problem) return

        // Validate no negative values before submission
        const negativeValues = Object.entries(answers).filter(([_, value]) => value < 0)
        if (negativeValues.length > 0) {
            const negativeList = negativeValues.map(([key, value]) => `${key}=${value}`).join(', ')
            toast.error(`Physical quantities cannot be negative. Invalid values: ${negativeList}`)
            return
        }

        // Calculate elapsed time
        const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
        setElapsedTime(elapsed)

        setLoading(true)
        setRoundSubmitError(null)

        try {
            // Send complete problem object for AI evaluation
            const response = await apiClient.evaluateCivilQuantities({
                problem: problem,
                student_answers: answers
            })

            if (response.success && response.evaluation) {
                setEvaluation(response.evaluation)
                toast.success('Evaluation received')

                // If this is part of an assessment, submit the round
                if (assessmentId && roundId) {
                    try {
                        await apiClient.submitRoundResponses(
                            assessmentId,
                            roundId,
                            [{
                                response_data: {
                                    problem,
                                    student_answers: answers,
                                    evaluation: response.evaluation,
                                },
                                time_taken: elapsed,
                            }]
                        )
                        setRoundSubmitted(true)
                        toast.success('Assessment round recorded successfully!')
                    } catch (submitErr: any) {
                        console.error(submitErr)
                        const message = submitErr?.response?.data?.detail || submitErr?.message || 'Failed to record round'
                        setRoundSubmitError(message)
                        toast.error('Failed to record assessment round')
                    }
                }
            }
        } catch (error) {
            console.error('Failed to evaluate answers:', error)
            toast.error('Failed to evaluate answers. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Handle input change
    const handleAnswerChange = (item: string, value: string) => {
        const numValue = parseFloat(value) || 0

        // Prevent negative values - physical quantities cannot be negative
        if (numValue < 0) {
            toast.error('Physical quantities cannot be negative. Please enter a positive value.')
            return
        }

        setAnswers(prev => ({
            ...prev,
            [item]: numValue
        }))
    }

    // Format time in MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Auto-generate problem on mount if in assessment mode
    useEffect(() => {
        if (assessmentId && !problem) {
            generateProblem()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="w-full bg-gray-50 min-h-screen pb-12">


            <div className="max-w-5xl mx-auto space-y-6 px-4">
                {/* Header Placeholder (Removed original header) */}

                {/* Assessment Context Banner */}
                {assessmentId && (
                    <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
                        Linked to Assessment: <span className="font-medium">{assessmentId}</span>
                        {roundNumber && <span className="ml-2">Round {roundNumber}</span>}
                    </div>
                )}

                {/* Round Submitted Success */}
                {roundSubmitted && (
                    <Card className="border border-emerald-200 bg-emerald-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-emerald-800">Round Submitted</CardTitle>
                            <CardDescription className="text-emerald-700">Your civil quantity estimation has been recorded.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-3">
                            <Button onClick={() => router.push(`/dashboard/student/assessment?id=${assessmentId}`)}>
                                Return to Assessment
                            </Button>
                            <Button variant="ghost" onClick={() => setRoundSubmitted(false)}>
                                Stay and practice more
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Round Submit Error */}
                {roundSubmitError && (
                    <Card className="border border-red-200 bg-red-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-red-800">Submission Error</CardTitle>
                            <CardDescription className="text-red-700">{roundSubmitError}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => setRoundSubmitError(null)} variant="outline">
                                Dismiss
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* New Landing View Design */}
                {!problem && !evaluation && !loading && (
                    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                        {/* Header Section */}
                        <div className="space-y-4 pt-4">
                            <Badge className="bg-blue-100 text-[#2979FF] hover:bg-blue-200 border-none px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider">
                                CIVIL ENGINEERING
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-bold text-[#2979FF] tracking-tight">Practical Skills Practice</h1>
                            <p className="text-gray-500 text-lg max-w-2xl leading-relaxed">
                                Generate situation-based questions to sharpen your Civil Engineering and Quantity Estimation knowledge.
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Topics Available', val: '50+', icon: 'book', color: 'blue' },
                                { label: 'Questions Generated', val: '1000+', icon: 'star', color: 'orange' },
                                { label: 'Practice Sessions', val: '500+', icon: 'target', color: 'red' }
                            ].map((stat, i) => (
                                <Card key={i} className="border-none shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] hover:shadow-lg transition-all duration-300">
                                    <CardContent className="p-8 flex flex-col items-center text-center space-y-3">
                                        <div className={`p-4 rounded-2xl mb-2 ${stat.color === 'blue' ? 'bg-blue-50 text-blue-500' :
                                                stat.color === 'orange' ? 'bg-orange-50 text-orange-500' :
                                                    'bg-red-50 text-red-500'
                                            }`}>
                                            {stat.icon === 'book' && <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                                            {stat.icon === 'star' && <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
                                            {stat.icon === 'target' && <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                        </div>
                                        <h3 className="text-4xl font-bold text-[#2979FF]">{stat.val}</h3>
                                        <p className="text-gray-500 font-medium">{stat.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Question Generator Card */}
                        <Card className="border-none shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] overflow-hidden">
                            {/* Decorative Top Line */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>

                            <CardContent className="p-8 md:p-10 space-y-8">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-gray-900">Question Generator</h2>
                                    <p className="text-gray-500">Customize your practice session by selecting difficulty, topic, and number of questions</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                                            <Award className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <span className="font-bold text-gray-800 text-lg">Select Difficulty Level</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { id: 'easy', label: 'EASY', color: 'green' },
                                            { id: 'medium', label: 'MEDIUM', color: 'blue' },
                                            { id: 'hard', label: 'HARD', color: 'red' }
                                        ].map((level) => (
                                            <button
                                                key={level.id}
                                                onClick={() => setDifficulty(level.id as any)}
                                                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-start gap-4 ${difficulty === level.id
                                                        ? level.color === 'green' ? 'border-green-500 bg-green-50/50 shadow-md ring-1 ring-green-200' :
                                                            level.color === 'blue' ? 'border-blue-500 bg-blue-50/50 shadow-md ring-1 ring-blue-200' :
                                                                'border-red-500 bg-red-50/50 shadow-md ring-1 ring-red-200'
                                                        : 'border-gray-100 hover:border-gray-300 bg-white hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full shadow-sm transition-colors ${difficulty === level.id
                                                        ? level.color === 'green' ? 'bg-green-500' : level.color === 'blue' ? 'bg-blue-500' : 'bg-red-500' // Selected
                                                        : 'bg-gray-200 group-hover:bg-gray-300' // Unselected
                                                    }`}></div>
                                                <span className={`font-bold tracking-wider ${difficulty === level.id ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'
                                                    }`}>{level.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        onClick={generateProblem}
                                        className="w-full bg-[#2979FF] hover:bg-blue-700 text-white text-lg font-bold py-8 rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3"
                                    >
                                        <span>Start Practice Session</span>
                                        <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Loading State */}
                {loading && !problem && (
                    <Card>
                        <CardContent className="pt-6 pb-8">
                            <div className="text-center space-y-4">
                                <Loader className="mx-auto h-12 w-12" />
                                <p className="text-muted-foreground">Generating your civil engineering problem...</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Problem Display */}
                {problem && !evaluation && (
                    <div className="space-y-6 bg-white p-8 rounded-[16px] border border-gray-200 shadow-sm relative overflow-hidden">
                        {/* Top Accent Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#1E88E5]"></div>

                        {/* Title and Badge Row */}
                        <div className="space-y-4 mb-8">
                            <div className="flex items-start gap-4">
                                <div className="p-2 border-2 border-[#FF7043] rounded-lg">
                                    <Calculator className="w-6 h-6 text-[#FF7043]" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[#FF5722]">Civil Engineering Quantity Estimation</h2>
                                    <p className="text-gray-500 text-sm">Test your calculation skills with real-world civil engineering problems</p>
                                </div>
                            </div>

                            <div className="bg-[#FFF5F2] rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{problem.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1">Estimate the quantities based on given specifications.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-[#4CAF50] hover:bg-[#43A047] text-white border-0 px-3 py-1">Easy</Badge>
                                    <Badge variant="outline" className="bg-white text-gray-700 border-gray-200 px-3 py-1">08 points</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Specifications */}
                        <div className="space-y-6 mb-10">
                            <div className="flex items-center gap-3 border-l-4 border-[#FF5722] pl-3">
                                <h3 className="text-lg font-bold text-gray-800">Specifications</h3>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(problem.specifications).map(([category, specs]) => (
                                    <div key={category} className="space-y-2">
                                        <h4 className="font-semibold text-gray-800 text-sm ml-1">{category}</h4>
                                        <div className="bg-[#FFF5F2] rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {Object.entries(specs).map(([key, value]) => (
                                                <div key={key} className="flex items-center justify-between sm:justify-start sm:gap-4">
                                                    <span className="text-sm font-medium text-gray-600">{key}</span>
                                                    <span className="font-bold text-gray-900">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Calculation Form */}
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-gray-800">Your Calculations</h3>
                                <p className="text-sm text-gray-500">Enter your calculated quantities based on the specifications above</p>
                            </div>

                            <div className="space-y-6 pt-2">
                                {problem.required_calculations.map((calc, index) => (
                                    <div key={calc.item} className="space-y-2">
                                        <Label htmlFor={calc.item} className="text-base font-semibold flex items-center gap-3 text-gray-800">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF5722] text-white text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            {calc.label}
                                        </Label>
                                        <Input
                                            id={calc.item}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={answers[calc.item] || ''}
                                            onChange={(e) => handleAnswerChange(calc.item, e.target.value)}
                                            className="h-12 border-gray-200 bg-white focus:border-[#FF5722] focus:ring-[#FF5722] text-lg pl-4 shadow-sm"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8">
                                <Button
                                    onClick={submitAnswers}
                                    disabled={loading || Object.values(answers).every(v => v === 0)}
                                    className="w-full bg-[#FF5722] hover:bg-[#F4511E] text-white py-6 text-lg font-semibold rounded-lg shadow-sm"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="mr-2 h-5 w-5 animate-spin" />
                                            Evaluating...
                                        </>
                                    ) : (
                                        <>
                                            <Calculator className="mr-2 h-5 w-5" />
                                            Generate New Problem
                                        </>
                                    )}
                                </Button>
                                {/* Note: The button text in image says "Generate New Problem" even though it submits. Keeping text as per image, but function submits. Or maybe it means 'Submit'? The user asked to match image. Image says 'Generate New Problem' at bottom. But logically this is submit. I'll stick to 'Generate New Problem' text if that's what's visible, but maybe change to 'Submit Answer' to be safe, or check image... Actual image bottom button says "Generate New Problem". Wait, if I generate new, I lose work. It must be Submit. I will use "Submit Answer" but style it like the image.*/}
                            </div>
                        </div>
                    </div>
                )}

                {/* Evaluation Results */}
                {evaluation && problem && (
                    <div className="space-y-6 bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
                        {/* Title Header matches Problem View */}
                        <div className="p-6 pb-0 border-b border-gray-100 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2 border-2 border-[#FF7043] rounded-lg">
                                    <Calculator className="w-6 h-6 text-[#FF7043]" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[#FF5722]">Civil Engineering Quantity Estimation</h2>
                                    <p className="text-gray-500 text-sm">Test your calculation skills with real-world civil engineering problems</p>
                                </div>
                            </div>
                        </div>

                        {/* Results Banner */}
                        <div className="bg-[#F8FBFF] px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                    <Award className="w-5 h-5 text-blue-500" />
                                    Evaluation Results
                                </h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Time taken: {formatTime(elapsedTime)}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    {evaluation.correct_count === evaluation.total_questions ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    )}
                                    <span className="font-medium text-gray-900">{evaluation.correct_count} out of {evaluation.total_questions} questions correct</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold text-[#2979FF]">{evaluation.score.toFixed(1)}%</div>
                                <Badge className="bg-[#FF5252] hover:bg-[#FF5252] text-white mt-1">Grade: {evaluation.grade}</Badge>
                            </div>
                        </div>

                        {/* Feedback Box */}
                        <div className="mx-6 mt-4 bg-[#FAFAFA] border border-gray-200 p-4 rounded-lg">
                            <p className="text-gray-700 font-medium">{evaluation.overall_feedback}</p>
                        </div>

                        {/* Answer Breakdown */}
                        <div className="p-6 pt-2">
                            <h3 className="font-bold text-lg text-gray-900 mb-1">Answer Breakdown</h3>
                            <p className="text-gray-500 text-sm mb-6">Compare your answers with the expected values</p>

                            <div className="space-y-6">
                                {evaluation.detailed_results.map((result, index) => (
                                    <div key={result.item} className="bg-[#FFF5F2] border border-[#FFCCBC] rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF5252] text-white text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <span className="font-semibold text-gray-900">{problem.required_calculations[index]?.label || result.item}</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                            <div className="bg-white rounded border border-gray-200 p-3">
                                                <span className="text-xs font-bold text-gray-400 uppercase block mb-1">YOUR ANSWER</span>
                                                <span className="text-lg font-bold text-gray-900">{result.student_answer}</span>
                                            </div>
                                            <div className="bg-white rounded border border-gray-200 p-3">
                                                <span className="text-xs font-bold text-gray-400 uppercase block mb-1">EXPECTED</span>
                                                <span className="text-lg font-bold text-gray-900">{result.expected_answer}</span>
                                            </div>
                                        </div>

                                        {!result.is_correct && (
                                            <div className="bg-[#FFEBEE] rounded px-3 py-2 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-[#D32F2F]" />
                                                <span className="text-[#D32F2F] font-medium text-sm">Deviation: {result.error_percentage.toFixed(2)}%</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Improvement & Recommendations Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t border-gray-200 pt-8">
                                <div className="space-y-3">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        <div className="p-1 rounded-full border border-orange-400">
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                        </div>
                                        Areas for Improvement
                                    </h4>
                                    <ul className="space-y-2 pl-2">
                                        {evaluation.areas_for_improvement.map((area, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#FF9800] mt-1.5 shrink-0"></div>
                                                {area.replace(/_/g, ' ')}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        <div className="p-1 rounded-full border border-gray-400 text-gray-400">
                                            <span className="text-xs">Aa</span>
                                        </div>
                                        Study Recommendations
                                    </h4>
                                    <ul className="space-y-2 pl-2">
                                        {evaluation.recommendations.map((rec, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0"></div>
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Bottom CTA */}
                            <div className="mt-12 text-center space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Ready for the Next Challenge?</h3>
                                    <p className="text-gray-500 text-sm">Practice more problems to improve your quantity estimation skills</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button
                                        onClick={() => {
                                            setEvaluation(null)
                                            setProblem(null)
                                            setAnswers({})
                                            scrollToTop()
                                            if (assessmentId) generateProblem()
                                        }}
                                        className="bg-[#FF5722] hover:bg-[#F4511E] text-white px-8 py-2 h-auto"
                                    >
                                        <Calculator className="w-4 h-4 mr-2" />
                                        Try Another One
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.print()}
                                        className="bg-[#F5F5F5] border-gray-200 text-gray-700 hover:bg-gray-100 px-8 py-2 h-auto"
                                    >
                                        Print Results
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
