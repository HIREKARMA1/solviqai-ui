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
  activeQuestionId?: string
  hideFooter?: boolean
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

export function CodingRound({ assessmentId, roundData, onSubmitted, executeCodeFn, submitFn, showSubmitButton = true, onChange, activeQuestionId, hideFooter = false }: CodingRoundProps) {
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
      } else if (res.subscription_error) {
        toast.error('Code execution service is currently unavailable. Please contact support.')
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

  // Determine grid columns - single column on mobile, split on larger screens
  // If fullscreen is active for a specific question, that one takes over.
  // BUT the design requested is a single view for the main layout.
  // We'll iterate questions but for the coding round usually there's one active question or a sidebar list. 
  // The screenshot implies a single focused view. The current code maps all questions. 
  // I will assume we show the first question or map them, but enforce the split view for each.

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full flex flex-col gap-6">
          {(roundData?.questions || [])
            .filter((q: any) => !activeQuestionId || q.id === activeQuestionId)
            .map((q: any, idx: number) => {
              const editor = editors[q.id] || { language: 'python', code: '' }
              const meta = q.metadata || {}
              const isFullscreen = fullscreen === q.id
              const currentTab = activeTab[q.id] || 'problem'

              return (
                <div key={q.id} className="flex-1 flex flex-col min-h-0 bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 min-h-0">

                    {/* LEFT PANEL: Problem Description */}
                    <div className="flex flex-col min-h-0 bg-white">
                      {/* Tabs Row */}
                      <div className="flex border-b border-gray-100">
                        {['problem', 'tests', 'submissions'].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(prev => ({ ...prev, [q.id]: tab as any }))}
                            className={`px-6 py-3 text-sm font-semibold capitalize transition-all border-b-2 ${currentTab === tab
                              ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                              : 'text-gray-500 border-transparent hover:text-gray-800'
                              }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
                        {currentTab === 'problem' && (
                          <>
                            {/* Problem Title */}
                            <div>
                              <h2 className="text-xl font-bold text-gray-900 mb-3">{meta.title || q.question_text.slice(0, 50)}</h2>
                              {/* Problem Description - Cleaned */}
                              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed mb-4">
                                <p className="whitespace-pre-wrap">{q.question_text.split(/\*\*Input Format:\*\*|\*\*Output Format:\*\*|\*\*Examples?:\*\*|\*\*Constraints?:\*\*/i)[0].trim()}</p>
                              </div>
                            </div>

                            {/* Input Format */}
                            {(() => {
                              const inputMatch = q.question_text.match(/\*\*Input Format:\*\*\s*([\s\S]+?)(?=\*\*|$)/i);
                              const inputFormat = inputMatch ? inputMatch[1].trim() : meta.input_format;
                              return inputFormat ? (
                                <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4">
                                  <h3 className="font-bold text-blue-900 text-sm mb-2">Input Format</h3>
                                  <p className="text-sm text-blue-800 font-mono">{inputFormat}</p>
                                </div>
                              ) : null;
                            })()}

                            {/* Output Format */}
                            {(() => {
                              const outputMatch = q.question_text.match(/\*\*Output Format:\*\*\s*([\s\S]+?)(?=\*\*|$)/i);
                              const outputFormat = outputMatch ? outputMatch[1].trim() : meta.output_format;
                              return outputFormat ? (
                                <div className="bg-green-50 border-l-4 border-green-500 rounded p-4">
                                  <h3 className="font-bold text-green-900 text-sm mb-2">Output Format</h3>
                                  <p className="text-sm text-green-800 font-mono">{outputFormat}</p>
                                </div>
                              ) : null;
                            })()}

                            {/* Examples Section - Enhanced */}
                            {(() => {
                              // Try to parse examples from metadata first
                              if (meta.examples?.length > 0) {
                                return (
                                  <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 text-base">Examples</h3>
                                    {meta.examples.map((ex: any, i: number) => (
                                      <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                                          <span className="font-bold text-gray-900 text-sm">Example {i + 1}</span>
                                        </div>
                                        <div className="p-4 space-y-3">
                                          <div>
                                            <span className="font-semibold text-gray-900 text-sm block mb-1">Input:</span>
                                            <pre className="bg-white border border-gray-200 rounded p-2 text-xs font-mono text-gray-800 overflow-x-auto">{String(ex.input || ex.input_data || '')}</pre>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-gray-900 text-sm block mb-1">Output:</span>
                                            <pre className="bg-white border border-gray-200 rounded p-2 text-xs font-mono text-gray-800 overflow-x-auto">{String(ex.output || ex.expected_output || '')}</pre>
                                          </div>
                                          {ex.explanation && (
                                            <div className="text-xs text-gray-600 italic pt-2 border-t border-gray-200">
                                              <span className="font-semibold">Explanation:</span> {ex.explanation}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              // Fallback: Try to parse from question text
                              const examplesMatch = q.question_text.match(/\*\*Examples?:\*\*\s*([\s\S]+?)(?=\*\*Constraints?:\*\*|$)/i);
                              if (examplesMatch) {
                                const examplesText = examplesMatch[1];
                                const exampleBlocks = examplesText.split(/(?:^|\n)\s*(?:Input:|Example \d+)/i).filter(Boolean);
                                if (exampleBlocks.length > 0) {
                                  return (
                                    <div className="space-y-4">
                                      <h3 className="font-bold text-gray-900 text-base">Examples</h3>
                                      {exampleBlocks.slice(0, 4).map((block: string, i: number) => {
                                        const inputMatch = block.match(/Input:\s*([\s\S]+?)(?:\n|Output:|$)/i);
                                        const outputMatch = block.match(/Output:\s*([\s\S]+?)(?:\n|$)/i);
                                        return (inputMatch || outputMatch) ? (
                                          <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                                              <span className="font-bold text-gray-900 text-sm">Example {i + 1}</span>
                                            </div>
                                            <div className="p-4 space-y-3">
                                              {inputMatch && (
                                                <div>
                                                  <span className="font-semibold text-gray-900 text-sm block mb-1">Input:</span>
                                                  <pre className="bg-white border border-gray-200 rounded p-2 text-xs font-mono text-gray-800 overflow-x-auto">{inputMatch[1].trim()}</pre>
                                                </div>
                                              )}
                                              {outputMatch && (
                                                <div>
                                                  <span className="font-semibold text-gray-900 text-sm block mb-1">Output:</span>
                                                  <pre className="bg-white border border-gray-200 rounded p-2 text-xs font-mono text-gray-800 overflow-x-auto">{outputMatch[1].trim()}</pre>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ) : null;
                                      })}
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })()}

                            {/* Constraints - Enhanced */}
                            {(() => {
                              const constraints = meta.constraints || [];
                              // Try to parse from question text if not in metadata
                              if (constraints.length === 0) {
                                const constraintsMatch = q.question_text.match(/\*\*Constraints?:\*\*\s*([\s\S]+?)(?=\*\*|$)/i);
                                if (constraintsMatch) {
                                  const constraintsText = constraintsMatch[1].trim();
                                  // Split by lines or bullets
                                  constraints.push(...constraintsText.split(/\n|•|\*/).filter((c: string) => c.trim().length > 0).map((c: string) => c.trim().replace(/^[-•]\s*/, '')));
                                }
                              }
                              return constraints.length > 0 ? (
                                <div className="bg-amber-50 border-l-4 border-amber-500 rounded p-4">
                                  <h3 className="font-bold text-amber-900 text-sm mb-2">Constraints</h3>
                                  <ul className="space-y-1.5 text-sm text-amber-800">
                                    {constraints.map((c: string, i: number) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-amber-600 mt-1">•</span>
                                        <span>{c}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null;
                            })()}
                          </>
                        )}

                        {/* RE-USE EXISTING TABS LOGIC FOR TESTS & SUBMISSIONS (SIMPLIFIED) */}
                        {currentTab === 'tests' && (
                          <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 text-base mb-4">Test Cases</h3>
                            {results[q.id]?.results?.length > 0 ? (
                              results[q.id].results.map((r: any, i: number) => (
                                <div
                                  key={i}
                                  className={`p-4 rounded-lg border-2 ${r.passed
                                    ? 'bg-green-50 border-green-300'
                                    : 'bg-red-50 border-red-300'
                                    }`}
                                >
                                  <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold text-sm text-gray-900">Test Case {i + 1}</span>
                                    <span
                                      className={`text-xs font-bold px-3 py-1 rounded-full ${r.passed
                                        ? 'bg-green-200 text-green-800'
                                        : 'bg-red-200 text-red-800'
                                        }`}
                                    >
                                      {r.passed ? '✓ PASSED' : '✗ FAILED'}
                                    </span>
                                  </div>
                                  <div className="space-y-2 font-mono text-xs">
                                    <div className="bg-white border border-gray-200 rounded p-2">
                                      <span className="font-semibold text-gray-700 block mb-1">Input:</span>
                                      <pre className="text-gray-800 whitespace-pre-wrap break-words">{String(r.input || '(no input)')}</pre>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded p-2">
                                      <span className="font-semibold text-gray-700 block mb-1">Expected:</span>
                                      <pre className="text-green-700 whitespace-pre-wrap break-words">{String(r.expected || '')}</pre>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded p-2">
                                      <span className="font-semibold text-gray-700 block mb-1">Your Output:</span>
                                      <pre
                                        className={`whitespace-pre-wrap break-words ${r.passed ? 'text-green-700' : 'text-red-700'
                                          }`}
                                      >
                                        {String(r.stdout || r.stderr || '(no output)')}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : results[q.id]?.error ? (
                              <div className="p-4 rounded-lg border-2 bg-red-50 border-red-300">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-red-600 font-bold">Error</span>
                                </div>
                                <pre className="text-xs text-red-800 whitespace-pre-wrap">
                                  {String(results[q.id].message || results[q.id].stderr || 'Execution failed')}
                                </pre>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500 text-sm">
                                <p>Run your code to see test case results</p>
                                <p className="text-xs mt-2 text-gray-400">Click the "Run Code" button to execute your solution</p>
                              </div>
                            )}
                          </div>
                        )}

                        {currentTab === 'submissions' && (
                          <div className="space-y-2">
                            {submissionHistory[q.id]?.map((sub) => (
                              <div key={sub.id} className="border p-3 rounded bg-gray-50 text-sm flex justify-between">
                                <span>{new Date(sub.timestamp).toLocaleTimeString()}</span>
                                <span className={sub.status === 'success' ? 'text-green-600' : 'text-red-600'}>{sub.status}</span>
                              </div>
                            )) || <div className="text-gray-500">No history.</div>}
                          </div>
                        )}

                        {/* Test Cases Summary - Dynamic based on actual results */}
                        {(() => {
                          const testResults = results[q.id]?.results;
                          if (testResults && testResults.length > 0) {
                            return (
                              <div className="mt-8 pt-6 border-t border-gray-200">
                                <h4 className="font-medium text-xs uppercase text-gray-500 mb-3">Test Cases Summary</h4>
                                <div className="space-y-2">
                                  {testResults.map((r: any, i: number) => (
                                    <div
                                      key={i}
                                      className={`border rounded p-2 text-xs ${r.passed
                                        ? 'bg-green-50 border-green-100 text-green-800'
                                        : 'bg-red-50 border-red-100 text-red-800'
                                        }`}
                                    >
                                      <span className="font-bold">Test Case {i + 1}:</span>{' '}
                                      <span className={r.passed ? 'text-green-700' : 'text-red-700'}>
                                        {r.passed ? 'Passed' : 'Failed'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          // Show placeholder if no results yet
                          return (
                            <div className="mt-8 pt-6 border-t border-gray-200">
                              <h4 className="font-medium text-xs uppercase text-gray-500 mb-3">Test Cases Summary</h4>
                              <div className="text-xs text-gray-500 italic">Run your code to see test case results</div>
                            </div>
                          );
                        })()}

                      </div>
                    </div>

                    {/* RIGHT PANEL: Code Editor */}
                    <div className="flex flex-col min-h-0 bg-[#1e1e1e]">
                      {/* Toolbar */}
                      <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] border-b border-[#3e3e3e]">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm font-medium">Language:</span>
                          <select
                            value={editor.language}
                            onChange={(e) => setLang(q.id, e.target.value)}
                            className="bg-[#3e3e3e] text-white text-sm rounded px-2 py-1 outline-none border border-transparent focus:border-blue-500"
                          >
                            {LANGS.map(l => (
                              <option key={l.key} value={l.key}>{l.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setFullscreen(isFullscreen ? null : q.id)}
                            className="p-1.5 hover:bg-[#3e3e3e] rounded text-gray-400"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                          </button>
                          <Button
                            onClick={() => runTests(q.id)}
                            disabled={running[q.id]}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 h-auto rounded flex items-center gap-2"
                          >
                            {running[q.id] ? <Loader size="sm" className="w-3 h-3 text-white" /> : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            Run Code
                          </Button>
                        </div>
                      </div>

                      {/* Editor Area */}
                      <div className="flex-1 relative">
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
                              padding: { top: 16 },
                              fontFamily: "'Fira Code', monospace",
                            }}
                          />
                        ) : (
                          <textarea
                            className="w-full h-full bg-[#1e1e1e] text-gray-300 p-4 font-mono text-sm resize-none focus:outline-none"
                            value={editor.code}
                            onChange={(e) => setCode(q.id, e.target.value)}
                          />
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )
            })}
        </div>
      </div >

      {/* Footer Submit Bar */}
      {
        showSubmitButton && !hideFooter && (
          <div className="shrink-0 bg-white border-t border-gray-200 p-4 px-6 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
            <div>
              <h3 className="font-bold text-gray-900">Ready to Submit?</h3>
              <p className="text-sm text-gray-500">Make sure you've tested all solutions before submitting.</p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={busy}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-sm transition-all text-sm"
            >
              {busy ? (
                <span className="flex items-center gap-2"><Loader size="sm" /> Submitting...</span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  Submit
                </span>
              )}
            </Button>
          </div>
        )
      }
    </div >
  )
}

export default CodingRound