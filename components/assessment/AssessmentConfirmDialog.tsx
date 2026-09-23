'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface AssessmentConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  /** Element that should receive focus when the dialog closes (e.g. Submit button). */
  returnFocusRef?: React.RefObject<HTMLElement | null>
}

/**
 * In-app confirmation modal for assessment flows.
 * Replaces browser-native alert()/confirm() while preserving existing submit behavior.
 */
export function AssessmentConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  returnFocusRef,
}: AssessmentConfirmDialogProps) {
  const confirmRef = React.useRef<HTMLButtonElement>(null)

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) onCancel()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[250] bg-black/60',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <DialogPrimitive.Content
          role="dialog"
          aria-modal="true"
          className={cn(
            'fixed left-1/2 top-1/2 z-[250] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl outline-none sm:p-8',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'max-h-[min(90dvh,100%)] overflow-y-auto'
          )}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            confirmRef.current?.focus()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            returnFocusRef?.current?.focus()
          }}
          onEscapeKeyDown={(event) => {
            if (loading) {
              event.preventDefault()
              return
            }
            // Escape cancels; never submits
            event.preventDefault()
            onCancel()
          }}
          onPointerDownOutside={(event) => {
            if (loading) event.preventDefault()
          }}
          onInteractOutside={(event) => {
            if (loading) event.preventDefault()
          }}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>

          <DialogPrimitive.Title className="text-center text-xl font-bold text-gray-900">
            {title}
          </DialogPrimitive.Title>

          <DialogPrimitive.Description className="mt-3 whitespace-pre-line text-center text-sm leading-relaxed text-gray-600">
            {message}
          </DialogPrimitive.Description>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={onCancel}
              className="w-full sm:w-auto sm:min-w-[7.5rem]"
            >
              {cancelLabel}
            </Button>
            <Button
              ref={confirmRef}
              type="button"
              variant="default"
              loading={loading}
              disabled={loading}
              onClick={onConfirm}
              className="w-full bg-[#2563EB] hover:bg-blue-700 focus-visible:ring-blue-600 sm:w-auto sm:min-w-[8.5rem]"
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** Singular/plural unanswered-question copy for submit confirmation. */
export function unansweredSubmitMessage(unansweredCount: number): string {
  const noun = unansweredCount === 1 ? 'question' : 'questions'
  return [
    `You have ${unansweredCount} unanswered ${noun}.`,
    'Unanswered questions will be scored as 0.',
    'Do you want to submit anyway?',
  ].join('\n\n')
}
