"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Mail, Phone } from "lucide-react"

interface SubscriptionRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  feature?: string
}

export default function SubscriptionRequiredModal({ 
  isOpen, 
  onClose,
  feature = "this feature"
}: SubscriptionRequiredModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            <DialogTitle className="text-xl">Subscription Required</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Contact HireKarma for subscription to access {feature}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-gray-100">
              Get in Touch:
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <a 
                  href="mailto:contact@hirekarma.com" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  contact@hirekarma.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <a 
                  href="tel:+1234567890" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  +91 (123) 456-7890
                </a>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">Upgrade to Premium to unlock:</p>
            <ul className="space-y-1 ml-4">
              <li>• Unlimited resume uploads</li>
              <li>• Unlimited job recommendations</li>
              <li>• Unlimited assessments</li>
              <li>• Access to practice section</li>
              <li>• Priority support</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={() => {
              window.location.href = "mailto:contact@hirekarma.com?subject=Premium Subscription Inquiry"
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Contact Us
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
