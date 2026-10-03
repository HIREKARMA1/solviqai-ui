export const MOCK_INTERVIEW_DEFAULTS = {
  languageCode: 'en-IN',
  maxTurns: 10,
  sessionTimeoutSeconds: 20 * 60,
  silenceTimeoutSeconds: 5,
  reconnectGraceSeconds: 30,
} as const;

export type MockInterviewRealtimeStartRequest = {
  focus_prompt: string;
  language_code?: string;
  max_turns?: number;
  session_timeout_seconds?: number;
  silence_timeout_seconds?: number;
  reconnect_grace_seconds?: number;
};

export type MockInterviewEventType =
  | 'session.ready'
  | 'session.state'
  | 'turn.started'
  | 'ai.transcript.delta'
  | 'ai.transcript.final'
  | 'ai.audio.state'
  | 'student.transcript.delta'
  | 'student.transcript.final'
  | 'turn.analyzing'
  | 'turn.evaluated'
  | 'turn.action'
  | 'session.completed'
  | 'session.error';

export type MockInterviewStreamEvent = {
  event_id: string;
  session_id: string;
  sequence: number;
  type: MockInterviewEventType;
  emitted_at: string;
  turn_id?: number;
  actor?: 'ai' | 'student' | 'system';
  text_delta?: string;
  text?: string;
  data: Record<string, unknown>;
};

export type MockInterviewAudioPlaybackState =
  | 'queued'
  | 'playing'
  | 'ended'
  | 'interrupted'
  | 'failed';

export type MockInterviewRealtimeStatus =
  | 'CONNECTING'
  | 'IN_PROGRESS'
  | 'RECONNECTING'
  | 'COMPLETED'
  | 'INTERRUPTED'
  | 'FAILED';

export type MockInterviewRealtimeSessionState = {
  session_id: string;
  status: MockInterviewRealtimeStatus;
  focus_prompt: string;
  language_code: string;
  max_turns: number;
  session_timeout_seconds: number;
  silence_timeout_seconds: number;
  reconnect_grace_seconds: number;
};

export type MockInterviewRealtimeConnectionResponse = {
  session_id: string;
  room_name: string;
  livekit_url: string;
  livekit_token: string;
  event_stream_token: string;
  event_stream_url: string;
  initial_state: MockInterviewRealtimeSessionState;
  resume_from_sequence: number;
};

export type MockInterviewRealtimeEndResponse = {
  session_id: string;
  state: MockInterviewRealtimeSessionState;
  report?: {
    overall_score?: number;
    summary?: string;
    verdict?: string;
    strengths?: string[];
    weaknesses?: string[];
    improvement_tips?: string[];
    improvement_areas?: string[];
    ai_mode?: string;
    fallback_reason?: string;
    turn_evaluation_summary?: {
      turn_count?: number;
      answered_turns?: number;
      evaluated_turns?: number;
      skipped_turns?: number;
      follow_up_count?: number;
      average_score?: number | null;
      average_relevance?: number | null;
      average_completeness?: number | null;
    };
  } | null;
};
