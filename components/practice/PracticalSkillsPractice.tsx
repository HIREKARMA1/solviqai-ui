'use client';

import { useMemo, useState, useEffect } from 'react';
import { BookOpen, Sparkles, Target, Rocket, Trophy, Award, TrendingUp } from 'lucide-react';

interface Question {
  exam_type: string;
  category: string;
  topic: string;
  difficulty?: string | null;
  question_type: 'mcq' | 'written';
  question_text: string;
  options?: string[] | null;
  correct_answer?: string | null;
  explanation?: string | null;
  is_ai_generated: boolean;
}

interface PracticalEvalItem {
  index: number;
  score: number; // 0-10
  feedback: string;
}

interface PracticalSkillsPracticeProps {
  branch?: string;
  onBack?: () => void;
}

export default function PracticalSkillsPractice({ branch: initialBranch, onBack }: PracticalSkillsPracticeProps = {}) {
  const [branch, setBranch] = useState<string>(initialBranch || 'Mechanical');
  const [topic, setTopic] = useState<string>('');
  const [limit, setLimit] = useState<number>(6);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userMcqAnswers, setUserMcqAnswers] = useState<Record<number, string>>({});
  const [userWrittenAnswers, setUserWrittenAnswers] = useState<Record<number, string>>({});

  const [showResults, setShowResults] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<{ score: number; feedback: string; analyses: PracticalEvalItem[] } | null>(null);

  const branches = [
    'Mechanical',
    'Civil',
    'Electrical',
    'Electronics & Telecommunication',
    'Automobile',
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const mcqCount = useMemo(() => questions.filter((q) => q.question_type === 'mcq').length, [questions]);
  const writtenCount = useMemo(() => questions.filter((q) => q.question_type === 'written').length, [questions]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Please log in to access practice questions');

      const params = new URLSearchParams({ branch, limit: String(limit) });
      if (topic.trim()) params.append('topic', topic.trim());
      if (difficulty) params.append('difficulty', difficulty);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/practice/practical?${params}`;
      const resp = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (resp.status === 401) throw new Error('Session expired. Please log in again.');
        if (resp.status === 403) throw new Error('Access denied. Student access required.');
        if (resp.status === 500) throw new Error('Server error. Please try again later.');
        throw new Error(data.detail || data.error || `API error: ${resp.status} ${resp.statusText}`);
      }

      const data = await resp.json();
      const items: Question[] = data.items || [];
      if (!items.length) throw new Error('No questions returned. Try different parameters.');

      setQuestions(items);
      setCurrentIndex(0);
      setUserMcqAnswers({});
      setUserWrittenAnswers({});
      setShowResults(false);
      setEvaluation(null);
    } catch (e: any) {
      const msg = e.name === 'AbortError' ? 'Request timed out. Try fewer questions.' : e.message || 'Failed to load questions.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMcqSelect = (answer: string) => {
    setUserMcqAnswers((prev) => ({ ...prev, [currentIndex]: answer }));
  };

  const handleWrittenChange = (value: string) => {
    setUserWrittenAnswers((prev) => ({ ...prev, [currentIndex]: value }));
  };

  const goTo = (idx: number) => setCurrentIndex(idx);

  const finishAndEvaluate = async () => {
    // Only written questions are evaluated by backend; MCQs are scored locally
    const writtenItems: { question_text: string; answer_text: string }[] = [];
    const writtenIndexMap: number[] = [];
    questions.forEach((q, i) => {
      if (q.question_type === 'written') {
        writtenItems.push({ question_text: q.question_text, answer_text: userWrittenAnswers[i] || '' });
        writtenIndexMap.push(i);
      }
    });

    setShowResults(true);
    if (!writtenItems.length) {
      setEvaluation({ score: 0, feedback: 'No written answers to evaluate.', analyses: [] });
      return;
    }

    try {
      setEvalLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Please log in to evaluate');

      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/practice/practical/evaluate`;
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branch, topic: topic || null, items: writtenItems }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (resp.status === 401) throw new Error('Session expired. Please log in again.');
        if (resp.status === 403) throw new Error('Access denied. Student access required.');
        if (resp.status === 500) throw new Error('Server error. Please try again later.');
        throw new Error(data.detail || data.error || `API error: ${resp.status} ${resp.statusText}`);
      }

      const data = await resp.json();
      const evalData = data.evaluation || { score: 0, feedback: '', analyses: [] };
      // Map returned indices to global question indices
      const mappedAnalyses: PracticalEvalItem[] = (evalData.analyses || []).map((it: any, idx: number) => ({
        index: writtenIndexMap[idx] ?? idx,
        score: it.score ?? 0,
        feedback: it.feedback ?? '',
      }));
      setEvaluation({ score: evalData.score || 0, feedback: evalData.feedback || '', analyses: mappedAnalyses });
    } catch (e: any) {
      setEvaluation({ score: 0, feedback: e.message || 'Evaluation failed', analyses: [] });
    } finally {
      setEvalLoading(false);
    }
  };

  const calculateMcqScore = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (q.question_type === 'mcq' && q.correct_answer && userMcqAnswers[i] === q.correct_answer) correct++;
    });
    return correct;
  };

  const current = questions[currentIndex];
  const hasQuestions = questions.length > 0;

  if (showResults) {
    const totalMcq = mcqCount;
    const correctMcq = calculateMcqScore();
    const mcqPct = totalMcq ? Math.round((correctMcq / totalMcq) * 100) : 0;

    return (
      <div className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50/30 p-4 sm:p-6 lg:p-8 pb-12">

        {/* Results Card */}
        <div className={`bg-white rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-blue-200 mb-6 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Practical Test Results</h2>
            <p className="text-gray-600 text-lg">Review your MCQ score and written feedback</p>
          </div>

          {/* MCQ Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <p className="text-gray-600 text-sm font-medium mb-2">MCQ Correct</p>
                <p className="text-5xl font-extrabold text-green-600 mb-1">{correctMcq}</p>
                <p className="text-xs text-gray-500">out of {totalMcq}</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <p className="text-gray-600 text-sm font-medium mb-2">MCQ Total</p>
                <p className="text-5xl font-extrabold text-blue-600 mb-1">{totalMcq}</p>
                <p className="text-xs text-gray-500">questions</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <p className="text-gray-600 text-sm font-medium mb-2">MCQ Score</p>
                <p className="text-5xl font-extrabold text-purple-600 mb-1">{mcqPct}%</p>
                <p className="text-xs text-gray-500">percentage</p>
              </div>
            </div>
          </div>

          {/* Written Evaluation */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" />
              Written Answers Evaluation
            </h3>
            {evalLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Evaluating answers…</span>
              </div>
            )}
            {!evalLoading && evaluation && (
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200">
                <div className="mb-4 p-4 bg-white rounded-xl border-2 border-blue-200">
                  <p className="text-gray-700 text-lg">
                    <span className="font-bold text-blue-600">Overall Score:</span>
                    <span className="ml-2 text-2xl font-extrabold text-gray-900">{evaluation.score}/10</span>
                  </p>
                  <p className="text-gray-700 mt-2">
                    <span className="font-semibold">Feedback:</span>
                    <span className="ml-2">{evaluation.feedback || '—'}</span>
                  </p>
                </div>
                <div className="space-y-3">
                  {evaluation.analyses.length === 0 && (
                    <p className="text-gray-600 text-center py-4">No written items were evaluated.</p>
                  )}
                  {evaluation.analyses.map((item) => (
                    <div key={item.index} className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-500">Question #{item.index + 1}</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${item.score >= 8 ? 'bg-green-100 text-green-700' :
                          item.score >= 6 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {item.score}/10
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        <span className="font-semibold">Feedback:</span> {item.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-semibold"
              onClick={() => {
                setShowResults(false);
                setCurrentIndex(0);
              }}
            >
              ← Back to Questions
            </button>
            <button
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
              onClick={() => {
                setQuestions([]);
                setUserMcqAnswers({});
                setUserWrittenAnswers({});
                setEvaluation(null);
                setShowResults(false);
              }}
            >
              Reset Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  const branchDisplayName = branch.toUpperCase();
  const branchColors: Record<string, { bg: string; text: string; border: string }> = {
    'MECHANICAL': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    'CIVIL': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    'ELECTRICAL': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    'ELECTRONICS & TELECOMMUNICATION': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    'AUTOMOBILE': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  };
  const branchColor = branchColors[branchDisplayName] || branchColors['MECHANICAL'];

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50/30 p-4 sm:p-6 lg:p-8 pb-12">

      {/* Header Section */}
      <div className={`mb-8 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'} transition-all duration-700`}>
        <div className={`inline-block px-4 py-1.5 rounded-full ${branchColor.bg} ${branchColor.text} ${branchColor.border} border-2 font-semibold text-sm mb-4 animate-fade-in`}>
          {branchDisplayName}
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
          Practical Skills Practice
        </h1>
        <p className="text-gray-600 text-lg sm:text-xl max-w-3xl">
          Generate situation-based questions to sharpen your {branch.toLowerCase()} engineering knowledge
        </p>
      </div>

      {/* Statistics Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700 delay-100`}>
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <BookOpen className="w-12 h-12 text-blue-600" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-500 rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-blue-600 mb-1">50+</div>
            <div className="text-gray-600 font-medium">Topics Available</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-center mb-3">
            <Sparkles className="w-12 h-12 text-orange-500" />
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-blue-600 mb-1">1000+</div>
            <div className="text-gray-600 font-medium">Questions Generated</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-center mb-3">
            <Target className="w-12 h-12 text-red-500" />
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-blue-600 mb-1">500+</div>
            <div className="text-gray-600 font-medium">Practice Sessions</div>
          </div>
        </div>
      </div>

      {/* Question Generator Card */}
      <div className={`bg-white rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-blue-200 mb-6 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700 delay-200`}>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Question Generator</h2>
        <p className="text-gray-600 mb-6">Customize your practice session by selecting difficulty, topic, and number of questions</p>

        {/* Difficulty Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">Select Difficulty Level</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setDifficulty('easy')}
              className={`flex-1 min-w-[100px] px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${difficulty === 'easy'
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span>EASY</span>
              </div>
            </button>
            <button
              onClick={() => setDifficulty('medium')}
              className={`flex-1 min-w-[100px] px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${difficulty === 'medium'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span>MEDIUM</span>
              </div>
            </button>
            <button
              onClick={() => setDifficulty('hard')}
              className={`flex-1 min-w-[100px] px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${difficulty === 'hard'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span>HARD</span>
              </div>
            </button>
          </div>
        </div>

        {/* Topic Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Topic Selection (optional)</h3>
          </div>
          <div className="relative">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Thermodynamics, Fluid Mechanics, Machine Design"
              className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Award className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Number of Questions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Number of Questions</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold">{limit}</span>
            </div>
          </div>
          <input
            type="number"
            min={1}
            max={20}
            value={limit}
            onChange={(e) => {
              const val = parseInt(e.target.value || '1', 10);
              if (val >= 1 && val <= 20) setLimit(val);
            }}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
          />
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>Min: 1</span>
            <span>Max: 20</span>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={fetchQuestions}
          disabled={loading}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-[1.02] ${loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl'
            }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating Questions...</span>
            </>
          ) : (
            <>
              <Rocket className="w-6 h-6" />
              <span>Generate Questions</span>
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-shake">
            <p className="text-red-600 font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </p>
          </div>
        )}
      </div>

      {/* Questions Display */}
      {hasQuestions && (
        <div className={`bg-white rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-blue-200 mb-6 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700 delay-300`}>
          {/* Question Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">{branch}</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">{topic || `MIXED:${branch}`}</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  {questions.length} Questions (MCQ: {mcqCount}, Written: {writtenCount})
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                ← Previous
              </button>
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                disabled={currentIndex >= questions.length - 1}
              >
                Next →
              </button>
            </div>
          </div>

          {/* Current Question Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-lg">
                Question {currentIndex + 1} of {questions.length}
              </div>
              {current?.difficulty && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${current.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  current.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                  {current.difficulty.toUpperCase()}
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-relaxed">{current?.question_text}</h3>

            {/* MCQ Options */}
            {current?.question_type === 'mcq' && current?.options && (
              <div className="space-y-3 mb-6">
                {current.options.map((opt, idx) => {
                  const letter = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
                  const selected = userMcqAnswers[currentIndex] === letter;
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${selected
                        ? 'bg-blue-100 border-blue-500 shadow-lg shadow-blue-500/20'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                    >
                      <input
                        type="radio"
                        name={`q-${currentIndex}`}
                        checked={selected}
                        onChange={() => handleMcqSelect(letter)}
                        className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-lg text-gray-800 mr-2">{letter}.</span>
                        <span className="text-gray-700 text-base">{opt}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Written Answer */}
            {current?.question_type === 'written' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Answer:</label>
                <textarea
                  placeholder="Write your short explanation or calculation here…"
                  value={userWrittenAnswers[currentIndex] || ''}
                  onChange={(e) => handleWrittenChange(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 min-h-[180px] resize-y"
                />
              </div>
            )}

            {/* Explanation */}
            {current?.explanation && (
              <div className="mt-6 p-4 bg-white rounded-xl border-2 border-green-200">
                <p className="text-sm font-semibold text-green-700 mb-2">💡 Explanation:</p>
                <p className="text-gray-700 leading-relaxed">{current.explanation}</p>
              </div>
            )}

            {/* Question Navigation & Controls */}
            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {Array.from({ length: questions.length }).map((_, i) => {
                    const hasAnswer = userMcqAnswers[i] || userWrittenAnswers[i];
                    return (
                      <button
                        key={i}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-110 ${i === currentIndex
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-110'
                          : hasAnswer
                            ? 'bg-green-100 text-green-700 border-2 border-green-300'
                            : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                          }`}
                        onClick={() => goTo(i)}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-bold hover:from-purple-700 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={finishAndEvaluate}
                >
                  Finish & Evaluate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}