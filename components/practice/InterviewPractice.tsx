'use client';

import { useEffect, useRef, useState } from 'react';

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

export default function InterviewPractice() {
  const [mode, setMode] = useState<'technical' | 'hr'>('technical');
  const [jobRole, setJobRole] = useState<string>('Software Engineer');
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [limit, setLimit] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, any>>({});
  const [analyzing, setAnalyzing] = useState<boolean>(false);
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
            } catch {}
          }
        };

        speechRecognitionRef.current = recognition;
      }
    }

    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
    };
  }, [isLiveTranscribing]);

  const startLiveTranscription = () => {
    if (!speechRecognitionRef.current) {
      alert('Speech recognition not available. Use Chrome or Edge browser.');
      return;
    }
    if (!isLiveTranscribing) {
      try {
        setLiveTranscript('');
        setInterimTranscript('');
        speechRecognitionRef.current.start();
        setIsLiveTranscribing(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        alert('Failed to start recording');
      }
    }
  };

  const stopLiveTranscription = () => {
    if (speechRecognitionRef.current && isLiveTranscribing) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      setIsLiveTranscribing(false);
      const fullTranscript = (liveTranscript + ' ' + interimTranscript).trim();
      if (fullTranscript) {
        setResponses((prev) => ({ ...prev, [currentIndex]: fullTranscript }));
      }
      setLiveTranscript('');
      setInterimTranscript('');
    }
  };

  const analyzeCurrentAnswer = async () => {
    if (!currentQuestion) return;
    const answer = responses[currentIndex] || '';
    if (!answer.trim()) {
      alert('Please provide an answer before requesting analysis.');
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Please log in to analyze your answer');

      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiUrl = `${base}/api/v1/practice/interview/analyze`;
      const examType = mode === 'technical' ? 'technical' : 'hr';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_type: examType,
          question_text: currentQuestion?.question_text,
          response_text: answer,
          job_role: jobRole,
          topic: topic || currentQuestion?.topic,
          difficulty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = data.analysis || data;
      setFeedback((prev) => ({ ...prev, [currentIndex]: analysis }));
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const finishPracticeAndEvaluate = async () => {
    if (questions.length === 0) return;
    setEvaluating(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Please log in to evaluate your session');
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiUrl = `${base}/api/v1/practice/interview/evaluate`;
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

      const params = new URLSearchParams({ job_role: jobRole, limit: String(limit) });
      if (topic.trim()) params.append('topic', topic.trim());
      if (difficulty) params.append('difficulty', difficulty);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const path = mode === 'technical' ? '/api/v1/practice/interview/technical' : '/api/v1/practice/interview/hr';
      const apiUrl = `${base}${path}?${params}`;

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
      <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-1">Interview Skills Practice</h2>
        <p className="text-gray-600 mb-6">Practice mock interviews with AI-generated questions</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
            <div className="flex gap-3">
              <button
                onClick={() => setMode('technical')}
                className={`px-4 py-2 rounded font-medium transition ${mode === 'technical' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Technical Interview
              </button>
              <button
                onClick={() => setMode('hr')}
                className={`px-4 py-2 rounded font-medium transition ${mode === 'hr' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                HR Interview
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Job Role</label>
            <input
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              disabled={loading}
              placeholder="e.g., Software Engineer, Data Analyst"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic (optional)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
              placeholder={mode === 'technical' ? 'e.g., Data Structures, System Design' : 'e.g., Teamwork, Strengths/Weaknesses'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <div className="flex gap-3">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`flex-1 py-2 rounded font-medium transition capitalize ${difficulty === level ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions: <span className="text-blue-600 font-bold">{limit}</span></label>
            <input
              type="range"
              min="3"
              max="20"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <button
          onClick={fetchQuestions}
          disabled={loading}
          className={`mt-6 w-full py-3 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              Loading Questions... (may take 10-20s)
            </>
          ) : (
            'Start Practice'
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
                setShowEvaluation(false);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Back to Answers
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
              setFeedback({});
              setShowEvaluation(false);
              setSessionEval(null);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start New Practice
          </button>
          <button
            onClick={() => setShowEvaluation(false)}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Back
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
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  difficulty === 'easy' ? 'bg-green-100 text-green-800' :
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
                onClick={() => setResponses((prev) => ({ ...prev, [currentIndex]: '' }))}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                🧹 Clear Response
              </button>
              <button
                onClick={analyzeCurrentAnswer}
                disabled={analyzing}
                className={`px-4 py-2 rounded ${analyzing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {analyzing ? 'Analyzing…' : '✨ Get AI Feedback'}
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
                value={answered}
                onChange={(e) => setResponses((prev) => ({ ...prev, [currentIndex]: e.target.value }))}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Speak your answer or type here..."
              />
            </div>

            {/* AI Feedback Panel */}
            {feedback[currentIndex] && (
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded">
                <h4 className="text-lg font-semibold text-purple-700 mb-2">AI Feedback</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Mistakes</p>
                    <ul className="list-disc list-inside text-sm text-gray-800">
                      {(feedback[currentIndex].mistakes || []).map((m: string, i: number) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">How to fix</p>
                    <ul className="list-disc list-inside text-sm text-gray-800">
                      {(feedback[currentIndex].fixes || []).map((m: string, i: number) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {feedback[currentIndex].solution_steps && feedback[currentIndex].solution_steps.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-gray-700">Solution steps</p>
                    <ol className="list-decimal list-inside text-sm text-gray-800">
                      {feedback[currentIndex].solution_steps.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {feedback[currentIndex].improved_answer && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-gray-700">Improved answer</p>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap bg-white border border-gray-200 rounded p-3">
                      {feedback[currentIndex].improved_answer}
                    </div>
                  </div>
                )}
                {feedback[currentIndex].criteria_scores && (
                  <div className="mt-3 flex gap-3 text-xs text-gray-700">
                    <span>Score: <span className="font-bold text-purple-700">{feedback[currentIndex].score ?? 0}</span></span>
                    <span>Communication: {feedback[currentIndex].criteria_scores.communication ?? 0}</span>
                    <span>Relevance: {feedback[currentIndex].criteria_scores.relevance ?? 0}</span>
                    <span>Technical Depth: {feedback[currentIndex].criteria_scores.technical_depth ?? 0}</span>
                  </div>
                )}
                {feedback[currentIndex].tips && feedback[currentIndex].tips.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-gray-700">Tips</p>
                    <ul className="list-disc list-inside text-sm text-gray-800">
                      {feedback[currentIndex].tips.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
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
                    className={`w-full aspect-square rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isCurrent ? 'bg-blue-600 text-white shadow-lg' : isAnswered ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
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