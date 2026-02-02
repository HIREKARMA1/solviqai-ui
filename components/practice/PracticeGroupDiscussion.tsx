'use client';

import { GroupDiscussionRound } from '@/components/assessment/GroupDiscussionRound';

export default function PracticeGroupDiscussion({ onBack }: { onBack?: () => void }) {
  return (
    <div className="relative w-full">
      {onBack && (
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={onBack}
            className="bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-white hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      )}
      <GroupDiscussionRound
        mode="practice"
        practiceJoinPayload={{ mode: 'practice' }}
      />
    </div>
  );
}
