"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { CircuitComponentsLibrary } from '@/components/electrical/CircuitComponentsLibrary'
import { circuitComponents } from '@/lib/electrical/components'
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
  const [scene, setScene] = useState<any>(null)
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const [roundSubmitted, setRoundSubmitted] = useState(false)
  const [roundSubmitError, setRoundSubmitError] = useState<string | null>(null)

  const onExcalidrawAPIMount = useCallback((api: any) => {
    setExcalidrawAPI(api)
  }, [])

  const handleSceneChange = useCallback((elements: any, appState: any, files: any) => {
    setScene({ elements, appState, files })
  }, [])

  const handleGenerate = async () => {
    setBusy(true)
    setEvaluation(null)
    try {
      const res = await apiClient.generateElectricalQuestion()
      setQuestion(res?.question || "Design a full-wave bridge rectifier with labeled components and proper input/output connections.")
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
      setBusy(true)
      setEvaluation(null)
      setRoundSubmitError(null)
      const startedAt = Date.now()
      const elements = excalidrawAPI.getSceneElements()
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

  useEffect(() => {
    // Auto-generate a question on first load
    handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <DashboardLayout requiredUserType="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Electrical Practice</h1>
          <p className="text-sm text-muted-foreground">Generate circuit design questions, draw your circuit, and get instant AI feedback.</p>
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
              <Button onClick={() => router.push(`/dashboard/student/assessment?id=${assessmentId}`)}>
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
            <div className="flex items-start gap-3">
              <div className="flex-1 p-3 border rounded bg-muted/30 text-sm min-h-[60px] whitespace-pre-wrap">{question || '...'}</div>
              <Button onClick={handleGenerate} disabled={busy}>
                {busy ? <Loader size="sm" /> : 'Regenerate'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Draw Your Circuit</CardTitle>
            <CardDescription>Use shapes, connectors, and labels to represent components and wiring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-48 flex-shrink-0">
                <CircuitComponentsLibrary />
              </div>
              <div 
                className="flex-1 h-[600px] border rounded overflow-hidden"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const componentName = e.dataTransfer.getData('application/circuit-component')
                  const component = circuitComponents[componentName]
                  if (component && excalidrawAPI) {
                    // Get drop position relative to canvas
                    const bounds = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - bounds.left
                    const y = e.clientY - bounds.top
                    
                    // Add component to canvas at drop position
                    const elements = JSON.parse(JSON.stringify(component.elements))
                    elements.forEach((el: any) => {
                      el.x += x
                      el.y += y
                    })
                    
                    // Get current elements and append new ones
                    const currentElements = excalidrawAPI.getSceneElements()
                    excalidrawAPI.updateScene({
                      elements: [...currentElements, ...elements]
                    })
                  }
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
            </div>
            <div className="flex justify-end mt-4">
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
              <CardDescription>AI feedback and correctness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {evaluation.correct != null && (
                  <div><span className="font-semibold">Correct:</span> {evaluation.correct ? 'Yes' : 'No'}</div>
                )}
                {evaluation.score != null && (
                  <div><span className="font-semibold">Score:</span> {Math.round((evaluation.score as number) * 100) / 100} / 10</div>
                )}
                {evaluation.feedback && (
                  <div className="whitespace-pre-wrap"><span className="font-semibold">Feedback:</span> {evaluation.feedback}</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}


