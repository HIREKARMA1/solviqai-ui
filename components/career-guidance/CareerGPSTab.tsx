"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Sparkles,
  AlertCircle,
  Clock,
  Target,
  BookOpen,
  ArrowRight,
  ArrowDown,
  Loader2,
  RefreshCw,
  MapPin,
  ChevronRight,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'

interface GPSRoutePhase {
  step_index: number
  title: string
  what_to_read: string
  duration: string
  status: string // "completed", "in_progress", "future"
}

interface GPSRoute {
  id: string
  target_role: string
  match_percentage: number
  avg_salary_range: string
  route_phases: GPSRoutePhase[]
}

export default function CareerGPSTab() {
  const [routes, setRoutes] = useState<GPSRoute[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    setLoading(true)
    setError(null)
    try {
      const { apiClient } = await import('@/lib/api')
      const data = await apiClient.getGPSRecommendations()
      setRoutes(data || [])
      if (data && data.length > 0) {
        setSelectedRouteId(data[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load career recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setError(null)
    try {
      const { apiClient } = await import('@/lib/api')
      const data = await apiClient.refreshGPSRecommendations()
      setRoutes(data || [])
      if (data && data.length > 0) {
        setSelectedRouteId(data[0].id)
      }
      toast.success('Successfully regenerated career paths based on your latest profile!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to refresh career recommendations')
    } finally {
      setRefreshing(false)
    }
  }

  const selectedRoute = routes.find(r => r.id === selectedRouteId)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[450px] space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20 rounded-2xl">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-xl opacity-20 animate-pulse" />
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative z-10" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">GPS Mapping Your Career Routes</h3>
          <p className="text-sm text-gray-600 max-w-sm px-4">
            Proactively analyzing your projects, skills, and resume data to plot routes...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] p-6">
        <Card className="border-red-200 bg-red-50/50 max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Career GPS</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <Button
                onClick={loadRecommendations}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1C2938] overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Top Header Row with Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-[#1b52a4] dark:text-blue-400">
            {/* <TrendingUp className="h-6 w-6 text-[#f58020]" /> */}
            Career GPS
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Personalized routes matching your profile to high-demand industry roles.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-[#f58020] hover:bg-[#d66d12] text-white flex items-center gap-2 rounded-xl py-2.5 px-4 font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Regenerating...' : 'Refresh GPS Paths'}
        </Button>
      </div>

      {routes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No GPS Paths Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            Please make sure you have uploaded your resume and completed at least 30% of your profile.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {routes.map((route) => {
              const isSelected = selectedRouteId === route.id
              return (
                <motion.div
                  key={route.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`cursor-pointer h-full transition-all duration-300 border-2 rounded-2xl overflow-hidden ${isSelected
                        ? 'border-[#1b52a4] bg-blue-50/20 dark:bg-blue-900/10 shadow-lg'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E293B] hover:shadow-md'
                      }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <Badge
                          className={`text-xs font-semibold px-2.5 py-1 ${isSelected ? 'bg-[#1b52a4] text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                        >
                          {route.match_percentage}% Match
                        </Badge>
                        <span className="flex items-center gap-1 text-xs font-bold text-[#f58020]">
                          <DollarSign className="w-3.5 h-3.5" />
                          {route.avg_salary_range}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-bold text-gray-900 dark:text-white mt-3 group-hover:text-[#1b52a4]">
                        {route.target_role}
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                        Top opportunities in leading tech organizations.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Sequential Arrow Roadmap Block */}
          {selectedRoute && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Step-by-Step learning pathway for <span className="text-[#1b52a4] dark:text-blue-400 font-extrabold">{selectedRoute.target_role}</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Follow this visual curriculum designed to bridge the gaps in your profile.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs text-[#1b52a4] dark:text-blue-300 border-[#1b52a4]/40">
                  {selectedRoute.route_phases.length} Phases
                </Badge>
              </div>

              {/* Roadmap Flow View */}
              <div className="flex flex-col lg:flex-row items-center justify-center lg:items-stretch gap-6 py-4">
                {selectedRoute.route_phases.map((step, index) => {
                  const isCompleted = step.status === 'completed'
                  const isInProgress = step.status === 'in_progress'

                  return (
                    <React.Fragment key={step.step_index}>
                      {/* Step Card */}
                      <div className="flex-1 w-full max-w-[280px]">
                        <div
                          className={`relative h-full rounded-2xl p-5 border-2 flex flex-col justify-between transition-all duration-300 shadow-sm ${isCompleted
                              ? 'border-green-200 bg-green-50/30 dark:bg-green-950/15'
                              : isInProgress
                                ? 'border-[#f58020] bg-orange-50/10 dark:bg-orange-950/10 shadow-md ring-2 ring-[#f58020]/20'
                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E293B]'
                            }`}
                        >
                          <div>
                            {/* Step Badge & Duration */}
                            <div className="flex justify-between items-center mb-3">
                              <span
                                className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${isCompleted
                                    ? 'bg-green-500 text-white'
                                    : isInProgress
                                      ? 'bg-[#f58020] text-white animate-pulse'
                                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                                  }`}
                              >
                                {step.step_index}
                              </span>
                              <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#1b52a4]" />
                                {step.duration}
                              </span>
                            </div>

                            {/* Phase Title */}
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2 leading-tight">
                              {step.title}
                            </h4>

                            {/* What to read / Study guide */}
                            <div className="text-xs text-gray-600 dark:text-gray-300 mt-2 bg-white/70 dark:bg-[#202d41] p-3 rounded-xl border border-gray-100 dark:border-gray-800/80 leading-relaxed font-medium">
                              {step.what_to_read}
                            </div>
                          </div>

                          {/* Phase Status Badge */}
                          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/50 flex justify-between items-center">
                            <span
                              className={`text-[10px] uppercase font-bold tracking-wider ${isCompleted
                                  ? 'text-green-600'
                                  : isInProgress
                                    ? 'text-[#f58020]'
                                    : 'text-gray-400'
                                }`}
                            >
                              {step.status.replace('_', ' ')}
                            </span>
                            {isCompleted && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 hover:bg-green-100 border-0 text-[10px]">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Connection Arrow (horizontal for lg, vertical for mobile) */}
                      {index < selectedRoute.route_phases.length - 1 && (
                        <div className="flex items-center justify-center py-2 flex-shrink-0 text-gray-400">
                          {/* Desktop Arrow */}
                          <ArrowRight className="hidden lg:block w-6 h-6 text-[#1b52a4] animate-bounce-horizontal" />
                          {/* Mobile Arrow */}
                          <ArrowDown className="lg:hidden w-6 h-6 text-[#1b52a4] animate-bounce" />
                        </div>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
