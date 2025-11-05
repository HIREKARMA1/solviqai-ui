"use client"

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'
import { Badge } from '@/components/ui/badge'
import { Clock, PlayCircle, ExternalLink } from 'lucide-react'

export default function Playlist({ assessmentId }: { assessmentId: string }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await apiClient.getAssessmentPlaylist(assessmentId, 5)
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        console.error(e)
        setError(e?.message || 'Failed to load playlist')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [assessmentId])

  if (loading) return <div className="py-8"><Loader /></div>
  if (error) return <div className="py-4 text-red-600">{error}</div>
  if (!data || !data.playlist?.length) return <div className="py-4 text-gray-600">No playlist available</div>

  return (
    <div className="space-y-8">
      {data.playlist.map((item: any, idx: number) => (
        <Card key={idx} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {item.topic}
                </CardTitle>
                <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
                  Curated content to enhance your skills
                </CardDescription>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                {item.videos?.length || 0} videos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {item.videos?.map((v: any, i: number) => (
                <Card key={i} className="overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-200 hover:shadow-lg">
                  <div className="relative aspect-video">
                    {v.url && v.url.includes('watch') && (
                      <iframe
                        src={v.url.replace('watch?v=', 'embed/')}
                        className="absolute inset-0 w-full h-full"
                        title={v.title}
                        allowFullScreen
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-2 text-gray-900 dark:text-gray-100">
                      {v.title || 'Watch Video'}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{v.duration || 'Tutorial'}</span>
                      </div>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <PlayCircle className="w-5 h-5 mr-1" />
                        Watch
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
