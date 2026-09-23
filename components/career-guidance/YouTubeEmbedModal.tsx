"use client"

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export interface EmbeddableVideo {
  title: string
  url?: string
  embed_url?: string
  video_id?: string
  channel?: string
  duration?: string
  views?: string
}

interface YouTubeEmbedModalProps {
  video: EmbeddableVideo | null
  onClose: () => void
}

/** Pull an 11-character YouTube ID from a watch / share / embed / shorts URL. */
export function extractYouTubeVideoId(input?: string | null): string {
  if (!input) return ''
  const trimmed = input.trim()
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed

  try {
    const u = new URL(trimmed)
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.split('/').filter(Boolean)[0]?.slice(0, 11)
      if (id && /^[\w-]{11}$/.test(id)) return id
    }
    const v = u.searchParams.get('v')
    if (v && /^[\w-]{11}$/.test(v)) return v
    const parts = u.pathname.split('/').filter(Boolean)
    const marker = parts.findIndex((p) => ['embed', 'shorts', 'live', 'v'].includes(p))
    if (marker >= 0) {
      const id = parts[marker + 1]?.slice(0, 11)
      if (id && /^[\w-]{11}$/.test(id)) return id
    }
  } catch {
    const m = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)
    return m?.[1] || ''
  }
  return ''
}

/** Resolve an embeddable src from the various shapes the API may return. */
export function getEmbedSrc(video?: EmbeddableVideo | null): string {
  if (!video) return ''
  const id =
    extractYouTubeVideoId(video.video_id) ||
    extractYouTubeVideoId(video.embed_url) ||
    extractYouTubeVideoId(video.url)
  return id ? `https://www.youtube.com/embed/${id}` : ''
}

/**
 * Plays a YouTube video INSIDE the app via an <iframe> so the student never
 * leaves the Performance Analysis Dashboard (or Career Guidance).
 * Closing unmounts the iframe, which stops playback.
 */
export default function YouTubeEmbedModal({ video, onClose }: YouTubeEmbedModalProps) {
  useEffect(() => {
    if (!video) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [video, onClose])

  const embedBase = getEmbedSrc(video)
  const src = embedBase ? `${embedBase}?autoplay=1&rel=0` : ''

  return (
    <AnimatePresence>
      {video && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={video.title}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-[#0B1220] rounded-2xl shadow-2xl overflow-hidden"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close video"
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {src ? (
              <div className="relative w-full bg-black" style={{ aspectRatio: '16 / 9' }}>
                <iframe
                  key={src}
                  src={src}
                  title={video.title}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-10 text-center text-gray-300 space-y-2 min-h-[220px] flex flex-col items-center justify-center">
                <p className="text-sm font-medium">This video cannot be played here.</p>
                <p className="text-xs text-gray-500">Stay on this page and try another playlist video.</p>
              </div>
            )}

            <div className="px-5 py-4 pr-14 space-y-1 bg-[#111c33] border-t border-white/5">
              <p className="text-base font-semibold text-white leading-snug">{video.title}</p>
              {(video.channel || video.duration || video.views) && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  {video.channel && <span className="font-medium text-gray-300">{video.channel}</span>}
                  {video.duration && <span>• {video.duration}</span>}
                  {video.views && <span>• {video.views}</span>}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
