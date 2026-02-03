"use client"

import { Button } from "@/components/ui/button"
import { Lock, ArrowLeft } from "lucide-react"
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
          className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-white/60 dark:bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex flex-col items-center justify-center text-center max-w-lg mx-auto"
          >
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
                Subscription Required
              </h3>
              <p className="text-base font-medium text-gray-600 dark:text-gray-300 max-w-xs mx-auto">
                Contact HireKarma for subscription to access <span className="text-blue-600 dark:text-blue-400">{feature}</span>.
              </p>
            </div>

            {/* Minimal Actions */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button
                onClick={() => {
                  window.location.href = "mailto:contact@hirekarma.com?subject=Premium Subscription Inquiry"
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-full px-8"
              >
                Contact Us
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
