"use client"

import { useMemo, useState, type ElementType, type ReactNode } from 'react'
import { Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SkillCategory, StudentSkill } from '@/lib/studentProfile'

const SKILL_GROUPS: Array<{ id: SkillCategory; label: string }> = [
  { id: 'technical', label: 'Technical' },
  { id: 'soft', label: 'Soft' },
  { id: 'domain', label: 'Domain' },
  { id: 'tool', label: 'Tool' },
]

export function InventorySection({
  title,
  description,
  icon: Icon,
  emptyText,
  onAdd,
  addLabel = 'Add',
  count = 0,
  children,
}: {
  title: string
  description: string
  icon: ElementType
  emptyText: string
  onAdd: () => void
  addLabel?: string
  count?: number
  children: ReactNode
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shrink-0">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <Button type="button" onClick={onAdd} className="shrink-0 bg-[#0068FC] hover:bg-[#0054cc]">
          <Plus className="mr-2 h-4 w-4" />
          {addLabel}
        </Button>
      </div>
      <div className="p-5">
        {count === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{emptyText}</p>
        ) : (
          <div className="space-y-3">{children}</div>
        )}
      </div>
    </section>
  )
}

export function SkillsInventory({
  skills,
  onAdd,
  onEdit,
  onDelete,
}: {
  skills: StudentSkill[]
  onAdd: () => void
  onEdit: (skill: StudentSkill) => void
  onDelete: (skill: StudentSkill) => void
}) {
  const grouped = useMemo(() => {
    const map = new Map<SkillCategory, StudentSkill[]>()
    for (const group of SKILL_GROUPS) map.set(group.id, [])
    for (const skill of skills) {
      const key = (SKILL_GROUPS.some((g) => g.id === skill.category) ? skill.category : 'technical') as SkillCategory
      map.get(key)?.push(skill)
    }
    return map
  }, [skills])

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Skills</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Skills you add plus those extracted from resumes and completed assessments (duplicates are skipped)
            </p>
          </div>
        </div>
        <Button type="button" onClick={onAdd} className="shrink-0 bg-[#0068FC] hover:bg-[#0054cc]">
          <Plus className="mr-2 h-4 w-4" />
          Add skill
        </Button>
      </div>
      <div className="p-5">
        {skills.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
            No skills yet. Add one or upload a resume to extract them automatically.
          </p>
        ) : (
          <div className="space-y-6">
            {SKILL_GROUPS.map((group) => {
              const items = grouped.get(group.id) || []
              if (items.length === 0) return null
              return (
                <div key={group.id}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                      {group.label}
                    </h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{items.length}</span>
                  </div>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    {items.map((skill) => (
                      <li
                        key={skill.id}
                        className="flex items-center gap-3 bg-white px-4 py-3 dark:bg-[#1C2938] hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                          {skill.name}
                        </p>
                        <span className="shrink-0 rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {group.label}
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${skill.name}`}
                            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                            onClick={() => onEdit(skill)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${skill.name}`}
                            className="rounded-md p-1.5 text-gray-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                            onClick={() => onDelete(skill)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export function InventoryItem({
  title,
  subtitle,
  badges,
  onEdit,
  onDelete,
}: {
  title: string
  subtitle?: string
  badges?: string[]
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
        {subtitle ? <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">{subtitle}</p> : null}
        {badges && badges.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {badges.map((badge) => (
              <Badge key={badge} variant="outline" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex gap-2 shrink-0">
        <Button type="button" variant="outline" size="sm" onClick={onEdit} aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDelete} aria-label="Delete">
          <Trash2 className="h-4 w-4 text-rose-500" />
        </Button>
      </div>
    </div>
  )
}

export function ConfirmDeleteDialog({
  open,
  title,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  title: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {title}?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="bg-rose-600 hover:bg-rose-700" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[]
  onChange: (next: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')
  const chips = useMemo(() => values || [], [values])

  const add = () => {
    const next = draft.trim()
    if (!next) return
    if (chips.some((c) => c.toLowerCase() === next.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...chips, next])
    setDraft('')
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
        />
        <Button type="button" variant="outline" onClick={add}>
          Add
        </Button>
      </div>
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-200"
              onClick={() => onChange(chips.filter((c) => c !== chip))}
            >
              {chip} ×
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
