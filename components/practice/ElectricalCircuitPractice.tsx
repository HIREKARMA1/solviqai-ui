'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { Zap, CheckCircle2, AlertCircle, Award, TrendingUp, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Excalidraw is large; load client-side only
const Excalidraw = dynamic(
  async () => {
    const mod = await import('@excalidraw/excalidraw')
    return { default: mod.Excalidraw }
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <Loader size="lg" />
      </div>
    )
  }
)

interface ElectricalCircuitPracticeProps {
  onBack?: () => void
  assessmentId?: string
  roundId?: string
  roundNumber?: string
}

export default function ElectricalCircuitPractice({
  onBack,
  assessmentId,
  roundId,
  roundNumber
}: ElectricalCircuitPracticeProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [question, setQuestion] = useState<string>("")
  const [evaluation, setEvaluation] = useState<any>(null)
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const [roundSubmitted, setRoundSubmitted] = useState(false)
  const [roundSubmitError, setRoundSubmitError] = useState<string | null>(null)
  const [isRestored, setIsRestored] = useState(false)

  // Load Excalidraw CSS on mount (backup if layout import fails)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - CSS import doesn't have type declarations
      import('@excalidraw/excalidraw/index.css').catch((err) => {
        console.warn('Failed to load Excalidraw CSS:', err)
      })
    }
  }, [])

  // Auto-save key for localStorage
  const storageKey = `electrical-circuit-${assessmentId || 'practice'}-${roundId || 'draft'}`

  const onExcalidrawAPIMount = useCallback((api: any) => {
    setExcalidrawAPI(api)
  }, [])

  // Auto-save to localStorage on scene changes
  const handleSceneChange = useCallback((elements: any, appState: any, files: any) => {
    try {
      const saveData = {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
        },
        files,
        question,
        timestamp: Date.now(),
      }
      localStorage.setItem(storageKey, JSON.stringify(saveData))
    } catch (error) {
      console.error('Failed to auto-save:', error)
    }
  }, [storageKey, question])

  const handleGenerate = async () => {
    setBusy(true)
    setEvaluation(null)
    try {
      const res = await apiClient.generateElectricalQuestion()
      const newQuestion = res?.question || "Design a full-wave bridge rectifier with labeled components and proper input/output connections."
      setQuestion(newQuestion)

      try {
        localStorage.removeItem(storageKey)
      } catch (error) {
        console.error('Failed to clear auto-save:', error)
      }

      toast.success('Question generated')
    } catch (e) {
      console.error(e)
      toast.error('Failed to generate question')
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (!excalidrawAPI) {
        toast.error('Canvas not ready')
        return
      }

      const elements = excalidrawAPI.getSceneElements()

      if (!elements || elements.length === 0) {
        toast.error('Please draw your circuit before submitting')
        return
      }

      const validElements = elements.filter((el: any) => !el.isDeleted)
      if (validElements.length === 0) {
        toast.error('Your canvas is empty. Please draw your circuit before submitting')
        return
      }

      setBusy(true)
      setEvaluation(null)
      setRoundSubmitError(null)
      const startedAt = Date.now()
      const appState = excalidrawAPI.getAppState()
      const files = excalidrawAPI.getFiles()

      const drawingData = {
        elements,
        appState,
        files,
      }

      const payload = {
        question,
        drawing: drawingData,
      }
      const res = await apiClient.evaluateElectricalDiagram(payload)
      setEvaluation(res)
      toast.success('Evaluation received')

      if (assessmentId && roundId) {
        try {
          const timeTaken = Math.max(1, Math.floor((Date.now() - startedAt) / 1000))
          await apiClient.submitRoundResponses(
            assessmentId,
            roundId,
            [{
              response_data: {
                question,
                evaluation: res,
                drawing: drawingData,
              },
              time_taken: timeTaken,
            }]
          )
          setRoundSubmitted(true)
          toast.success('Assessment round recorded successfully!')

          try {
            localStorage.removeItem(storageKey)
          } catch (error) {
            console.error('Failed to clear auto-save:', error)
          }
        } catch (submitErr: any) {
          console.error(submitErr)
          const message = submitErr?.response?.data?.detail || submitErr?.message || 'Failed to record round'
          setRoundSubmitError(message)
          toast.error('Failed to record assessment round')
        }
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to evaluate diagram')
    } finally {
      setBusy(false)
    }
  }

  // Restore saved work from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        const age = Date.now() - (data.timestamp || 0)

        if (age < 24 * 60 * 60 * 1000) {
          setQuestion(data.question || "")
          setIsRestored(true)

          if (excalidrawAPI && data.elements) {
            setTimeout(() => {
              excalidrawAPI.updateScene({
                elements: data.elements,
                appState: data.appState || {},
              })
              toast.success('Previous work restored', { duration: 3000 })
            }, 100)
          }
          return
        } else {
          localStorage.removeItem(storageKey)
        }
      }
    } catch (error) {
      console.error('Failed to restore saved work:', error)
    }

    if (!isRestored) {
      handleGenerate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excalidrawAPI])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        const age = Date.now() - (data.timestamp || 0)

        if (age < 24 * 60 * 60 * 1000 && data.question) {
          setQuestion(data.question)
          setIsRestored(true)
        }
      }
    } catch (error) {
      console.error('Failed to restore question:', error)
    }
  }, [])

  const handleClearCanvas = () => {
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({ elements: [] })
      try {
        localStorage.removeItem(storageKey)
      } catch (error) {
        console.error('Failed to clear auto-save:', error)
      }
      toast.success('Canvas cleared')
    }
  }

  return (
    <div className="w-full bg-white min-h-screen pb-12">
      {/* Design-Matching Blue Header Banner */}
      <div className="w-full bg-[#1E88E5] text-white p-6 shadow-md mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Electrical Circuit Design</h1>
              <p className="text-blue-100 text-sm opacity-90">Design circuits, draw diagrams, and get instant AI feedback</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">

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
              <CardDescription className="text-emerald-700">Your circuit evaluation has been recorded.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Button onClick={() => router.push(`/dashboard/student/assessment?id=${assessmentId}`)}>
                Return to Assessment
              </Button>
              <Button variant="ghost" onClick={() => setRoundSubmitted(false)}>
                Stay and iterate
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

        {/* Question Card */}
        <div className="bg-[#FFFBE6] border border-yellow-200 rounded-[16px] p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Zap className="w-5 h-5 text-gray-700 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Circuit Design Question</h2>
              <p className="text-sm text-gray-500">AI-generated circuit design prompt</p>
            </div>
          </div>

          <div className="bg-[#F0F7FF] border border-blue-100 rounded-lg p-4 text-gray-800 font-medium whitespace-pre-wrap">
            {question || (busy ? 'Generating question...' : 'Click explicitly to generate a question')}
          </div>

          {!question && !busy && (
            <div className="mt-4">
              <Button
                onClick={handleGenerate}
                className="bg-[#1E88E5] hover:bg-blue-600 text-white"
              >
                Generate Question
              </Button>
            </div>
          )}
        </div>

        {/* Drawing Canvas Section */}
        <div className="bg-[#FFFBE6] border border-yellow-200 rounded-[16px] p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Zap className="w-5 h-5 text-gray-700 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Circuit Design Workspace</h2>
              <p className="text-sm text-gray-500">Draw your component diagram below</p>
            </div>
          </div>

          {/* Canvas Container with Blue Border */}
          <div
            className="border-2 border-[#2196F3] rounded-[16px] overflow-hidden bg-white shadow-sm relative"
            style={{ height: '600px', width: '100%' }}
          >
            {/* @ts-ignore */}
            <Excalidraw
              excalidrawAPI={onExcalidrawAPIMount}
              onChange={handleSceneChange}
              gridModeEnabled={true}
              theme="light"
              UIOptions={{
                canvasActions: {
                  loadScene: false,
                  saveToActiveFile: false,
                  export: false,
                  saveAsImage: false
                }
              }}
            />
          </div>

          {/* Toolbar / Actions Footer */}
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleClearCanvas}
              disabled={busy}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Canvas
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={busy || !question}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-8 font-semibold shadow-sm"
            >
              {busy ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Submit for Evaluation
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Evaluation Results */}
        {evaluation && (
          <Card className="shadow-lg border-2 border-[#1E88E5]">
            <CardHeader className="bg-blue-50/50 rounded-t-lg border-b border-blue-100">
              <CardTitle className="text-2xl flex items-center gap-2 text-gray-900">
                <Award className="w-6 h-6 text-[#1E88E5]" />
                Evaluation Results
              </CardTitle>
              <CardDescription>AI feedback on your circuit design</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

              <div className={`p-6 rounded-xl border-l-4 ${evaluation.correct ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                <div className="flex items-center gap-3 mb-2">
                  {evaluation.correct ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  )}
                  <h3 className="text-xl font-bold text-gray-900">
                    {evaluation.correct ? 'Success!' : 'Needs Improvement'}
                  </h3>
                </div>
                <p className="text-gray-700">
                  {evaluation.correct
                    ? 'Your circuit design meets the requirements.'
                    : 'Your circuit design contains errors or is incomplete.'}
                </p>
              </div>

              {evaluation.score != null && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="font-semibold text-gray-600">Overall Score</span>
                  <span className="text-3xl font-bold text-[#1E88E5]">
                    {Math.round((evaluation.score as number) * 100) / 100} <span className="text-lg text-gray-400 font-normal">/ 10</span>
                  </span>
                </div>
              )}

              {evaluation.feedback && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#1E88E5]" />
                    Detailed Feedback
                  </h4>
                  <div className="p-4 bg-white border border-gray-200 rounded-lg text-gray-700 leading-relaxed whitespace-pre-wrap shadow-sm">
                    {evaluation.feedback}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleClearCanvas()
                    setEvaluation(null)
                  }}
                >
                  Keep Editing
                </Button>
                <Button
                  onClick={() => {
                    setEvaluation(null)
                    setQuestion("")
                    handleClearCanvas()
                    handleGenerate()
                  }}
                  className="bg-[#1E88E5] hover:bg-blue-600 text-white"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Try Another Question
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

