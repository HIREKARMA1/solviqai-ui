"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTranscription } from '@/hooks/useTranscription'
import {
  Sparkles,
  Users,
  MessageSquare,
  Volume2,
  VolumeX,
  Send,
  Mic,
  MicOff,
  Briefcase,
  TrendingUp,
  Award,
  AlertTriangle,
  Loader2,
  Building,
  DollarSign,
  Compass
} from 'lucide-react'
import { toast } from 'sonner'

interface TwinProfile {
  twin_name: string
  strengths: string[]
  weaknesses: string[]
  career_goals: Record<string, string>
  dream_companies: string[]
  salary_expectations: string
  evolution_log: Array<{ date: string; description: string }>
}

interface ChatMessage {
  sender: 'student' | 'twin'
  text: string
  audio?: string
}

export default function AICareerTwinTab() {
  const [twin, setTwin] = useState<TwinProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [playVoice, setPlayVoice] = useState(true)
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null)

  const initialTextRef = useRef('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const playVoiceRef = useRef(true)
  const playingAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    playVoiceRef.current = playVoice
  }, [playVoice])

  useEffect(() => {
    playingAudioRef.current = playingAudio
  }, [playingAudio])

  useEffect(() => {
    return () => {
      playingAudioRef.current?.pause()
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const { isListening, start, stop, reset, partial, finalized } = useTranscription({
    onFinal: () => {}
  })

  useEffect(() => {
    loadTwinProfile()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  useEffect(() => {
    if (isListening) {
      initialTextRef.current = inputText
    }
  }, [isListening])

  useEffect(() => {
    if (isListening) {
      const addedText = (finalized + ' ' + partial).trim()
      setInputText(() => {
        return initialTextRef.current ? `${initialTextRef.current} ${addedText}`.trim() : addedText
      })
    }
  }, [finalized, partial, isListening])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadTwinProfile = async () => {
    setLoading(true)
    try {
      const { apiClient } = await import('@/lib/api')
      const data = await apiClient.getAICareerTwin()
      setTwin(data)
      const voiceOn = data.sound_enabled !== false
      setPlayVoice(voiceOn)
      playVoiceRef.current = voiceOn
      setChatHistory([
        {
          sender: 'twin',
          text: `Hi there! I am your AI Career Twin. I align myself with your strengths in ${
            data.strengths.slice(0, 3).join(', ') || 'software development'
          }. Ask me anything about matching roles, certification pathways, or salary negotiations!`
        }
      ])
    } catch (err) {
      toast.error('Failed to load your AI Twin profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return
    const currentInput = inputText.trim()
    setInputText('')
    reset()

    // Add user message
    setChatHistory(prev => [...prev, { sender: 'student', text: currentInput }])
    setSending(true)

    try {
      const { apiClient } = await import('@/lib/api')
      const res = await apiClient.chatWithCareerTwin({
        message: currentInput,
        play_voice: playVoiceRef.current
      })

      setChatHistory(prev => [
        ...prev,
        {
          sender: 'twin',
          text: res.reply,
          audio: res.audio || undefined
        }
      ])

      if (playVoiceRef.current && res.audio) {
        playBase64Audio(res.audio)
      }
    } catch (err) {
      toast.error('Failed to get a response from your twin')
    } finally {
      setSending(false)
    }
  }

  const stopPlayingAudio = () => {
    const current = playingAudioRef.current
    if (current) {
      current.pause()
      current.currentTime = 0
    }
    setPlayingAudio(null)
    playingAudioRef.current = null
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  const togglePlayVoice = async () => {
    const next = !playVoiceRef.current
    playVoiceRef.current = next
    setPlayVoice(next)
    if (!next) {
      stopPlayingAudio()
    }
    try {
      const { apiClient } = await import('@/lib/api')
      await apiClient.updateCareerTwinSound(next)
    } catch {
      // Preference still applies locally even if save fails
    }
  }

  const playBase64Audio = (base64Data: string) => {
    if (!playVoiceRef.current) return
    try {
      stopPlayingAudio()
      const audioUrl = `data:audio/wav;base64,${base64Data}`
      const audio = new Audio(audioUrl)
      audio.onended = () => {
        setPlayingAudio(null)
        playingAudioRef.current = null
      }
      audio.play().catch(e => console.error('Audio play blocked or failed:', e))
      setPlayingAudio(audio)
      playingAudioRef.current = audio
    } catch (err) {
      console.error('Failed to play audio:', err)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[450px] space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20 rounded-2xl">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Synchronizing AI Twin...</h3>
          <p className="text-sm text-gray-600 max-w-sm">
            Fetching latest strengths, weaknesses, goals and assessments...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 bg-white dark:bg-[#1C2938] p-4 sm:p-6 overflow-y-auto min-h-0">
      {/* Left panel: Stats & Twin Evolution */}
      <div className="lg:w-2/5 flex flex-col gap-4 overflow-y-auto pr-1">
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl bg-slate-50/40 dark:bg-slate-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#1b52a4] dark:text-blue-400">
              <Users className="h-5 w-5 text-[#f58020]" />
              AI Twin Persona
            </CardTitle>
            <CardDescription className="text-xs">
              Evolves automatically with your assessments, mock interviews, and resume updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Strengths */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                <Award className="w-4 h-4 text-green-600" />
                Strengths
              </div>
              <div className="flex flex-wrap gap-1.5">
                {twin?.strengths && twin.strengths.length > 0 ? (
                  twin.strengths.map((str, idx) => (
                    <Badge key={idx} className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50">
                      {str}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">No strengths recorded yet</span>
                )}
              </div>
            </div>

            {/* Weaknesses */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Growth Areas (Weaknesses)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {twin?.weaknesses && twin.weaknesses.length > 0 ? (
                  twin.weaknesses.map((weak, idx) => (
                    <Badge key={idx} className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50">
                      {weak}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">No weaknesses recorded yet</span>
                )}
              </div>
            </div>

            {/* Career Goals */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                <Compass className="w-4 h-4 text-[#1b52a4]" />
                Desired Roles & Goals
              </div>
              <div className="flex flex-col gap-1.5">
                {twin?.career_goals && Object.keys(twin.career_goals).length > 0 ? (
                  Object.entries(twin.career_goals).map(([key, val], idx) => (
                    <div key={idx} className="flex flex-col text-xs bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-950 p-2 rounded-lg">
                      <span className="font-bold text-[10px] text-blue-800 dark:text-blue-300 capitalize">{key.replace('_', ' ')}:</span>
                      <span className="text-gray-700 dark:text-gray-300 mt-0.5">{val}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">No goals set yet</span>
                )}
              </div>
            </div>

            {/* Dream Companies & Expected Salary */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-[#f58020]" />
                  Dream targets
                </span>
                <p className="text-xs text-gray-800 dark:text-gray-200 font-semibold mt-1">
                  {twin?.dream_companies.join(', ') || 'Tech MNCs'}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-green-600" />
                  Expected package
                </span>
                <p className="text-xs text-gray-800 dark:text-gray-200 font-semibold mt-1">
                  {twin?.salary_expectations || '12 LPA India'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evolution Log */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl flex-1 bg-slate-50/40 dark:bg-slate-900/10">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
              Evolution History
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs max-h-[160px] overflow-y-auto space-y-2">
            {twin?.evolution_log && twin.evolution_log.length > 0 ? (
              twin.evolution_log.map((log, idx) => (
                <div key={idx} className="flex flex-col border-l-2 border-indigo-500 pl-2 py-0.5">
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-gray-400 font-mono">#{idx+1}</span>
                    {log.date && (
                      <span className="text-[9px] text-gray-400">
                        {new Date(log.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium mt-0.5">
                    {log.description}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No evolution activities logged yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right panel: Live Chat interface */}
      <div className="lg:w-3/5 flex flex-col border border-gray-200 dark:border-gray-800 rounded-2xl bg-slate-50/20 dark:bg-[#1E293B] shadow-sm overflow-hidden h-[450px] lg:h-auto min-h-[350px]">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-[#1E293B]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
              <MessageSquare className="w-4 h-4 text-[#1b52a4]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Twin Counselor Chat</h3>
              <p className="text-[10px] text-gray-500">Ask questions, test alignments, or practice replies</p>
            </div>
          </div>

          {/* Voice toggle */}
          <Button
            onClick={togglePlayVoice}
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl border text-xs"
            aria-pressed={playVoice}
          >
            {playVoice ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-600">Voice ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400">Muted</span>
              </>
            )}
          </Button>
        </div>

        {/* Message bubble logs */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <AnimatePresence>
            {chatHistory.map((msg, index) => {
              const isTwin = msg.sender === 'twin'
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isTwin ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-sm relative ${
                      isTwin
                        ? 'bg-white dark:bg-[#202d41] border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100'
                        : 'bg-[#1b52a4] text-white'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    {isTwin && msg.audio && playVoice && (
                      <button
                        onClick={() => playBase64Audio(msg.audio!)}
                        className="mt-2 text-[#f58020] hover:text-[#d66d12] flex items-center gap-1 font-bold text-[10px]"
                      >
                        <Volume2 className="w-3 h-3" />
                        Replay Voice
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E293B] flex gap-2 items-center">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Talk or type to align your AI twin..."
            className="flex-1 bg-slate-50 dark:bg-[#202d41] border border-gray-100 dark:border-gray-800/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1b52a4] resize-none h-9 leading-relaxed"
            rows={1}
            disabled={sending}
          />
          <div className="flex gap-1.5">
            <Button
              onClick={() => (isListening ? stop() : start())}
              variant="outline"
              size="icon"
              className={`h-9 w-9 rounded-xl border ${isListening ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sending || !inputText.trim()}
              className="bg-[#1b52a4] hover:bg-[#154182] text-white h-9 w-9 rounded-xl p-0 flex items-center justify-center"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
