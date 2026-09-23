'use client';

import { useExamCamera } from '@/hooks/useExamCamera';

/** Re-export of the shared exam camera hook for assessment rounds. */
export function useAssessmentCamera() {
  return useExamCamera();
}
