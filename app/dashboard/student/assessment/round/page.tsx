"use client"

import { useEffect, useState, useRef, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { apiClient } from '@/lib/api'
import { getAssessmentOverviewPath, getPostRoundPath } from '@/lib/assessmentAgent'
import {
    User,
    Mic, Clock, Volume2, Zap, ChevronsRight, ChevronsLeft,
    Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { GroupDiscussionRound } from '@/components/assessment/GroupDiscussionRound'
import CodingRound from '@/components/assessment/CodingRound'
import { TallyExcelRound } from '@/components/assessment/TallyExcelRound'
import { AssessmentSecurityGuard } from '@/components/assessment/security/AssessmentSecurityGuard'
import { CameraStatusIndicator, FullscreenStatusIndicator } from '@/components/assessment/security/AssessmentFullscreenOverlay'
import { ExamSubmissionOverlay } from '@/components/assessment/ExamSubmissionOverlay'
import {
    AssessmentConfirmDialog,
    unansweredSubmitMessage,
} from '@/components/assessment/AssessmentConfirmDialog'
import { useAssessmentSecurity } from '@/hooks/useAssessmentSecurity'
import {
    isExamInteractionLocked,
    isExamSubmitInFlight,
    snapshotAnswers,
} from '@/lib/assessmentExam'
import type { AssessmentSubmissionState } from '@/types/assessmentExam'

interface GDResponse {
    response_text: string;
    time_taken?: number;
    score?: number;
}

// Speech Recognition Types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: any) => void;
    onend: () => void;
}

const extractErrorMessage = (error: any): string => {
    if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (Array.isArray(detail) && detail.length > 0) {
            return detail[0].msg || detail[0].message || 'Validation error'
        }
        if (typeof detail === 'string') {
            return detail
        }
    }
    return error.message || 'An error occurred'
}


// Default labels by round number (used only as a fallback)
const roundNames = {
    1: "Aptitude Test",
    2: "Soft Skills Assessment",
    3: "Group Discussion",
    4: "Technical MCQ",
    5: "Coding Challenge",
    6: "Technical Interview",
    7: "HR Interview"
}

// Historical mapping used when backend round_type isn't loaded yet.
// Do NOT rely on this for logic after data loads because non-technical roles
// use technical_interview at round 5 instead of coding.
const roundTypeMap = {
    1: 'aptitude',
    2: 'soft_skills',
    3: 'group_discussion',
    4: 'technical_mcq',
    5: 'coding',
    6: 'technical_interview',
    7: 'hr_interview'
}

