/**
 * Resolve display/evaluation question type for Disha exam questions.
 * Supports new enum values and legacy rows stored as mcq without options.
 */

/** API/UI question objects (e.g. Question interface) are plain objects without an index signature */
type DishaQuestionInput = object | null | undefined

function asQuestionRecord(q: object): Record<string, unknown> {
    return q as Record<string, unknown>
}

export function normalizeMcqOptions(q: DishaQuestionInput): string[] {
    if (!q) return []
    const qRec = asQuestionRecord(q)
    if (Array.isArray(qRec.options)) {
        return qRec.options.map((o: unknown) =>
            typeof o === 'string' ? o : ((o as { text?: string; label?: string })?.text ?? (o as { label?: string })?.label ?? JSON.stringify(o))
        )
    }
    if (Array.isArray(qRec.choices)) {
        return qRec.choices.map((o: unknown) =>
            typeof o === 'string' ? o : ((o as { text?: string; label?: string })?.text ?? (o as { label?: string })?.label ?? JSON.stringify(o))
        )
    }
    const jsonCandidate = qRec.options_json || qRec.options
    if (typeof jsonCandidate === 'string') {
        try {
            const parsed = JSON.parse(jsonCandidate)
            if (Array.isArray(parsed)) {
                return parsed.map((o: unknown) =>
                    typeof o === 'string' ? o : ((o as { text?: string })?.text ?? JSON.stringify(o))
                )
            }
            if (parsed && typeof parsed === 'object') {
                return Object.values(parsed as Record<string, unknown>).map((o) =>
                    typeof o === 'string' ? o : String(o)
                )
            }
        } catch {
            /* ignore */
        }
    }
    const keySet = ['option_a', 'option_b', 'option_c', 'option_d']
    const fromFields = keySet.map((k) => qRec[k]).filter(Boolean)
    if (fromFields.length > 0) return fromFields as string[]
    if (qRec.options && typeof qRec.options === 'object' && !Array.isArray(qRec.options)) {
        return Object.values(qRec.options as Record<string, unknown>).map(String)
    }
    return []
}

export function resolveDishaQuestionType(
    question: DishaQuestionInput,
    round?: { round_type?: string; round_name?: string } | null
): string {
    if (!question) return ''
    const q = asQuestionRecord(question)
    const meta = (q.question_metadata || {}) as Record<string, unknown>
    const fromMeta = meta.original_question_type || meta.source_question_type
    if (fromMeta) return String(fromMeta).toLowerCase()

    const rawType = String(q.question_type || '').toLowerCase()
    if (['dictation', 'voice_reading', 'voice_speaking', 'text', 'voice'].includes(rawType)) {
        return rawType
    }

    const isSoftSkillsRound =
        round?.round_type === 'soft_skills' ||
        (round?.round_name || '').toLowerCase().includes('soft skill')

    if (rawType === 'mcq' && isSoftSkillsRound && normalizeMcqOptions(question).length === 0) {
        const text = String(q.question_text || '').toLowerCase()
        if (text.includes('listen and write')) return 'dictation'
        if (
            text.includes('read aloud') ||
            text.includes('read the following') ||
            /read[\s\S]*?aloud/i.test(text)
        ) {
            return 'voice_reading'
        }
        if (
            text.includes('speak') ||
            text.includes('describe a') ||
            text.includes('tell us') ||
            text.includes('explain verbally')
        ) {
            return 'voice_speaking'
        }
        const raw = String(q.question_text || '').trim()
        if (
            raw.length > 20 &&
            !raw.includes('choose') &&
            !raw.includes('select') &&
            !/\b(which|what|who)\b/i.test(raw) &&
            !raw.includes('?')
        ) {
            return 'dictation'
        }
    }

    return rawType
}

export function isDishaMcqQuestion(
    question: DishaQuestionInput,
    round?: { round_type?: string; round_name?: string } | null
): boolean {
    const resolved = resolveDishaQuestionType(question, round)
    return resolved === 'mcq'
}
