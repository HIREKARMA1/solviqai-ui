'use client';

import { useEffect, useRef, useState } from 'react';
import { config } from '@/lib/config';

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

export default function InterviewPractice({ onBack }: { onBack?: () => void }) {
  const [mode, setMode] = useState<'technical' | 'hr'>('technical');
  const [jobRole, setJobRole] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [limit, setLimit] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI-Powered Interview Practice</h1>
            {onBack && (
              <button
                onClick={onBack}
                className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-700 hover:border-blue-400 hover:shadow-sm transition-all text-sm font-medium"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400">Practice mock interviews with AI-generated questions tailored to your role</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Top Stats/Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Technical Interview Card */}
          <button
            onClick={() => setMode('technical')}
            className={`p-6 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${mode === 'technical'
              ? 'bg-[#E8F2FF] border-blue-200 dark:bg-blue-900/40 dark:border-blue-700 shadow-md transform scale-[1.02]'
              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-[#E8F2FF] dark:hover:bg-blue-900/30 hover:border-blue-100 hover:shadow-sm'
              }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Interview Type</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Technical</h3>
              </div>
              <div className={`p-3 rounded-xl ${mode === 'technical' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-500 dark:bg-blue-800 dark:text-blue-200'}`}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${mode === 'technical' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                {mode === 'technical' ? 'Selected' : 'Click to select'}
              </span>
            </div>
          </button>

          {/* HR Interview Card */}
          <button
            onClick={() => setMode('hr')}
            className={`p-6 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${mode === 'hr'
              ? 'bg-[#F4EBF7] border-purple-200 dark:bg-purple-900/40 dark:border-purple-700 shadow-md transform scale-[1.02]'
              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-[#F4EBF7] dark:hover:bg-purple-900/30 hover:border-purple-100 hover:shadow-sm'
              }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Interview Type</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">HR Round</h3>
              </div>
              <div className={`p-3 rounded-xl ${mode === 'hr' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-500 dark:bg-purple-800 dark:text-purple-200'}`}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${mode === 'hr' ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                {mode === 'hr' ? 'Selected' : 'Click to select'}
              </span>
            </div>
          </button>

          {/* Difficulty Stats Card */}
          <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-700 bg-[#FCE8EF] dark:bg-pink-900/30 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Selected Difficulty</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{difficulty}</h3>
              </div>
              <div className="p-3 rounded-xl bg-pink-100 dark:bg-pink-800 text-pink-500 dark:text-pink-200">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="w-full bg-pink-200 dark:bg-pink-800 h-1.5 mt-2">
              <div
                className="bg-pink-500 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: difficulty === 'easy' ? '33%' : difficulty === 'medium' ? '66%' : '100%'
                }}
              />
            </div>
            <p className="text-xs text-pink-600 dark:text-pink-300 mt-2 font-medium">Readiness Level</p>
          </div>

          {/* Question Count Stats Card */}
          <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-700 bg-[#FFF9E6] dark:bg-yellow-900/30 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Questions</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{limit}</h3>
              </div>
              <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-200">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">~{Math.round(limit * 2.5)} mins</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">estimated time</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Configuration Card */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Session Configuration</h2>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            )}

            {/* Job Role Input (Critical for Interview) */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Target Job Role <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder={mode === 'technical' ? "e.g., Software Engineer, Data Scientist, Product Manager..." : "e.g., HR Generalist, Project Manager..."}
                  className={`w-full p-4 border-2 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-all bg-gray-50/50 dark:bg-gray-700/50 dark:text-white ${!jobRole.trim() && error ? 'border-red-300 bg-red-50' : 'border-gray-100 dark:border-gray-700'}`}
                />
                {!jobRole.trim() && (
                  <div className="absolute right-4 top-4 text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">Required</div>
                )}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Select Difficulty Level</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['easy', 'medium', 'hard'] as const).map((level) => {
                  const isSelected = difficulty === level;
                  const colors = {
                    easy: {
                      bg: 'bg-[#E6F7ED] dark:bg-green-900/20',
                      border: 'border-green-200 dark:border-green-800',
                      text: 'text-green-700 dark:text-green-400',
                      active: 'ring-2 ring-green-500'
                    },
                    medium: {
                      bg: 'bg-[#FFF4E6] dark:bg-orange-900/20',
                      border: 'border-orange-200 dark:border-orange-800',
                      text: 'text-orange-700 dark:text-orange-400',
                      active: 'ring-2 ring-orange-500'
                    },
                    hard: {
                      bg: 'bg-[#E6F0FF] dark:bg-blue-900/20',
                      border: 'border-blue-200 dark:border-blue-800',
                      text: 'text-blue-700 dark:text-blue-400',
                      active: 'ring-2 ring-blue-500'
                    }
                  };
                  return (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`p-4 rounded-xl border transition-all text-left ${colors[level].bg} ${colors[level].border} ${isSelected ? colors[level].active : 'hover:shadow-md'
                        }`}
                    >
                      <div className={`font-bold capitalize mb-1 ${colors[level].text}`}>{level}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {level === 'easy' ? 'For beginners' : level === 'medium' ? 'Standard practice' : 'Challenge yourself'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Topic Focus (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={mode === 'technical' ? "e.g., 'System Design', 'React Basics'..." : "e.g., 'Conflict Resolution', 'Leadership'..."}
                  className="w-full p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-all bg-gray-50/50 dark:bg-gray-700/50 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Slider & Action */}
          <div className="space-y-6">
            {/* Questions Slider Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Question Limit</h2>
              </div>

              <div className="mb-8 px-2">
                <input
                  type="range"
                  min="3"
                  max="20"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((limit - 3) / 17) * 100}%, #e5e7eb ${((limit - 3) / 17) * 100}%, #e5e7eb 100%)`,
                  }}
                />
                <div className="flex justify-between mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <span>3 Qs</span>
                  <span>10 Qs</span>
                  <span>20 Qs</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Total Questions</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{limit}</span>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={fetchQuestions}
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-bold text-lg text-white transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Generating Questions...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Start Interview</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>

            {!loading && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                AI generates unique questions based on your profile for each session.
              </p>
            )}
          </div>
        </div>
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
          <div className="bg-white p-4 rounded-lg shadow-lg">
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
    </div>
  );
}