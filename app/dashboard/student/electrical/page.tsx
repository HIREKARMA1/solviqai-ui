"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

// Excalidraw is large; load client-side only
const Excalidraw = dynamic(async () => (await import('@excalidraw/excalidraw')).Excalidraw, { ssr: false })

export default function ElectricalPracticePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const assessmentId = searchParams?.get('assessment_id') || undefined
  const roundId = searchParams?.get('round_id') || undefined
  const roundNumber = searchParams?.get('round_number') || undefined
  const [busy, setBusy] = useState(false)
  const [question, setQuestion] = useState<string>("")
  const [evaluation, setEvaluation] = useState<any>(null)
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const [roundSubmitted, setRoundSubmitted] = useState(false)
  const [roundSubmitError, setRoundSubmitError] = useState<string | null>(null)
  const [isRestored, setIsRestored] = useState(false)

  // Auto-save key for localStorage
  const storageKey = `electrical-circuit-${assessmentId || 'practice'}-${roundId || 'draft'}`

  const onExcalidrawAPIMount = useCallback((api: any) => {
    setExcalidrawAPI(api)
  }, [])

  // Auto-save to localStorage on scene changes
  const handleSceneChange = useCallback((elements: any, appState: any, files: any) => {
    setScene({ elements, appState, files })
    
    // Auto-save to localStorage (debounced via state change)
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
      
      // Clear localStorage when generating new question
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
      
      // Validate that canvas is not empty
      if (!elements || elements.length === 0) {
        toast.error('Please draw your circuit before submitting')
        return
      }
      
      // Filter out deleted elements and check if there are any valid elements
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
          
          // Clear auto-save after successful submission
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
        
        // Restore if saved within last 24 hours
        if (age < 24 * 60 * 60 * 1000) {
          setQuestion(data.question || "")
          setIsRestored(true)
          
          // Restore canvas after API is ready
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
          // Clear old data
          localStorage.removeItem(storageKey)
        }
      }
    } catch (error) {
      console.error('Failed to restore saved work:', error)
    }
    
    // Only generate new question if no saved work was restored
    if (!isRestored) {
      handleGenerate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excalidrawAPI])

  // Separate effect to handle initial load without excalidrawAPI
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
    <DashboardLayout requiredUserType="student">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Electrical Practice</h1>
            <p className="text-sm text-muted-foreground">Generate circuit design questions, draw your circuit, and get instant AI feedback.</p>
          </div>
          <div className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
            ✓ Auto-save enabled
          </div>
        </div>

        {assessmentId && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Linked to Assessment: <span className="font-medium">{assessmentId}</span>
            {roundNumber && <span className="ml-2">Round {roundNumber}</span>}
          </div>
        )}

        {roundSubmitted && (
          <Card className="border border-emerald-200 bg-emerald-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-emerald-800">Round Submitted</CardTitle>
              <CardDescription className="text-emerald-700">Your circuit evaluation has been recorded.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Button onClick={() => router.push(`/dashboard/student/assessment?id={assessmentId}`)}>
                Return to Assessment
              </Button>
              <Button variant="ghost" onClick={() => setRoundSubmitted(false)}>
                Stay and iterate
              </Button>
            </CardContent>
          </Card>
        )}

        {roundSubmitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {roundSubmitError}
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Question</CardTitle>
            <CardDescription>LLM-generated circuit design prompt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 border rounded bg-muted/30 text-sm min-h-[60px] whitespace-pre-wrap">{question || '...'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Draw Your Circuit</CardTitle>
            <CardDescription>Use shapes, connectors, and labels to represent components and wiring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] border rounded overflow-hidden">
                {/* @ts-ignore */}
                <Excalidraw
                  excalidrawAPI={onExcalidrawAPIMount}
                  onChange={handleSceneChange}
                  gridModeEnabled={true}
                  theme="light"
                />
            </div>
            <div className="flex justify-between items-center mt-4">
              <Button 
                variant="outline" 
                onClick={handleClearCanvas}
                disabled={busy}
              >
                Clear Canvas
              </Button>
              <Button onClick={handleSubmit} disabled={busy || !question}>
                {busy ? <Loader size="sm" /> : 'Submit for Evaluation'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {evaluation && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Evaluation</CardTitle>
              <CardDescription>AI feedback on your circuit design</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {evaluation.correct != null && (
                  <div><span className="font-semibold">Correct:</span> {evaluation.correct ? '✓ Yes' : '✗ No'}</div>
                )}
                {evaluation.score != null && (
                  <div>
                    <span className="font-semibold">Score:</span> {Math.round((evaluation.score as number) * 100) / 100} / 10
                    {assessmentId && <span className="text-muted-foreground ml-2">(scaled to 0-100 for assessment)</span>}
                  </div>
                )}
                {evaluation.feedback && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="font-semibold">Feedback:</span>
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{evaluation.feedback}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
