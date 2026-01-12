"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import {
    Home, User, FileText, Briefcase, ClipboardList,
    Mic, Square, Send, Clock, CheckCircle2, Volume2, Edit3, Zap, ChevronsRight, ChevronsLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import { GroupDiscussionRound } from '@/components/assessment/GroupDiscussionRound'
import CodingRound from '@/components/assessment/CodingRound'
import { TallyExcelRound } from '@/components/assessment/TallyExcelRound'

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
    const [submitting, setSubmitting] = useState(false)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const autoFullscreenAttemptedRef = useRef(false)

    // Live Transcription States
    const [isLiveTranscribing, setIsLiveTranscribing] = useState(false)
    const [liveTranscript, setLiveTranscript] = useState("")
    const [interimTranscript, setInterimTranscript] = useState("")
    const speechRecognitionRef = useRef<SpeechRecognition | null>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)

    const router = useRouter()
    const searchParams = useSearchParams()
    const assessmentId = searchParams?.get('assessment_id')
    const roundNumber = parseInt(searchParams?.get('round') || '1')

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
    const counts = roundData ? getCounts() : { answered: 0, notAnswered: 0, marked: 0, notVisited: 0 }
    const canSubmit = roundData && !submitting

    const responsesRef = useRef(responses)
    const roundDataRef = useRef(roundData)
    const submittingRef = useRef(submitting)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const hasAutoSubmitted = useRef(false)

    // Update refs
    useEffect(() => { responsesRef.current = responses }, [responses])
    useEffect(() => { roundDataRef.current = roundData }, [roundData])
    useEffect(() => { submittingRef.current = submitting }, [submitting])

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (isVoiceRound) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [liveTranscript, interimTranscript, currentQuestion])

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

    // Track fullscreen changes
    useEffect(() => {
        if (typeof document === 'undefined') return

        // Initial check
        const checkFullscreen = () => {
            const fs = Boolean(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            )
            setIsFullscreen(fs)
        }

        // Check immediately
        checkFullscreen()

        // Listen for changes
        const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
        events.forEach(event => {
            document.addEventListener(event, checkFullscreen)
        })

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, checkFullscreen)
            })
        }
    }, [])

    const toggleFullscreen = async () => {
        try {
            if (!isFullscreen) {
                const elem: any = document.documentElement
                if (elem.requestFullscreen) {
                    await elem.requestFullscreen()
                } else if (elem.webkitRequestFullscreen) {
                    await elem.webkitRequestFullscreen()
                } else if (elem.mozRequestFullScreen) {
                    await elem.mozRequestFullScreen()
                } else if (elem.msRequestFullscreen) {
                    await elem.msRequestFullscreen()
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen()
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen()
                } else if ((document as any).mozCancelFullScreen) {
                    await (document as any).mozCancelFullScreen()
                } else if ((document as any).msExitFullscreen) {
                    await (document as any).msExitFullscreen()
                }
            }
            // Force state update after a brief delay to ensure browser has processed
            setTimeout(() => {
                const fs = Boolean(
                    document.fullscreenElement ||
                    (document as any).webkitFullscreenElement ||
                    (document as any).mozFullScreenElement ||
                    (document as any).msFullscreenElement
                )
                setIsFullscreen(fs)
            }, 100)
        } catch (e) {
            console.error('Fullscreen toggle failed', e)
        }
    }

    // Try to enter fullscreen automatically when page opens after Start click
    useEffect(() => {
        if (autoFullscreenAttemptedRef.current) return
        autoFullscreenAttemptedRef.current = true

        const requestFs = async () => {
            try {
                const elem: any = document.documentElement
                if (!document.fullscreenElement && (elem.requestFullscreen || elem.webkitRequestFullscreen)) {
                    if (elem.requestFullscreen) await elem.requestFullscreen()
                    else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen()
                }
            } catch (e) {
                // Many browsers require a user gesture; fall back to first interaction
            }
        }

        // Attempt quickly after navigation (still counts as gesture in many browsers)
        const t = setTimeout(requestFs, 100)

        // If blocked, request on first user interaction
        const once = async () => {
            document.removeEventListener('pointerdown', once)
            document.removeEventListener('keydown', once)
            await requestFs()
        }
        document.addEventListener('pointerdown', once, { once: true })
        document.addEventListener('keydown', once, { once: true })

        return () => clearTimeout(t)
    }, [])

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [])

    // Load round data
    useEffect(() => {
        if (!assessmentId) {
            toast.error('Assessment ID is required')
            router.push('/dashboard/student/assessment')
            return
        }
        loadRoundData()
    }, [assessmentId, roundNumber])

    // Initialize timer
    useEffect(() => {
        if (roundData && roundData.time_limit && timeLeft === null) {
            const initialTime = roundData.time_limit * 60
            console.log(`⏰ Timer initialized: ${initialTime} seconds`)
            setTimeLeft(initialTime)
        }
    }, [roundData, timeLeft])

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
                    router.push(`/dashboard/student/assessment?id=${assessmentId}`)
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

                router.push(`/dashboard/student/assessment?id=${assessmentId}`)
            }
        } finally {
            if (isMounted) {
                setLoading(false)
            }
        }

        return () => { isMounted = false }
    }

    const handleSubmitRound = async () => {
        if (submittingRef.current || submitting) {
            console.log('⚠️ Already submitting, skipping...')
            return
        }

        if (isLiveTranscribing) {
            stopLiveTranscription()
        }

        console.log('📤 Submitting round...')
        setSubmitting(true)

        try {
            const currentResponses = responsesRef.current
            const currentRoundData = roundDataRef.current

            if (!currentRoundData) {
                throw new Error('Round data not available')
            }

            const responseData = Object.entries(currentResponses).map(([questionId, response]) => ({
                question_id: questionId,
                response_text: response.response_text || '',
                response_audio: null,
                time_taken: response.time_taken || 0
            }))

            console.log(`Submitting ${responseData.length} responses`)

            await apiClient.submitRoundResponses(
                assessmentId!,
                currentRoundData.round_id,
                responseData
            )

            toast.success('Round submitted successfully!')
            router.push(`/dashboard/student/assessment?id=${assessmentId}`)
        } catch (error: any) {
            console.error('Error submitting round:', error)

            // Check if it's an authentication error
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('Session expired. Please login again.')
                // Clear invalid tokens
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                localStorage.removeItem('token_expiry')
                // Redirect to login
                setTimeout(() => {
                    router.push('/auth/login')
                }, 2000)
            } else {
                toast.error(extractErrorMessage(error))
            }

            setSubmitting(false)
            hasAutoSubmitted.current = false
        }
    }

    const handleAnswerChange = (questionId: string, answer: any) => {
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
        const unansweredCount = counts.notVisited + counts.notAnswered + counts.marked

        if (unansweredCount > 0) {
            const message = `⚠️ You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}.\n\nUnanswered questions will be scored as 0.\n\nDo you want to submit anyway?`

            if (window.confirm(message)) {
                handleSubmitRound()
            }
        } else {
            // All questions answered, submit directly
            handleSubmitRound()
        }
    }


    const startLiveTranscription = () => {
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

            if (fullTranscript) {
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


    const handleNextQuestion = () => {
        if (currentQuestion < roundData.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1)
            setVisitedQuestions(prev => new Set([...Array.from(prev), currentQuestion + 1]))
            setLiveTranscript("")
            setInterimTranscript("")
        }
    }

    const navigateToQuestion = (index: number) => {
        if (isLiveTranscribing) {
            stopLiveTranscription()
        }

        setCurrentQuestion(index)
        setVisitedQuestions(prev => new Set([...Array.from(prev), index]))
        setLiveTranscript("")
        setInterimTranscript("")
    }

    const handleMarkForReview = () => {
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

    if (loading) {
        return (
            <DashboardLayout requiredUserType="student" hideNavigation={isFullscreen}>
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-center max-w-lg px-6">
                        <Loader size="lg" />
                        <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
                            Preparing Your Assessment
                        </h2>
                        <p className="mt-3 text-gray-600 dark:text-gray-400">
                            Our AI is generating personalized questions tailored to your profile and the job role...
                        </p>
                        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                                ⏰ This may take 20-60 seconds. Please wait and do not close this page.
                            </p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    // ========== TALLY/EXCEL PRACTICAL ROUND ==========
    const isTallyExcelRound = roundType === 'tally_excel_practical' || roundType === 'TALLY_EXCEL_PRACTICAL'

    if (isTallyExcelRound) {
        if (!roundData || (!roundData.round_id && !roundData.id)) {
            return (
                <DashboardLayout requiredUserType="student" hideNavigation={isFullscreen}>
                    <div className="flex justify-center items-center min-h-screen">
                        <div className="text-center max-w-lg px-6">
                            <Loader size="lg" />
                            <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
                                Loading Tally/Excel Assessment
                            </h2>
                            <p className="mt-3 text-gray-600 dark:text-gray-400">
                                Preparing your practical tasks...
                            </p>
                        </div>
                    </div>
                </DashboardLayout>
            )
        }

        return (
            <DashboardLayout requiredUserType="student" hideNavigation={isFullscreen}>
                <TallyExcelRound
                    assessmentId={assessmentId!}
                    roundData={roundData}
                    onSubmitted={(result) => {
                        toast.success('All solutions submitted successfully!');
                        router.push(`/dashboard/student/assessment?id=${assessmentId}`);
                    }}
                />
            </DashboardLayout>
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
                <div className="max-w-3xl mx-auto space-y-6">
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
                            <Button onClick={() => router.push(workspaceUrl)}>
                                Open Electrical Workspace
                            </Button>
                            <Button variant="outline" onClick={() => router.push(`/dashboard/student/assessment?id=${assessmentId}`)}>
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
            return (
                <DashboardLayout requiredUserType="student" hideNavigation={isFullscreen}>
                    <div className="flex justify-center items-center min-h-screen">
                        <div className="text-center max-w-lg px-6">
                            <Loader size="lg" />
                            <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
                                Loading Group Discussion
                            </h2>
                            <p className="mt-3 text-gray-600 dark:text-gray-400">
                                Preparing your discussion round...
                            </p>
                        </div>
                    </div>
                </DashboardLayout>
            )
        }

        return (
            <DashboardLayout requiredUserType="student" hideNavigation={isFullscreen}>
                <GroupDiscussionRound
                    roundId={roundData.round_id || roundData.id}
                    assessmentId={assessmentId!}
                    onComplete={async (responses) => {
                        try {
                            setSubmitting(true);
                            await apiClient.submitRoundResponses(
                                assessmentId!,
                                roundData.round_id || roundData.id,
                                responses.map(response => ({
                                    response_text: response.response_text,
                                    time_taken: response.time_taken || 0,
                                    score: response.score || 0
                                }))
                            );
                            toast.success('Discussion round completed successfully!');
                            router.push(`/dashboard/student/assessment?id=${assessmentId}`);
                        } catch (error: any) {
                            console.error('Error submitting discussion responses:', error);

                            // Check if it's an authentication error
                            if (error.response?.status === 401 || error.response?.status === 403) {
                                toast.error('Session expired. Please login again.')
                                localStorage.removeItem('access_token')
                                localStorage.removeItem('refresh_token')
                                localStorage.removeItem('token_expiry')
                                setTimeout(() => {
                                    router.push('/auth/login')
                                }, 2000)
                            } else {
                                toast.error('Failed to submit discussion responses');
                            }

                            setSubmitting(false);
                        }
                    }}
                />
            </DashboardLayout>
        );
    }

    // Coding Round UI
    if (isCodingRound) {
        return (
            <DashboardLayout requiredUserType="student" hideNavigation={isFullscreen}>
                <div className="min-h-screen bg-gray-100">
                    {/* Header */}
                    <div className="bg-indigo-600 text-white p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center max-w-7xl mx-auto gap-2 sm:gap-0">
                            <h1 className="text-base sm:text-lg md:text-xl font-semibold">Round {roundNumber}: Coding Challenge</h1>
                            <div className="text-xs sm:text-sm">Time Left: {formatTime(timeLeft)}</div>
                        </div>
                    </div>

                    {/* Full-height Coding Workspace */}
                    <div className="flex-1 overflow-hidden">
                        <div className="h-full w-full px-3">
                            <div className="h-full rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm p-0 md:p-0">
                                <div className="h-full">
                                    <CodingRound
                                        assessmentId={assessmentId!}
                                        roundData={roundData}
                                        onSubmitted={() => {
                                            router.push(`/dashboard/student/assessment?id=${assessmentId}`)
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (!roundData || (!isGroupDiscussionRound && !isTallyExcelRound && (!roundData.questions || roundData.questions.length === 0))) {
        return (
            <DashboardLayout requiredUserType="student" hideNavigation={isFullscreen}>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">No Questions Available</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        This round doesn't have any questions yet.
                    </p>
                    <Button onClick={() => router.push(`/dashboard/student/assessment?id=${assessmentId}`)}>
                        Back to Assessment
                    </Button>
                </div>
            </DashboardLayout>
        )
    }

    // ========== CHAT INTERFACE FOR INTERVIEW ROUNDS ==========
    if (isVoiceRound) {
        const isHR = roundType === 'hr_interview'
        const headerTitle = isHR ? 'HR Interview' : 'Technical Interview'
        const headerGradient = isHR ? 'from-orange-500 to-pink-600' : 'from-blue-600 to-purple-600'
        const pageBg = isHR ? 'from-orange-50 via-white to-pink-50' : 'from-blue-50 via-white to-purple-50'
        const primaryGrad = isHR ? 'from-orange-500 to-pink-600' : 'from-blue-600 to-purple-600'
        const aiBadgeGrad = isHR ? 'from-orange-500 to-pink-500' : 'from-blue-500 to-purple-500'
        const cardBorder = isHR ? 'border-pink-100' : 'border-blue-100'
        const liveBorder = isHR ? 'border-orange-300' : 'border-blue-300'
        const liveText = isHR ? 'text-orange-600' : 'text-blue-600'
        return (
            <DashboardLayout requiredUserType="student" hideNavigation={isFullscreen}>
                <div className="h-[calc(100vh-64px)] flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4 shadow-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center max-w-7xl mx-auto gap-3 sm:gap-0">
                            <div>
                                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
                                    {roundNumber === 6 ? '💻 Technical Interview' : '👔 HR Interview'}
                                </h1>
                                <p className="text-xs sm:text-sm text-blue-100 mt-1">
                                    Question {currentQuestion + 1} of {roundData?.questions?.length || 0}
                                </p>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto">
                                <div className="text-base sm:text-lg font-semibold">
                                    ⏱️ {formatTime(timeLeft)}
                                </div>
                                {timeLeft !== null && timeLeft <= 60 && timeLeft > 0 && (
                                    <span className="text-yellow-300 font-bold animate-pulse text-xs sm:text-sm">
                                        Last minute!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
                        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                            {currentQ && (
                                <div className={`bg-white rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 border ${cardBorder}`}>
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${aiBadgeGrad} flex items-center justify-center text-white text-sm sm:text-base font-bold flex-shrink-0`}>AI</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm text-gray-500 mb-2">Interviewer</p>
                                            <p className="text-gray-800 text-sm sm:text-base md:text-lg leading-relaxed break-words">{currentQ.question_text}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {responses[currentQ?.id]?.response_text && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 border border-emerald-100">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm sm:text-base font-bold flex-shrink-0">You</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm text-gray-500 mb-2">Your Answer</p>
                                            <p className="text-gray-800 text-sm sm:text-base leading-relaxed break-words">{responses[currentQ.id].response_text}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isLiveTranscribing && (liveTranscript || interimTranscript) && (
                                <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 border-2 border-dashed" style={{ borderColor: 'transparent' }}>
                                    <div className={`border-2 ${liveBorder} rounded-xl p-3 sm:p-4 bg-opacity-50 bg-blue-50`}>
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            <Mic className={`h-5 w-5 sm:h-6 sm:w-6 ${liveText} animate-pulse flex-shrink-0`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs sm:text-sm ${liveText} font-semibold mb-2`}>Speaking... (Live)</p>
                                                <p className="text-sm sm:text-base text-gray-800 break-words">
                                                    {liveTranscript}
                                                    {interimTranscript && (
                                                        <span className="text-gray-500 italic"> {interimTranscript}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="bg-white/90 backdrop-blur border-t shadow-lg p-3 sm:p-4">
                        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
                            <div className="flex gap-2 sm:gap-3">
                                {!isLiveTranscribing ? (
                                    <button onClick={startLiveTranscription} className={`flex-1 bg-gradient-to-r ${primaryGrad} hover:opacity-95 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg shadow-lg transition-all flex items-center justify-center gap-2 sm:gap-3`}>
                                        <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
                                        <span>Start Speaking</span>
                                    </button>
                                ) : (
                                    <button onClick={stopLiveTranscription} className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg shadow-lg transition-all animate-pulse flex items-center justify-center gap-2 sm:gap-3">
                                        <Square className="h-5 w-5 sm:h-6 sm:w-6" />
                                        <span className="hidden sm:inline">Stop & Save Answer</span>
                                        <span className="sm:hidden">Stop & Save</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button
                                    onClick={() => {
                                        if (currentQuestion < roundData.questions.length - 1) {
                                            navigateToQuestion(currentQuestion + 1)
                                        }
                                    }}
                                    disabled={currentQuestion >= roundData.questions.length - 1}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-800 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all"
                                >
                                    <span className="hidden sm:inline">Next Question →</span>
                                    <span className="sm:hidden">Next →</span>
                                </button>

                                <button onClick={handleSubmitWithConfirmation} disabled={submitting} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all shadow-lg">
                                    {submitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader size="sm" />
                                            <span>Submitting...</span>
                                        </div>
                                    ) : (
                                        <span>✓ Submit Interview</span>
                                    )}
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 text-xs sm:text-sm text-gray-600">
                                <span>Progress: {currentQuestion + 1} / {roundData?.questions?.length || 0}</span>
                                {counts.notVisited + counts.notAnswered + counts.marked > 0 && (
                                    <span className="text-orange-600">⚠️ {counts.notVisited + counts.notAnswered + counts.marked} unanswered</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }


    // ========== UPDATED MCQ INTERFACE WITH NEW QUESTION TYPES ==========
    return (
        <DashboardLayout requiredUserType="student" hideNavigation={isFullscreen}>
            <div className="min-h-screen bg-gray-100 select-none flex flex-col font-sans">
                {/* Header */}
                <div className="bg-[#2563EB] text-white h-16 flex items-center px-6 justify-between shadow-md z-20 relative">
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
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleFullscreen}
                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 w-full flex overflow-hidden h-[calc(100vh-64px)]">

                    {/* Main Content Area */}
                    <div className="flex-1 bg-white flex flex-col h-full relative transition-all duration-300 z-40">

                        {/* Sidebar Toggle Button - Attached to the right edge */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-gray-50 focus:outline-none transition-transform duration-300 ${isSidebarOpen ? 'translate-x-1/2' : '-translate-x-2'}`}
                            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                        >
                            {isSidebarOpen ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                        </button>

                        {/* Scrollable Content Wrapper */}
                        <div className="flex-1 flex flex-col p-6 overflow-hidden h-full">
                            {/* Question Header */}
                            <div className="mb-4 flex-shrink-0">
                                <h2 className="text-lg font-bold text-gray-800">
                                    Question {currentQuestion + 1} of {roundData?.questions?.length || 0}
                                </h2>
                                <div className="h-px bg-gray-200 mt-2 w-full"></div>
                            </div>

                            {/* Unified Question Card Container */}
                            <div className="flex-1 flex flex-col border border-gray-300 rounded-sm overflow-hidden min-h-0 bg-white shadow-sm relative z-10 h-full">

                                {/* Split Pane Content */}
                                <div className="flex-1 flex flex-col md:flex-row min-h-0 pb-16">
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
                                                    onClick={() => {
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
                                                            className={`flex items-start space-x-3 p-4 rounded-lg cursor-pointer transition-all border ${isSelected
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
                                                                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                                                                    className="peer appearance-none w-5 h-5 border-2 border-gray-400 rounded-full checked:border-blue-600 checked:border-[6px] transition-all bg-white"
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
                                                    <Button onClick={startLiveTranscription} className="bg-purple-600 hover:bg-purple-700">
                                                        Start Recording
                                                    </Button>
                                                ) : (
                                                    <Button onClick={stopLiveTranscription} variant="destructive">
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

                                {/* Bottom Footer: Action Buttons (Inside Card, Absolute at Bottom) */}
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-300 flex items-center justify-between px-6 z-20">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleMarkForReview}
                                            className="bg-[#DC2626] hover:bg-red-700 text-white px-6 py-2 rounded text-sm font-semibold transition-colors shadow-sm"
                                        >
                                            Mark for review & Next
                                        </button>
                                        <button
                                            onClick={handleClearResponse}
                                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded text-sm font-semibold transition-colors shadow-sm"
                                        >
                                            Clear Response
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleNextQuestion}
                                        className="bg-[#16A34A] hover:bg-green-700 text-white px-8 py-2 rounded text-sm font-semibold transition-colors shadow-sm"
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
                                    let content = <span className={status === 'notAnswered' ? "-mt-1" : ""}>{index + 1}</span>

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
                                            onClick={() => navigateToQuestion(index)}
                                            className={baseClasses}
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
                                onClick={handleSubmitWithConfirmation}
                                disabled={submitting}
                                className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 rounded shadow-md transition-colors text-base"
                            >
                                {submitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader size="sm" color="white" />
                                        <span>Submitting...</span>
                                    </div>
                                ) : (
                                    'Submit Section'
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    )

}
