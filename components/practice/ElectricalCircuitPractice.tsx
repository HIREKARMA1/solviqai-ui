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
import SubscriptionRequiredModal from '../subscription/SubscriptionRequiredModal'
import { config } from '@/lib/config'

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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [isLimitReached, setIsLimitReached] = useState(false)
  const [subscriptionFeature, setSubscriptionFeature] = useState('Electrical Circuit AI')

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
    } catch (e: any) {
      console.error(e)
      const msg = e?.response?.data?.detail || e?.message || 'Failed to generate question'

      const isSubscriptionError =
        e?.response?.status === 403 ||
        e?.response?.status === 402 ||
        (msg && (
          msg.toLowerCase().includes('contact hirekarma') ||
          msg.toLowerCase().includes('subscription') ||
          msg.toLowerCase().includes('free plan') ||
          msg.toLowerCase().includes('expired')
        ));

      if (isSubscriptionError) {
        setIsLimitReached(true)
        setShowSubscriptionModal(true)
      }
      toast.error(msg)
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
    } catch (e: any) {
      console.error(e)
      const msg = e?.response?.data?.detail || e?.message || 'Failed to evaluate diagram'
      if (e?.response?.status === 403 || e?.response?.status === 402) {
        setIsLimitReached(true)
        setShowSubscriptionModal(true)
      }
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  // Check Subscription Status
  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch(`${config.api.fullUrl}/api/v1/students/subscription-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const statusData = await response.json();
          const isExpired = statusData.days_remaining !== null && statusData.days_remaining < 0;

          if (isExpired) {
            setIsLimitReached(true);
            setShowSubscriptionModal(true);
          }
        }
      } catch (err) {
        console.error("Failed to check subscription", err);
      }
    };
    checkUser();
  }, [])

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

    if (!isRestored && !isLimitReached) {
      handleGenerate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excalidrawAPI, isLimitReached])

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
    <div className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50/30 pb-8">
      <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Electrical Circuit Design
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg mt-1">
                Design circuits, draw diagrams, and get instant AI feedback
              </p>
            </div>
          </div>
        </div>

        {/* Assessment Context Banner */}
        {assessmentId && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
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

        {/* Auto-save Badge */}
        <div className="flex items-center justify-end">
          <Badge className="bg-green-100 text-green-700 border-green-300 shadow-sm">
            ✓ Auto-save enabled
          </Badge>
        </div>

        {/* Question Card */}
        <Card className="shadow-lg border-2 border-yellow-100">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-t-lg">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Circuit Design Question
            </CardTitle>
            <CardDescription className="text-base text-gray-700">AI-generated circuit design prompt</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="p-4 border-2 border-yellow-200 rounded-xl bg-gradient-to-br from-yellow-50/50 to-amber-50/50 text-sm min-h-[80px] whitespace-pre-wrap font-medium text-gray-800">
              {question || 'Generating question...'}
            </div>
            {!question && (
              <Button
                onClick={handleGenerate}
                disabled={busy || isLimitReached}
                className={`mt-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${isLimitReached
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white'
                  }`}
              >
                {isLimitReached ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-4V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2v-4z" />
                    </svg>
                    Subscription Required
                  </>
                ) : busy ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Question
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Subscription Required Modal */}
        <SubscriptionRequiredModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          feature={subscriptionFeature}
        />

        {/* Drawing Canvas Card */}
        <Card className="shadow-lg border-2 border-yellow-100">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-t-lg">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <span className="text-2xl">✏️</span>
              Draw Your Circuit
            </CardTitle>
            <CardDescription className="text-base text-gray-700">Use shapes, connectors, and labels to represent components and wiring</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div
              className="border-2 border-yellow-200 rounded-xl shadow-inner overflow-hidden"
              style={{
                height: '600px',
                width: '100%',
                position: 'relative',
                minHeight: '600px'
              }}
            >
              {/* @ts-ignore */}
              <Excalidraw
                excalidrawAPI={onExcalidrawAPIMount}
                onChange={handleSceneChange}
                gridModeEnabled={true}
                theme="light"
              />
            </div>
            <div className="flex justify-between items-center mt-4 gap-3">
              <Button
                variant="outline"
                onClick={handleClearCanvas}
                disabled={busy}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Canvas
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={busy || !question || isLimitReached}
                className={`bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ${isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLimitReached ? (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Subscription Required
                  </>
                ) : busy ? (
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
          </CardContent>
        </Card>

        {/* Evaluation Results */}
        {evaluation && (
          <Card className="shadow-lg border-2 border-primary">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Award className="w-6 h-6 text-primary" />
                Evaluation Results
              </CardTitle>
              <CardDescription>AI feedback on your circuit design</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {evaluation.correct != null && (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  {evaluation.correct ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <span className="font-semibold text-lg">Correct: </span>
                    <span className={`text-lg font-bold ${evaluation.correct ? 'text-green-600' : 'text-red-600'}`}>
                      {evaluation.correct ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                </div>
              )}
              {evaluation.score != null && (
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">Score:</span>
                    <span className="text-3xl font-bold text-yellow-700">
                      {Math.round((evaluation.score as number) * 100) / 100} / 10
                    </span>
                  </div>
                  {assessmentId && (
                    <p className="text-sm text-muted-foreground mt-2">(scaled to 0-100 for assessment)</p>
                  )}
                </div>
              )}
              {evaluation.feedback && (
                <div className="mt-4 pt-4 border-t-2 border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-lg">Feedback:</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-base text-gray-700 leading-relaxed p-4 bg-muted/30 rounded-lg">
                    {evaluation.feedback}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-4">
                <Button
                  onClick={() => {
                    setEvaluation(null)
                    setQuestion("")
                    handleClearCanvas()
                    handleGenerate()
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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

