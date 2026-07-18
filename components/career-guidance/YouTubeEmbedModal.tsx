"use client"

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'

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

/** Resolve an embeddable src from the various shapes the API may return. */
export function getEmbedSrc(video?: EmbeddableVideo | null): string {
  if (!video) return ''
  if (video.embed_url) return video.embed_url
  if (video.video_id) return `https://www.youtube.com/embed/${video.video_id}`
  // Last-resort: extract the id from a watch URL.
  const m = video.url?.match(/[?&]v=([\w-]{11})/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : ''
}

/**
 * Plays a YouTube video INSIDE the app via an <iframe> so the student never
 * leaves the site (Problems 5 & 6). Falls back to an external link only if the
 * video cannot be embedded.
 */
export default function YouTubeEmbedModal({ video, onClose }: YouTubeEmbedModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (video) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [video, onClose])

  const src = getEmbedSrc(video)

  return (
    <AnimatePresence>
      {video && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-[#0F172A] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#111c33]">
              <p className="text-sm font-semibold text-white truncate">{video.title}</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close video"
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {src ? (
              <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                <iframe
                  src={`${src}?autoplay=1&rel=0&modestbranding=1`}
                  title={video.title}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-8 text-center text-gray-300 space-y-3">
                <p className="text-sm">This video can’t be embedded here.</p>
                {video.url && (
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Open on YouTube <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}

            {(video.channel || video.duration || video.views) && (
              <div className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-400 bg-[#111c33] border-t border-white/5">
                {video.channel && <span className="font-medium text-gray-300">{video.channel}</span>}
                {video.duration && <span>• {video.duration}</span>}
                {video.views && <span>• {video.views}</span>}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
