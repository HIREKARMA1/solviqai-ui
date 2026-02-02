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
      // Backend will generate 1 NEW question based on difficulty
      // Add cache-busting timestamp to ensure fresh question generation
      const timestamp = Date.now();
      const data = await apiClient.getPracticeCodingQuestions(branch, difficulty, timestamp);
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

      // Exit fullscreen before showing evaluation (only if active)
      const docAny = document as any;
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (docAny.webkitFullscreenElement && docAny.webkitExitFullscreen) {
          await docAny.webkitExitFullscreen();
        }
      } catch (fullscreenError) {
        console.warn('Failed to exit fullscreen (likely already closed):', fullscreenError);
      }

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
      <div className="w-full bg-white min-h-screen pb-12">
        {/* Blue Header Banner */}
        <div className="w-full bg-[#1E88E5] text-white p-6 shadow-md mb-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold">Computer Science</h1>
            <p className="text-blue-100 text-sm opacity-90">Generate situation-based questions to sharpen your mechanical engineering knowledge</p>
          </div>
        </div>

        <div className="max-w-[700px] mx-auto p-4">
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 space-y-8">

            {/* Title Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                <h2 className="text-xl font-bold text-blue-600">Coding Challenge Practice</h2>
              </div>
              <p className="text-sm text-gray-600">Practice coding problems for Computer Science. Select your difficulty level to begin.</p>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Select Difficulty Level</h3>
              </div>

              <div className="flex gap-4">
                {/* Easy Button */}
                <button
                  onClick={() => setDifficulty('easy')}
                  className={`flex-1 p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 ${difficulty === 'easy'
                    ? 'bg-green-500 text-white border-green-600 shadow-md'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                    }`}
                >
                  <TrendingUp className={`w-5 h-5 ${difficulty === 'easy' ? 'text-white' : 'text-green-500'}`} />
                  <span className={`font-bold ${difficulty === 'easy' ? 'text-white' : 'text-green-600'}`}>Easy</span>
                  <span className={`text-[10px] ${difficulty === 'easy' ? 'text-green-100' : 'text-gray-400'}`}>Beginner-Friendly Problems</span>
                </button>

                {/* Medium Button - Default Selected Style matches Image */}
                <button
                  onClick={() => setDifficulty('medium')}
                  className={`flex-1 p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 ${difficulty === 'medium'
                    ? 'bg-gradient-to-r from-orange-400 to-amber-600 text-white border-orange-500 shadow-md transform scale-105'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                    }`}
                >
                  <Target className={`w-5 h-5 ${difficulty === 'medium' ? 'text-white' : 'text-orange-500'}`} />
                  <span className={`font-bold ${difficulty === 'medium' ? 'text-white' : 'text-white'}`}>MEDIUM</span>
                  <span className={`text-[10px] ${difficulty === 'medium' ? 'text-orange-100' : 'text-gray-400'}`}>Moderate Complexity Challenges</span>
                </button>

                {/* Hard Button */}
                <button
                  onClick={() => setDifficulty('hard')}
                  className={`flex-1 p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 ${difficulty === 'hard'
                    ? 'bg-red-500 text-white border-red-600 shadow-md'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'
                    }`}
                >
                  <Zap className={`w-5 h-5 ${difficulty === 'hard' ? 'text-white' : 'text-red-500'}`} />
                  <span className={`font-bold ${difficulty === 'hard' ? 'text-white' : 'text-red-500'}`}>Hard</span>
                  <span className={`text-[10px] ${difficulty === 'hard' ? 'text-red-100' : 'text-gray-400'}`}>Advanced Algorithmic Problems</span>
                </button>
              </div>
            </div>

            {/* Info Rows */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#E3F2FD] border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-blue-800 text-base">Test Cases</span>
                </div>
                <p className="text-sm text-blue-600">Auto-evaluated solutions</p>
              </div>
              <div className="bg-[#F3E5F5] border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="font-bold text-purple-800 text-base">Multiple Languages</span>
                </div>
                <p className="text-sm text-purple-600">Python, JS, Java, C++</p>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={fetchQuestions}
              disabled={loading}
              className={`w-full py-4 rounded-lg font-bold text-white transition-all shadow-sm ${loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-[#007AFF] hover:bg-blue-600'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Code className="w-5 h-5" />
                  Start {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Coding Practice
                </span>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-center rounded-lg border border-red-200 text-sm">
                {error}
              </div>
            )}
          </div>
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
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header - Full Width, matching screenshot */}
      <div className="bg-[#5145CD] text-white p-3 shadow-md shrink-0">
        <div className="flex justify-between items-center w-full px-4">
          <h1 className="text-lg font-bold">
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
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors border border-white/10"
            >
              Exit Practice
            </button>
            <button
              onClick={toggleFullscreen}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors border border-white/10"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            </button>
          </div>
        </div>
      </div>

      {/* Full-height Coding Workspace */}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full w-full">
          <div className="h-full bg-white">
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
  );
}
