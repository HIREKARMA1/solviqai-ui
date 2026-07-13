"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Sparkles,
  Send,
  Paperclip,
  Mic,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  AlertCircle,
  Rocket,
  RotateCcw,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export interface CounselorMessage {
  role: 'ai' | 'user'
  content: string
  timestamp: string
}

interface CareerCounselorChatProps {
  messages: CounselorMessage[]
  isTyping: boolean
  inputMessage: string
  onInputChange: (value: string) => void
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  counselorComplete: boolean
  needsCounselorStart: boolean
  isLimitReached: boolean
  isLoading: boolean
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
  sessionId: string | null
  careerProgress: any
  counselorBlockedReason?: string
  onStartSession: () => void
  onStartFresh: () => void
  onUpgrade: () => void
  messagesEndRef: React.RefObject<HTMLDivElement>
  isDark: boolean
}

function formatMessageTime(timestamp: string) {
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function copyMessage(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success('Copied to clipboard'),
    () => toast.error('Could not copy'),
  )
}

export default function CareerCounselorChat({
  messages,
  isTyping,
  inputMessage,
  onInputChange,
  onSend,
  onKeyDown,
  counselorComplete,
  needsCounselorStart,
  isLimitReached,
  isLoading,
  connectionStatus,
  sessionId,
  careerProgress,
  counselorBlockedReason,
  onStartSession,
  onStartFresh,
  onUpgrade,
  messagesEndRef,
  isDark,
}: CareerCounselorChatProps) {
  const inputDisabled =
    isLoading ||
    connectionStatus !== 'connected' ||
    isLimitReached ||
    (!sessionId && needsCounselorStart) ||
    counselorComplete

  const counselorProgress = careerProgress?.counselor_progress
  const progressPct = counselorProgress
    ? Math.round((counselorProgress.questions_answered / counselorProgress.questions_total) * 100)
    : 0

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200/80 dark:border-[#4F5764] bg-white dark:bg-[#1C2938] shadow-sm">
      {/* Header */}
      <div
        className="flex-shrink-0 border-b border-gray-200/70 dark:border-[#4F5764] px-4 py-3 sm:px-6 sm:py-4 lg:px-8"
        style={{ backgroundColor: isDark ? '#1C2938' : '#E8EFFF' }}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-[#0068FC] text-white shadow-md">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              AI Career Counselor
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-snug">
              {counselorComplete
                ? 'Counseling complete — GPS, Tree, Playlist, Calendar & Twin are unlocked'
                : counselorProgress
                  ? `Question ${counselorProgress.questions_answered} of ${counselorProgress.questions_total} — answer each to unlock all modules`
                  : 'Guided intake — 14 questions to unlock your full career roadmap'}
            </p>
            {!counselorComplete && counselorProgress && (
              <div className="mt-2 flex items-center gap-2 max-w-md">
                <div className="flex-1 h-1.5 rounded-full bg-white/80 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0068FC] transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-[#0068FC] dark:text-[#8EBDFF] shrink-0">
                  {progressPct}%
                </span>
              </div>
            )}
          </div>
          {counselorComplete && (
            <div className="shrink-0">
              {careerProgress?.can_restart_counselor ? (
                <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8" onClick={onStartFresh}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Start Fresh
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="text-xs gap-1.5 h-8 bg-[#f58020] hover:bg-[#d66d12]"
                  onClick={onUpgrade}
                >
                  Start Fresh — Upgrade
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages — full width of chat panel */}
      <div
        className="flex-1 min-h-[280px] overflow-y-auto overscroll-contain"
        style={{
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(248, 250, 252, 0.95)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
          {messages.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <div className="text-center space-y-4 px-4 max-w-md">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0068FC]/10">
                  <MessageCircle className="h-7 w-7 text-[#0068FC]" />
                </div>
                {careerProgress?.profile ? (
                  <>
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                      Counseling completed
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Target role: {careerProgress.profile.desired_role || 'Your career path'}
                    </p>
                  </>
                ) : needsCounselorStart ? (
                  <>
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                      Ready to begin counseling
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start a guided session to build your personalized career profile
                    </p>
                    <Button className="mt-2 gap-2" onClick={onStartSession} disabled={isLoading || isLimitReached}>
                      <Rocket className="h-4 w-4" />
                      Start Counseling Session
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-200">No messages yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your conversation will appear here</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => {
                const isUser = message.role === 'user'
                return (
                  <motion.div
                    key={`${message.timestamp}-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-2.5 sm:gap-3 min-w-0 ${
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      } max-w-[96%] sm:max-w-[90%] md:max-w-[82%] lg:max-w-[74%] xl:max-w-[68%]`}
                    >
                      <div
                        className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full shadow-sm ${
                          isUser
                            ? 'bg-[#0068FC] text-white'
                            : 'bg-white dark:bg-[#2A3444] border border-gray-200 dark:border-[#4F5764] text-[#0068FC]'
                        }`}
                      >
                        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      </div>

                      <div
                        className={`flex min-w-0 flex-1 flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`flex items-center gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {isUser ? 'You' : 'Career Counselor'}
                          </span>
                          {message.timestamp && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                              {formatMessageTime(message.timestamp)}
                            </span>
                          )}
                        </div>

                        <div
                          className={`w-full rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm ${
                            isUser
                              ? 'rounded-tr-md bg-[#0068FC] text-white'
                              : 'rounded-tl-md bg-white dark:bg-[#2A3444] border border-gray-200 dark:border-[#4F5764] text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>

                          {!isUser && (
                            <div className="mt-3 flex items-center gap-1 border-t border-gray-100 dark:border-gray-600/60 pt-2">
                              <button
                                type="button"
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
                                aria-label="Like"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
                                aria-label="Dislike"
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => copyMessage(message.content)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
                                aria-label="Copy"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
                                aria-label="Regenerate"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full justify-start"
            >
              <div className="flex gap-2.5 sm:gap-3 max-w-[96%] sm:max-w-[90%] md:max-w-[82%] lg:max-w-[74%] xl:max-w-[68%]">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 dark:border-[#4F5764] bg-white dark:bg-[#2A3444] text-[#0068FC]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-md border border-gray-200 dark:border-[#4F5764] bg-white dark:bg-[#2A3444] px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Counselor is typing</span>
                    <div className="flex gap-1">
                      {[0, 0.15, 0.3].map((delay) => (
                        <motion.span
                          key={delay}
                          className="inline-block h-1.5 w-1.5 rounded-full bg-[#0068FC]"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Input — full width aligned with messages */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-[#4F5764] bg-white dark:bg-[#1C2938] px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="w-full">
          <div className="flex items-end gap-2 sm:gap-3 rounded-2xl border border-gray-200 dark:border-[#4F5764] bg-gray-50 dark:bg-[#2A3444] px-3 py-2 sm:px-4 sm:py-3 shadow-inner">
            <textarea
              value={inputMessage}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                counselorComplete
                  ? 'Counseling complete. Explore unlocked modules or start fresh (Pro).'
                  : isLimitReached
                    ? 'Upgrade to start fresh counseling.'
                    : 'Type your answer here…'
              }
              className="flex-1 min-w-0 resize-none bg-transparent text-sm sm:text-[15px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none min-h-[44px] max-h-[120px] leading-relaxed disabled:opacity-50 py-1"
              rows={1}
              disabled={inputDisabled}
              aria-label="Message input"
            />
            <div className="flex items-center gap-1 shrink-0 pb-0.5">
              <button
                type="button"
                disabled={isLimitReached}
                className="rounded-xl p-2 text-gray-400 hover:bg-white hover:text-gray-600 dark:hover:bg-[#1C2938] disabled:opacity-30"
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={isLimitReached}
                className="rounded-xl p-2 text-gray-400 hover:bg-white hover:text-gray-600 dark:hover:bg-[#1C2938] disabled:opacity-30"
                aria-label="Voice input"
              >
                <Mic className="h-4 w-4" />
              </button>
              <Button
                onClick={onSend}
                disabled={!inputMessage.trim() || inputDisabled}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#0068FC] hover:bg-[#0056d6] text-white p-0 shrink-0"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLimitReached ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900 dark:bg-red-950/20">
              <div className="flex min-w-0 items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span className="text-xs text-red-800 dark:text-red-200 font-medium">
                  {counselorBlockedReason || 'Free plan allows one counseling completion. Upgrade for unlimited sessions.'}
                </span>
              </div>
              <Button
                size="sm"
                className="shrink-0 bg-[#f58020] hover:bg-[#d66d12] text-white text-xs h-8"
                onClick={onUpgrade}
              >
                Upgrade Plan
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-gray-500 hidden sm:block">
              Press Enter to send · Shift+Enter for a new line
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
