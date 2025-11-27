"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ProgressLoaderProps {
  /** Current progress percentage (0-100) */
  progress?: number
  /** Loading message to display */
  message?: string
  /** Subtitle or description */
  subtitle?: string
  /** Show percentage text */
  showPercentage?: boolean
  /** Size variant */
  size?: "sm" | "md" | "lg"
  /** Custom className */
  className?: string
  /** Auto-increment progress if not provided */
  autoIncrement?: boolean
  /** Animation duration in ms for auto-increment */
  duration?: number
}

export const ProgressLoader = React.forwardRef<HTMLDivElement, ProgressLoaderProps>(
  (
    {
      progress: controlledProgress,
      message = "Loading...",
      subtitle,
      showPercentage = true,
      size = "md",
      className,
      autoIncrement = false,
      duration = 2000,
    },
    ref
  ) => {
    const [internalProgress, setInternalProgress] = React.useState(0)
    const [isComplete, setIsComplete] = React.useState(false)

    // Use controlled progress if provided, otherwise use internal state
    const progress = controlledProgress ?? internalProgress
    const displayProgress = Math.min(100, Math.max(0, progress))

    // Auto-increment progress if enabled and not controlled
    React.useEffect(() => {
      if (autoIncrement && controlledProgress === undefined && !isComplete) {
        const interval = setInterval(() => {
          setInternalProgress((prev) => {
            if (prev >= 100) {
              setIsComplete(true)
              clearInterval(interval)
              return 100
            }
            // Increment with easing - faster at start, slower near end
            const increment = prev < 50 ? Math.random() * 10 + 5 : Math.random() * 3 + 1
            return Math.min(100, prev + increment)
          })
        }, 100)

        return () => clearInterval(interval)
      }
    }, [autoIncrement, controlledProgress, isComplete])

    const sizeClasses = {
      sm: {
        progress: "h-1",
        message: "text-sm",
        subtitle: "text-xs",
        percentage: "text-lg",
      },
      md: {
        progress: "h-2",
        message: "text-base",
        subtitle: "text-sm",
        percentage: "text-xl",
      },
      lg: {
        progress: "h-3",
        message: "text-lg",
        subtitle: "text-base",
        percentage: "text-2xl",
      },
    }

    const currentSizeClasses = sizeClasses[size]

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center space-y-4 w-full", className)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key="loader-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-md space-y-4"
          >
            {/* Progress Bar */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between mb-2">
                {message && (
                  <p className={cn("font-medium text-gray-900 dark:text-white", currentSizeClasses.message)}>
                    {message}
                  </p>
                )}
                {showPercentage && (
                  <span className={cn("font-bold text-blue-600 dark:text-blue-400", currentSizeClasses.percentage)}>
                    {Math.round(displayProgress)}%
                  </span>
                )}
              </div>
              <Progress value={displayProgress} className={cn("w-full", currentSizeClasses.progress)} />
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className={cn("text-center text-gray-600 dark:text-gray-400", currentSizeClasses.subtitle)}>
                {subtitle}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }
)

ProgressLoader.displayName = "ProgressLoader"

