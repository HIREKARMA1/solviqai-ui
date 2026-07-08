'use client';

import { useCallback, useEffect, useRef } from 'react';

const TOTAL_SNAPSHOTS = 4;
const STORAGE_PREFIX = 'proctor-schedule-';
const TICK_MS = 4_000;
const MIN_MS_BEFORE_FIRST_CAPTURE = 4_000;

type ScheduleState = {
    scheduledAt: number[];
    captured: number[];
    examEndMs?: number;
    attemptStartedMs?: number;
};

function storageKey(attemptId: string) {
    return `${STORAGE_PREFIX}${attemptId}`;
}

function loadSchedule(attemptId: string): ScheduleState | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(storageKey(attemptId));
        if (!raw) return null;
        return JSON.parse(raw) as ScheduleState;
    } catch {
        return null;
    }
}

function saveSchedule(attemptId: string, state: ScheduleState) {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(storageKey(attemptId), JSON.stringify(state));
}

function computeExamEndMs(
    startedAtIso: string | null | undefined,
    overallTimeRemainingSeconds: number | null
): number {
    const now = Date.now();
    if (overallTimeRemainingSeconds != null && overallTimeRemainingSeconds > 0) {
        return now + overallTimeRemainingSeconds * 1000;
    }
    if (startedAtIso) {
        return new Date(startedAtIso).getTime() + 45 * 60 * 1000;
    }
    return now + 45 * 60 * 1000;
}

/**
 * Spread 4 captures across remaining exam time (works for short exams).
 */
export function buildProctorSchedule(examEndMs: number): number[] {
    const now = Date.now();
    const end = Math.max(examEndMs, now + 3 * 60 * 1000);
    const remaining = Math.max(end - now, 3 * 60 * 1000);
    const fractions = [0.12, 0.35, 0.58, 0.82];

    return fractions.map((f) => Math.round(now + remaining * f));
}

function needsScheduleRebuild(
    state: ScheduleState | null,
    examEndMs: number
): boolean {
    if (!state || state.scheduledAt.length !== TOTAL_SNAPSHOTS) return true;

    const now = Date.now();
    const remaining = Math.max(examEndMs - now, 60_000);

    if (state.scheduledAt[0] > now + 3 * 60 * 60 * 1000) return true;

    if (state.scheduledAt[0] - now > remaining * 0.45) return true;
    if (state.scheduledAt[TOTAL_SNAPSHOTS - 1] > examEndMs + 30_000) return true;

    if (state.examEndMs != null && Math.abs(state.examEndMs - examEndMs) > 90_000) {
        return (state.captured?.length ?? 0) < TOTAL_SNAPSHOTS;
    }

    return false;
}

async function captureVideoFrame(video: HTMLVideoElement, retries = 6): Promise<Blob | null> {
    for (let i = 0; i < retries; i++) {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.72);
            });
            if (blob && blob.size > 500) return blob;
        }
        await new Promise((r) => setTimeout(r, 300));
    }
    return null;
}

export interface UseProctorSnapshotsOptions {
    enabled: boolean;
    attemptId: string | null;
    getVideoElement: () => HTMLVideoElement | null;
    isCameraActive: boolean;
    startedAtIso: string | null | undefined;
    overallTimeRemainingSeconds: number | null;
    /** Upload handler — Mock Test / Disha / Simulation each pass their own API call. */
    onUpload: (snapshotIndex: number, blob: Blob) => Promise<void>;
    serverCapturedIndexes?: number[];
}

