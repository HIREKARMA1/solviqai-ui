'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
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
  source?: 'ai_generated' | 'template' | 'template_fallback'  // Indicates if problem is AI-generated
  expected_answers?: Record<string, number>  // AI-provided expected answers
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

export default function CivilPracticePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const assessmentId = searchParams?.get('assessment_id') || undefined
  const roundId = searchParams?.get('round_id') || undefined
  const roundNumber = searchParams?.get('round_number') || undefined
  
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
      alert('Failed to generate problem. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Submit answers for evaluation
  const submitAnswers = async () => {
    if (!problem) return
    
    // Calculate elapsed time
    const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
    setElapsedTime(elapsed)
    
    setLoading(true)
    setRoundSubmitError(null)
    
    try {
      // Send complete problem object for AI evaluation
      const response = await apiClient.evaluateCivilQuantities({
        problem: problem,  // Send the entire problem object
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
    <DashboardLayout requiredUserType="student">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Civil Engineering Practice</h1>
          <p className="text-muted-foreground">
            Quantity Estimation Assessment • Test your calculation skills with real-world problems
          </p>
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
          <Card className="border-2 border-dashed">
            <CardContent className="pt-6 pb-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Calculator className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    {assessmentId ? 'Assessment Round Ready' : 'Ready to Practice?'}
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
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
                  className="mt-4"
                >
                  <Calculator className="mr-2 h-4 w-4" />
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
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{problem.title}</CardTitle>
                    <CardDescription className="mt-2">{problem.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {problem.source === 'ai_generated' && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                        🤖 AI Generated Problem
                      </Badge>
                    )}
                    <Badge variant={problem.difficulty === 'easy' ? 'default' : problem.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                      {problem.difficulty.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTime(problem.time_limit)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Specifications */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Specifications:</h3>
                  {Object.entries(problem.specifications).map(([category, specs]) => (
                    <div key={category} className="border rounded-lg p-4 bg-muted/50">
                      <h4 className="font-medium mb-2">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(specs).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calculation Form */}
            <Card>
              <CardHeader>
                <CardTitle>Your Calculations</CardTitle>
                <CardDescription>Enter your calculated quantities based on the specifications above</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {problem.required_calculations.map((calc, index) => (
                    <div key={calc.item} className="space-y-2">
                      <Label htmlFor={calc.item} className="text-base font-medium flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                          {index + 1}
                        </span>
                        {calc.label}
                      </Label>
                      <Input
                        id={calc.item}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={answers[calc.item] || ''}
                        onChange={(e) => handleAnswerChange(calc.item, e.target.value)}
                        className="text-lg h-12"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-8">
                  <Button 
                    onClick={submitAnswers} 
                    disabled={loading || Object.values(answers).every(v => v === 0)}
                    size="lg"
                    className="flex-1"
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
                  <Button 
                    onClick={generateProblem} 
                    variant="outline"
                    size="lg"
                  >
                    New Problem
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
                      className={`border-2 rounded-lg p-4 transition-all ${
                        result.is_correct 
                          ? 'bg-green-50/50 border-green-300 hover:bg-green-50' 
                          : 'bg-red-50/50 border-red-300 hover:bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold ${
                            result.is_correct ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
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
                  <div className="flex gap-3 justify-center">
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
                          className="min-w-[200px]"
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
    </DashboardLayout>
  )
}
