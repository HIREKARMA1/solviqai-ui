"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { 
  FileSpreadsheet, Upload, CheckCircle, Clock, AlertCircle, 
  Download, FileText, TrendingUp, Award, ArrowLeft, PlayCircle 
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import ExcelInterface from './ExcelInterface'

interface Question {
  id: string
  title: string
  description: string
  question_type: string
  difficulty: string
  instructions: string
  max_score: number
  time_limit: number | null
  expected_output: any
  sample_data: any
}

interface Assessment {
  id: string
  title: string
  description: string
  status: string
  question_ids: string[]
  questions: Question[]
  started_at: string | null
  total_time_minutes: number | null
}

interface Submission {
  [questionId: string]: {
    file?: File
    uploaded: boolean
    evaluation?: any
  }
}

export default function ExcelAssessmentDetail({ assessmentId }: { assessmentId: string }) {
  const router = useRouter()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Submission>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)

  useEffect(() => {
    fetchAssessment()
  }, [assessmentId])

  const fetchAssessment = async () => {
    try {
      const data = await apiClient.excelAssessment.getAssessment(assessmentId)
      setAssessment(data)

      // Initialize submissions tracking
      const initialSubmissions: Submission = {}
      data.questions.forEach((q: Question) => {
        initialSubmissions[q.id] = { uploaded: false }
      })
      setSubmissions(initialSubmissions)
    } catch (error) {
      console.error('Error fetching assessment:', error)
      toast.error('Failed to load assessment')
    } finally {
      setLoading(false)
    }
  }

  const startAssessment = async () => {
    try {
      await apiClient.excelAssessment.startAssessment(assessmentId)
      await fetchAssessment()
      toast.success('Assessment started!')
    } catch (error) {
      console.error('Error starting assessment:', error)
      toast.error('Failed to start assessment')
    }
  }

  const handleFileSelect = (questionId: string, file: File) => {
    setSubmissions(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        file
      }
    }))
  }

  const uploadFile = async (questionId: string) => {
    const submission = submissions[questionId]
    if (!submission?.file) {
      toast.error('Please select a file first')
      return
    }

    setUploading(questionId)
    try {
      const result = await apiClient.excelAssessment.submitExcelFile(
        assessmentId,
        questionId,
        submission.file
      )

      setSubmissions(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          uploaded: true,
          evaluation: result.evaluation
        }
      }))

      toast.success('File uploaded and evaluated successfully!')
      
      // Move to next question if available
      if (currentQuestion < (assessment?.questions.length || 0) - 1) {
        setCurrentQuestion(currentQuestion + 1)
      }
    } catch (error: any) {
      console.error('Error uploading file:', error)
      toast.error(error.response?.data?.detail || 'Failed to upload file')
    } finally {
      setUploading(null)
    }
  }

  const completeAssessment = async () => {
    try {
      const result = await apiClient.excelAssessment.completeAssessment(assessmentId)
      toast.success('Assessment completed! Viewing report...')
      router.push(`/dashboard/student/excel-assessment/${assessmentId}/report`)
    } catch (error) {
      console.error('Error completing assessment:', error)
      toast.error('Failed to complete assessment')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  if (!assessment) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Assessment Not Found</h3>
        <Button onClick={() => router.back()}>Go Back</Button>
      </Card>
    )
  }

  const allQuestionsSubmitted = assessment.questions.every(q => submissions[q.id]?.uploaded)

  // If not started, show start screen
  if (assessment.status === 'not_started') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="text-center">
            <FileSpreadsheet className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <CardTitle className="text-3xl">{assessment.title}</CardTitle>
            <CardDescription className="text-lg mt-2">
              {assessment.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Assessment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                <Clock className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-purple-600">~20m</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Estimated Time</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <Award className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">100</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Points</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Instructions
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>You will be presented with an Excel-based accounting scenario</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Read the instructions carefully and create your solution directly in the spreadsheet</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Use Excel formulas (=SUM, =IF, etc.) to complete the calculations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>AI will evaluate your solution based on formulas, accuracy, and formatting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>You can review your performance report after completing the assessment</span>
                </li>
              </ul>
            </div>

            {/* Start Button */}
            <Button 
              onClick={startAssessment} 
              size="lg" 
              className="w-full bg-green-600 hover:bg-green-700 text-lg h-14"
            >
              <PlayCircle className="w-6 h-6 mr-2" />
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Assessment in progress
  const question = assessment.questions[currentQuestion]
  const submission = submissions[question?.id]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>



      {/* Question Card */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <Badge className="bg-purple-600">
              {question.difficulty}
            </Badge>
            <Badge variant="outline">
              {question.max_score} points
            </Badge>
          </div>
          <CardTitle className="text-2xl">{question.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {question.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Excel Interface */}
          <ExcelInterface
            questionId={question.id}
            assessmentId={assessmentId}
            instructions={question.instructions}
            sampleData={question.sample_data}
            onSubmit={async (data) => {
              setUploading(question.id)
              try {
                const result = await apiClient.excelAssessment.submitSpreadsheetData(
                  assessmentId,
                  question.id,
                  data
                )

                setSubmissions(prev => ({
                  ...prev,
                  [question.id]: {
                    ...prev[question.id],
                    uploaded: true,
                    evaluation: result.evaluation
                  }
                }))

                toast.success('Solution submitted successfully! Redirecting to report...')
                
                // Complete assessment and redirect to report page
                await apiClient.excelAssessment.completeAssessment(assessmentId)
                router.push(`/dashboard/student/excel-assessment/${assessmentId}/report`)
              } catch (error: any) {
                console.error('Error submitting solution:', error)
                toast.error(error.response?.data?.detail || 'Failed to submit solution')
              } finally {
                setUploading(null)
              }
            }}
          />
        </CardContent>
      </Card>


    </div>
  )
}
