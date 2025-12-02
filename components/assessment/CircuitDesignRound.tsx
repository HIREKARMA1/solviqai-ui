"use client";

import { useMemo, useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api'

export type CircuitDesignRoundProps = {
  assessmentId: string
  roundData: any
  onSubmitted?: (result: any) => void
  timeLeft?: number | null
}

// Difficulty is now determined by LLM based on job role - no longer displayed in UI

export function CircuitDesignRound({ assessmentId, roundData, onSubmitted, timeLeft }: CircuitDesignRoundProps) {
  const [busy, setBusy] = useState(false)
  const [simulating, setSimulating] = useState<Record<string, boolean>>({})
  const [simulationResults, setSimulationResults] = useState<Record<string, any>>({})
  const [fullscreen, setFullscreen] = useState<string | null>(null)
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({})
  const [circuitStates, setCircuitStates] = useState<Record<string, any>>({})
  const [measurements, setMeasurements] = useState<Record<string, any>>({})
  const [manualExportText, setManualExportText] = useState<Record<string, string>>({})
  const [circuitUrlInput, setCircuitUrlInput] = useState<Record<string, string>>({})
  const [showManualInput, setShowManualInput] = useState<Record<string, boolean>>({})
  const postMessageListeners = useRef<Record<string, ((event: MessageEvent) => void) | null>>({})
  const urlPollIntervals = useRef<Record<string, NodeJS.Timeout | null>>({})
  const [capturingState, setCapturingState] = useState<Record<string, boolean>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [validating, setValidating] = useState<Record<string, boolean>>({})
  const [validationResults, setValidationResults] = useState<Record<string, any>>({})

  // Initialize circuit states and load from localStorage backup
  useEffect(() => {
    if (!roundData?.questions) return
    
    const states: Record<string, any> = {}
    for (const q of (roundData?.questions || []).slice(0, 1)) {
      const qid = q.id
      // Try to load from localStorage backup
      try {
        const stored = localStorage.getItem(`circuit_state_${qid}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Only use if less than 1 hour old
          if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp) < 3600000) {
            states[qid] = parsed
            console.log('Loaded circuit state from localStorage backup')
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    if (Object.keys(states).length > 0) {
      setCircuitStates(prev => ({ ...prev, ...states }))
    }
  }, [roundData])

  const [activeTab, setActiveTab] = useState<Record<string, 'problem' | 'simulation' | 'submission'>>({})
  
  useEffect(() => {
    // Initialize tabs (only first question)
    const tabs: Record<string, 'problem' | 'simulation' | 'submission'> = {}
    for (const q of (roundData?.questions || []).slice(0, 1)) {
      tabs[q.id] = 'problem'
    }
    setActiveTab(tabs)
  }, [roundData])

  // ========== METHOD 1: URL-Based Capture (Primary) ==========
  // Monitor CircuitJS iframe URL for circuit state (ctz parameter)
  useEffect(() => {
    if (!roundData?.questions) return

    // Only process first question
    (roundData.questions.slice(0, 1)).forEach((q: any) => {
      const qid = q.id
      const iframe = iframeRefs.current[qid]
      
      if (!iframe) return

      // Function to extract circuit state from URL
      const extractCircuitStateFromUrl = (url: string): any => {
        try {
          // CircuitJS stores state in URL parameter 'ctz'
          // Format: https://falstad.com/circuit/circuitjs.html?ctz=...
          if (url.includes('ctz=')) {
            const urlObj = new URL(url)
            const ctzParam = urlObj.searchParams.get('ctz')
            
            if (ctzParam) {
              return {
                circuit_url: url,
                circuit_state: ctzParam, // Base64 encoded circuit data
                method: 'url',
                timestamp: Date.now()
              }
            }
          }
        } catch (e) {
          console.warn(`Failed to parse URL for question ${qid}:`, e)
        }
        return null
      }

      // Function to check and update circuit state
      const checkCircuitState = () => {
        try {
          // Try to access iframe URL (may fail due to cross-origin restrictions)
          const iframeUrl = iframe.contentWindow?.location.href
          
          if (iframeUrl && iframeUrl.includes('falstad.com')) {
            const state = extractCircuitStateFromUrl(iframeUrl)
            if (state) {
              setCircuitStates(prev => {
                // Only update if state actually changed
                const current = prev[qid]
                if (!current || current.circuit_state !== state.circuit_state) {
                  return { ...prev, [qid]: state }
                }
                return prev
              })
            }
          }
        } catch (e) {
          // Cross-origin error - URL access blocked, will use postMessage fallback
          // This is expected and handled by fallback method
        }
      }

      // Poll for URL changes every 2 seconds
      // CircuitJS updates URL when circuit changes
      urlPollIntervals.current[qid] = setInterval(checkCircuitState, 2000)

      // Initial check
      checkCircuitState()
    })

    // Cleanup intervals on unmount
    return () => {
      Object.values(urlPollIntervals.current).forEach(interval => {
        if (interval) clearInterval(interval)
      })
    }
  }, [roundData])

  // ========== METHOD 2: postMessage API (Fallback) ==========
  // Listen for messages from CircuitJS iframe
  useEffect(() => {
    if (!roundData?.questions) return

    // Set up message listener for first question only
    (roundData.questions.slice(0, 1)).forEach((q: any) => {
      const qid = q.id

      const handleMessage = (event: MessageEvent) => {
        // Security: Verify origin
        if (event.origin !== 'https://falstad.com' && event.origin !== 'http://localhost:8080') {
          return
        }

        // Handle different message types from CircuitJS
        if (event.data) {
          // Handle string messages (CircuitJS might send URL as string)
          if (typeof event.data === 'string') {
            // Check if it's a CircuitJS URL with ctz parameter
            if (event.data.includes('ctz=') && event.data.includes('falstad.com')) {
              try {
                const urlObj = new URL(event.data)
                const ctzParam = urlObj.searchParams.get('ctz')
                if (ctzParam && ctzParam.trim().length > 0) {
                  const state = {
                    circuit_url: event.data,
                    circuit_state: ctzParam,
                    method: 'postMessage_url',
                    timestamp: Date.now()
                  }
                  setCircuitStates(prev => ({ ...prev, [qid]: state }))
                  // Save to localStorage backup
                  try {
                    localStorage.setItem(`circuit_state_${qid}`, JSON.stringify(state))
                  } catch (e) {
                    // Ignore localStorage errors
                  }
                }
              } catch (e) {
                // Invalid URL, ignore
              }
            }
          }
          
          // Handle object messages
          if (typeof event.data === 'object') {
            // CircuitJS might send state updates
            if (event.data.type === 'circuitState' || event.data.circuitState || event.data.state) {
              const state = event.data.circuitState || event.data.state || event.data
              const stateObj = {
                circuit_state: typeof state === 'string' ? state : JSON.stringify(state),
                circuit_url: event.data.circuitUrl || event.data.url || null,
                method: 'postMessage',
                timestamp: Date.now()
              }
              
              setCircuitStates(prev => ({
                ...prev,
                [qid]: stateObj
              }))
              
              // Save to localStorage backup
              try {
                localStorage.setItem(`circuit_state_${qid}`, JSON.stringify(stateObj))
              } catch (e) {
                // Ignore localStorage errors
              }
            }

            // CircuitJS might send measurements
            if (event.data.type === 'measurements' || event.data.measurements) {
              const meas = event.data.measurements || event.data
              setMeasurements(prev => ({
                ...prev,
                [qid]: meas
              }))
            }
          }
        }
      }

      // Store listener reference for cleanup
      postMessageListeners.current[qid] = handleMessage
      window.addEventListener('message', handleMessage)
    })

    // Cleanup listeners on unmount
    return () => {
      Object.values(postMessageListeners.current).forEach(listener => {
        if (listener) {
          window.removeEventListener('message', listener)
        }
      })
    }
  }, [roundData])

  // Request circuit state via postMessage (fallback method)
  const requestCircuitStateViaPostMessage = (qid: string) => {
    const iframe = iframeRefs.current[qid]
    if (!iframe || !iframe.contentWindow) return

    try {
      // Try multiple message formats that CircuitJS might support
      const messages = [
        { type: 'requestState', source: 'solviqai' },
        { action: 'getCircuitState', source: 'solviqai' },
        { command: 'export', source: 'solviqai' },
        { method: 'getState', source: 'solviqai' },
        'getState', // Some APIs accept string commands
        'export'
      ]
      
      messages.forEach(msg => {
        try {
          iframe.contentWindow?.postMessage(msg, 'https://falstad.com')
        } catch (e) {
          // Ignore individual message failures
        }
      })
    } catch (e) {
      // Ignore postMessage errors
    }
  }

  // ========== Unified Circuit State Getter ==========
  // Handle manual export text input (fallback method)
  const handleManualExport = (qid: string, exportText: string) => {
    if (!exportText || exportText.trim().length === 0) {
      toast.error('Please paste the exported circuit text')
      return
    }

    // Store manual export as circuit state
    const state = {
      circuit_state: exportText.trim(),
      circuit_url: null,
      method: 'manual_export',
      timestamp: Date.now()
    }
    
    setCircuitStates(prev => ({
      ...prev,
      [qid]: state
    }))
    
    // Save to localStorage backup
    try {
      localStorage.setItem(`circuit_state_${qid}`, JSON.stringify(state))
    } catch (e) {
      // Ignore localStorage errors
    }

    setShowManualInput(prev => ({ ...prev, [qid]: false }))
    toast.success('Circuit state captured from manual export!')
  }
  
  // Handle circuit URL input (user can paste CircuitJS share URL)
  const handleCircuitUrlInput = (qid: string, url: string) => {
    if (!url || url.trim().length === 0) {
      toast.error('Please paste the CircuitJS share URL')
      return
    }

    try {
      // Extract ctz parameter from URL
      const urlObj = new URL(url.trim())
      const ctzParam = urlObj.searchParams.get('ctz')
      
      if (!ctzParam || ctzParam.trim().length === 0) {
        toast.error('Invalid CircuitJS URL. Please ensure it contains circuit data (ctz parameter)')
        return
      }

      const state = {
        circuit_url: url.trim(),
        circuit_state: ctzParam,
        method: 'url_input',
        timestamp: Date.now()
      }
      
      setCircuitStates(prev => ({
        ...prev,
        [qid]: state
      }))
      
      // Save to localStorage backup
      try {
        localStorage.setItem(`circuit_state_${qid}`, JSON.stringify(state))
      } catch (e) {
        // Ignore localStorage errors
      }
      
      setCircuitUrlInput(prev => ({ ...prev, [qid]: '' }))
      toast.success('Circuit state captured from URL!')
    } catch (e) {
      toast.error('Invalid URL format. Please paste a valid CircuitJS share URL')
    }
  }

  // Get circuit state from CircuitJS iframe (tries URL first, then postMessage, then manual)
  const getCircuitStateFromIframe = (qid: string): any => {
    const iframe = iframeRefs.current[qid]
    let currentState = circuitStates[qid]
    
    // Priority 1: Manual export (most reliable)
    if (currentState && currentState.method === 'manual_export' && currentState.circuit_state) {
      return currentState
    }
    
    // Priority 2: URL input (user pasted CircuitJS share URL)
    if (currentState && currentState.method === 'url_input' && currentState.circuit_state) {
      return currentState
    }

    // Priority 3: PostMessage URL (CircuitJS sent URL via postMessage)
    if (currentState && currentState.method === 'postMessage_url' && currentState.circuit_state) {
      return currentState
    }

    // Priority 4: URL-based capture (from polling - if it worked)
    if (currentState && currentState.method === 'url' && currentState.circuit_state) {
      return currentState
    }

    // Priority 5: PostMessage-based capture (fallback)
    if (currentState && currentState.method === 'postMessage' && currentState.circuit_state) {
      return currentState
    }
    
    // Priority 6: Try localStorage backup
    if (!currentState || !currentState.circuit_state) {
      try {
        const stored = localStorage.getItem(`circuit_state_${qid}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed && parsed.circuit_state && parsed.circuit_state.trim().length > 0) {
            // Restore to state
            setCircuitStates(prev => ({ ...prev, [qid]: parsed }))
            return parsed
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }

    // If no state found and iframe exists, try requesting via postMessage
    if (iframe && (!currentState || !currentState.circuit_state)) {
      requestCircuitStateViaPostMessage(qid)
    }

    // Return whatever state we have (might be empty)
    return currentState || null
  }

  // Get CircuitJS shareable URL
  const getCircuitUrl = (qid: string): string | null => {
    const state = circuitStates[qid]
    if (state && state.circuit_url) {
      return state.circuit_url
    }
    
    // Try to get from iframe directly
    const iframe = iframeRefs.current[qid]
    if (iframe) {
      try {
        const url = iframe.contentWindow?.location.href
        if (url && url.includes('ctz=')) {
          return url
        }
      } catch (e) {
        // Cross-origin error - expected
      }
    }
    
    return null
  }

  // Get measurements from circuit
  const getMeasurementsFromCircuit = (qid: string): any => {
    return measurements[qid] || {}
  }

  const handleSimulate = async (qid: string) => {
    // Try to capture circuit state first
    let circuitState = getCircuitStateFromIframe(qid)
    
    // If no state found, try requesting via postMessage with retry logic
    if (!circuitState || !circuitState.circuit_state) {
      requestCircuitStateViaPostMessage(qid)
      
      // ✅ FIX: Use retry logic similar to submission for consistency
      const MAX_RETRIES = 3
      const INITIAL_DELAY_MS = 300
      let retryCount = 0
      
      while (retryCount < MAX_RETRIES && (!circuitState || !circuitState.circuit_state)) {
        const delay = INITIAL_DELAY_MS * (retryCount + 1) // 300, 600, 900ms
        await new Promise(resolve => setTimeout(resolve, delay))
        circuitState = getCircuitStateFromIframe(qid)
        
        if (circuitState?.circuit_state) {
          break // Successfully captured
        }
        
        retryCount++
        if (retryCount < MAX_RETRIES) {
          requestCircuitStateViaPostMessage(qid) // Request again
        }
      }
    }

    if (!circuitState || !circuitState.circuit_state) {
      toast.error('Unable to capture circuit state. Please ensure you have added components and try clicking "Refresh Capture" button, or use Manual Export option.', { duration: 5000 })
      return
    }

    try {
      setSimulating(prev => ({...prev, [qid]: true}))
      
      const question = roundData.questions.find((q: any) => q.id === qid)
      const circuitUrl = getCircuitUrl(qid)
      const result = await apiClient.simulateCircuit({
        circuit_state: circuitState.circuit_state || circuitState,
        circuit_url: circuitUrl || undefined,
        question_id: qid
      })
      
      setSimulationResults(prev => ({...prev, [qid]: result}))
      setActiveTab(prev => ({...prev, [qid]: 'simulation'}))
      toast.success('Circuit simulated successfully!')
    } catch (e: any) {
      console.error('Simulation error:', e)
      const msg = e?.response?.data?.detail || e?.message || 'Simulation failed'
      toast.error(msg)
    } finally {
      setSimulating(prev => ({...prev, [qid]: false}))
    }
  }

  // Capture circuit state with loading indicator
  // Attempts to get fresh circuit state, especially important at submission time
  const captureCircuitStateWithLoading = async (qid: string, forceFresh: boolean = false) => {
    setCapturingState(prev => ({...prev, [qid]: true}))
    try {
      const iframe = iframeRefs.current[qid]
      let circuitState: any = null
      
      // Always check cached state first - if it exists and is valid, use it
      // This handles the case where user submits without making changes
      const cachedState = getCircuitStateFromIframe(qid)
      circuitState = cachedState
      
      // If we have valid cached state and not forcing fresh, return it immediately
      if (circuitState && circuitState.circuit_state && !forceFresh) {
        return circuitState
      }
      
      // If forcing fresh, try to get fresh state but keep cached state as fallback
      // If no cached state, we must try to get fresh state
      if (forceFresh || !circuitState || !circuitState.circuit_state) {
        // Try direct iframe URL access first (most reliable if CORS allows)
        if (iframe) {
          try {
            const iframeUrl = iframe.contentWindow?.location.href
            if (iframeUrl && iframeUrl.includes('ctz=')) {
              const urlObj = new URL(iframeUrl)
              const ctzParam = urlObj.searchParams.get('ctz')
              // Accept any non-empty ctz parameter (even if short, it might be valid)
              if (ctzParam && ctzParam.trim().length > 0) {
              const freshState = {
                circuit_url: iframeUrl,
                circuit_state: ctzParam,
                method: forceFresh ? 'url_direct' : 'url',
                timestamp: Date.now()
              }
              setCircuitStates(prev => ({ ...prev, [qid]: freshState }))
              // Save to localStorage backup
              try {
                localStorage.setItem(`circuit_state_${qid}`, JSON.stringify(freshState))
              } catch (e) {
                // Ignore localStorage errors
              }
              return freshState
              }
            }
          } catch (e) {
            // CORS error expected - continue to other methods
            console.log('Direct URL access blocked (CORS), trying other methods...')
          }
        }
        
        // Request via postMessage
        requestCircuitStateViaPostMessage(qid)
        
        // Retry with exponential backoff
        const MAX_RETRIES = 6
        const INITIAL_DELAY_MS = 200
        let retryCount = 0
        
        while (retryCount < MAX_RETRIES) {
          const delay = INITIAL_DELAY_MS * Math.pow(2, retryCount)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          // Try getting state from cache (updated by polling or postMessage)
          circuitState = getCircuitStateFromIframe(qid)
          
          // Also try URL capture again in each retry
          if (iframe && (!circuitState || !circuitState.circuit_state)) {
            try {
              const iframeUrl = iframe.contentWindow?.location.href
              if (iframeUrl && iframeUrl.includes('ctz=')) {
                const urlObj = new URL(iframeUrl)
                const ctzParam = urlObj.searchParams.get('ctz')
                if (ctzParam && ctzParam.trim().length > 0) {
                const urlState = {
                  circuit_url: iframeUrl,
                  circuit_state: ctzParam,
                  method: 'url',
                  timestamp: Date.now()
                }
                setCircuitStates(prev => ({ ...prev, [qid]: urlState }))
                // Save to localStorage backup
                try {
                  localStorage.setItem(`circuit_state_${qid}`, JSON.stringify(urlState))
                } catch (e) {
                  // Ignore localStorage errors
                }
                circuitState = urlState
                  break
                }
              }
            } catch (e) {
              // Continue to next retry
            }
          }
          
          // If we got valid state, break
          if (circuitState && circuitState.circuit_state) break
          
          retryCount++
          if (retryCount < MAX_RETRIES) {
            requestCircuitStateViaPostMessage(qid)
          }
        }
      }
      
      // If we still don't have state but have cached state, use cached state as fallback
      // This ensures we submit whatever was last captured, even if fresh capture failed
      if ((!circuitState || !circuitState.circuit_state) && circuitStates[qid] && circuitStates[qid].circuit_state) {
        console.log('Using cached circuit state as fallback')
        const cached = circuitStates[qid]
        // Save to localStorage
        try {
          localStorage.setItem(`circuit_state_${qid}`, JSON.stringify(cached))
        } catch (e) {
          // Ignore localStorage errors
        }
        return cached
      }
      
      // Final fallback: Try localStorage
      if ((!circuitState || !circuitState.circuit_state)) {
        try {
          const stored = localStorage.getItem(`circuit_state_${qid}`)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed && parsed.circuit_state) {
              // Accept even if empty string - let backend handle validation
              console.log('Using localStorage backup as final fallback')
              // Restore to state
              setCircuitStates(prev => ({ ...prev, [qid]: parsed }))
              return parsed
            }
          }
        } catch (e) {
          console.warn('Failed to read from localStorage:', e)
        }
      }
      
      // Return whatever we have, even if empty - let submission handler deal with it
      return circuitState
    } finally {
      setCapturingState(prev => ({...prev, [qid]: false}))
    }
  }

  // Validate circuit
  const handleValidate = async (qid: string) => {
    try {
      setValidating(prev => ({...prev, [qid]: true}))
      const circuitState = await captureCircuitStateWithLoading(qid)
      
      if (!circuitState || !circuitState.circuit_state) {
        toast.error('Circuit appears to be empty. Please add components first.')
        return
      }

      const question = roundData.questions.find((q: any) => q.id === qid)
      const meta = question?.metadata || question?.question_metadata || {}
      const result = await apiClient.validateCircuit({
        circuit_state: circuitState.circuit_state,
        expected_config: meta.expected_config || {},
        circuit_url: getCircuitUrl(qid) || undefined
      })
      
      setValidationResults(prev => ({...prev, [qid]: result}))
      setActiveTab(prev => ({...prev, [qid]: 'simulation'}))
      
      if (result.valid) {
        toast.success(`Validation passed! Score: ${result.score}/100`)
      } else {
        toast.error(`Validation failed. Score: ${result.score}/100`)
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || 'Validation failed')
    } finally {
      setValidating(prev => ({...prev, [qid]: false}))
    }
  }

  // Show preview before submission
  const handlePreview = async () => {
    try {
      const q = roundData?.questions?.[0]
      if (!q) return
      
      const circuitState = await captureCircuitStateWithLoading(q.id)
      if (!circuitState || !circuitState.circuit_state) {
        toast.error('Circuit appears to be empty. Please design a circuit first.')
        return
      }

      setPreviewData({
        question_text: q.question_text,
        circuit_state: circuitState.circuit_state,
        circuit_url: getCircuitUrl(q.id),
        capture_method: circuitState?.method || 'unknown'
      })
      setShowPreview(true)
    } catch (e: any) {
      toast.error('Failed to capture circuit for preview')
    }
  }

  // Submit with confirmation
  const handleSubmitClick = () => {
    setShowConfirmDialog(true)
  }

  const handleSubmit = async () => {
    setShowConfirmDialog(false)
    try {
      setBusy(true)
      
      // Pre-check: Warn if no state is available before attempting capture
      const q = roundData?.questions?.[0]
      if (q) {
        const hasState = circuitStates[q.id]?.circuit_state || 
          (() => {
            try {
              const stored = localStorage.getItem(`circuit_state_${q.id}`)
              return stored ? JSON.parse(stored)?.circuit_state : null
            } catch { return null }
          })()
        
        if (!hasState) {
          // Show warning but don't block - let capture attempt proceed
          console.warn('No circuit state found before submission attempt')
        }
      }
      
      const responses = await Promise.all(
        (roundData?.questions || []).slice(0, 1).map(async (q: any) => {
          // Try to capture circuit state (will use cached if available, or attempt fresh capture)
          const circuitState = await captureCircuitStateWithLoading(q.id, true)
          const circuitMeasurements = getMeasurementsFromCircuit(q.id)
          const circuitUrl = getCircuitUrl(q.id)
          
          // Check if circuit state is valid - accept any non-empty state
          if (!circuitState || !circuitState.circuit_state || circuitState.circuit_state.trim().length === 0) {
            // Fallback 1: Check cached state in memory
            let finalState = circuitStates[q.id]
            
            // Fallback 2: Check localStorage directly (most reliable backup)
            if (!finalState || !finalState.circuit_state || finalState.circuit_state.trim().length === 0) {
              try {
                const stored = localStorage.getItem(`circuit_state_${q.id}`)
                if (stored) {
                  const parsed = JSON.parse(stored)
                  if (parsed && parsed.circuit_state && parsed.circuit_state.trim().length > 0) {
                    console.log('Using localStorage backup for submission')
                    finalState = parsed
                    // Restore to state for consistency
                    setCircuitStates(prev => ({ ...prev, [q.id]: parsed }))
                  }
                }
              } catch (e) {
                console.warn('Failed to read from localStorage:', e)
              }
            }
            
            // If we found a valid fallback state, use it
            if (finalState && finalState.circuit_state && finalState.circuit_state.trim().length > 0) {
              console.log('Using fallback state for submission:', finalState.method || 'unknown')
              // Save to localStorage before submitting (update timestamp)
              try {
                finalState.timestamp = Date.now()
                localStorage.setItem(`circuit_state_${q.id}`, JSON.stringify(finalState))
              } catch (e) {
                // Ignore localStorage errors
              }
              return {
                question_id: q.id,
                response_text: JSON.stringify({
                  circuit_state: finalState.circuit_state,
                  circuit_url: finalState.circuit_url || circuitUrl,
                  measurements: circuitMeasurements,
                  capture_method: finalState?.method || 'fallback'
                }),
                response_data: {
                  circuit_state: finalState.circuit_state,
                  circuit_url: finalState.circuit_url || circuitUrl,
                  measurements: circuitMeasurements,
                  capture_method: finalState?.method || 'fallback'
                },
                time_taken: 0,
              }
            }
            
            // Final fallback: Check if user has ANY circuit state stored anywhere
            // This is a last resort - accept even minimal state
            const allPossibleStates = [
              circuitState,
              circuitStates[q.id],
              (() => {
                try {
                  const stored = localStorage.getItem(`circuit_state_${q.id}`)
                  return stored ? JSON.parse(stored) : null
                } catch { return null }
              })()
            ].filter(s => s && s.circuit_state)
            
            if (allPossibleStates.length > 0) {
              const anyState = allPossibleStates[0]
              console.log('Using any available state as last resort:', anyState.method || 'unknown')
              return {
                question_id: q.id,
                response_text: JSON.stringify({
                  circuit_state: anyState.circuit_state || '',
                  circuit_url: anyState.circuit_url || circuitUrl,
                  measurements: circuitMeasurements,
                  capture_method: anyState?.method || 'last_resort'
                }),
                response_data: {
                  circuit_state: anyState.circuit_state || '',
                  circuit_url: anyState.circuit_url || circuitUrl,
                  measurements: circuitMeasurements,
                  capture_method: anyState?.method || 'last_resort'
                },
                time_taken: 0,
              }
            }
            
            // If we get here, truly no state available
            // Auto-open manual export section to help user
            setShowManualInput(prev => ({ ...prev, [q.id]: true }))
            
            const errorMsg = `Unable to capture circuit state automatically. Please use the "Manual Export" option below:\n\n1. In CircuitJS, right-click → "File" → "Export"\n2. Copy the exported text\n3. Paste it in the "Manual Export" section below\n4. Click "Import Circuit Text"\n5. Then submit again.`
            toast.error(errorMsg, { duration: 10000 })
            throw new Error('Circuit state capture failed - no state available')
          }
          
          // Save successful capture to localStorage before submitting
          try {
            localStorage.setItem(`circuit_state_${q.id}`, JSON.stringify(circuitState))
          } catch (e) {
            // Ignore localStorage errors
          }
          
          return {
            question_id: q.id,
            response_text: JSON.stringify({
              circuit_state: circuitState.circuit_state,
              circuit_url: circuitUrl,
              measurements: circuitMeasurements,
              capture_method: circuitState?.method || 'unknown'
            }),
            response_data: {
              circuit_state: circuitState.circuit_state,
              circuit_url: circuitUrl,
              measurements: circuitMeasurements,
              capture_method: circuitState?.method || 'unknown'
            },
            time_taken: 0,
          }
        })
      )
      
      const res = await apiClient.submitRoundResponses(assessmentId, roundData.round_id, responses)
      toast.success('Circuit designs submitted successfully!')
      onSubmitted?.(res)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Submit failed'
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  // Undo/Redo handlers
  const handleUndo = (qid: string) => {
    const iframe = iframeRefs.current[qid]
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ action: 'undo' }, 'https://falstad.com')
      toast('Undo', { duration: 1000 })
    }
  }

  const handleRedo = (qid: string) => {
    const iframe = iframeRefs.current[qid]
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ action: 'redo' }, 'https://falstad.com')
      toast('Redo', { duration: 1000 })
    }
  }

  // Format time
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`min-h-screen w-screen bg-slate-50 dark:bg-slate-950 ${fullscreen ? 'overflow-y-auto' : ''}`}>
      <div className="w-full flex flex-col">
        {/* Circuit Design Problems - Only show first question */}
        {(roundData?.questions || []).slice(0, 1).map((q: any, idx: number) => {
          const meta = q.metadata || q.question_metadata || {}
          const simulationResult = simulationResults[q.id]
          const currentTab = activeTab[q.id] || 'problem'
          const isFullscreen = fullscreen === q.id

          return (
            <div 
              key={q.id} 
              className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl max-h-[calc(100vh-2rem)] overflow-y-auto' : 'min-h-screen'}`}
            >
              {/* Professional Header Bar */}
              <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700 px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex-shrink-0">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 flex-shrink-0">
                        <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Q{idx + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                          Circuit Design Assessment
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {meta.circuit_type ? meta.circuit_type.replace('_', ' ').toUpperCase() : 'ELECTRONIC CIRCUIT'}
                        </p>
                      </div>
                    </div>
                    {simulationResult && (
                      <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide border flex-shrink-0 ${
                        simulationResult.valid 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' 
                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
                      }`}>
                        {simulationResult.valid ? '✓ Validated' : '✗ Invalid'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`flex-1 grid grid-cols-1 lg:grid-cols-[minmax(300px,35%)_minmax(500px,65%)] divide-x-0 lg:divide-x divide-slate-200 dark:divide-slate-800 ${isFullscreen ? 'min-h-0' : ''}`}>
                {/* Left Panel - Problem Description */}
                <div className={`flex flex-col bg-white dark:bg-slate-900 ${isFullscreen ? 'min-h-0 overflow-hidden' : ''}`}>
                  {/* Professional Tabs */}
                  <div className="flex border-b-2 border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/80 dark:to-slate-900 flex-shrink-0 shadow-sm overflow-x-auto">
                    {(['problem', 'simulation', 'submission'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(prev => ({...prev, [q.id]: tab}))}
                        className={`px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 text-xs font-semibold uppercase tracking-wider transition-all relative flex-shrink-0 whitespace-nowrap ${
                          currentTab === tab
                            ? 'text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {currentTab === tab && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 rounded-t-full" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className={`${isFullscreen ? 'flex-1 overflow-y-auto overflow-x-hidden' : ''} p-4 sm:p-6 space-y-4 bg-white dark:bg-slate-900 ${isFullscreen ? 'min-h-0' : ''}`}>
                    {currentTab === 'problem' && (
                      <>
                        {/* Question Statement */}
                        <div className="border-l-4 border-slate-900 dark:border-slate-100 pl-4 py-2 bg-slate-50/30 dark:bg-slate-800/20 rounded-r-lg">
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Question Statement
                          </div>
                          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-100 font-medium pr-2">
                            {q.question_text || q.statement || 'No question text available. Please refresh the page.'}
                          </p>
                        </div>

                        {/* Actual Question Content (LLM Generated) */}
                        {(() => {
                          // ✅ FIX: Extract complex fallback chain to helper function for maintainability
                          const getQuestionDetails = (question: any, metadata: any): string | null => {
                            return question.explanation || 
                                   metadata.explanation || 
                                   metadata.description || 
                                   metadata.question || 
                                   metadata.details || 
                                   metadata.content || 
                                   question.description || 
                                   question.details || 
                                   question.content || 
                                   null
                          }
                          
                          const questionDetails = getQuestionDetails(q, meta)
                          
                          return questionDetails ? (
                            <div className="border-l-4 border-blue-600 dark:border-blue-400 pl-4 py-2 bg-blue-50/30 dark:bg-blue-950/20 rounded-r-lg">
                              <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">
                                Question Details
                              </div>
                              <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-100 pr-2 whitespace-pre-wrap">
                                {questionDetails}
                              </p>
                            </div>
                          ) : null
                        })()}

                        {/* Instructions Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-l-4 border-blue-500 dark:border-blue-400 rounded-lg p-3 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="font-semibold text-blue-900 dark:text-blue-200 text-xs uppercase tracking-wider">
                              Instructions
                            </div>
                          </div>
                          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed pl-7">
                            Use the CircuitJS simulator on the right to design your circuit. Add components, connect them, and test your design.
                          </p>
                        </div>

                        {meta.expected_components && Array.isArray(meta.expected_components) && meta.expected_components.length > 0 && (
                          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                              Required Components
                            </div>
                            <div className="space-y-2">
                              {meta.expected_components.map((comp: string, i: number) => (
                                <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400 flex-shrink-0"></div>
                                  <span className="font-medium capitalize">{comp}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {meta.evaluation_criteria && (
                          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                              Evaluation Criteria
                            </div>
                            <div className="space-y-2.5">
                              {meta.evaluation_criteria.component_count && (
                                <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                                  <div className="w-4 h-4 rounded border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span>Component count verification</span>
                                </div>
                              )}
                              {meta.evaluation_criteria.topology_match && (
                                <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                                  <div className="w-4 h-4 rounded border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span>Circuit topology validation</span>
                                </div>
                              )}
                              {meta.evaluation_criteria.output_voltage_range && (
                                <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                                  <div className="w-4 h-4 rounded border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span>Output voltage range compliance</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {meta.explanation && (
                          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-l-4 border-purple-500 dark:border-purple-400 rounded-r-lg p-4 shadow-sm">
                            <div className="flex items-center gap-2.5 mb-2.5">
                              <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="font-semibold text-purple-900 dark:text-purple-200 text-xs uppercase tracking-wide">Expected Solution</div>
                            </div>
                            <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed pl-8">{meta.explanation}</p>
                          </div>
                        )}

                        {/* Manual Export/Import Fallback Instructions */}
                        <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border-l-4 border-amber-500 dark:border-amber-600 rounded-r-lg p-4 shadow-sm">
                          <div className="flex items-center gap-2.5 mb-2.5">
                            <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <div className="font-semibold text-amber-900 dark:text-amber-200 text-xs uppercase tracking-wide">
                              Manual Export
                            </div>
                          </div>
                          <p className="text-xs text-amber-800 dark:text-amber-300 mb-2.5 leading-relaxed pl-8">
                            If automatic state capture fails, follow these steps:
                          </p>
                          <ol className="text-xs text-amber-800 dark:text-amber-300 space-y-1.5 list-decimal list-inside ml-2 pl-6">
                            <li className="leading-relaxed">Right-click inside the CircuitJS simulator</li>
                            <li className="leading-relaxed">Select <span className="font-mono font-semibold bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">"File" → "Export"</span></li>
                            <li className="leading-relaxed">Copy the exported text</li>
                            <li className="leading-relaxed">Click <span className="font-semibold">"Refresh Capture"</span> button below the simulator</li>
                          </ol>
                        </div>
                      </>
                    )}

                    {currentTab === 'simulation' && (
                      <div className="space-y-5">
                        {!simulationResult ? (
                          <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
                            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <div className="font-semibold text-slate-700 dark:text-slate-300 text-base mb-1">No Simulation Results</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Click "Simulate Circuit" to validate your design</div>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            <div className={`rounded-lg p-6 border-2 ${
                              simulationResult.valid
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                                : 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                            }`}>
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  simulationResult.valid
                                    ? 'bg-emerald-100 dark:bg-emerald-900/50'
                                    : 'bg-red-100 dark:bg-red-900/50'
                                }`}>
                                  {simulationResult.valid ? (
                                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                                    {simulationResult.valid ? 'Circuit Validated' : 'Circuit Invalid'}
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{simulationResult.message || 'Simulation completed'}</p>
                                </div>
                              </div>
                            </div>

                            {simulationResult.components_found !== undefined && (
                              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-5 bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                                  Component Analysis
                                </div>
                                <div className="flex items-baseline gap-2 mb-4">
                                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{simulationResult.components_found}</span>
                                  <span className="text-sm text-slate-600 dark:text-slate-400">components detected</span>
                                </div>
                                {simulationResult.component_types && simulationResult.component_types.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                                    {simulationResult.component_types.map((type: string, i: number) => (
                                      <span key={i} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                                        {type}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {simulationResult.topology && (
                              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-5 bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                  Circuit Topology
                                </div>
                                <div className="text-base font-semibold text-slate-900 dark:text-slate-100 capitalize">
                                  {simulationResult.topology.replace('_', ' ')}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {currentTab === 'submission' && (
                      <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
                        <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="font-semibold text-slate-700 dark:text-slate-300 text-base mb-1">Ready for Submission</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Your circuit design will be evaluated after submission</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - CircuitJS Simulator */}
                <div className={`flex flex-col bg-slate-50 dark:bg-slate-900/50 ${isFullscreen ? 'min-h-0' : ''}`}>
                  <div className="border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 sm:px-6 py-2 sm:py-3 flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                            CircuitJS Simulator
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Interactive Circuit Design Environment</p>
                        </div>
                      </div>
                    </div>
                    {/* Circuit State Capture Status */}
                    {circuitStates[q.id] && circuitStates[q.id].circuit_state ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md">
                        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          State Captured ({circuitStates[q.id].method || 'auto'})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                        <svg className="w-4 h-4 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                          Design your circuit - state will be captured automatically
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CircuitJS Iframe */}
                  <div className={`bg-white dark:bg-slate-900 relative min-w-0 border-t border-slate-200 dark:border-slate-700 ${isFullscreen ? 'flex-1 min-h-[600px]' : 'h-[600px] min-h-[500px]'}`}>
                    <iframe
                      ref={(el) => { 
                        iframeRefs.current[q.id] = el
                        // Try to capture state when iframe loads
                        if (el) {
                          el.onload = () => {
                            // Wait a bit for CircuitJS to initialize
                            setTimeout(() => {
                              requestCircuitStateViaPostMessage(q.id)
                            }, 1000)
                          }
                        }
                      }}
                      src="https://falstad.com/circuit/circuitjs.html"
                      className="w-full h-full border-0 min-w-0"
                      title="CircuitJS Simulator"
                      allow="fullscreen"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                      style={{ minWidth: 0 }}
                    />
                  </div>

                  {/* Professional Action Bar */}
                  <div className="border-t-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 sm:px-6 py-2 sm:py-3 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
                      {!simulating[q.id] ? (
                        <Button
                          onClick={() => handleSimulate(q.id)}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold py-2 sm:py-3 rounded-lg transition-all shadow-sm hover:shadow-md text-sm sm:text-base"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="hidden sm:inline">Simulate Circuit</span>
                          <span className="sm:hidden">Simulate</span>
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="flex-1 bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-semibold py-2 sm:py-3 rounded-lg cursor-not-allowed text-sm sm:text-base"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <Loader size="sm" /> <span className="hidden sm:inline">Simulating...</span><span className="sm:hidden">...</span>
                          </span>
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          requestCircuitStateViaPostMessage(q.id)
                          toast('Requesting circuit state...', { duration: 2000, icon: 'ℹ️' })
                        }}
                        variant="outline"
                        className="px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg flex-shrink-0"
                        title="Refresh circuit state capture"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </Button>
                    </div>
                    {circuitStates[q.id] && circuitStates[q.id].circuit_state && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
                        Last captured: {new Date(circuitStates[q.id].timestamp).toLocaleTimeString()}
                      </div>
                    )}
                    {/* Manual Export Input (Fallback) - Make it more prominent */}
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg">
                      <button
                        onClick={() => setShowManualInput(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                        className="w-full flex items-center justify-between text-sm font-semibold text-amber-900 dark:text-amber-200 hover:text-amber-950 dark:hover:text-amber-100 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {showManualInput[q.id] ? '▼ Hide' : '▶ Show'} Manual Export (If automatic capture fails)
                        </span>
                      </button>
                      {!circuitStates[q.id]?.circuit_state && (
                        <p className="text-xs text-amber-800 dark:text-amber-300 mt-2">
                          ⚠️ No circuit state captured. Use manual export to ensure your circuit is saved.
                        </p>
                      )}
                    </div>
                    {showManualInput[q.id] && (
                      <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-slate-200 dark:border-slate-700 mt-3">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                          Manual Capture Options
                        </div>
                        
                        {/* Option 1: Circuit URL Input */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">
                            Option 1: Paste CircuitJS Share URL
                          </label>
                          <div className="text-xs text-slate-500 dark:text-slate-500 mb-1.5">
                            In CircuitJS, click "File" → "Share" and copy the URL, then paste it here:
                          </div>
                          <input
                            type="text"
                            value={circuitUrlInput[q.id] || ''}
                            onChange={(e) => setCircuitUrlInput(prev => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="https://falstad.com/circuit/circuitjs.html?ctz=..."
                            className="w-full p-2.5 text-xs border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent"
                          />
                          <Button
                            onClick={() => handleCircuitUrlInput(q.id, circuitUrlInput[q.id] || '')}
                            disabled={!circuitUrlInput[q.id] || circuitUrlInput[q.id].trim().length === 0}
                            className="w-full text-xs py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Import from URL
                          </Button>
                        </div>
                        
                        <div className="border-t border-slate-300 dark:border-slate-600 pt-3">
                          <div className="text-xs text-slate-500 dark:text-slate-500 mb-2 text-center">OR</div>
                        </div>
                        
                        {/* Option 2: Manual Export Text */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">
                            Option 2: Paste Exported Circuit Text
                          </label>
                          <div className="text-xs text-slate-500 dark:text-slate-500 mb-1.5">
                            In CircuitJS, click "File" → "Export" and copy the text, then paste it here:
                          </div>
                          <textarea
                            value={manualExportText[q.id] || ''}
                            onChange={(e) => setManualExportText(prev => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Paste exported circuit text from CircuitJS (File → Export)..."
                            className="w-full h-28 p-3 text-xs border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent"
                          />
                          <Button
                            onClick={() => handleManualExport(q.id, manualExportText[q.id] || '')}
                            disabled={!manualExportText[q.id] || manualExportText[q.id].trim().length === 0}
                            className="w-full text-xs py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Import Circuit Text
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Submit Section - Inside question container for fullscreen scrolling */}
                {isFullscreen && (
                  <div className="bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-lg flex-shrink-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 flex-shrink-0">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base mb-1">Ready to Submit Assessment</div>
                          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            Ensure your circuit design is complete and validated before final submission
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleSubmit}
                        disabled={busy}
                        className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold px-6 sm:px-8 lg:px-10 py-2.5 sm:py-3 lg:py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm sm:text-base flex-shrink-0"
                      >
                        {busy ? (
                          <span className="flex items-center gap-2">
                            <Loader size="sm" /> <span className="hidden sm:inline">Submitting...</span><span className="sm:hidden">Submitting</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="hidden sm:inline">Submit Assessment</span>
                            <span className="sm:hidden">Submit</span>
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Professional Submit Section - Outside for non-fullscreen mode */}
        {!fullscreen && (
          <div className="bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-lg">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base mb-1">Ready to Submit Assessment</div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Ensure your circuit design is complete and validated before final submission
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={busy}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold px-6 sm:px-8 lg:px-10 py-2.5 sm:py-3 lg:py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm sm:text-base flex-shrink-0"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <Loader size="sm" /> <span className="hidden sm:inline">Submitting...</span><span className="sm:hidden">Submitting</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="hidden sm:inline">Submit Assessment</span>
                    <span className="sm:hidden">Submit</span>
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CircuitDesignRound

