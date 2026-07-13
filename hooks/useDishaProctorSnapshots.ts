'use client';

/**
 * Disha-specific wrapper around the generic proctoring hook.
 * Keeps existing DishaAssessmentExam call sites unchanged.
 */

import { useCallback } from 'react';
import { apiClient } from '@/lib/api';
import {
    useProctorSnapshots,
    buildProctorSchedule,
    type UseProctorSnapshotsOptions,
} from '@/hooks/useProctorSnapshots';

export { buildProctorSchedule };

export interface UseDishaProctorSnapshotsOptions
    extends Omit<UseProctorSnapshotsOptions, 'onUpload'> {
    packageId: string;
    studentId: string;
    currentRoundNumber?: number;
}

export function useDishaProctorSnapshots({
    enabled,
    packageId,
    attemptId,
    studentId,
    getVideoElement,
    isCameraActive,
    startedAtIso,
    overallTimeRemainingSeconds,
    currentRoundNumber,
    serverCapturedIndexes = [],
}: UseDishaProctorSnapshotsOptions) {
    const onUpload = useCallback(
        async (snapshotIndex: number, blob: Blob) => {
            if (!attemptId || !packageId) return;
            await apiClient.uploadDishaProctoringSnapshot(
                packageId,
                attemptId,
                studentId,
                snapshotIndex,
                blob,
                currentRoundNumber
            );
        },
        [attemptId, packageId, studentId, currentRoundNumber]
    );

    return useProctorSnapshots({
        enabled,
        attemptId,
        getVideoElement,
        isCameraActive,
        startedAtIso,
        overallTimeRemainingSeconds,
        onUpload,
        serverCapturedIndexes,
    });
}
