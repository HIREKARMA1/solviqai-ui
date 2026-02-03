'use client';

import { useMemo, useState, useEffect } from 'react';
import { BookOpen, Sparkles, Target, Rocket, Trophy, Award, TrendingUp } from 'lucide-react';
import { config } from '@/lib/config';
import PracticalSkillsQuestionsView from './PracticalSkillsQuestionsView';
import SubscriptionRequiredModal from '../subscription/SubscriptionRequiredModal';

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
  isFreeUser?: boolean;
}

export default function PracticalSkillsPractice({ branch: initialBranch, onBack, isFreeUser = false }: PracticalSkillsPracticeProps = {}) {
  const [branch, setBranch] = useState<string>(initialBranch || 'Mechanical');
  const [topic, setTopic] = useState<string>('');
  const [limit, setLimit] = useState<number>(6);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [userMcqAnswers, setUserMcqAnswers] = useState<Record<number, string>>({});
  const [userWrittenAnswers, setUserWrittenAnswers] = useState<Record<number, string>>({});

  const [showQuestionsView, setShowQuestionsView] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<{ score: number; feedback: string; analyses: PracticalEvalItem[] } | null>(null);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [subscriptionFeature, setSubscriptionFeature] = useState('Practical Skills AI');

  const branches = [
    'Mechanical',
    'Civil',
    'Electrical',
    'Electronics & Telecommunication',
    'Automobile',
  ];

  useEffect(() => {
    setIsVisible(true);

    const checkSub = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch(`${config.api.fullUrl}/api/v1/students/subscription-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const statusData = await response.json();
          const isExpired = statusData.days_remaining !== null && statusData.days_remaining < 0;

          if (isExpired) {
            setIsLimitReached(true);
            setShowSubscriptionModal(true);
          }
        }
      } catch (err) {
        console.error("Failed to check subscription", err);
      }
    };
    checkSub();
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

      const apiUrl = `${config.api.fullUrl}/api/v1/practice/practical?${params}`;
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
        const msg = data.detail || data.error || `API error: ${resp.status} ${resp.statusText}`;

        const isSubscriptionError =
          resp.status === 403 ||
          resp.status === 402 ||
          (msg && (
            msg.toLowerCase().includes('contact hirekarma') ||
            msg.toLowerCase().includes('subscription') ||
            msg.toLowerCase().includes('free plan') ||
            msg.toLowerCase().includes('expired')
          ));

        if (isSubscriptionError) {
          setIsLimitReached(true);
          setShowSubscriptionModal(true);
          throw new Error('Subscription limit reached');
        }

        if (resp.status === 401) throw new Error('Session expired. Please log in again.');
        if (resp.status === 500) throw new Error('Server error. Please try again later.');
        throw new Error(msg);
      }

      const data = await resp.json();
      const items: Question[] = data.items || [];
      if (!items.length) throw new Error('No questions returned. Try different parameters.');

      setQuestions(items);
      setUserMcqAnswers({});
      setUserWrittenAnswers({});
      setShowResults(false);
      setShowQuestionsView(true);
      setEvaluation(null);
    } catch (e: any) {
      const msg = e.name === 'AbortError' ? 'Request timed out. Try fewer questions.' : e.message || 'Failed to load questions.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const finishAndEvaluate = async (mcqAnswers?: Record<number, string>, writtenAnswers?: Record<number, string>) => {
    // Use provided answers or fall back to state
    const finalMcqAnswers = mcqAnswers || userMcqAnswers;
    const finalWrittenAnswers = writtenAnswers || userWrittenAnswers;

    // Only written questions are evaluated by backend; MCQs are scored locally
    const writtenItems: { question_text: string; answer_text: string }[] = [];
    const writtenIndexMap: number[] = [];
    questions.forEach((q, i) => {
      if (q.question_type === 'written') {
        writtenItems.push({ question_text: q.question_text, answer_text: finalWrittenAnswers[i] || '' });
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

      const apiUrl = `${config.api.fullUrl}/api/v1/practice/practical/evaluate`;
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
        const msg = data.detail || data.error || `API error: ${resp.status} ${resp.statusText}`;

        if (resp.status === 403 || resp.status === 402) {
          setIsLimitReached(true);
          setShowSubscriptionModal(true);
        }

        if (resp.status === 401) throw new Error('Session expired. Please log in again.');
        if (resp.status === 500) throw new Error('Server error. Please try again later.');
        throw new Error(msg);
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

  const calculateMcqScore = (mcqAnswers?: Record<number, string>) => {
    const answers = mcqAnswers || userMcqAnswers;
    let correct = 0;
    questions.forEach((q, i) => {
      if (q.question_type === 'mcq' && q.correct_answer && answers[i] === q.correct_answer) correct++;
    });
    return correct;
  };

  const hasQuestions = questions.length > 0;

  // Handle finish from questions view
  const handleFinishFromQuestions = (mcqAnswers: Record<number, string>, writtenAnswers: Record<number, string>) => {
    setUserMcqAnswers(mcqAnswers);
    setUserWrittenAnswers(writtenAnswers);
    setShowQuestionsView(false);
    finishAndEvaluate(mcqAnswers, writtenAnswers);
  };

  // Show questions view
  if (showQuestionsView && questions.length > 0) {
    return (
      <PracticalSkillsQuestionsView
        questions={questions}
        branch={branch}
        topic={topic || 'Mixed'}
        onFinish={handleFinishFromQuestions}
      />
    );
  }

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

          {/* All Questions Review */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" />
              Questions Review
            </h3>
            {evalLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Evaluating answers…</span>
              </div>
            )}
            {!evalLoading && (
              <div className="space-y-4">
                {/* Overall Written Evaluation Summary */}
                {evaluation && writtenCount > 0 && (
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200 mb-6">
                    <div className="mb-4 p-4 bg-white rounded-xl border-2 border-blue-200">
                      <p className="text-gray-700 text-lg">
                        <span className="font-bold text-blue-600">Written Answers Overall Score:</span>
                        <span className="ml-2 text-2xl font-extrabold text-gray-900">{evaluation.score}/10</span>
                      </p>
                      <p className="text-gray-700 mt-2">
                        <span className="font-semibold">Feedback:</span>
                        <span className="ml-2">{evaluation.feedback || '—'}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* All Questions with Answers */}
                {questions.map((question, idx) => {
                  const questionNum = idx + 1;
                  const isMcq = question.question_type === 'mcq';
                  const userAnswer = isMcq ? userMcqAnswers[idx] : userWrittenAnswers[idx];
                  const isCorrect = isMcq && question.correct_answer && userAnswer === question.correct_answer;

                  // Find evaluation for written questions
                  const writtenEval = !isMcq && evaluation ? evaluation.analyses.find((item) => item.index === idx) : null;

                  return (
                    <div key={idx} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300">
                      {/* Question Header */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm">
                            Question #{questionNum}
                          </span>
                          <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${isMcq
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                            }`}>
                            {isMcq ? 'MCQ' : 'Written'}
                          </span>
                          {isMcq && (
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${isCorrect
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                              }`}>
                              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                            </span>
                          )}
                          {!isMcq && writtenEval && (
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${writtenEval.score >= 8 ? 'bg-green-100 text-green-700' :
                              writtenEval.score >= 6 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                              Score: {writtenEval.score}/10
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="mb-4">
                        <p className="text-gray-900 font-semibold text-lg mb-2">Question:</p>
                        <p className="text-gray-700 leading-relaxed">{question.question_text}</p>
                      </div>

                      {/* User's Answer */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <p className="text-gray-900 font-semibold mb-2">Your Answer:</p>
                        {isMcq ? (
                          <div className="space-y-2">
                            {question.options?.map((opt, optIdx) => {
                              const letter = ['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1);
                              const isSelected = userAnswer === letter;
                              const isCorrectOption = letter === question.correct_answer;
                              return (
                                <div
                                  key={optIdx}
                                  className={`p-3 rounded-lg border-2 ${isSelected && isCorrectOption
                                    ? 'bg-green-50 border-green-400'
                                    : isSelected
                                      ? 'bg-red-50 border-red-400'
                                      : isCorrectOption
                                        ? 'bg-blue-50 border-blue-300'
                                        : 'bg-white border-gray-200'
                                    }`}
                                >
                                  <span className="font-bold mr-2">{letter}.</span>
                                  <span className={isSelected || isCorrectOption ? 'font-medium' : ''}>{opt}</span>
                                  {isCorrectOption && (
                                    <span className="ml-2 text-green-600 font-semibold">✓ Correct Answer</span>
                                  )}
                                </div>
                              );
                            })}
                            {!userAnswer && (
                              <p className="text-gray-500 italic">No answer provided</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            {userAnswer ? (
                              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{userAnswer}</p>
                            ) : (
                              <p className="text-gray-500 italic">No answer provided</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Feedback for Written Questions */}
                      {!isMcq && writtenEval && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                          <p className="text-gray-900 font-semibold mb-2">Feedback:</p>
                          <p className="text-gray-700 leading-relaxed">{writtenEval.feedback}</p>
                        </div>
                      )}

                      {/* Correct Answer / Explanation / Suggestions */}
                      <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <p className="text-green-700 font-semibold mb-2">💡 Correct Answer & Explanation:</p>
                        {isMcq ? (
                          <div>
                            {question.correct_answer && (
                              <p className="text-gray-700 mb-2">
                                <span className="font-semibold">Correct Answer: </span>
                                <span>{question.correct_answer}</span>
                                {question.options && (
                                  <span className="ml-2">
                                    - {question.options[['A', 'B', 'C', 'D'].indexOf(question.correct_answer)]}
                                  </span>
                                )}
                              </p>
                            )}
                            {question.explanation && (
                              <p className="text-gray-700 leading-relaxed">
                                <span className="font-semibold">Explanation: </span>
                                {question.explanation}
                              </p>
                            )}
                            {!question.explanation && (
                              <p className="text-gray-600 italic">No explanation available for this question.</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            {writtenEval && writtenEval.feedback ? (
                              <div>
                                <p className="text-gray-700 leading-relaxed mb-2">
                                  <span className="font-semibold">Suggestions: </span>
                                  {writtenEval.feedback}
                                </p>
                                {question.explanation && (
                                  <p className="text-gray-700 leading-relaxed mt-2">
                                    <span className="font-semibold">Explanation: </span>
                                    {question.explanation}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div>
                                {question.explanation ? (
                                  <p className="text-gray-700 leading-relaxed">
                                    <span className="font-semibold">Explanation: </span>
                                    {question.explanation}
                                  </p>
                                ) : (
                                  <p className="text-gray-600 italic">No explanation or suggestions available for this question.</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
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
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Number of Questions</h3>
          </div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{isFreeUser ? 'Max 2' : '3 questions'}</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                {isFreeUser ? Math.min(limit, 2) : limit}
              </span>
              <span className="text-xs text-gray-500 font-medium">{isFreeUser ? 'Free Limit' : '20 questions'}</span>
            </div>
            <input
              type="range"
              min="3"
              max="20"
              value={isFreeUser ? 2 : limit}
              disabled={isFreeUser}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                background: isFreeUser
                  ? '#e5e7eb'
                  : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((limit - 3) / 17) * 100}%, #e5e7eb ${((limit - 3) / 17) * 100}%, #e5e7eb 100%)`,
              }}
            />
            {isFreeUser && (
              <p className="mt-1 text-xs text-indigo-600 font-semibold animate-pulse">
                Free plan is limited to 2 questions per session.
              </p>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={fetchQuestions}
          disabled={loading || isLimitReached}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-[1.02] ${loading || isLimitReached
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl'
            }`}
        >
          {isLimitReached ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-4V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2v-4z" />
              </svg>
              <span>Subscription Required</span>
            </>
          ) : loading ? (
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

        {/* Subscription Required Modal */}
        <SubscriptionRequiredModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          feature={subscriptionFeature}
        />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-shake">
            <p className="text-red-600 font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </p>
          </div>
        )}
      </div>

    </div>
  );
}