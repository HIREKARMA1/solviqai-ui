"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { 
  Trophy, TrendingUp, Clock, CheckCircle, XCircle, 
  AlertCircle, Sparkles, ArrowLeft, RotateCcw, Download 
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface ReportData {
  assessment: {
    id: string
    title: string
    description: string
    status: string
    total_score: number
    max_possible_score: number
    percentage_score: number
    total_time_minutes: number
    created_at: string
    submitted_at: string
  }
  submissions: Array<{
    id: string
    score: number
    max_score: number
    feedback: string
    mistakes: string[]
    suggestions: string[]
    correctness_score: number
    formula_accuracy: number
    formatting_score: number
    efficiency_score: number
    question: {
      id: string
      title: string
      difficulty: string
      question_type: string
      max_score: number
    }
  }>
}

export default function ExcelAssessmentReport({ assessmentId }: { assessmentId: string }) {
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [assessmentId])

  const fetchReport = async () => {
    try {
      const data = await apiClient.excelAssessment.getAssessmentReport(assessmentId)
      setReport(data)
    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error('Failed to load assessment report')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/20'
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
    if (percentage >= 40) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
    return 'text-red-600 bg-red-50 dark:bg-red-900/20'
  }

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B+'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C'
    return 'F'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  if (!report) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Report Not Found</h3>
        <Button onClick={() => router.back()}>Go Back</Button>
      </Card>
    )
  }

  const { assessment, submissions } = report
  const percentage = assessment.percentage_score

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/dashboard/student/excel-assessment')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assessments
        </Button>
      </div>

      {/* Overall Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="text-center">
            <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
            <CardTitle className="text-3xl">{assessment.title}</CardTitle>
            <CardDescription className="text-lg mt-2">
              Assessment Complete - Here's Your Performance Report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className={`p-8 rounded-lg text-center ${getScoreColor(percentage)}`}>
              <div className="text-6xl font-bold mb-2">
                {getGrade(percentage)}
              </div>
              <div className="text-3xl font-semibold mb-2">
                {assessment.total_score}/{assessment.max_possible_score}
              </div>
              <div className="text-xl">
                {percentage.toFixed(1)}% Score
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                <Clock className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {assessment.total_time_minutes || 0}m
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Time Taken</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {submissions.filter(s => s.score >= s.max_score * 0.6).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Questions Passed</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                <TrendingUp className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {submissions.length > 0 ? Math.round(submissions.reduce((sum, s) => sum + (s.formula_accuracy || 0), 0) / submissions.length) : 0}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Formula Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Results */}
      {submissions.map((submission, idx) => (
        <motion.div
          key={submission.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{submission.question.title}</CardTitle>
                  <CardDescription className="mt-2">
                    <Badge className="bg-purple-600 mr-2">{submission.question.difficulty}</Badge>
                    <Badge variant="outline">{submission.question.question_type}</Badge>
                  </CardDescription>
                </div>
                <Badge className={`text-2xl px-4 py-2 ${
                  (submission.score / submission.question.max_score * 100) >= 80 ? 'bg-green-600' :
                  (submission.score / submission.question.max_score * 100) >= 60 ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}>
                  {submission.score}/{submission.question.max_score}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Correctness</div>
                  <div className="text-lg font-bold text-blue-600">{submission.correctness_score || 0}%</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Formula Accuracy</div>
                  <div className="text-lg font-bold text-purple-600">{submission.formula_accuracy || 0}%</div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Formatting</div>
                  <div className="text-lg font-bold text-yellow-600">{submission.formatting_score || 0}%</div>
                </div>
                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Efficiency</div>
                  <div className="text-lg font-bold text-pink-600">{submission.efficiency_score || 0}%</div>
                </div>
              </div>

              {/* AI Feedback */}
              {submission.feedback && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    AI Feedback
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">{submission.feedback}</p>
                </div>
              )}

              {/* Mistakes */}
              {submission.mistakes && submission.mistakes.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2 text-red-600 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Mistakes Found
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {submission.mistakes.map((mistake, idx) => (
                      <li key={idx}>{mistake}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {submission.suggestions && submission.suggestions.length > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2 text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Suggestions for Improvement
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {submission.suggestions.map((suggestion, idx) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push('/dashboard/student/excel-assessment')}
              size="lg"
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Try New Assessment
            </Button>
            <Button
              onClick={() => window.print()}
              size="lg"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
