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
        <div className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50/30 pb-8">
            <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                            <Calculator className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-clip-text text-transparent">
                                Civil Engineering Quantity Estimation
                            </h1>
                            <p className="text-muted-foreground text-base sm:text-lg mt-1">
                                Test your calculation skills with real-world civil engineering problems
                            </p>
                        </div>
                    </div>
                </div>

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

                {/* Generate Problem Button */}
                {!problem && !evaluation && !loading && (
                    <Card className="border-2 border-dashed border-orange-200 hover:border-orange-400 transition-all duration-300 shadow-lg hover:shadow-xl">
                        <CardContent className="pt-8 pb-10">
                            <div className="text-center space-y-6">
                                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300">
                                    <Calculator className="w-12 h-12 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                        {assessmentId ? 'Assessment Round Ready' : 'Ready to Practice?'}
                                    </h2>
                                    <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
                                        {assessmentId
                                            ? 'Click below to generate your quantity estimation problem for this assessment round'
                                            : 'Generate a quantity estimation problem and calculate material quantities for real-world civil engineering scenarios'
                                        }
                                    </p>
                                </div>
                                <Button
                                    onClick={generateProblem}
                                    disabled={loading}
                                    size="lg"
                                    className="mt-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-6 text-lg"
                                >
                                    <Calculator className="mr-2 h-5 w-5" />
                                    Generate New Problem
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
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
                    <div className="space-y-6">
                        {/* Problem Header */}
                        <Card className="shadow-lg border-2 border-orange-100">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                                <div className="flex items-start justify-between flex-wrap gap-4">
                                    <div className="flex-1">
                                        <CardTitle className="text-2xl sm:text-3xl text-gray-900 mb-2">{problem.title}</CardTitle>
                                        <CardDescription className="text-base text-gray-700">{problem.description}</CardDescription>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {problem.source === 'ai_generated' && (
                                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md">
                                                🤖 AI Generated
                                            </Badge>
                                        )}
                                        <Badge
                                            variant={problem.difficulty === 'easy' ? 'default' : problem.difficulty === 'medium' ? 'secondary' : 'destructive'}
                                            className="shadow-sm"
                                        >
                                            {problem.difficulty.toUpperCase()}
                                        </Badge>
                                        <Badge variant="outline" className="shadow-sm">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatTime(problem.time_limit)}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {/* Specifications */}
                                <div className="space-y-5">
                                    <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></span>
                                        Specifications
                                    </h3>
                                    {Object.entries(problem.specifications).map(([category, specs]) => (
                                        <div key={category} className="border-2 border-orange-200 rounded-xl p-5 bg-gradient-to-br from-orange-50/50 to-red-50/50 hover:shadow-md transition-shadow duration-300">
                                            <h4 className="font-semibold text-lg mb-3 text-gray-800">{category}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {Object.entries(specs).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between items-center p-2 bg-white/80 rounded-lg border border-orange-100">
                                                        <span className="text-sm font-medium text-gray-600">{key}:</span>
                                                        <span className="text-sm font-bold text-gray-900">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Calculation Form */}
                        <Card className="shadow-lg border-2 border-orange-100">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                                <CardTitle className="text-2xl text-gray-900">Your Calculations</CardTitle>
                                <CardDescription className="text-base text-gray-700">Enter your calculated quantities based on the specifications above</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-6">
                                    {problem.required_calculations.map((calc, index) => (
                                        <div key={calc.item} className="space-y-3 p-4 bg-gradient-to-br from-orange-50/30 to-red-50/30 rounded-xl border border-orange-200 hover:shadow-md transition-shadow duration-300">
                                            <Label htmlFor={calc.item} className="text-base font-semibold flex items-center gap-3 text-gray-800">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-sm font-bold shadow-md">
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
                                                className="text-lg h-14 border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg bg-white shadow-sm"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8">
                                    <Button
                                        onClick={submitAnswers}
                                        disabled={loading || Object.values(answers).every(v => v === 0)}
                                        size="lg"
                                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 py-6 text-lg font-semibold"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader className="mr-2 h-5 w-5 animate-spin" />
                                                Evaluating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                                Submit for Evaluation
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Evaluation Results */}
                {evaluation && problem && (
                    <div className="space-y-6">
                        {/* Score Card */}
                        <Card className="border-2 border-primary shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-2xl flex items-center gap-2">
                                            <Award className="w-6 h-6 text-primary" />
                                            Evaluation Results
                                        </CardTitle>
                                        <CardDescription className="mt-1 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Time taken: {formatTime(elapsedTime)}
                                        </CardDescription>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <div className="text-5xl font-bold text-primary mb-2">{evaluation.score.toFixed(1)}%</div>
                                        <Badge
                                            className="text-sm px-3 py-1"
                                            variant={
                                                evaluation.grade === 'A+' || evaluation.grade === 'A' ? 'default' :
                                                    evaluation.grade === 'B' ? 'secondary' : 'destructive'
                                            }
                                        >
                                            Grade: {evaluation.grade}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-lg">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <span className="font-medium">
                                            {evaluation.correct_count} out of {evaluation.total_questions} questions correct
                                        </span>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-base">{evaluation.overall_feedback}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detailed Results */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-2xl">📊</span>
                                    Answer Breakdown
                                </CardTitle>
                                <CardDescription>Compare your answers with the expected values</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {evaluation.detailed_results.map((result, index) => (
                                        <div
                                            key={result.item}
                                            className={`border-2 rounded-lg p-4 transition-all ${result.is_correct
                                                ? 'bg-green-50/50 border-green-300 hover:bg-green-50'
                                                : 'bg-red-50/50 border-red-300 hover:bg-red-50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold ${result.is_correct ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                                                        }`}>
                                                        {index + 1}
                                                    </span>
                                                    <h4 className="font-semibold text-base">
                                                        {problem.required_calculations[index]?.label || result.item}
                                                    </h4>
                                                </div>
                                                {result.is_correct ? (
                                                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                                                ) : (
                                                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/80 rounded-md p-3 border">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase">Your Answer</span>
                                                    <p className="text-lg font-bold mt-1">{result.student_answer}</p>
                                                </div>
                                                <div className="bg-white/80 rounded-md p-3 border">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase">Expected</span>
                                                    <p className="text-lg font-bold mt-1">{result.expected_answer}</p>
                                                </div>
                                            </div>
                                            {!result.is_correct && (
                                                <div className="mt-3 p-2 bg-red-100 rounded-md">
                                                    <p className="text-sm font-medium text-red-800">
                                                        ⚠️ Deviation: {result.error_percentage.toFixed(2)}%
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Feedback Section */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Strengths */}
                            {evaluation.strengths.length > 0 && evaluation.strengths[0] !== 'None identified' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                            Strengths
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {evaluation.strengths.map((strength, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm">{strength.replace(/_/g, ' ')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Areas for Improvement */}
                            {evaluation.areas_for_improvement.length > 0 && evaluation.areas_for_improvement[0] !== 'None - All correct!' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-orange-600" />
                                            Areas for Improvement
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {evaluation.areas_for_improvement.map((area, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm">{area.replace(/_/g, ' ')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Recommendations */}
                        <Card>
                            <CardHeader>
                                <CardTitle>📚 Study Recommendations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {evaluation.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-primary mt-0.5">•</span>
                                            <span className="text-sm">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                            <CardContent className="pt-6">
                                <div className="text-center space-y-4">
                                    <h3 className="text-lg font-semibold">
                                        {assessmentId && roundSubmitted ? 'Round Complete!' : 'Ready for the Next Challenge?'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {assessmentId && roundSubmitted
                                            ? 'Your assessment has been recorded. You can practice more or return to the assessment.'
                                            : 'Practice more problems to improve your quantity estimation skills'
                                        }
                                    </p>
                                    <div className="flex gap-3 justify-center flex-wrap">
                                        {assessmentId && roundSubmitted ? (
                                            <>
                                                <Button
                                                    onClick={() => router.push(`/dashboard/student/assessment?id=${assessmentId}`)}
                                                    size="lg"
                                                    className="min-w-[200px]"
                                                >
                                                    Return to Assessment
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    onClick={() => {
                                                        setEvaluation(null)
                                                        setProblem(null)
                                                        setAnswers({})
                                                        setRoundSubmitted(false)
                                                        generateProblem()
                                                    }}
                                                >
                                                    <Calculator className="mr-2 h-5 w-5" />
                                                    Practice More
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    onClick={() => {
                                                        setEvaluation(null)
                                                        setProblem(null)
                                                        setAnswers({})
                                                        scrollToTop()
                                                        if (assessmentId) generateProblem()
                                                    }}
                                                    size="lg"
                                                    className="min-w-[200px] bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                                                >
                                                    <Calculator className="mr-2 h-5 w-5" />
                                                    Try Another One
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    onClick={() => window.print()}
                                                >
                                                    Print Results
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}

