"use client"

import { Button } from "@/components/ui/button"
import { Lock, ArrowLeft, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface SubscriptionRequiredModalProps {
  isOpen: boolean
  onClose?: () => void
  feature?: string
  title?: string
  message?: string
}

export default function SubscriptionRequiredModal({ 
  isOpen, 
  onClose,
  feature = "this feature",
  title = "Subscription Required",
  message,
}: SubscriptionRequiredModalProps) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 dark:bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative flex flex-col items-center justify-center text-center max-w-lg mx-auto bg-white dark:bg-[#1C2938] border border-gray-200 dark:border-gray-700 p-8 rounded-2xl shadow-2xl"
          >
            {/* Close Button Icon */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Lock Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="mb-6 relative"
            >
              <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Lock className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
            </motion.div>
            
            {/* Text Content */}
            <div className="space-y-2 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {title}
              </h3>
              <p className="text-base font-medium text-gray-600 dark:text-gray-300 max-w-xs mx-auto">
                Upgrade your plan to access <span className="text-blue-600 dark:text-blue-400">{feature}</span>.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {onClose ? (
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-full px-6"
                >
                  Maybe Later
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={() => router.back()}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              )}
              <Button 
                onClick={() => {
                  window.location.href = "/dashboard/student/plans"
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-full px-8"
              >
                View Plans
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