export function useProctorSnapshots({
    enabled,
    attemptId,
    getVideoElement,
    isCameraActive,
    startedAtIso,
    overallTimeRemainingSeconds,
    onUpload,
    serverCapturedIndexes = [],
}: UseProctorSnapshotsOptions) {
    const overallRemainingRef = useRef(overallTimeRemainingSeconds);
    const startedAtRef = useRef(startedAtIso);
    const isCameraActiveRef = useRef(isCameraActive);
    const getVideoElementRef = useRef(getVideoElement);
    const onUploadRef = useRef(onUpload);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const capturingRef = useRef<Set<number>>(new Set());

    overallRemainingRef.current = overallTimeRemainingSeconds;
    startedAtRef.current = startedAtIso;
    isCameraActiveRef.current = isCameraActive;
    getVideoElementRef.current = getVideoElement;
    onUploadRef.current = onUpload;

    const captureAndUpload = useCallback(
        async (snapshotIndex: number) => {
            if (!attemptId || capturingRef.current.has(snapshotIndex)) return;

            const state = loadSchedule(attemptId);
            if (state?.captured.includes(snapshotIndex)) return;
            if (serverCapturedIndexes.includes(snapshotIndex)) return;

            const video = getVideoElementRef.current();
            if (!video || !isCameraActiveRef.current) return;

            capturingRef.current.add(snapshotIndex);
            try {
                const blob = await captureVideoFrame(video);
                if (!blob) {
                    console.warn('Proctoring: empty frame for snapshot', snapshotIndex);
                    return;
                }

                await onUploadRef.current(snapshotIndex, blob);

                const updated = loadSchedule(attemptId) || { scheduledAt: [], captured: [] };
                if (!updated.captured.includes(snapshotIndex)) {
                    updated.captured.push(snapshotIndex);
                    saveSchedule(attemptId, updated);
                }
            } catch (err) {
                console.warn('Proctoring snapshot upload failed', snapshotIndex, err);
            } finally {
                capturingRef.current.delete(snapshotIndex);
            }
        },
        [attemptId, serverCapturedIndexes]
    );

    const tick = useCallback(() => {
        if (!attemptId || !isCameraActiveRef.current) return;

        const examEndMs = computeExamEndMs(
            startedAtRef.current,
            overallRemainingRef.current
        );

        let state = loadSchedule(attemptId);
        const attemptStartedMs =
            state?.attemptStartedMs ??
            (startedAtRef.current ? new Date(startedAtRef.current).getTime() : Date.now());

        if (needsScheduleRebuild(state, examEndMs)) {
            state = {
                scheduledAt: buildProctorSchedule(examEndMs),
                captured: state?.captured ?? [],
                examEndMs,
                attemptStartedMs,
            };
            saveSchedule(attemptId, state);
        } else if (!state!.attemptStartedMs) {
            state = { ...state!, attemptStartedMs };
            saveSchedule(attemptId, state);
        }

        const capturedSet = new Set([...(state!.captured ?? []), ...serverCapturedIndexes]);
        const now = Date.now();
        const elapsedMs = now - attemptStartedMs;
        const remainingMs = Math.max(examEndMs - now, 60_000);

        if (!capturedSet.has(1) && elapsedMs >= MIN_MS_BEFORE_FIRST_CAPTURE) {
            void captureAndUpload(1);
        }

        const quickFinishMs = 3 * 60 * 1000;
        if (elapsedMs >= MIN_MS_BEFORE_FIRST_CAPTURE && elapsedMs < quickFinishMs) {
            const quickSlots = [
                MIN_MS_BEFORE_FIRST_CAPTURE,
                Math.max(MIN_MS_BEFORE_FIRST_CAPTURE + 5000, Math.round(elapsedMs * 0.35)),
                Math.max(MIN_MS_BEFORE_FIRST_CAPTURE + 12000, Math.round(elapsedMs * 0.6)),
                Math.max(MIN_MS_BEFORE_FIRST_CAPTURE + 18000, Math.round(elapsedMs * 0.85)),
            ];
            quickSlots.forEach((offsetMs, idx) => {
                const snapshotIndex = idx + 1;
                if (capturedSet.has(snapshotIndex)) return;
                if (elapsedMs >= offsetMs - 1500) {
                    void captureAndUpload(snapshotIndex);
                }
            });
        }

        const shortExamThresholdMs = 8 * 60 * 1000;
        if (remainingMs < shortExamThresholdMs) {
            const shortSlots = [
                MIN_MS_BEFORE_FIRST_CAPTURE,
                Math.round(remainingMs * 0.35),
                Math.round(remainingMs * 0.6),
                Math.round(remainingMs * 0.82),
            ];
            shortSlots.forEach((offsetMs, idx) => {
                const snapshotIndex = idx + 1;
                if (capturedSet.has(snapshotIndex)) return;
                if (elapsedMs >= offsetMs - 2000) {
                    void captureAndUpload(snapshotIndex);
                }
            });
        }

        state!.scheduledAt.forEach((atMs, idx) => {
            const snapshotIndex = idx + 1;
            if (capturedSet.has(snapshotIndex)) return;
            if (now >= atMs - 3000) {
                void captureAndUpload(snapshotIndex);
            }
        });
    }, [attemptId, serverCapturedIndexes, captureAndUpload]);

    useEffect(() => {
        if (tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
        }

        if (!enabled || !attemptId || !isCameraActive) {
            return;
        }

        void tick();
        tickRef.current = setInterval(() => void tick(), TICK_MS);

        return () => {
            if (tickRef.current) {
                clearInterval(tickRef.current);
                tickRef.current = null;
            }
        };
    }, [enabled, attemptId, isCameraActive, tick]);

    const captureNow = useCallback(
        (snapshotIndex: number) => {
            void captureAndUpload(snapshotIndex);
        },
        [captureAndUpload]
    );

    return { totalSnapshots: TOTAL_SNAPSHOTS, runCaptureCheck: tick, captureNow };
}
