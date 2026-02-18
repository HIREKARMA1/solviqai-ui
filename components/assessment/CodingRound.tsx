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
      <div className="flex-1 overflow-hidden p-0 sm:p-4">
        <div className="h-full flex flex-col">
          {(roundData?.questions || [])
            .filter((q: any) => !activeQuestionId || q.id === activeQuestionId)
            .map((q: any, idx: number) => {
              const editor = editors[q.id] || { language: 'python', code: '' }
              const meta = q.metadata || {}
              const isFullscreen = fullscreen === q.id
              const currentTab = activeTab[q.id] || 'problem'

              return (
                <div key={q.id} className="flex-1 flex flex-col min-h-0 bg-white shadow-sm border border-gray-200 sm:rounded-xl overflow-hidden">

                  {/* Question Header Bar */}
                  <div className="bg-white border-b border-gray-100 p-4 pb-0">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-semibold text-gray-500">Problem {idx + 1}</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${DIFFICULTY_CONFIG[meta.difficulty as keyof typeof DIFFICULTY_CONFIG]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {meta.difficulty || 'Easy'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">{meta.title || q.question_text.slice(0, 50)}</h2>
                      <button onClick={() => setFullscreen(isFullscreen ? null : q.id)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                      </button>
                    </div>
                    <div className="text-sm text-gray-500 pb-4">{meta.category || 'Matrix Operations'}</div>

                    {/* Tabs */}
                    <div className="flex gap-6 border-b border-gray-200">
                      {['problem', 'tests', 'submissions'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(prev => ({ ...prev, [q.id]: tab as any }))}
                          className={`pb-3 text-sm font-semibold capitalize transition-all border-b-2 ${currentTab === tab
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                        >
                          {tab === 'tests' ? 'Tests' : tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 min-h-0">

                    {/* LEFT PANEL: Problem Description */}
                    <div className="flex flex-col min-h-0 bg-white overflow-y-auto">
                      <div className="p-6 space-y-6">
                        {currentTab === 'problem' && (
                          <>
                            {/* Problem Text */}
                            <div className="prose prose-sm max-w-none text-gray-800 font-medium">
                              <p className="mb-4">{q.question_text.split(/\*\*Input Format:\*\*|\*\*Output Format:\*\*|\*\*Examples?:\*\*|\*\*Constraints?:\*\*/i)[0].trim()}</p>
                            </div>

                            {/* Formats */}
                            <div className="space-y-4">
                              {(() => {
                                // Input Format
                                const inputMatch = q.question_text.match(/\*\*Input Format:\*\*\s*([\s\S]+?)(?=\*\*|$)/i);
                                const inputFormat = inputMatch ? inputMatch[1].trim() : meta.input_format;

                                // Output Format
                                const outputMatch = q.question_text.match(/\*\*Output Format:\*\*\s*([\s\S]+?)(?=\*\*|$)/i);
                                const outputFormat = outputMatch ? outputMatch[1].trim() : meta.output_format;

                                return (
                                  <>
                                    {/* Example Input/Output Box style from Figma */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                      <div className="p-4 space-y-4">
                                        {inputFormat && (
                                          <div>
                                            <h4 className="font-bold text-gray-900 mb-1 text-sm">Input Format:</h4>
                                            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-600">
                                              {inputFormat}
                                            </div>
                                          </div>
                                        )}
                                        {outputFormat && (
                                          <div>
                                            <h4 className="font-bold text-gray-900 mb-1 text-sm">Output Format:</h4>
                                            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-600">
                                              {outputFormat}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Example Section */}
                                    <div>
                                      <h4 className="font-bold text-gray-900 mb-2 text-sm">Example:</h4>
                                      {(() => {
                                        // Same example parsing logic
                                        const examplesMatch = q.question_text.match(/\*\*Examples?:\*\*\s*([\s\S]+?)(?=\*\*Constraints?:\*\*|$)/i);
                                        if (examplesMatch) {
                                          const examplesText = examplesMatch[1];
                                          // Simple parsing for first example
                                          const inputEx = examplesText.match(/Input:\s*([\s\S]+?)(?:\n|Output:|$)/i)?.[1]?.trim();
                                          const outputEx = examplesText.match(/Output:\s*([\s\S]+?)(?:\n|$)/i)?.[1]?.trim();

                                          return (
                                            <div className="bg-gray-50 p-4 rounded-lg text-sm border border-gray-200">
                                              <div className="mb-2">
                                                <span className="text-gray-500 block mb-1">Input:</span>
                                                <span className="font-mono text-gray-800">{inputEx || 'hello'}</span>
                                              </div>
                                              <div>
                                                <span className="text-gray-500 block mb-1">Output:</span>
                                                <span className="font-mono text-gray-800">{outputEx || 'olleh'}</span>
                                              </div>
                                            </div>
                                          )
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </>
                                )
                              })()}
                            </div>

                            {/* Blue Info Box */}
                            <div className="bg-[#E3F2FD] border-l-4 border-[#2196F3] p-4 rounded-r-md flex gap-3">
                              <div className="mt-0.5">
                                <svg className="w-5 h-5 text-[#2196F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-bold text-[#1565C0] text-sm">Input/Output Instructions</h4>
                                <p className="text-sm text-[#1E88E5] mt-1">
                                  Read input using <code className="font-mono bg-blue-100 px-1 rounded">input()</code> or <code className="font-mono bg-blue-100 px-1 rounded">sys.stdin.read()</code>, then print the result. Do not include test cases in your code.
                                </p>
                              </div>
                            </div>

                            {/* Orange Constraint Box */}
                            <div className="bg-[#FFF3E0] border border-[#FFE0B2] p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-[#F57C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h4 className="font-bold text-[#EF6C00]">Constraints</h4>
                              </div>
                              <ul className="space-y-2 ml-1">
                                {(() => {
                                  const constraintsMatch = q.question_text.match(/\*\*Constraints?:\*\*\s*([\s\S]+?)(?=\*\*|$)/i);
                                  const list = constraintsMatch
                                    ? constraintsMatch[1].split(/\n|•|\*/).filter((c: string) => c.trim().length > 0)
                                    : ["1 <= number of tasks <= 10^4", "1 <= start_time < end_time <= 10^5"];

                                  return list.map((c: string, i: number) => (
                                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>
                                      <span>{c.trim().replace(/^[-•]\s*/, '')}</span>
                                    </li>
                                  ))
                                })()}
                              </ul>
                            </div>
                          </>
                        )}

                        {/* RE-USE EXISTING TABS LOGIC FOR TESTS & SUBMISSIONS (SIMPLIFIED) */}
                        {currentTab === 'tests' && (
                          <div className="space-y-4">
                            <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg">
                              <h3 className="font-bold text-gray-900 text-base mb-2">Test Cases</h3>
                              <p className="text-sm text-gray-600">Run your code to see results against these cases.</p>
                            </div>
                            {results[q.id]?.results?.length > 0 ? (
                              results[q.id].results.map((r: any, i: number) => (
                                <div key={i} className={`p-4 rounded-lg border ${r.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                  <div className="font-bold mb-1 text-sm">{r.passed ? 'Test Case Passed' : 'Test Case Failed'}</div>
                                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                    <div className="bg-white p-2 rounded border border-gray-200">
                                      <div className="text-gray-500 mb-1">Input</div>
                                      <div>{String(r.input || '-')}</div>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-gray-200">
                                      <div className="text-gray-500 mb-1">Expected</div>
                                      <div>{String(r.expected || '-')}</div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="space-y-3">
                                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                  <div className="font-bold text-gray-800 text-sm mb-1">Test Case 1</div>
                                  <div className="text-xs text-gray-600">Input: [2, 7, 11, 15], target = 9</div>
                                  <div className="text-xs text-gray-600">Expected: [0, 1]</div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                  <div className="font-bold text-gray-800 text-sm mb-1">Test Case 2</div>
                                  <div className="text-xs text-gray-600">Input: [3, 2, 4], target = 6</div>
                                  <div className="text-xs text-gray-600">Expected: [1, 2]</div>
                                </div>
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
                            )) || <div className="text-gray-500 text-sm">No submissions yet available.</div>}
                          </div>
                        )}

                      </div>
                    </div>

                    {/* RIGHT PANEL: Code Editor */}
                    <div className="flex flex-col min-h-0 bg-[#1e1e1e]">
                      {/* Toolbar */}
                      <div className="flex items-center justify-between px-4 py-2 bg-[#F5F5F5] border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-900 text-sm font-bold">Select Language:</span>
                          <select
                            value={editor.language}
                            onChange={(e) => setLang(q.id, e.target.value)}
                            className="bg-white text-gray-900 border border-gray-300 text-sm rounded-md px-3 py-1 outline-none focus:border-blue-500 shadow-sm"
                          >
                            {LANGS.map(l => (
                              <option key={l.key} value={l.key}>{l.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => runTests(q.id)}
                            disabled={running[q.id]}
                            className="bg-[#2979FF] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 h-auto rounded flex items-center gap-2 shadow-sm transition-all"
                          >
                            {running[q.id] ? <Loader size="sm" className="w-3 h-3 text-white" /> : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            Run code
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
                              scrollBeyondLastLine: false,
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
          <div className="shrink-0 bg-white border-t border-gray-200 p-4 px-6 flex items-center justify-end shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
            <Button
              onClick={handleSubmit}
              disabled={busy}
              className="bg-[#2979FF] hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg shadow-sm transition-all text-sm"
            >
              {busy ? (
                <span className="flex items-center gap-2"><Loader size="sm" /> Submitting...</span>
              ) : (
                <span className="flex items-center gap-2">
                  Submit Solutions
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