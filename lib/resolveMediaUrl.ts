import { config } from '@/lib/config';

/** Turn relative /uploads/... paths into absolute API URLs for <img src>. */
export function resolveMediaUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const base = config.api.baseUrl?.replace(/\/+$/, '') || '';
    if (!base) return url;
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}

export interface ProctoringSnapshotLike {
    index: number;
    url?: string;
    captured_at?: string;
    round_number?: number;
}

/** Always return 4 slots (filled or empty) for admin UI. */
export function buildProctoringSlots(
    snapshots?: ProctoringSnapshotLike[] | null,
    urlFields?: {
        proctoring_snapshot_1_url?: string;
        proctoring_snapshot_2_url?: string;
        proctoring_snapshot_3_url?: string;
        proctoring_snapshot_4_url?: string;
    }
): Array<ProctoringSnapshotLike & { url: string }> {
    const byIndex = new Map<number, ProctoringSnapshotLike>();

    for (const snap of snapshots || []) {
        if (snap?.index >= 1 && snap.index <= 4) {
            byIndex.set(snap.index, snap);
        }
    }

    if (urlFields) {
        ([1, 2, 3, 4] as const).forEach((i) => {
            const key = `proctoring_snapshot_${i}_url` as keyof typeof urlFields;
            const url = urlFields[key];
            if (url && !byIndex.has(i)) {
                byIndex.set(i, { index: i, url });
            } else if (url && byIndex.has(i) && !byIndex.get(i)?.url) {
                byIndex.set(i, { ...byIndex.get(i)!, url });
            }
        });
    }

    return ([1, 2, 3, 4] as const).map((index) => {
        const existing = byIndex.get(index);
        return {
            index,
            url: resolveMediaUrl(existing?.url || ''),
            captured_at: existing?.captured_at,
            round_number: existing?.round_number,
        };
    });
}

export function escapeCsvCell(value: string | number | undefined | null): string {
    const s = value == null ? '' : String(value);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}
