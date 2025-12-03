'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, Code, TrendingUp, Target, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { CodingRound } from '@/components/assessment/CodingRound';
import PracticeCodingEvaluation from './PracticeCodingEvaluation';

interface CodingChallengePracticeProps {
  branch: string;
}

export default function CodingChallengePractice({ branch }: CodingChallengePracticeProps) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [submissionsData, setSubmissionsData] = useState<any>(null);
  const autoFullscreenAttemptedRef = useRef(false);

  // Refs to track CodingRound state
  const codingRoundRef = useRef<any>(null);
  const editorsRef = useRef<Record<string, { language: string; code: string }>>({});
  const resultsRef = useRef<Record<string, any>>({});

  // Request fullscreen function - more aggressive approach
  const requestFullscreen = async () => {
    if (autoFullscreenAttemptedRef.current) return;
    autoFullscreenAttemptedRef.current = true;

    const requestFs = async () => {
      try {
        const elem: any = document.documentElement;
        if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
          if (elem.requestFullscreen) {
            await elem.requestFullscreen();
          } else if (elem.webkitRequestFullscreen) {
            await elem.webkitRequestFullscreen();
          } else if (elem.mozRequestFullScreen) {
            await elem.mozRequestFullScreen();
          } else if (elem.msRequestFullscreen) {
            await elem.msRequestFullscreen();
          }
        }
      } catch (e) {
        console.log('Fullscreen request failed, will retry on interaction:', e);
      }
    };

    // Try immediately (may work if called from user gesture)
    requestFs();

    // Also set up listeners for first interaction
    const once = async () => {
      document.removeEventListener('pointerdown', once);
      document.removeEventListener('keydown', once);
      document.removeEventListener('click', once);
      await requestFs();
    };
    document.addEventListener('pointerdown', once, { once: true });
    document.addEventListener('keydown', once, { once: true });
    document.addEventListener('click', once, { once: true });
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend will generate 1 question based on difficulty
      const data = await apiClient.getPracticeCodingQuestions(branch, difficulty);
      const items: any[] = data.items || [];

      if (!items.length) {
        throw new Error('No coding challenges returned. Try different difficulty level.');
      }

      // Transform questions to match CodingRound expected format
      const transformedQuestions = items.map((item, index) => ({
        id: item.id || `q_${index}`,
        question_text: item.question_text || '',
        metadata: item.metadata || {
          title: `Problem ${index + 1}`,
          difficulty: difficulty,
          category: 'Algorithms',
          constraints: [],
          tests: [],
          starter_code: {
            python: '# Write your solution here\n',
            javascript: '// Write your solution here\n',
            typescript: '// Write your solution here\n',
            java: '// Write your solution here\n',
            cpp: '// Write your solution here\n',
          }
        }
      }));

      setQuestions(transformedQuestions);
      setHasStarted(true);

      // Attempt to enter fullscreen automatically
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          requestFullscreen();
        }, 100);
      });

      toast.success(`Loaded ${items.length} ${difficulty} coding problems!`);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Failed to load coding challenges.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Transform questions data to roundData format expected by CodingRound
  const roundData = useMemo(() => {
    if (!questions.length) return null;

    return {
      round_id: 'practice_coding',
      round_type: 'coding',
      questions: questions,
    };
  }, [questions]);

  // Mock assessmentId for practice (not used in practice mode)
  const practiceAssessmentId = 'practice';

  // Handle practice submission - collect data and navigate to evaluation
  const handlePracticeSubmit = async (responses: any[]) => {
    try {
      // Collect submission data with test results
      const submissions = responses.map((response) => {
        const responseData = JSON.parse(response.response_text || '{}');
        const question = questions.find(q => q.id === response.question_id);
        const testResults = resultsRef.current[response.question_id];

        return {
          question_id: response.question_id,
          question_text: question?.question_text || '',
          code: responseData.code || '',
          language: responseData.language || 'python',
          test_results: testResults || null,
        };
      });

      // Store submissions data and show evaluation
      setSubmissionsData({
        branch,
        difficulty,
        submissions,
        questions,
      });

      // Exit fullscreen before showing evaluation
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();

      setShowEvaluation(true);

      toast.success('Submitting for evaluation...');
      return { success: true, message: 'Practice completed' };
    } catch (e: any) {
      toast.error('Failed to prepare evaluation. Please try again.');
      console.error('Submission error:', e);
      return { success: false, message: 'Submission failed' };
    }
  };

  const handleBackFromEvaluation = () => {
    setShowEvaluation(false);
    setSubmissionsData(null);
    setHasStarted(false);
    setQuestions([]);
    editorsRef.current = {};
    resultsRef.current = {};
  };

  const handlePracticeMore = () => {
    setShowEvaluation(false);
    setSubmissionsData(null);
    setQuestions([]);
    editorsRef.current = {};
    resultsRef.current = {};
    setHasStarted(false);
    // Reset difficulty selector state by re-rendering
  };

  // Use CodingRound with practice execute function
  const executePracticeCode = async (payload: { question_id: string; language: string; code: string; stdin?: string }) => {
    const result = await apiClient.executePracticeCode(payload);
    // Store result for evaluation
    resultsRef.current[payload.question_id] = result;
    return result;
  };

  // Track fullscreen changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handler = () => {
      const fs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(fs);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler as any);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler as any);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const elem: any = document.documentElement;
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
      }
    } catch (e) {
      console.error('Fullscreen toggle failed', e);
    }
  };

  if (!hasStarted) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 rounded-2xl shadow-xl border-2 border-blue-100/50 p-6 sm:p-8 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
              <h2 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Coding Challenge</span>{' '}
                <span className="text-blue-400">Practice</span>
              </h2>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">
              Practice coding problems for <span className="font-semibold text-blue-700">{branch}</span>. Select your difficulty level to begin.
            </p>
          </div>

          {/* Difficulty Selector with Sliding Indicator */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
              Select Difficulty Level
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
                    ? 'linear-gradient(to right, #10b981, #059669)'
                    : difficulty === 'medium'
                      ? 'linear-gradient(to right, #f59e0b, #d97706)'
                      : 'linear-gradient(to right, #ef4444, #dc2626)',
                  boxShadow: difficulty === 'easy'
                    ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                    : difficulty === 'medium'
                      ? '0 4px 12px rgba(245, 158, 11, 0.4)'
                      : '0 4px 12px rgba(239, 68, 68, 0.4)',
                }}
              ></div>
              {(['easy', 'medium', 'hard'] as const).map((level) => {
                const isSelected = difficulty === level;
                const icons = {
                  easy: <TrendingUp className="w-5 h-5" />,
                  medium: <Target className="w-5 h-5" />,
                  hard: <Zap className="w-5 h-5" />,
                };
                const colors = {
                  easy: isSelected ? 'text-white' : 'text-green-600',
                  medium: isSelected ? 'text-white' : 'text-amber-600',
                  hard: isSelected ? 'text-white' : 'text-red-600',
                };
                const descriptions = {
                  easy: 'Beginner-friendly problems',
                  medium: 'Moderate complexity challenges',
                  hard: 'Advanced algorithmic problems',
                };
                return (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`relative z-10 flex-1 py-4 px-4 rounded-lg font-semibold transition-all duration-300 capitalize flex flex-col items-center justify-center gap-2 ${isSelected
                      ? 'scale-105 shadow-md'
                      : 'hover:scale-[1.02]'
                      } ${colors[level]}`}
                  >
                    <div className="flex items-center gap-2">
                      {icons[level]}
                      <span className="text-base sm:text-lg">{level}</span>
                    </div>
                    <span className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                      {descriptions[level]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800 text-sm">Test Cases</span>
              </div>
              <p className="text-xs text-blue-700">Auto-evaluated solutions</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-800 text-sm">Multiple Languages</span>
              </div>
              <p className="text-xs text-purple-700">Python, JS, Java, C++</p>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={fetchQuestions}
            disabled={loading}
            className={`w-full px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform ${loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-[1.02]'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating {difficulty} challenges...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Code className="w-5 h-5" />
                Start {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Coding Practice
              </span>
            )}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-red-800 mb-1">Error Loading Challenges</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show evaluation page if submissions are ready
  if (showEvaluation && submissionsData) {
    return (
      <PracticeCodingEvaluation
        branch={submissionsData.branch}
        difficulty={submissionsData.difficulty}
        submissions={submissionsData.submissions}
        questions={submissionsData.questions}
        onBack={handleBackFromEvaluation}
        onPracticeMore={handlePracticeMore}
      />
    );
  }

  if (!roundData) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg border p-6">
          <p className="text-gray-600">No questions loaded. Please try again.</p>
          <button
            onClick={() => setHasStarted(false)}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100 select-none flex flex-col">
      {/* Header - Matching Assessment Style */}
      <div className="bg-indigo-600 text-white p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto w-full px-6">
          <h1 className="text-xl font-semibold">
            Coding Challenge Practice - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to exit? Your progress will be saved.')) {
                  setHasStarted(false);
                  setQuestions([]);
                  setError(null);
                  if (document.exitFullscreen) document.exitFullscreen();
                  else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
                }
              }}
              className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded text-sm transition-colors"
            >
              Exit Practice
            </button>
            <button
              onClick={toggleFullscreen}
              className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded text-sm transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            </button>
          </div>
        </div>
      </div>

      {/* Full-height Coding Workspace - Matching Assessment Style */}
      <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="h-full w-full px-3">
          <div className="h-full rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm">
            <div className="h-full">
              <CodingRound
                assessmentId={practiceAssessmentId}
                roundData={roundData}
                executeCodeFn={executePracticeCode}
                submitFn={handlePracticeSubmit}
                showSubmitButton={true}
                onSubmitted={(result) => {
                  // Evaluation page will be shown via handlePracticeSubmit
                  // This callback is just for cleanup if needed
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
