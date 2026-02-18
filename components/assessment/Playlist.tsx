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
        <Card key={idx} className="overflow-hidden border border-[#ABABAB] rounded-[8px] shadow-none">
          <CardHeader className="bg-[#E3ECFE] border-b border-[#E3ECFE] py-4 px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-900">
                  {item.topic}
                </CardTitle>
                <CardDescription className="mt-1 text-gray-700 dark:text-gray-700">
                  Curated content to enhance your skills
                </CardDescription>
              </div>
              <Badge variant="secondary" className="px-3 py-1 bg-white/50 text-gray-800 hover:bg-white/70">
                {item.videos?.length || 0} videos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {item.videos?.map((v: any, i: number) => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3">
                    {v.url && v.url.includes('watch') ? (
                       <img 
                        src={`https://img.youtube.com/vi/${v.url.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg`}
                        alt={v.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${v.url.split('v=')[1]?.split('&')[0]}/mqdefault.jpg`
                        }}
                      />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <PlayCircle className="w-12 h-12 text-gray-400" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                    </div>
                    {v.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                            {v.duration}
                        </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm sm:text-base leading-tight text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {v.title || 'Watch Video'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{v.channel || 'Solviq Channel'}</span>
                        <span>•</span>
                        <span>{v.views || '1.2K views'}</span>
                        <span>•</span>
                        <span>{v.uploaded || '1 day ago'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
