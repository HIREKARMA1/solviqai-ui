'use client';

import { GroupDiscussionRound } from '@/components/assessment/GroupDiscussionRound';

export default function PracticeGroupDiscussion() {
  return (
    <GroupDiscussionRound 
      mode="practice"
      practiceJoinPayload={{ mode: 'practice' }}
    />
  );
}
