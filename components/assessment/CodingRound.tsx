"use client";

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api'

// Load Monaco only on client
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false }) as any

export type CodingRoundProps = {
  assessmentId: string
  roundData: any
  onSubmitted?: (result: any) => void
  executeCodeFn?: (payload: { question_id: string; language: string; code: string; stdin?: string }) => Promise<any>
  submitFn?: (responses: any[]) => Promise<any>
  showSubmitButton?: boolean
  onChange?: (questionId: string, code: string, language: string) => void
}

const LANGS = [
  { key: 'python', label: 'Python', icon: '🐍', ext: '.py' },
  { key: 'javascript', label: 'JavaScript', icon: 'JS', ext: '.js' },
  { key: 'typescript', label: 'TypeScript', icon: 'TS', ext: '.ts' },
  { key: 'java', label: 'Java', icon: 'JV', ext: '.java' },
  { key: 'cpp', label: 'C++', icon: 'C++', ext: '.cpp' },
]

type SubmissionEntry = {
  id: string
  timestamp: number
  language: string
  code: string
  result: any
  status: 'success' | 'error'
  summary?: {
    passed: number
    total: number
  }
}

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', color: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800' },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800' },
  hard: { label: 'Hard', color: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800' },
}

export function CodingRound({ assessmentId, roundData, onSubmitted, executeCodeFn, submitFn, showSubmitButton = true, onChange }: CodingRoundProps) {
  const [busy, setBusy] = useState(false)
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, any>>({})
  const [fullscreen, setFullscreen] = useState<string | null>(null)
  const [submissionHistory, setSubmissionHistory] = useState<Record<string, SubmissionEntry[]>>({})

  // Build per-question editor state
  const initial = useMemo(() => {
    const m: Record<string, { language: string; code: string }> = {}
    for (const q of (roundData?.questions || [])) {
      const meta = q.metadata || {}
      const starter = meta.starter_code || {}
      m[q.id] = { language: 'python', code: starter['python'] || '' }
    }
    return m
  }, [roundData])

  const initialTabs = useMemo(() => {
    const tabs: Record<string, 'problem' | 'tests' | 'submissions'> = {}
    for (const q of (roundData?.questions || [])) {
      tabs[q.id] = 'problem'
    }
    return tabs
  }, [roundData])

  const [editors, setEditors] = useState<Record<string, { language: string; code: string }>>(initial)
  const [activeTab, setActiveTab] = useState<Record<string, 'problem' | 'tests' | 'submissions'>>(initialTabs)

  const setLang = (qid: string, lang: string) => {
    setEditors(prev => {
      const next = { ...prev }
      const meta = (roundData.questions.find((q: any) => q.id === qid)?.metadata) || {}
      const starter = (meta.starter_code || {}) as Record<string, string>
      const newCode = starter[lang] || next[qid]?.code || ''
      next[qid] = { language: lang, code: newCode }
      onChange?.(qid, newCode, lang)
      return next
    })
  }

  const setCode = (qid: string, code: string) => {
    setEditors(prev => {
      const current = prev[qid] || { language: 'python', code: '' }
      const next = { ...prev, [qid]: { ...current, code } }
      onChange?.(qid, code, current.language)
      return next
    })
  }

  const handleSubmit = async () => {
    try {
      setBusy(true)
      const responses = (roundData.questions || []).map((q: any) => {
        const ed = editors[q.id] || { language: 'python', code: '' }
        const payload = { language: ed.language, code: ed.code }
        return {
          question_id: q.id,
          response_text: JSON.stringify(payload),
          response_data: payload,
          time_taken: 0,
        }
      })

      // Use custom submit function if provided (for practice mode), otherwise use default assessment endpoint
      let res
      if (submitFn) {
        res = await submitFn(responses)
      } else {
        res = await apiClient.submitRoundResponses(assessmentId, roundData.round_id, responses)
        toast.success('Solutions submitted successfully!')
      }
      onSubmitted?.(res)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Submit failed'
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  // Reset submission history when round changes
  useEffect(() => {
    setSubmissionHistory({})
  }, [roundData?.round_id])

  const runTests = async (qid: string) => {
    const ed = editors[qid] || { language: 'python', code: '' }
    try {
      setRunning(prev => ({ ...prev, [qid]: true }))

      // Add timeout wrapper to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000)
      )

      // Use custom execute function if provided (for practice mode), otherwise use default assessment endpoint
      const executePromise = executeCodeFn
        ? executeCodeFn({
          question_id: qid,
          language: ed.language,
          code: ed.code,
        })
        : apiClient.executeCode(assessmentId, roundData.round_id, {
          question_id: qid,
          language: ed.language,
          code: ed.code,
        })

      const res = await Promise.race([executePromise, timeoutPromise])
      setResults(prev => ({ ...prev, [qid]: res }))
      const summary = (() => {
        if (res?.results?.length) {
          const passed = res.results.filter((r: any) => r.passed).length
          return { passed, total: res.results.length }
        }
        if (typeof res?.passed === 'number' && typeof res?.total === 'number') {
          return { passed: res.passed, total: res.total }
        }
        return undefined
      })()
      setSubmissionHistory(prev => {
        const next = { ...prev }
        const list = next[qid] ? [...next[qid]] : []
        list.unshift({
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          language: ed.language,
          code: ed.code,
          result: res,
          status: 'success',
          summary,
        })
        next[qid] = list.slice(0, 10)
        return next
      })

      if (res.mode === 'tests') {
        const passRate = Math.round((res.passed / res.total) * 100)
        if (passRate === 100) {
          toast.success(`All ${res.total} tests passed`)
        } else {
          toast.success(`Passed ${res.passed}/${res.total} tests (${passRate}%)`)
        }
      } else if (res.quota_exceeded) {
        toast.error('API quota exceeded. Please try again later or contact support.')
      } else if (res.network_error) {
        toast.error('Network error. Please check your connection and try again.')
      } else if (res.stderr || res.compile_output) {
        toast.error('Compilation/Runtime error')
      } else {
        toast.success('Program executed successfully')
      }
      setActiveTab(prev => ({ ...prev, [qid]: 'tests' }))
    } catch (e: any) {
      console.error('Code execution error:', e)
      const msg = e?.response?.data?.detail || e?.message || 'Execution failed'
      toast.error(msg)

      // Set error result to show in tests tab
      setResults(prev => ({
        ...prev, [qid]: {
          error: true,
          message: msg,
          stderr: msg,
          mode: 'error'
        }
      }))
      setSubmissionHistory(prev => {
        const next = { ...prev }
        const list = next[qid] ? [...next[qid]] : []
        list.unshift({
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          language: ed.language,
          code: ed.code,
          result: { error: msg },
          status: 'error',
        })
        next[qid] = list.slice(0, 10)
        return next
      })
    } finally {
      setRunning(prev => ({ ...prev, [qid]: false }))
    }
  }

  const getPassRate = (qid: string) => {
    const res = results[qid]
    if (!res?.results) return null
    const passed = res.results.filter((r: any) => r.passed).length
    const total = res.results.length
    return { passed, total, percentage: Math.round((passed / total) * 100) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{roundData?.questions?.length || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Problems</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {Object.keys(results).filter(k => {
                const r = getPassRate(k)
                return r && r.percentage === 100
              }).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Solved</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{LANGS.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Languages</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
            <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
              {Object.keys(results).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Attempted</div>
          </div>
        </div>

        {/* Problems */}
        {(roundData?.questions || []).map((q: any, idx: number) => {
          const editor = editors[q.id] || { language: 'python', code: '' }
          const meta = q.metadata || {}
          const difficulty = meta.difficulty || 'medium'
          const difficultyConfig = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG]
          const passRate = getPassRate(q.id)
          const currentTab = activeTab[q.id] || 'problem'
          const isFullscreen = fullscreen === q.id

          return (
            <div
              key={q.id}
              className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'shadow-sm'}`}
            >
              {/* Question Header */}
              <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Problem {idx + 1}
                      </span>
                      <span className={`px-2.5 py-1 rounded text-xs font-medium border ${difficultyConfig.color}`}>
                        {difficultyConfig.label}
                      </span>
                      {passRate && (
                        <span className={`px-2.5 py-1 rounded text-xs font-medium border ${passRate.percentage === 100
                          ? 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800'
                          : passRate.percentage >= 50
                            ? 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800'
                            : 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800'
                          }`}>
                          {passRate.passed}/{passRate.total}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {meta.title || 'Coding Problem'}
                    </h3>
                    {meta.category && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{meta.category}</div>
                    )}
                  </div>
                  <button
                    onClick={() => setFullscreen(isFullscreen ? null : q.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isFullscreen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className={`grid ${isFullscreen ? 'md:grid-cols-2' : 'lg:grid-cols-2'} divide-x divide-gray-200 dark:divide-gray-800`}>
                {/* Left Panel - Problem Description */}
                <div className="flex flex-col">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    {(['problem', 'tests', 'submissions'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(prev => ({ ...prev, [q.id]: tab }))}
                        className={`px-4 py-3 text-sm font-medium transition-colors ${currentTab === tab
                          ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: isFullscreen ? 'calc(100vh - 240px)' : '600px' }}>
                    {currentTab === 'problem' && (
                      <>
                        {/* Problem Description - Enhanced Styling with Better Visibility */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-300 dark:border-gray-600 p-6 mb-6 shadow-sm">
                          <div className="prose prose-base max-w-none">
                            <div
                              className="leading-relaxed whitespace-pre-wrap font-normal text-gray-900 dark:text-gray-100"
                              style={{
                                fontSize: '15px',
                                lineHeight: '1.7',
                                fontFamily: 'inherit',
                              }}
                            >
                              {q.question_text}
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-200 dark:border-blue-900 rounded-lg p-4">
                          <div className="font-semibold text-blue-900 dark:text-blue-200 text-base mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Input/Output Instructions
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                            Read input using <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs font-mono font-semibold">input()</code> or <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs font-mono font-semibold">sys.stdin.read()</code>, then print the result. Do not include test cases in your code.
                          </p>
                        </div>

                        {Array.isArray(meta.constraints) && meta.constraints.length > 0 && (
                          <div className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/30 rounded-lg p-5">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Constraints
                            </div>
                            <ul className="space-y-2.5">
                              {meta.constraints.map((c: string, i: number) => (
                                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-3 leading-relaxed">
                                  <span className="text-orange-600 dark:text-orange-400 mt-0.5 font-bold">•</span>
                                  <span className="flex-1">{c}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}

                    {currentTab === 'tests' && (
                      <div className="space-y-3">
                        {!results[q.id] ? (
                          <>
                            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2">
                                Sample Test Cases (first 3 of all test cases)
                              </div>
                              {Array.isArray(meta.tests) && meta.tests.length > 0 ? (
                                <div className="space-y-3">
                                  {meta.tests.slice(0, 3).map((t: any, i: number) => (
                                    <div key={i} className="bg-white dark:bg-gray-950 rounded p-3 text-xs border border-gray-200 dark:border-gray-800">
                                      <div className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                                        Test Case {i + 1}
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <div className="text-gray-500 dark:text-gray-400 mb-1">Input</div>
                                          <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto font-mono">
                                            {String(t.input)}
                                          </pre>
                                        </div>
                                        <div>
                                          <div className="text-gray-500 dark:text-gray-400 mb-1">Expected Output</div>
                                          <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto font-mono">
                                            {String(t.output)}
                                          </pre>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Test cases will appear here once they are available.
                                </div>
                              )}
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                                Run tests to execute <span className="font-semibold">all hidden test cases</span> (including edge cases) and see detailed results.
                              </div>
                            </div>
                          </>
                        ) : results[q.id]?.error ? (
                          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4">
                            <div className="font-medium text-red-900 dark:text-red-200 text-sm mb-2">Execution Error</div>
                            <pre className="text-xs bg-red-100 dark:bg-red-900/30 p-3 rounded overflow-x-auto font-mono text-red-900 dark:text-red-200">
                              {results[q.id].message || results[q.id].stderr}
                            </pre>
                          </div>
                        ) : results[q.id]?.quota_exceeded ? (
                          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-lg p-4">
                            <div className="font-medium text-orange-900 dark:text-orange-200 text-sm mb-2">⚠️ API Quota Exceeded</div>
                            <p className="text-sm text-orange-800 dark:text-orange-300 mb-2">
                              The code execution service has reached its daily limit. Your code appears to be correct based on previous test results.
                            </p>
                            <div className="text-xs text-orange-700 dark:text-orange-400">
                              💡 <strong>Solution:</strong> Try again tomorrow or contact support to upgrade the service plan.
                            </div>
                          </div>
                        ) : results[q.id]?.network_error ? (
                          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                            <div className="font-medium text-yellow-900 dark:text-yellow-200 text-sm mb-2">🌐 Network Error</div>
                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                              Unable to connect to the code execution service. Please check your internet connection and try again.
                            </p>
                          </div>
                        ) : (
                          <>
                            {results[q.id]?.results && (
                              <div className="space-y-2">
                                {results[q.id].results.map((r: any, i: number) => (
                                  <div
                                    key={i}
                                    className={`rounded-lg p-4 border ${r.passed
                                      ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900'
                                      : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
                                      }`}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Test Case {i + 1}
                                      </span>
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${r.passed
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                        }`}>
                                        {r.passed ? 'Passed' : 'Failed'}
                                      </span>
                                    </div>
                                    {!r.passed && (
                                      <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div>
                                          <div className="text-gray-500 dark:text-gray-400 mb-1 font-medium">Input</div>
                                          <pre className="bg-white dark:bg-gray-950 p-2 rounded border border-gray-200 dark:border-gray-800 overflow-x-auto font-mono">{String(r.input)}</pre>
                                        </div>
                                        <div>
                                          <div className="text-gray-500 dark:text-gray-400 mb-1 font-medium">Expected</div>
                                          <pre className="bg-white dark:bg-gray-950 p-2 rounded border border-gray-200 dark:border-gray-800 overflow-x-auto font-mono">{String(r.expected)}</pre>
                                        </div>
                                        <div>
                                          <div className="text-gray-500 dark:text-gray-400 mb-1 font-medium">Your Output</div>
                                          <pre className="bg-white dark:bg-gray-950 p-2 rounded border border-gray-200 dark:border-gray-800 overflow-x-auto font-mono">{String(r.stdout || r.stderr)}</pre>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {(results[q.id]?.stderr || results[q.id]?.compile_output) && (
                              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4">
                                <div className="font-medium text-red-900 dark:text-red-200 text-sm mb-2">Error Output</div>
                                <pre className="text-xs bg-red-100 dark:bg-red-900/30 p-3 rounded overflow-x-auto font-mono text-red-900 dark:text-red-200">
                                  {results[q.id].stderr || results[q.id].compile_output}
                                </pre>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {currentTab === 'submissions' && (
                      <div className="space-y-3">
                        {!(submissionHistory[q.id]?.length) ? (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="font-medium">No submissions yet</div>
                            <div className="text-sm mt-1">Run tests to record your attempts</div>
                          </div>
                        ) : (
                          submissionHistory[q.id]!.map((entry, idx) => (
                            <div
                              key={entry.id}
                              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    Attempt #{submissionHistory[q.id]!.length - idx}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(entry.timestamp).toLocaleString()} • {entry.language.toUpperCase()}
                                  </div>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded ${entry.status === 'success'
                                  ? (entry.summary && entry.summary.passed === entry.summary.total
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300')
                                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                  }`}>
                                  {entry.status === 'success'
                                    ? entry.summary
                                      ? `${entry.summary.passed}/${entry.summary.total} tests`
                                      : 'Executed'
                                    : 'Error'}
                                </span>
                              </div>
                              <pre className="text-xs bg-gray-50 dark:bg-gray-950 p-3 rounded border border-dashed border-gray-200 dark:border-gray-800 overflow-x-auto">
                                {entry.code}
                              </pre>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Code Editor */}
                <div className="flex flex-col bg-gray-50 dark:bg-gray-900/50">
                  {/* Language Selector */}
                  <div className="border-b border-gray-200 dark:border-gray-800 p-4">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 block">
                      Language
                    </label>
                    <div className="flex gap-2">
                      {LANGS.map(l => (
                        <button
                          key={l.key}
                          onClick={() => setLang(q.id, l.key)}
                          className={`flex-1 px-3 py-2 rounded text-sm font-medium border transition-colors ${editor.language === l.key
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                            }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div className="flex-1 flex flex-col">
                    <div className="bg-gray-900 flex items-center justify-between px-4 py-2 border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs text-gray-400 ml-2 font-mono">
                          solution{LANGS.find(l => l.key === editor.language)?.ext || '.py'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{editor.code.split('\n').length} lines</span>
                    </div>
                    <div className="flex-1 bg-gray-900" style={{ height: isFullscreen ? 'calc(100vh - 340px)' : '440px' }}>
                      {MonacoEditor ? (
                        <MonacoEditor
                          height="100%"
                          language={editor.language === 'cpp' ? 'cpp' : editor.language}
                          value={editor.code}
                          onChange={(v: string) => setCode(q.id, v || '')}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 4,
                            fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
                            fontLigatures: true,
                            padding: { top: 16, bottom: 16 },
                          }}
                        />
                      ) : (
                        <textarea
                          className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm focus:outline-none resize-none"
                          value={editor.code}
                          onChange={(e) => setCode(q.id, e.target.value)}
                          placeholder="Write your code here..."
                        />
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
                    {!running[q.id] ? (
                      <Button
                        onClick={() => runTests(q.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded transition-colors"
                      >
                        Run Tests
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setRunning(prev => ({ ...prev, [q.id]: false }))}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded transition-colors"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Loader size="sm" /> Cancel
                        </span>
                      </Button>
                    )}
                    <button
                      onClick={() => setCode(q.id, '')}
                      className="p-2.5 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      title="Clear code"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Submit Button */}
        {showSubmitButton && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Ready to Submit?</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Make sure you've tested all solutions before submitting
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={busy}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <Loader size="sm" /> Submitting...
                  </span>
                ) : (
                  'Submit All Solutions'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CodingRound