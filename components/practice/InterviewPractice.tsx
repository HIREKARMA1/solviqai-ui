'use client';

import { useEffect, useRef, useState } from 'react';
import { config } from '@/lib/config';
import SubscriptionRequiredModal from '@/components/subscription/SubscriptionRequiredModal';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Question {
  id?: string;
  exam_type: string; // interview_hr or interview_technical
  category?: string;
  topic?: string;
  difficulty?: Difficulty;
  question_type?: string; // usually 'open'
  question_text: string;
  is_ai_generated?: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

interface InterviewPracticeProps {
  isFreeUser?: boolean;
}

export default function InterviewPractice({ isFreeUser = false }: InterviewPracticeProps) {
  const [mode, setMode] = useState<'technical' | 'hr'>('technical');
  const [jobRole, setJobRole] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [limit, setLimit] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionType, setSubscriptionType] = useState<string>(isFreeUser ? 'free' : 'premium');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [showEvaluation, setShowEvaluation] = useState<boolean>(false);
  const [sessionEval, setSessionEval] = useState<any>(null);
  const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveTranscript, interimTranscript, currentIndex]);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition: SpeechRecognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) final += transcript + ' ';
            else interim += transcript;
          }
          setInterimTranscript(interim);
          if (final) setLiveTranscript((prev) => prev + final);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
          if (isLiveTranscribing) {
            try {
              recognition.start();
            } catch { }
          }
        };

        speechRecognitionRef.current = recognition;
      }
    }

    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch { }
      }
    };
  }, [isLiveTranscribing]);

  // Check Subscription Status
  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        // Use full URL from config
        const response = await fetch(`${config.api.fullUrl}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const userData = await response.json();
          const sub = userData.subscription_type || 'free';
          setSubscriptionType(sub);

          // Force limit to 2 for free users
          if (sub === 'free' || isFreeUser) {
            setLimit(2);
            if (isFreeUser) setSubscriptionType('free');
          }
        }
      } catch (err) {
        console.error("Failed to check subscription", err);
      }
    };
    checkUser();
  }, []);

  const startLiveTranscription = async () => {
    if (!speechRecognitionRef.current) {
      // Check if browser supports speech recognition
      if (typeof window === 'undefined' || !((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) {
        alert('Speech recognition not available. Please use Chrome, Edge, or Safari browser.');
        return;
      }
      alert('Speech recognition not initialized. Please refresh the page.');
      return;
    }

    if (!isLiveTranscribing) {
      try {
        // Request microphone permission first
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permError) {
          alert('Microphone permission denied. Please allow microphone access in your browser settings.');
          return;
        }

        setLiveTranscript('');
        setInterimTranscript('');
        speechRecognitionRef.current.start();
        setIsLiveTranscribing(true);
      } catch (error: any) {
        console.error('Error starting speech recognition:', error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          alert('Microphone permission denied. Please allow microphone access.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          alert('No microphone found. Please connect a microphone.');
        } else {
          alert('Failed to start recording: ' + (error.message || 'Unknown error'));
        }
      }
    }
  };

  const stopLiveTranscription = () => {
    if (speechRecognitionRef.current && isLiveTranscribing) {
      try {
        speechRecognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
      setIsLiveTranscribing(false);
      const fullTranscript = (liveTranscript + ' ' + interimTranscript).trim();
      if (fullTranscript) {
        setResponses((prev) => ({ ...prev, [currentIndex]: fullTranscript }));
      }
      setLiveTranscript('');
      setInterimTranscript('');
    }
  };


  const finishPracticeAndEvaluate = async () => {
    if (questions.length === 0) return;
    setEvaluating(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Please log in to evaluate your session');
      const apiUrl = `${config.api.fullUrl}/api/v1/practice/interview/evaluate`;
      const examType = mode === 'technical' ? 'technical' : 'hr';

      const items = questions.map((q, idx) => ({ question_text: q.question_text, response_text: responses[idx] || '' }));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_type: examType,
          job_role: jobRole,
          topic: topic,
          difficulty,
          items,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const evaluation = data.evaluation || data;
      setSessionEval(evaluation);
      setShowEvaluation(true);
    } catch (err: any) {
      setError(err.message || 'Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  const playDictationAudio = (text: string) => {
    if (!text || text.trim() === '') return;
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech not supported. Try Chrome or Edge.');
      return;
    }
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }, 80);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Please log in to access practice questions');

      // Validate job role is provided
      if (!jobRole || !jobRole.trim()) {
        setError('Please enter a target job role (e.g., Software Engineer, Data Analyst, Product Manager)');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({ job_role: jobRole.trim(), limit: String(limit) });
      if (topic.trim()) params.append('topic', topic.trim());
      if (difficulty) params.append('difficulty', difficulty);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const path = mode === 'technical' ? '/api/v1/practice/interview/technical' : '/api/v1/practice/interview/hr';
      const apiUrl = `${config.api.fullUrl}${path}?${params}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) throw new Error('Session expired. Please log in again.');
        if (response.status === 403) throw new Error('Access denied. Student access required.');
        if (response.status === 500) throw new Error('Server error. Please try again later.');
        throw new Error(errorData.detail || errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const items: Question[] = data.items || data.questions || [];
      if (!items || items.length === 0) throw new Error('No questions returned. Try different parameters.');

      setQuestions(items);
      setCurrentIndex(0);
      setResponses({});
    } catch (error: any) {
      const msg = error.name === 'AbortError' ? 'Request timeout. Try with fewer questions.' : error.message || 'Failed to load questions.';

      if (error.message && (error.message.includes('Access denied') || error.message.includes('subscription') || error.message.includes('limit'))) {
        setShowSubscriptionModal(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const answered = responses[currentIndex] ?? '';

  // Initial form when there are no questions yet
  if (questions.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 via-white to-blue-50/30 rounded-2xl shadow-xl border border-blue-100/50">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
            <h2 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">AI-Powered</span>{' '}
              <span className="text-blue-400">Interview Practice</span>
            </h2>
          </div>
          <p className="text-gray-600">Practice mock interviews with AI-generated questions</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Interview Type with Sliding Indicator */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
              Interview Type
            </label>
            <div className="relative flex gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200/50 shadow-lg">
              {/* Sliding Background Indicator */}
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 shadow-lg transition-all duration-500 ease-out z-0"
                style={{
                  width: 'calc(50% - 8px)',
                  left: mode === 'technical' ? '4px' : 'calc(50% + 4px)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                }}
              ></div>
              <button
                onClick={() => setMode('technical')}
                className={`relative z-10 flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${mode === 'technical'
                  ? 'text-white scale-105 shadow-md'
                  : 'text-gray-700 hover:scale-[1.02]'
                  }`}
              >
                Technical Interview
              </button>
              <button
                onClick={() => setMode('hr')}
                className={`relative z-10 flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${mode === 'hr'
                  ? 'text-white scale-105 shadow-md'
                  : 'text-gray-700 hover:scale-[1.02]'
                  }`}
              >
                HR Interview
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                Target Job Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                disabled={loading}
                placeholder={mode === 'technical' ? 'e.g., Software Engineer, Backend Developer, Data Engineer' : 'e.g., Software Engineer, Product Manager, HR Generalist'}
                required
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md bg-white/90 backdrop-blur-sm text-gray-900 ${!jobRole.trim() ? 'border-red-300 bg-red-50/50' : 'border-gray-200'}`}
              />
              {!jobRole.trim() && (
                <p className="mt-1 text-xs text-red-600">Job role is required to generate relevant questions</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                Topic (optional)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                placeholder={mode === 'technical' ? 'e.g., Data Structures, System Design' : 'e.g., Teamwork, Strengths/Weaknesses'}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md bg-white/90 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Difficulty Level with Sliding Indicator */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
              Difficulty Level
            </label>
            <div className="relative flex gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200/50 shadow-lg">
              {/* Sliding Background Indicator */}
              <div
                className="absolute top-1 bottom-1 rounded-lg shadow-lg transition-all duration-500 ease-out z-0"
                style={{
                  width: 'calc(33.333% - 8px)',
                  left: difficulty === 'easy'
                    ? '4px'
                    : difficulty === 'medium'
                      ? 'calc(33.333% + 4px)'
                      : 'calc(66.666% + 4px)',
                  background: difficulty === 'easy'
                    ? 'linear-gradient(to right, #3b82f6, #2563eb)'
                    : difficulty === 'medium'
                      ? 'linear-gradient(to right, #10b981, #059669)'
                      : 'linear-gradient(to right, #1f2937, #111827)',
                  boxShadow: difficulty === 'easy'
                    ? '0 4px 12px rgba(37, 99, 235, 0.4)'
                    : difficulty === 'medium'
                      ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                      : '0 4px 12px rgba(31, 41, 55, 0.4)',
                }}
              ></div>
              {(['easy', 'medium', 'hard'] as const).map((level) => {
                const isSelected = difficulty === level;
                const colors = {
                  easy: isSelected ? 'text-white' : 'text-green-600',
                  medium: isSelected ? 'text-white' : 'text-orange-600',
                  hard: isSelected ? 'text-white' : 'text-gray-700',
                };
                return (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`relative z-10 flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 capitalize ${isSelected
                      ? 'scale-105 shadow-md'
                      : 'hover:scale-[1.02]'
                      } ${colors[level]}`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Number of Questions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
              Number of Questions
              {subscriptionType === 'free' && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold">
                  Free Limit: 2
                </span>
              )}
            </label>
            <div className={`relative ${subscriptionType === 'free' ? 'opacity-60 grayscale' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">{subscriptionType === 'free' ? '2 questions' : '1 question'}</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                  {limit}
                </span>
                <span className="text-xs text-gray-500 font-medium">{subscriptionType === 'free' ? 'Max 2' : '20 questions'}</span>
              </div>
              <input
                type="range"
                min={subscriptionType === 'free' ? "2" : "1"}
                max={subscriptionType === 'free' ? "2" : "20"}
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                disabled={subscriptionType === 'free'}
                className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${subscriptionType === 'free' ? 'cursor-not-allowed' : ''}`}
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${subscriptionType === 'free' ? 100 : ((limit - 1) / 19) * 100}%, #e5e7eb ${subscriptionType === 'free' ? 100 : ((limit - 1) / 19) * 100}%, #e5e7eb 100%)`,
                }}
              />
              {subscriptionType === 'free' && (
                <p className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                  🔒 <strong>Free Plan Limit Check:</strong> You can only generate 2 questions per day. Upgrade to Premium for up to 30/day!
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={fetchQuestions}
          disabled={loading}
          className={`mt-8 w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none ${loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
            }`}
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              <span>Loading Questions... (may take 10-20s)</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Start Practice</span>
            </>
          )}
        </button>

        {!loading && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              Questions are generated using AI and cached per topic and difficulty.
            </p>
          </div>
        )}
      </div>
    );
  }

  // If evaluation is toggled, show the evaluation summary view
  if (showEvaluation && sessionEval) {
    const overall = sessionEval.overall || {};
    const analyses = sessionEval.analyses || [];
    return (
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Practice Evaluation</h2>
              <p className="text-sm text-gray-600">Overall feedback and per-question analysis</p>
            </div>
            <button
              onClick={() => {
                setQuestions([]);
                setResponses({});
                setShowEvaluation(false);
                setSessionEval(null);
                setError(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Categories
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded">
              <p className="text-xs text-gray-500">Overall Score</p>
              <p className="text-3xl font-bold text-purple-700">{overall.overall_score ?? 0}</p>
              <div className="mt-2 text-xs text-gray-600">
                <p>Communication: {overall.criteria_averages?.communication ?? 0}</p>
                <p>Relevance: {overall.criteria_averages?.relevance ?? 0}</p>
                <p>Technical Depth: {overall.criteria_averages?.technical_depth ?? 0}</p>
              </div>
            </div>
            <div className="p-4 border rounded md:col-span-2">
              <p className="text-sm font-semibold text-gray-700">Summary</p>
              <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{overall.overall_summary}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <p className="text-sm font-semibold text-gray-700">Strengths</p>
              <ul className="list-disc list-inside text-sm text-gray-800 mt-1">
                {(overall.strengths || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="p-4 border rounded">
              <p className="text-sm font-semibold text-gray-700">Improvements</p>
              <ul className="list-disc list-inside text-sm text-gray-800 mt-1">
                {(overall.improvements || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>

          {overall.practice_plan && overall.practice_plan.length > 0 && (
            <div className="mt-4 p-4 border rounded">
              <p className="text-sm font-semibold text-gray-700">Practice Plan</p>
              <ol className="list-decimal list-inside text-sm text-gray-800 mt-1">
                {overall.practice_plan.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          )}
        </div>

        {/* Per-question analyses */}
        <div className="space-y-6">
          {analyses.map((entry: any, idx: number) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Question {idx + 1}</h3>
                <span className="text-xs text-gray-600">Score: {entry.analysis?.score ?? 0}</span>
              </div>
              <p className="text-sm text-gray-700 font-medium">{entry.question_text}</p>
              <div className="mt-2">
                <p className="text-xs text-gray-500">Your response</p>
                <div className="text-sm text-gray-800 whitespace-pre-wrap border rounded p-3 bg-gray-50">{entry.response_text || '—'}</div>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Mistakes</p>
                  <ul className="list-disc list-inside text-sm text-gray-800">
                    {(entry.analysis?.mistakes || []).map((m: string, i: number) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Fixes</p>
                  <ul className="list-disc list-inside text-sm text-gray-800">
                    {(entry.analysis?.fixes || []).map((m: string, i: number) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              </div>
              {entry.analysis?.solution_steps && entry.analysis.solution_steps.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-gray-700">Solution steps</p>
                  <ol className="list-decimal list-inside text-sm text-gray-800">
                    {entry.analysis.solution_steps.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              )}
              {entry.analysis?.improved_answer && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-gray-700">Improved answer</p>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap bg-white border border-gray-200 rounded p-3">
                    {entry.analysis?.improved_answer}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              setQuestions([]);
              setResponses({});
              setShowEvaluation(false);
              setSessionEval(null);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start New Practice
          </button>
        </div>
      </div>
    );
  }

  // Questions view for interview practice
  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{mode === 'technical' ? 'Technical' : 'HR'} Interview Practice</h2>
                <p className="text-gray-600">
                  Question <span className="font-semibold text-blue-600">{currentIndex + 1}</span> of{' '}
                  <span className="font-semibold">{questions.length}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Difficulty</p>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                  {difficulty.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete
            </p>
          </div>

          {/* Question + Actions */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full mb-4">
                Question {currentIndex + 1}
              </span>
              <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
                {currentQuestion?.question_text}
              </h3>
            </div>

            {/* Dictation controls */}
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => playDictationAudio(currentQuestion?.question_text || '')}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-100"
              >
                🔊 Read question aloud
              </button>
              {!isLiveTranscribing ? (
                <button
                  onClick={startLiveTranscription}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  🎤 Start Recording
                </button>
              ) : (
                <button
                  onClick={stopLiveTranscription}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  ⏹ Stop & Save
                </button>
              )}
              <button
                onClick={() => {
                  setResponses((prev) => ({ ...prev, [currentIndex]: '' }));
                  setLiveTranscript('');
                  setInterimTranscript('');
                  if (isLiveTranscribing && speechRecognitionRef.current) {
                    try {
                      speechRecognitionRef.current.stop();
                    } catch { }
                    setIsLiveTranscribing(false);
                  }
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                🧹 Clear Response
              </button>
            </div>

            {/* Live transcript preview */}
            {(liveTranscript || interimTranscript) && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-xs text-green-800 mb-1">Live transcript</p>
                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                  {liveTranscript} <span className="opacity-70">{interimTranscript}</span>
                </div>
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Manual response textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your response</label>
              <textarea
                value={
                  isLiveTranscribing
                    ? (liveTranscript + ' ' + interimTranscript).trim()
                    : answered
                }
                onChange={(e) => {
                  setResponses((prev) => ({ ...prev, [currentIndex]: e.target.value }));
                  // If user types while recording, stop recording
                  if (isLiveTranscribing && speechRecognitionRef.current) {
                    try {
                      speechRecognitionRef.current.stop();
                    } catch { }
                    setIsLiveTranscribing(false);
                  }
                }}
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all bg-white text-gray-900 placeholder:text-gray-400 text-base"
                placeholder="Speak your answer or type here..."
                style={{
                  color: '#111827',
                  backgroundColor: '#ffffff',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  lineHeight: '1.5',
                }}
              />
              {isLiveTranscribing && (
                <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                  Recording in progress... Your speech will appear here
                </p>
              )}
            </div>
          </div>



          {/* Navigation */}
          <div className="bg-white p-4 rounded-lg shadow-lg mb-6 lg:mb-0">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                ◀ Previous
              </button>
              <button
                onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                disabled={currentIndex === questions.length - 1}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                Next ▶
              </button>
              {currentIndex === questions.length - 1 && (
                <button
                  onClick={finishPracticeAndEvaluate}
                  disabled={evaluating}
                  className={`px-6 py-3 rounded ml-auto ${evaluating ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {evaluating ? 'Evaluating…' : 'Finish Practice'}
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm('Exit interview practice? Your responses will be cleared.')) {
                    setQuestions([]);
                    setResponses({});
                    setError(null);
                  }
                }}
                className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Exit
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar: progress */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-lg sticky top-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Progress</h4>
            <p className="text-xs text-gray-500 mb-4">
              {Object.keys(responses).length} of {questions.length} answered
            </p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {questions.map((_, idx) => {
                const isCurrent = currentIndex === idx;
                const isAnswered = responses[idx] && responses[idx].trim() !== '';
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full aspect-square rounded-lg text-xs font-semibold transition-all duration-200 ${isCurrent ? 'bg-blue-600 text-white shadow-lg' : isAnswered ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    title={isAnswered ? `Question ${idx + 1} - Answered` : `Question ${idx + 1} - Not answered`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="pt-4 border-t border-gray-200 text-xs">
              <p className="font-semibold text-gray-700 mb-2">Legend</p>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-blue-600 rounded" />
                <span className="text-gray-600">Current</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-gray-600">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-200 rounded" />
                <span className="text-gray-600">Not Answered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        feature="premium interview practice"
      />
    </div>

  );
}