export default function AssessmentRoundPage() {
    const [roundData, setRoundData] = useState<any>(null)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [responses, setResponses] = useState<Record<string, any>>({})
    const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]))
    const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set())
    const [loading, setLoading] = useState(true)
    const [submissionState, setSubmissionState] = useState<AssessmentSubmissionState>('ready')
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [sessionStarted, setSessionStarted] = useState(false)
    const [gdRetryNonce, setGdRetryNonce] = useState(0)
    const [showUnansweredDialog, setShowUnansweredDialog] = useState(false)
    const [pendingUnansweredCount, setPendingUnansweredCount] = useState(0)

    // Live Transcription States
    const [isLiveTranscribing, setIsLiveTranscribing] = useState(false)
    const [liveTranscript, setLiveTranscript] = useState("")
    const [interimTranscript, setInterimTranscript] = useState("")
    const speechRecognitionRef = useRef<SpeechRecognition | null>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const submitButtonRef = useRef<HTMLButtonElement | null>(null)

    const router = useRouter()
    const searchParams = useSearchParams()
    const assessmentId = searchParams?.get('assessment_id')
    const roundNumber = parseInt(searchParams?.get('round') || '1')
    const assessmentSource = searchParams?.get('source')

    // Normalize options coming from different backend shapes
    const normalizeMcqOptions = (q: any): string[] => {
        if (!q) return []
        // 1) Array of strings/objects
        if (Array.isArray(q.options)) {
            return q.options.map((o: any) => typeof o === 'string' ? o : (o?.text ?? o?.label ?? JSON.stringify(o)))
        }
        // 2) 'choices' array
        if (Array.isArray(q.choices)) {
            return q.choices.map((o: any) => typeof o === 'string' ? o : (o?.text ?? o?.label ?? JSON.stringify(o)))
        }
        // 3) JSON string in options/options_json
        const jsonCandidate = q.options_json || q.options
        if (typeof jsonCandidate === 'string') {
            try {
                const parsed = JSON.parse(jsonCandidate)
                if (Array.isArray(parsed)) {
                    return parsed.map((o: any) => typeof o === 'string' ? o : (o?.text ?? o?.label ?? JSON.stringify(o)))
                }
                if (parsed && typeof parsed === 'object') {
                    const vals = Object.values(parsed as Record<string, any>)
                    return vals.map((o: any) => typeof o === 'string' ? o : (o?.text ?? o?.label ?? JSON.stringify(o)))
                }
            } catch { }
        }
        // 4) option_a/option_b/option_c/option_d fields
        const keySet = ['option_a', 'option_b', 'option_c', 'option_d']
        const fromFields = keySet.map(k => q[k]).filter(Boolean)
        if (fromFields.length > 0) return fromFields
        // 5) options as object {A: '...', B: '...'}
        if (q.options && typeof q.options === 'object') {
            return Object.values(q.options)
        }
        return []
    }
    // Prefer backend-provided round_type; fall back to numeric guess only during initial load
    const roundType = (roundData?.round_type as string) || roundTypeMap[roundNumber as keyof typeof roundTypeMap]
    const isVoiceRound = roundType === 'technical_interview' || roundType === 'hr_interview'
    const isGroupDiscussionRound = roundType === 'group_discussion'
    const isCodingRound = roundType === 'coding'
    const isElectricalRound = roundType === 'electrical_circuit'
    const currentQ = roundData?.questions?.[currentQuestion]
    const jobContext = roundData?.job_context || {}
    const jobHeader = [jobContext.company, jobContext.job_title].filter(Boolean).join(' – ')
    const counts = roundData ? getCounts() : { answered: 0, notAnswered: 0, marked: 0, notVisited: 0 }
    const examLocked = isExamInteractionLocked(submissionState)
    const submitting = isExamSubmitInFlight(submissionState)

    const responsesRef = useRef(responses)
    const roundDataRef = useRef(roundData)
    const submittingRef = useRef(submitting)
    const currentQuestionRef = useRef(0)
    const answerSnapshotRef = useRef<any[] | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const hasAutoSubmitted = useRef(false)
    const security = useAssessmentSecurity({
        sessionActive: sessionStarted && submissionState !== 'completed',
        preventLeave: sessionStarted && submissionState !== 'completed',
    })

    // Update refs
    useEffect(() => { responsesRef.current = responses }, [responses])
    useEffect(() => { roundDataRef.current = roundData }, [roundData])
    useEffect(() => { submittingRef.current = submitting }, [submitting])
    useEffect(() => { currentQuestionRef.current = currentQuestion }, [currentQuestion])

    // Keep live transcript in view inside the interview panel only (never scroll the page)
    useEffect(() => {
        if (!isVoiceRound) return
        const node = chatEndRef.current
        const panel = node?.parentElement
        if (panel && typeof panel.scrollTop === 'number') {
            panel.scrollTop = panel.scrollHeight
        }
    }, [liveTranscript, interimTranscript, currentQuestion, isVoiceRound])

    // Initialize Web Speech API
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition()
                recognition.continuous = true
                recognition.interimResults = true
                recognition.lang = 'en-US'

                recognition.onresult = (event: any) => {
                    if (submittingRef.current) return
                    let interim = ""
                    let final = ""

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript

                        if (event.results[i].isFinal) {
                            final += transcript + " "
                        } else {
                            interim += transcript
                        }
                    }

                    setInterimTranscript(interim)

                    if (final) {
                        setLiveTranscript(prev => prev + final)
                    }
                }

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error)
                    if (event.error === 'no-speech') {
                        toast.error('No speech detected. Please speak clearly.')
                    } else if (event.error === 'audio-capture') {
                        toast.error('No microphone found. Check your device.')
                    } else if (event.error === 'not-allowed') {
                        toast.error('Microphone permission denied. Please allow access.')
                    }
                }

                recognition.onend = () => {
                    if (isLiveTranscribing) {
                        try {
                            recognition.start()
                        } catch (e) {
                            console.log('Recognition restart skipped')
                        }
                    }
                }

                speechRecognitionRef.current = recognition
            } else {
                console.warn('Web Speech API not supported in this browser')
            }
        }

        return () => {
            if (speechRecognitionRef.current) {
                try {
                    speechRecognitionRef.current.stop()
                } catch (e) {
                    // Already stopped
                }
            }
        }
    }, [isLiveTranscribing])

    const handleBeginAssessment = async () => {
        const ok = await security.beginAssessment()
        if (ok) {
            setSessionStarted(true)
            setSubmissionState('active')
        }
    }

    useEffect(() => {
        setResponses({})
        setCurrentQuestion(0)
        setVisitedQuestions(new Set([0]))
        setMarkedQuestions(new Set())
        setSubmissionState('ready')
        setTimeLeft(null)
        setSessionStarted(false)
        setLiveTranscript("")
        setInterimTranscript("")
        answerSnapshotRef.current = null
        hasAutoSubmitted.current = false
        submittingRef.current = false
        setGdRetryNonce(0)
        setLoading(true)
        setRoundData(null)
    }, [assessmentId, roundNumber])

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [])

    // Disable right-click during active exam round (Tally/Excel needs context menu)
    useEffect(() => {
        if (loading || !roundData) return
        const type = (roundData?.round_type as string) || roundTypeMap[roundNumber as keyof typeof roundTypeMap]
        if (type === 'tally_excel_practical' || type === 'TALLY_EXCEL_PRACTICAL') return

        const handleContextMenu = (e: MouseEvent) => e.preventDefault()
        document.addEventListener('contextmenu', handleContextMenu)
        return () => document.removeEventListener('contextmenu', handleContextMenu)
    }, [loading, roundData, roundNumber])

    // Load round data
    useEffect(() => {
        if (!assessmentId) {
            toast.error('Assessment ID is required')
            router.push('/dashboard/student/assessment')
            return
        }
        loadRoundData()
    }, [assessmentId, roundNumber])

    // Initialize timer only after the secure session has started
    useEffect(() => {
        if (!sessionStarted) return
        if (roundData && roundData.time_limit && timeLeft === null) {
            const initialTime = roundData.time_limit * 60
            console.log(`⏰ Timer initialized: ${initialTime} seconds`)
            setTimeLeft(initialTime)
        }
    }, [roundData, timeLeft, sessionStarted])

    // Timer countdown
    useEffect(() => {
        if (timeLeft === null || submitting || hasAutoSubmitted.current) {
            return
        }

        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }

        if (timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => (prev !== null && prev > 0) ? prev - 1 : 0)
            }, 1000)
        } else if (timeLeft === 0 && !hasAutoSubmitted.current) {
            console.log('⏰ Time expired - auto submitting')
            hasAutoSubmitted.current = true
            security.pendingSubmitRef.current = true
            handleSubmitRound()
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [timeLeft, submitting])

    const loadRoundData = async () => {
        let isMounted = true

        try {
            console.log(`🔄 Loading round ${roundNumber} for assessment ${assessmentId}...`)
            const data = await apiClient.getAssessmentRound(assessmentId!, roundNumber)
            if (isMounted) {
                console.log('📥 Round data loaded successfully:', data)
                console.log('Round type:', data.round_type)
                console.log('Questions count:', data.questions?.length || 0)

                // Validate that we have questions (skip for group_discussion as it only has a topic)
                const isGD = data.round_type === 'group_discussion'
                if (!isGD && (!data.questions || data.questions.length === 0)) {
                    console.warn('⚠️ No questions in round data')
                    toast.error('No questions available for this round. Please contact support.')
                    router.push(getAssessmentOverviewPath(assessmentId!, assessmentSource))
                    return
                }

                setRoundData(data)
                toast.success('Assessment loaded successfully!')
            }
        } catch (error: any) {
            if (isMounted) {
                console.error('❌ Error loading round data:', error)
                const errorMsg = extractErrorMessage(error)

                // Provide specific error messages for common issues
                if (error.code === 'ECONNABORTED' || errorMsg.includes('timeout')) {
                    toast.error('⏰ Request timed out. The AI is taking longer than expected. Please try again.')
                } else if (error.response?.status === 500) {
                    toast.error('🤖 AI question generation failed. Please try again or contact support.')
                } else {
                    toast.error(`Failed to load assessment: ${errorMsg}`)
                }

                router.push(getAssessmentOverviewPath(assessmentId!, assessmentSource))
            }
        } finally {
            if (isMounted) {
                setLoading(false)
            }
        }

        return () => { isMounted = false }
    }

    const handleSubmitRound = async (options?: { retry?: boolean }) => {
        const isRetry = Boolean(options?.retry)
        if (submittingRef.current) {
            console.log('⚠️ Already submitting, skipping...')
            return
        }

        if (isRetry && !answerSnapshotRef.current) {
            toast.error('Submission could not be completed')
            return
        }

        const gate = security.validateForSubmit()
        if (!gate.ok) {
            if (gate.message) toast.error(gate.message)
            hasAutoSubmitted.current = false
            return
        }
        security.pendingSubmitRef.current = false

        if (!isRetry) {
            const cloned = snapshotAnswers(responsesRef.current)
            const currentRoundData = roundDataRef.current
            const question = currentRoundData?.questions?.[currentQuestionRef.current]
            if (question && isLiveTranscribing) {
                const fullTranscript = (liveTranscript + " " + interimTranscript).trim()
                if (fullTranscript) {
                    cloned[question.id] = {
                        ...cloned[question.id],
                        response_text: fullTranscript,
                        time_taken: cloned[question.id]?.time_taken || 0,
                    }
                }
            }
            answerSnapshotRef.current = Object.entries(cloned).map(([questionId, response]) => ({
                question_id: questionId,
                response_text: response?.response_text || '',
                response_audio: null,
                time_taken: response?.time_taken || 0
            }))
        }

        if (!answerSnapshotRef.current) {
            toast.error('Your answers could not be captured. Please try again.')
            return
        }

        submittingRef.current = true
        setSubmissionState('submitting')

        if (isLiveTranscribing) {
            stopLiveTranscription()
        }

        console.log('📤 Submitting round...')

        try {
            const currentRoundData = roundDataRef.current

            if (!currentRoundData) {
                throw new Error('Round data not available')
            }

            const responseData = answerSnapshotRef.current

            console.log(`Submitting ${responseData.length} responses`)

            await apiClient.submitRoundResponses(
                assessmentId!,
                currentRoundData.round_id,
                responseData
            )

            toast.success('Round submitted successfully!')
            setSubmissionState('completed')
            await security.finishSession()
            router.push(getPostRoundPath(assessmentId!, roundNumber, assessmentSource))
        } catch (error: any) {
            console.error('Error submitting round:', error)

            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('Session expired. Please login again.')
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                localStorage.removeItem('token_expiry')
                setTimeout(() => {
                    router.push('/auth/login')
                }, 2000)
            } else {
                toast.error(extractErrorMessage(error))
            }

            submittingRef.current = false
            setSubmissionState('error')
            hasAutoSubmitted.current = false
        }
    }

    const handleAnswerChange = (questionId: string, answer: any) => {
        if (submittingRef.current || isExamInteractionLocked(submissionState)) return
        setResponses(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                response_text: answer,
                time_taken: prev[questionId]?.time_taken || 0
            }
        }))
    }

    const handleSubmitWithConfirmation = () => {
        if (submittingRef.current || isExamInteractionLocked(submissionState)) return

        const gate = security.validateForSubmit()
        if (!gate.ok) {
            if (gate.message) toast.error(gate.message)
            return
        }

        const unansweredCount = counts.notVisited + counts.notAnswered + counts.marked

        if (unansweredCount > 0) {
            setPendingUnansweredCount(unansweredCount)
            setShowUnansweredDialog(true)
            return
        }

        void handleSubmitRound()
    }

    const handleConfirmedSubmit = () => {
        setShowUnansweredDialog(false)
        void handleSubmitRound()
    }

    const handleCancelSubmitDialog = () => {
        setShowUnansweredDialog(false)
    }

    useEffect(() => {
        if (!sessionStarted || security.isBlocked || submitting) return
        if (security.pendingSubmitRef.current) {
            security.pendingSubmitRef.current = false
            void handleSubmitRound()
        }
    }, [sessionStarted, security.isBlocked, submitting, security.cameraReady, security.fullscreenActive])

    const startLiveTranscription = () => {
        if (submittingRef.current || isExamInteractionLocked(submissionState)) return
        if (!speechRecognitionRef.current) {
            toast.error('Speech recognition not available. Use Chrome or Edge browser.')
            return
        }

        if (!isLiveTranscribing) {
            try {
                setLiveTranscript("")
                setInterimTranscript("")
                speechRecognitionRef.current.start()
                setIsLiveTranscribing(true)
                toast.success('🎤 Recording started - Speak now!')
            } catch (error) {
                console.error('Error starting speech recognition:', error)
                toast.error('Failed to start recording')
            }
        }
    }

    const stopLiveTranscription = () => {
        if (speechRecognitionRef.current && isLiveTranscribing) {
            try {
                speechRecognitionRef.current.stop()
            } catch (e) {
                console.log('Already stopped')
            }
            setIsLiveTranscribing(false)

            const fullTranscript = (liveTranscript + " " + interimTranscript).trim()

            if (fullTranscript && !submittingRef.current && !isExamInteractionLocked(submissionState)) {
                const currentQ = roundData.questions[currentQuestion]
                handleAnswerChange(currentQ.id, fullTranscript)
                toast.success('✅ Response saved!')
            }

            // Clear transcripts after saving
            setLiveTranscript("")
            setInterimTranscript("")
        }
    }

    const playDictationAudio = (text: string, retryCount: number = 0) => {
        console.log('🔊 TTS called with text:', text)

        if (!text || text.trim() === '') {
            console.error('❌ Empty or undefined text')
            toast.error('No text to play!')
            return
        }

        if (!('speechSynthesis' in window)) {
            console.error('❌ Speech synthesis not supported')
            toast.error('Text-to-speech not supported. Try Chrome or Edge.')
            return
        }

        if (retryCount >= 3) {
            console.error('❌ Max retries reached')
            toast.error('Unable to play audio. Please try refreshing the page.')
            return
        }

        // Cancel any ongoing speech first
        window.speechSynthesis.cancel()

        // Small delay to ensure cancellation completes
        setTimeout(() => {
            try {
                // Get available voices and prefer high-quality ones
                const voices = window.speechSynthesis.getVoices()
                const preferredVoice = voices.find(v =>
                    v.lang.startsWith('en') &&
                    (v.name.toLowerCase().includes('neural') ||
                        v.name.toLowerCase().includes('premium') ||
                        v.name.toLowerCase().includes('enhanced'))
                ) || voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'))

                const utterance = new SpeechSynthesisUtterance(text.trim())

                if (preferredVoice) {
                    utterance.voice = preferredVoice
                    utterance.lang = preferredVoice.lang
                } else {
                    utterance.lang = 'en-US'
                }

                // Optimized settings for clarity
                utterance.rate = 0.88  // Slightly slower for better comprehension
                utterance.pitch = 1.0
                utterance.volume = 1.0  // Maximum volume

                let hasStarted = false
                const timeout = setTimeout(() => {
                    if (!hasStarted && retryCount < 2) {
                        console.warn('TTS timeout, retrying...')
                        window.speechSynthesis.cancel()
                        playDictationAudio(text, retryCount + 1)
                    }
                }, 2000)

                utterance.onstart = () => {
                    hasStarted = true
                    clearTimeout(timeout)
                    console.log('✅ Speech STARTED')
                    toast.success('🔊 Audio playing...', { duration: 2000 })
                }

                utterance.onend = () => {
                    clearTimeout(timeout)
                    console.log('✅ Speech ENDED')
                }

                utterance.onerror = (event: any) => {
                    clearTimeout(timeout)
                    console.error('❌ TTS Error:', event.error, event)

                    // Retry on certain errors
                    if ((event.error === 'synthesis-failed' ||
                        event.error === 'synthesis-unavailable' ||
                        event.error === 'audio-busy') && retryCount < 2) {
                        console.log('Retrying TTS...')
                        setTimeout(() => {
                            playDictationAudio(text, retryCount + 1)
                        }, 500)
                    } else {
                        toast.error(`Audio error: ${event.error || 'Unknown error'}`)
                    }
                }

                console.log('📢 Calling speak()...')
                window.speechSynthesis.speak(utterance)
                console.log('📢 speak() called successfully')
            } catch (err) {
                console.error('Error creating utterance:', err)
                if (retryCount < 2) {
                    setTimeout(() => {
                        playDictationAudio(text, retryCount + 1)
                    }, 500)
                } else {
                    toast.error('Failed to play audio. Please try again.')
                }
            }
        }, 150)
    }


    const handlePreviousQuestion = () => {
        if (submittingRef.current || isExamInteractionLocked(submissionState)) return
        if (currentQuestion <= 0) return
        if (isLiveTranscribing) {
            stopLiveTranscription()
        }
        setCurrentQuestion(currentQuestion - 1)
        setVisitedQuestions(prev => new Set([...Array.from(prev), currentQuestion - 1]))
        setLiveTranscript("")
        setInterimTranscript("")
    }

    const handleNextQuestion = () => {
        if (submittingRef.current || isExamInteractionLocked(submissionState)) return
        setMarkedQuestions(prev => {
            if (!prev.has(currentQuestion)) return prev
            const newMarked = new Set(prev)
            newMarked.delete(currentQuestion)
            return newMarked
        })
        if (currentQuestion < roundData.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1)
            setVisitedQuestions(prev => new Set([...Array.from(prev), currentQuestion + 1]))
            setLiveTranscript("")
            setInterimTranscript("")
        }
    }

    const navigateToQuestion = (index: number) => {
        if (submittingRef.current || isExamInteractionLocked(submissionState)) return
        if (isLiveTranscribing) {
            stopLiveTranscription()
        }

        setCurrentQuestion(index)
        setVisitedQuestions(prev => new Set([...Array.from(prev), index]))
        setLiveTranscript("")
        setInterimTranscript("")
    }

    const handleMarkForReview = () => {
        if (submittingRef.current || isExamInteractionLocked(submissionState)) return
        setMarkedQuestions(prev => {
            const newMarked = new Set(prev)
            if (newMarked.has(currentQuestion)) {
                newMarked.delete(currentQuestion)
            } else {
                newMarked.add(currentQuestion)
            }
            return newMarked
        })
        handleNextQuestion()
    }

    const handleClearResponse = () => {
        if (submittingRef.current || isExamInteractionLocked(submissionState)) return
        const currentQ = roundData.questions[currentQuestion]
        setResponses(prev => {
            const newAnswers = { ...prev }
            delete newAnswers[currentQ.id]
            return newAnswers
        })
        setLiveTranscript("")
        setInterimTranscript("")
    }

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return '--:--'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const splitTime = (seconds: number | null) => {
        if (seconds === null) {
            return { hours: '--', minutes: '--', seconds: '--' }
        }
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return {
            hours: hours.toString().padStart(2, '0'),
            minutes: minutes.toString().padStart(2, '0'),
            seconds: secs.toString().padStart(2, '0')
        }
    }

    function getQuestionStatus(index: number) {
        if (!roundData?.questions[index]) return 'notVisited'

        const questionId = roundData.questions[index].id
        const isAnswered = responses[questionId]?.response_text !== undefined
        const isMarked = markedQuestions.has(index)
        const isVisited = visitedQuestions.has(index)

        if (isAnswered && !isMarked) {
            return 'answered'
        } else if (isMarked) {
            return 'marked'
        } else if (isVisited) {
            return 'notAnswered'
        } else {
            return 'notVisited'
        }
    }

    function getCounts() {
        let answered = 0
        let notAnswered = 0
        let marked = 0
        let notVisited = 0

        if (roundData?.questions) {
            roundData.questions.forEach((_: any, index: number) => {
                const status = getQuestionStatus(index)
                if (status === 'answered') answered++
                else if (status === 'marked') marked++
                else if (status === 'notAnswered') notAnswered++
                else notVisited++
            })
        }

        return { answered, notAnswered, marked, notVisited }
    }

    const guard = (children: ReactNode, opts?: { loading?: boolean; loadingMessage?: string }) => (
        <AssessmentSecurityGuard
            loading={opts?.loading}
            sessionStarted={sessionStarted}
            security={security}
            onBegin={handleBeginAssessment}
            loadingMessage={opts?.loadingMessage}
            examLocked={examLocked}
        >
            <div className="relative h-full min-h-0 overflow-hidden">
                {children}
                <ExamSubmissionOverlay
                    state={submissionState}
                    onRetry={() => {
                        if (isGroupDiscussionRound) {
                            if (submittingRef.current) return
                            const gate = security.validateForSubmit()
                            if (!gate.ok) {
                                if (gate.message) toast.error(gate.message)
                                return
                            }
                            submittingRef.current = true
                            setSubmissionState('submitting')
                            setGdRetryNonce((value) => value + 1)
                            return
                        }
                        void handleSubmitRound({ retry: true })
                    }}
                />
                <AssessmentConfirmDialog
                    open={showUnansweredDialog}
                    title="Submit Assessment?"
                    message={unansweredSubmitMessage(pendingUnansweredCount)}
                    confirmLabel="Submit Anyway"
                    cancelLabel="Cancel"
                    onConfirm={handleConfirmedSubmit}
                    onCancel={handleCancelSubmitDialog}
                    returnFocusRef={submitButtonRef}
                />
            </div>
        </AssessmentSecurityGuard>
    )

    if (loading) {
        return guard(null, { loading: true, loadingMessage: 'Preparing Your Assessment' })
    }

    // ========== TALLY/EXCEL PRACTICAL ROUND ==========
    const isTallyExcelRound = roundType === 'tally_excel_practical' || roundType === 'TALLY_EXCEL_PRACTICAL'

    if (isTallyExcelRound) {
        if (!roundData || (!roundData.round_id && !roundData.id)) {
            return guard(null, { loading: true, loadingMessage: 'Loading Tally/Excel Assessment' })
        }

        return guard(
            <TallyExcelRound
                assessmentId={assessmentId!}
                roundData={roundData}
                interactionLocked={examLocked}
                onBeforeSubmit={() => {
                    if (submittingRef.current) return false
                    const gate = security.validateForSubmit()
                    if (!gate.ok) {
                        if (gate.message) toast.error(gate.message)
                        return false
                    }
                    submittingRef.current = true
                    setSubmissionState('submitting')
                    return true
                }}
                onSubmitted={async () => {
                    toast.success('All solutions submitted successfully!');
                    setSubmissionState('completed')
                    await security.finishSession()
                    router.push(getPostRoundPath(assessmentId!, roundNumber, assessmentSource));
                }}
            />
        )
    }

    if (isElectricalRound) {
        const roundId = roundData?.round_id || roundData?.id
        const params = new URLSearchParams()
        if (assessmentId) params.set('assessment_id', assessmentId)
        if (roundId) params.set('round_id', roundId)
        params.set('round_number', String(roundNumber))
        const workspaceUrl = `/dashboard/student/electrical?${params.toString()}`

        return (
            <DashboardLayout requiredUserType="student">
                <div className="max-w-3xl mx-auto space-y-6 p-6">
                    <div className="flex items-center gap-3 text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <Zap className="h-5 w-5" />
                        <div>
                            <h2 className="text-lg font-semibold">Electrical Circuit Design Round</h2>
                            <p className="text-sm text-amber-700">
                                Complete this round by designing the required circuit in the dedicated workspace and submitting it for AI evaluation.
                            </p>
                        </div>
                    </div>
                    <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
                        <h3 className="text-base font-semibold">How this round works</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                            <li>Click the button below to open the Electrical Practice workspace.</li>
                            <li>Generate the provided circuit question and design your circuit using the component library.</li>
                            <li>Submit your design for AI evaluation. Your feedback and score will be recorded automatically.</li>
                        </ol>
                        <div className="flex gap-3">
                            <Button type="button" onClick={() => router.push(workspaceUrl)}>
                                Open Electrical Workspace
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.push(getAssessmentOverviewPath(assessmentId!, assessmentSource))}>
                                Back to Assessment
                            </Button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (isGroupDiscussionRound) {
        // Ensure we have valid roundData with round_id before rendering
        if (!roundData || (!roundData.round_id && !roundData.id)) {
            return guard(null, { loading: true, loadingMessage: 'Loading Group Discussion' })
        }

        return guard(
            <div className="h-full min-h-0 overflow-hidden">
                <GroupDiscussionRound
                    roundId={roundData.round_id || roundData.id}
                    assessmentId={assessmentId!}
                    maxResponses={roundData.config?.number_of_rounds || 5}
                    interactionLocked={examLocked}
                    retryNonce={gdRetryNonce}
                    onBeforeSubmit={() => {
                        if (submittingRef.current) return false
                        const gate = security.validateForSubmit()
                        if (!gate.ok) {
                            if (gate.message) toast.error(gate.message)
                            return false
                        }
                        submittingRef.current = true
                        setSubmissionState('submitting')
                        return true
                    }}
                    onComplete={async () => {
                        toast.success('Discussion round completed successfully!');
                        setSubmissionState('completed')
                        await security.finishSession()
                        router.push(getPostRoundPath(assessmentId!, roundNumber, assessmentSource));
                    }}
                    onSubmitError={() => {
                        submittingRef.current = false
                        setSubmissionState('error')
                    }}
                />
            </div>
        );
    }

    // Coding Round UI
    if (isCodingRound) {
        return guard(
            <div className="h-full flex flex-col bg-gray-50 overflow-hidden font-sans">
                    <div className="bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white h-16 shrink-0 shadow-md flex items-center justify-between px-6 z-20">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-white/80">Assessment Agent</p>
                            <h1 className="text-xl font-bold tracking-tight">Round {roundNumber}: Coding Challenge</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <CameraStatusIndicator active={security.cameraReady} />
                            <div className="bg-white text-blue-600 px-4 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm">
                                <Clock className="w-4 h-4" />
                                <span>{timeLeft !== null ? `${Math.floor(timeLeft / 60)}m ${(timeLeft % 60).toString().padStart(2, '0')}s` : '--:--'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative min-h-0">
                        <CodingRound
                            assessmentId={assessmentId!}
                            roundData={roundData}
                            interactionLocked={examLocked}
                            onBeforeSubmit={() => {
                                if (submittingRef.current) return false
                                const gate = security.validateForSubmit()
                                if (!gate.ok) {
                                    if (gate.message) toast.error(gate.message)
                                    return false
                                }
                                submittingRef.current = true
                                setSubmissionState('submitting')
                                return true
                            }}
                            submitFn={async (responses) => {
                                if (!answerSnapshotRef.current) {
                                    answerSnapshotRef.current = snapshotAnswers(responses)
                                }
                                try {
                                    const res = await apiClient.submitRoundResponses(
                                        assessmentId!,
                                        roundData.round_id,
                                        answerSnapshotRef.current
                                    )
                                    toast.success('Solutions submitted successfully!')
                                    return res
                                } catch (error) {
                                    submittingRef.current = false
                                    setSubmissionState('error')
                                    throw error
                                }
                            }}
                            onSubmitted={async () => {
                                setSubmissionState('completed')
                                await security.finishSession()
                                router.push(getPostRoundPath(assessmentId!, roundNumber, assessmentSource))
                            }}
                        />
                    </div>
            </div>
        )
    }

    if (!roundData || (!isGroupDiscussionRound && !isTallyExcelRound && (!roundData.questions || roundData.questions.length === 0))) {
        return guard(
            <div className="flex h-full items-center justify-center text-center px-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">No Questions Available</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        This round doesn't have any questions yet.
                    </p>
                    <Button type="button" onClick={() => router.push(getAssessmentOverviewPath(assessmentId!, assessmentSource))}>
                        Back to Assessment
                    </Button>
                </div>
            </div>
        )
    }

    // ========== CHAT INTERFACE FOR INTERVIEW ROUNDS ==========
    if (isVoiceRound) {
        const isHR = roundType === 'hr_interview'
        const headerTitle = isHR ? 'HR Interview' : 'Technical Interview'
        // Using distinct theme for reference, but layout is unified as per screenshots
        // Screenshots show a Blue/Purple gradient header.

        return guard(
            <div className="flex flex-col h-full font-sans bg-white overflow-hidden">
                    {/* Header Bar - Matching Screenshot Blue/Purple Gradient */}
                    <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-between px-6 shrink-0 z-20 shadow-md">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-white/80">
                                {jobHeader || 'Assessment Agent'}
                            </p>
                            <h1 className="text-xl font-bold tracking-wide">{headerTitle}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <CameraStatusIndicator active={security.cameraReady} />
                            <FullscreenStatusIndicator active={security.fullscreenActive} />
                            <div className="bg-white/20 px-3 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(timeLeft)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1 overflow-hidden relative">
                        {/* Main Content Area (Left) */}
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white relative">
                            <div className="p-6 pb-6 flex-1 overflow-y-auto min-h-0">
                                {/* Top Section: Question and Video */}
                                <div className="flex flex-col lg:flex-row gap-6 mb-8">
                                    {/* Question Column */}
                                    <div className="flex-1">
                                        {/* Question Badge */}
                                        <div className="bg-[#0288D1] text-white px-4 py-1.5 rounded-md inline-block mb-4 font-bold text-sm shadow-sm">
                                            Question {currentQuestion + 1}
                                        </div>

                                        {/* Question Text */}
                                        <h2 className="text-xl font-bold text-gray-800 leading-relaxed mb-6">
                                            {currentQ?.question_text || "Loading question..."}
                                        </h2>

                                        {/* Simplified Progress Bar (Visual only as per screenshot) */}
                                        <div className="bg-gray-100 rounded-xl p-4 w-full max-w-md">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-semibold text-gray-700">Questions {currentQuestion + 1}/{roundData.questions.length}</span>
                                            </div>
                                            <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-200">
                                                <div
                                                    className="h-full bg-gray-200 rounded-full"
                                                    style={{ width: `${((currentQuestion + 1) / roundData.questions.length) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Video/Avatar Column */}
                                    {/* Video/Avatar Column - Commented out as requested
                                    <div className="w-full lg:w-[480px] shrink-0">
                                        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative border border-gray-200 shadow-sm group">
                                           
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                                <div className="flex flex-col items-center gap-3 p-6 text-center">
                                                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center ring-4 ring-gray-600">
                                                        <User className="w-12 h-12 text-gray-300" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-white font-semibold text-lg">Student Camera</p>
                                                        <p className="text-gray-400 text-sm">Secure Exam Environment</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {isLiveTranscribing && (
                                                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm animate-pulse">
                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                    REC
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    */}
                                </div>

                                <div className="h-px bg-gray-200 w-full mb-8" />

                                {/* Recording & Response Section */}
                                <div>
                                    {/* Record Button */}
                                    <div className="mb-6">
                                        {!isLiveTranscribing ? (
                                            <button
                                                onClick={startLiveTranscription}
                                                disabled={examLocked}
                                                className="bg-[#10B981] hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Mic size={20} />
                                                <span>Start Recoding</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={stopLiveTranscription}
                                                disabled={examLocked}
                                                className="bg-[#EF4444] hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-3 transition-all animate-pulse shadow-sm disabled:opacity-50"
                                            >
                                                <div className="w-3 h-3 bg-white rounded-full"></div>
                                                <span>Start Recoding</span>
                                                <span className="font-mono bg-red-600/50 px-2 py-0.5 rounded text-sm">01:10</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Transcribe Box (Green) - Only visible when recording/transcribed */}
                                    {(isLiveTranscribing || liveTranscript) && (
                                        <div className="bg-[#ECFDF5] border border-green-100 rounded-t-lg p-4 mb-0">
                                            <h3 className="text-[#10B981] font-bold text-sm uppercase tracking-wide mb-2">Transcribe</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {liveTranscript || interimTranscript || "Listening..."}
                                            </p>
                                        </div>
                                    )}

                                    {/* Response Box */}
                                    <div className="flex flex-col">
                                        <label className="text-lg font-bold text-gray-900 mb-2">Your Respones</label> {/* Typo 'Respones' in screenshot, but corrected to 'Responses' logic, keeping label matching design intent */}
                                        <textarea
                                            className={`w-full min-h-[200px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 ${isLiveTranscribing ? 'rounded-t-none border-t-0' : 'border-gray-300'}`}
                                            placeholder="Type your answer here..."
                                            value={responses[currentQ?.id]?.response_text || ''}
                                            readOnly={examLocked}
                                            disabled={examLocked}
                                            onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar - Progress */}
                        <div className="hidden lg:block w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Progress</h3>
                                <p className="text-gray-500 mb-6">{counts.answered} Of {roundData.questions.length} answered</p>

                                {/* Generic Square Grid like Screenshot */}
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {roundData.questions.map((_: any, idx: number) => {
                                        const status = getQuestionStatus(idx);
                                        let bgClass = "bg-[#E5E7EB] text-gray-500"; // Default Gray
                                        if (status === 'answered') bgClass = "bg-[#10B981] text-white"; // Green
                                        else if (idx === currentQuestion) bgClass = "bg-[#3B82F6] text-white"; // Blue (Current)

                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                disabled={examLocked}
                                                onClick={() => navigateToQuestion(idx)}
                                                className={`w-10 h-10 rounded-md flex items-center justify-center font-bold text-sm transition-colors disabled:cursor-not-allowed ${bgClass}`}
                                            >
                                                {idx + 1}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Legend (Vertical List) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-[#10B981] text-white flex items-center justify-center font-bold text-sm">1</div>
                                        <span className="font-medium text-gray-700">Answered</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-[#EF4444] text-white flex items-center justify-center font-bold text-sm">0</div>
                                        <span className="font-medium text-gray-700">Not Answered</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-[#E5E7EB] text-gray-500 flex items-center justify-center font-bold text-sm">0</div>
                                        <span className="font-medium text-gray-700">Not Answered</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Sticky Bottom Bar */}
                    <div className="bg-[#4F46E5] h-20 shrink-0 flex items-center justify-between px-6 z-30">
                        {/* Clear Button */}
                        <button
                            onClick={handleClearResponse}
                            disabled={examLocked}
                            className="bg-white text-gray-800 hover:bg-gray-100 px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                        >
                            <Trash2 size={18} className="text-gray-600" />
                            <span>Clear Respones</span>
                        </button>

                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={handlePreviousQuestion}
                                disabled={currentQuestion === 0 || examLocked}
                                className="bg-[#E5E5E5] hover:bg-white text-gray-800 px-6 py-2.5 rounded-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (currentQuestion < roundData.questions.length - 1) {
                                        navigateToQuestion(currentQuestion + 1)
                                    }
                                }}
                                disabled={currentQuestion >= roundData.questions.length - 1 || examLocked}
                                className="bg-[#E5E5E5] hover:bg-white text-gray-800 px-6 py-2.5 rounded-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                            >
                                Next Question
                            </button>

                            {/* Submit Button */}
                            <button
                                ref={submitButtonRef}
                                type="button"
                                onClick={handleSubmitWithConfirmation}
                                disabled={examLocked || submitting}
                                className="bg-[#10B981] hover:bg-green-600 text-white px-8 py-2.5 rounded-sm font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                            >
                                {submitting && <Loader size="sm" color="white" />}
                                {submitting ? 'Submitting Test...' : 'Submit Test'}
                            </button>
                        </div>
                    </div>
                </div>
        )
    }


    // ========== UPDATED MCQ INTERFACE WITH NEW QUESTION TYPES ==========
    return guard(
        <div
            className="h-full overflow-hidden bg-gray-100 select-none flex flex-col font-sans"
            onContextMenu={(e) => e.preventDefault()}
        >
                {/* Header */}
                <div className="bg-[#2563EB] text-white h-16 shrink-0 flex items-center px-6 justify-between shadow-md z-20 relative">
                    <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wide text-white/80">
                            {jobHeader || 'Assessment Agent'}
                        </p>
                        <h1 className="text-xl font-bold truncate">
                            {(() => {
                                const typeDisplayMap: Record<string, string> = {
                                    aptitude: 'Aptitude Test',
                                    soft_skills: 'Soft Skills Assessment',
                                    group_discussion: 'Group Discussion',
                                    technical_mcq: 'Technical MCQ',
                                    coding: 'Coding Challenge',
                                    electrical_circuit: 'Electrical Circuit Design',
                                    tally_excel_practical: 'Tally/Excel Practical',
                                    TALLY_EXCEL_PRACTICAL: 'Tally/Excel Practical',
                                    technical_interview: 'Technical Interview',
                                    hr_interview: 'HR Interview',
                                }
                                const title = typeDisplayMap[roundType] || roundNames[roundNumber as keyof typeof roundNames]
                                return <>Round {roundNumber}: {title}</>
                            })()}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <CameraStatusIndicator active={security.cameraReady} />
                        <FullscreenStatusIndicator active={security.fullscreenActive} />
                        <div className="bg-white text-blue-600 px-4 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(timeLeft)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full flex overflow-hidden">

                    {/* Main Content Area */}
                    <div className="flex-1 bg-white flex flex-col min-h-0 relative transition-all duration-300 z-40">

                        {/* Sidebar Toggle Button - Attached to the right edge */}
                        <button
                            type="button"
                            disabled={examLocked}
                            onClick={() => { if (examLocked) return; setIsSidebarOpen(!isSidebarOpen) }}
                            className={`absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-gray-50 focus:outline-none transition-transform duration-300 disabled:opacity-50 ${isSidebarOpen ? 'translate-x-1/2' : '-translate-x-2'}`}
                            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                        >
                            {isSidebarOpen ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                        </button>

                        {/* Scrollable Content Wrapper */}
                        <div className="flex-1 flex flex-col p-6 overflow-hidden min-h-0">
                            {/* Question Header */}
                            <div className="mb-4 flex-shrink-0">
                                <h2 className="text-lg font-bold text-gray-800">
                                    Question {currentQuestion + 1} of {roundData?.questions?.length || 0}
                                </h2>
                                <div className="h-px bg-gray-200 mt-2 w-full"></div>
                            </div>

                            {/* Unified Question Card Container */}
                            <div className="flex-1 flex flex-col border border-gray-300 rounded-sm overflow-hidden min-h-0 bg-white shadow-sm relative z-10">

                                {/* Split Pane Content */}
                                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                                    {/* Left Pane: Question Text */}
                                    <div className="flex-1 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-300 bg-white">
                                        {currentQ.question_type !== 'dictation' ? (
                                            <p className="text-lg font-medium text-gray-800 leading-relaxed select-none">
                                                {currentQ.question_text}
                                            </p>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-lg font-bold text-blue-600">
                                                    🎧 Listening Exercise
                                                </p>
                                                <p className="text-gray-700">
                                                    Click the button below to hear a sentence. Listen carefully and type exactly what you hear in the box.
                                                </p>
                                                <button
                                                    disabled={examLocked}
                                                    onClick={() => {
                                                        if (examLocked) return
                                                        const textToSpeak = currentQ.question_text || currentQ.correct_answer
                                                        playDictationAudio(textToSpeak)
                                                    }}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium"
                                                >
                                                    <Volume2 className="h-5 w-5" />
                                                    <span>Play Audio</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Pane: Options / Input */}
                                    <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
                                        {/* MCQ Options */}
                                        {String(currentQ.question_type || '').toLowerCase() === 'mcq' && (
                                            <div className="space-y-4">
                                                {normalizeMcqOptions(currentQ).map((option: any, index: number) => {
                                                    const optionLetter = String.fromCharCode(65 + index)
                                                    const optionText = typeof option === 'string'
                                                        ? option
                                                        : (option?.text ?? option?.label ?? JSON.stringify(option))
                                                    const isSelected = responses[currentQ.id]?.response_text === optionLetter

                                                    return (
                                                        <label
                                                            key={index}
                                                            className={`flex items-start space-x-3 p-4 rounded-lg transition-all border ${examLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${isSelected
                                                                ? 'bg-blue-50 border-blue-500 shadow-sm'
                                                                : 'bg-white border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                                                }`}
                                                        >
                                                            <div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                <input
                                                                    type="radio"
                                                                    name={`question-${currentQ.id}`}
                                                                    value={optionLetter}
                                                                    checked={isSelected}
                                                                    disabled={examLocked}
                                                                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                                                                    className="peer appearance-none w-5 h-5 border-2 border-gray-400 rounded-full checked:border-blue-600 checked:border-[6px] transition-all bg-white disabled:cursor-not-allowed"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="font-bold text-gray-700 mr-2">{optionLetter})</span>
                                                                <span className="text-gray-800 text-base">{optionText}</span>
                                                            </div>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {/* Text Input */}
                                        {currentQ.question_type === 'text' && (
                                            <div className="h-full flex flex-col">
                                                <label className="text-sm font-semibold text-gray-600 mb-2">Your Answer:</label>
                                                <textarea
                                                    className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
                                                    placeholder="Type your answer here..."
                                                    value={responses[currentQ.id]?.response_text || ''}
                                                    readOnly={examLocked}
                                                    disabled={examLocked}
                                                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                                                />
                                                <div className="text-right text-xs text-gray-500 mt-2">
                                                    {(responses[currentQ.id]?.response_text || '').length} characters
                                                </div>
                                            </div>
                                        )}

                                        {/* Dictation Input */}
                                        {currentQ.question_type === 'dictation' && (
                                            <div className="h-full flex flex-col">
                                                <label className="text-sm font-semibold text-gray-600 mb-2">Type what you hear:</label>
                                                <textarea
                                                    className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-base"
                                                    placeholder="Type here..."
                                                    value={responses[currentQ.id]?.response_text || ''}
                                                    readOnly={examLocked}
                                                    disabled={examLocked}
                                                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                                                />
                                            </div>
                                        )}

                                        {/* Voice Reading / Speaking place holders */}
                                        {(currentQ.question_type === 'voice_reading' || currentQ.question_type === 'voice_speaking') && (
                                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                                <div className="bg-purple-100 p-4 rounded-full mb-4">
                                                    <Mic className="h-8 w-8 text-purple-600" />
                                                </div>
                                                <p className="text-gray-600 mb-4">
                                                    This question requires voice interaction. Please use the controls above/below to record your answer.
                                                </p>
                                                {!isLiveTranscribing ? (
                                                    <Button onClick={startLiveTranscription} disabled={examLocked} className="bg-purple-600 hover:bg-purple-700">
                                                        Start Recording
                                                    </Button>
                                                ) : (
                                                    <Button onClick={stopLiveTranscription} disabled={examLocked} variant="destructive">
                                                        Stop Recording
                                                    </Button>
                                                )}
                                                {liveTranscript && (
                                                    <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-left w-full">
                                                        <p className="font-semibold text-xs text-gray-500 mb-1">Transcript:</p>
                                                        {liveTranscript}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Footer: Action Buttons (Sticky at Bottom) */}
                                <div className="shrink-0 h-16 bg-white border-t border-gray-300 flex items-center justify-between px-6 z-20">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handlePreviousQuestion}
                                            disabled={currentQuestion === 0 || examLocked}
                                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleMarkForReview}
                                            disabled={examLocked}
                                            className="bg-[#DC2626] hover:bg-red-700 text-white px-6 py-2 rounded text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            Mark for review
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClearResponse}
                                            disabled={examLocked}
                                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            Clear Response
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleNextQuestion}
                                        disabled={examLocked}
                                        className="bg-[#16A34A] hover:bg-green-700 text-white px-8 py-2 rounded text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        Save & Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className={`${isSidebarOpen ? 'w-80 border-l' : 'w-0 border-l-0'} bg-[#E6F3FF] border-gray-200 flex flex-col h-full overflow-hidden flex-shrink-0 font-sans transition-all duration-300`}>

                        {/* Profile & Timer Section */}
                        <div className="p-4 border-b border-gray-200 border-dashed border-blue-300 m-2 rounded-lg relative">
                            <div className="flex items-start gap-4">
                                {/* Large Black User Silhouette */}
                                <div className="w-20 h-20 bg-black rounded-xl overflow-hidden shadow-sm flex items-end justify-center flex-shrink-0">
                                    <User className="w-16 h-16 text-gray-400 mb-[-4px]" fill="currentColor" />
                                </div>

                                <div className="flex-1 text-center">
                                    <div className="text-lg font-bold text-gray-900 mb-1">Time Left</div>
                                    <div className="flex justify-center gap-2 items-start">
                                        {(() => {
                                            const t = splitTime(timeLeft)
                                            return (
                                                <>
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-2xl font-bold leading-none text-black">{t.hours}</div>
                                                        <div className="text-xs text-black font-medium mt-1">Hr</div>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-2xl font-bold leading-none text-black">{t.minutes}</div>
                                                        <div className="text-xs text-black font-medium mt-1">Min</div>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-2xl font-bold leading-none text-black">{t.seconds}</div>
                                                        <div className="text-xs text-black font-medium mt-1">Sec</div>
                                                    </div>
                                                </>
                                            )
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="w-3 h-3 text-gray-500" />
                                </div>
                                <span className="font-normal text-gray-700 text-sm">Test Profile</span>
                            </div>
                        </div>

                        {/* Legend section */}
                        <div className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                {/* Answered - Green Rounded Square */}
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#16A34A] text-white text-sm font-bold flex items-center justify-center rounded-md shadow-sm">
                                        {counts.answered}
                                    </div>
                                    <span className="text-sm font-medium text-black">Answered</span>
                                </div>

                                {/* Not Answered - Red Banner Shape */}
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-8 h-8 bg-[#DC2626] text-white text-sm font-bold flex items-center justify-center shadow-sm"
                                        style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)' }}
                                    >
                                        <span className="-mt-1">{counts.notAnswered}</span>
                                    </div>
                                    <span className="text-sm font-medium text-black">Not Answered</span>
                                </div>

                                {/* Marked - Purple Circle */}
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#9333EA] text-white text-sm font-bold flex items-center justify-center rounded-full shadow-sm">
                                        {counts.marked}
                                    </div>
                                    <span className="text-sm font-medium text-black">Marked</span>
                                </div>

                                {/* Not Visited - Gray Rounded Square */}
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center rounded-md shadow-sm">
                                        {counts.notVisited}
                                    </div>
                                    <span className="text-sm font-medium text-black">Not Visited</span>
                                </div>
                            </div>
                        </div>

                        {/* Palette Section */}
                        <div className="flex-1 px-6 overflow-y-auto">
                            <h3 className="font-bold text-black mb-4 text-base">Question Palette:</h3>
                            <div className="grid grid-cols-5 gap-3 content-start pb-4">
                                {roundData.questions.map((_: any, index: number) => {
                                    const status = getQuestionStatus(index)
                                    const isCurrent = index === currentQuestion

                                    // Base styles
                                    let baseClasses = "w-9 h-9 flex items-center justify-center text-sm font-bold shadow-sm transition-all"
                                    let style = {}
                                    let content: ReactNode = <span className={status === 'notAnswered' ? "-mt-1" : ""}>{index + 1}</span>
                                    if (isCurrent) {
                                        content = <span title={`Question ${index + 1} current`}>●</span>
                                    } else if (status === 'answered') {
                                        content = <span title={`Question ${index + 1} answered`}>✓</span>
                                    } else if (status === 'marked') {
                                        content = <span title={`Question ${index + 1} marked`}>⚠</span>
                                    }

                                    // Shape and Color Logic matching the legend
                                    if (status === 'answered') {
                                        baseClasses += " bg-[#16A34A] text-white rounded-md"
                                    } else if (status === 'notAnswered') {
                                        baseClasses += " bg-[#DC2626] text-white"
                                        style = { clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)' }
                                        // If current, adds a border? Clip-path cuts borders. 
                                        // We might need a wrapper if we want to highlight current on this shape, 
                                        // but for now let's stick to the shape.
                                    } else if (status === 'marked') {
                                        baseClasses += " bg-[#9333EA] text-white rounded-full"
                                    } else {
                                        // Not Visited / Default
                                        baseClasses += " bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                    }

                                    // Current Question Indicator
                                    // Since shapes vary, a ring might look weird on the shield. 
                                    // Let's use opacity or scale for current.
                                    if (isCurrent) {
                                        baseClasses += " ring-2 ring-offset-1 ring-blue-600 transform scale-105 z-10"
                                    }

                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            disabled={examLocked}
                                            onClick={() => navigateToQuestion(index)}
                                            className={`${baseClasses} disabled:cursor-not-allowed`}
                                            style={style}
                                            title={`Q${index + 1}`}
                                        >
                                            {content}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Submit Section */}
                        <div className="p-6 bg-[#E6F3FF]">
                            <button
                                ref={submitButtonRef}
                                type="button"
                                onClick={handleSubmitWithConfirmation}
                                disabled={examLocked || submitting}
                                className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 rounded shadow-md transition-colors text-base disabled:opacity-70"
                            >
                                {submitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader size="sm" color="white" />
                                        <span>Submitting Test...</span>
                                    </div>
                                ) : (
                                    'Submit Test'
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
    )

}
