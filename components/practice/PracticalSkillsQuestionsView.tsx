'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, XCircle, Bookmark } from 'lucide-react';

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

interface PracticalSkillsQuestionsViewProps {
  questions: Question[];
  branch: string;
  topic: string;
  onFinish: (userMcqAnswers: Record<number, string>, userWrittenAnswers: Record<number, string>) => void;
}

export default function PracticalSkillsQuestionsView({
  questions,
  branch,
  topic,
  onFinish,
}: PracticalSkillsQuestionsViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userMcqAnswers, setUserMcqAnswers] = useState<Record<number, string>>({});
  const [userWrittenAnswers, setUserWrittenAnswers] = useState<Record<number, string>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 30, seconds: 0 });

  const current = questions[currentIndex];
  const totalQuestions = questions.length;

  // Calculate question status
  const questionStatus = useMemo(() => {
    const status: Record<number, 'answered' | 'not_answered' | 'marked' | 'not_visited'> = {};
    questions.forEach((_, idx) => {
      const hasAnswer = userMcqAnswers[idx] || userWrittenAnswers[idx];
      if (markedQuestions.has(idx)) {
        status[idx] = 'marked';
      } else if (hasAnswer) {
        status[idx] = 'answered';
      } else {
        status[idx] = 'not_answered';
      }
    });
    return status;
  }, [questions, userMcqAnswers, userWrittenAnswers, markedQuestions]);

  const stats = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let notVisited = 0;

    questions.forEach((_, idx) => {
      const status = questionStatus[idx];
      if (status === 'answered') answered++;
      else if (status === 'not_answered') notAnswered++;
      else if (status === 'marked') marked++;
      else notVisited++;
    });

    return { answered, notAnswered, marked, notVisited };
  }, [questions, questionStatus]);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          clearInterval(interval);
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleMcqSelect = (answer: string) => {
    setUserMcqAnswers((prev) => ({ ...prev, [currentIndex]: answer }));
  };

  const handleWrittenChange = (value: string) => {
    setUserWrittenAnswers((prev) => ({ ...prev, [currentIndex]: value }));
  };

  const toggleMark = () => {
    setMarkedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) {
        newSet.delete(currentIndex);
      } else {
        newSet.add(currentIndex);
      }
      return newSet;
    });
  };

  const goToQuestion = (idx: number) => {
    setCurrentIndex(idx);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleClearResponse = () => {
    if (current?.question_type === 'mcq') {
      setUserMcqAnswers((prev) => {
        const newAnswers = { ...prev };
        delete newAnswers[currentIndex];
        return newAnswers;
      });
    } else {
      setUserWrittenAnswers((prev) => {
        const newAnswers = { ...prev };
        delete newAnswers[currentIndex];
        return newAnswers;
      });
    }
  };

  const handleSaveAndNext = () => {
    if (currentIndex === totalQuestions - 1) {
      // On last question, submit and evaluate
      handleFinish();
    } else {
      handleNext();
    }
  };

  const handleMarkAndNext = () => {
    toggleMark();
    handleNext();
  };

  const handleFinish = () => {
    onFinish(userMcqAnswers, userWrittenAnswers);
  };

  const getQuestionStatusColor = (idx: number) => {
    const status = questionStatus[idx];
    if (idx === currentIndex) return 'bg-red-500 text-white border-2 border-red-600';
    if (status === 'answered') return 'bg-green-500 text-white';
    if (status === 'marked') return 'bg-purple-500 text-white';
    if (status === 'not_answered') return 'bg-red-200 text-red-700';
    return 'bg-gray-200 text-gray-600';
  };

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b-2 border-black bg-white px-8 py-4">
        <h1 className="text-xl font-semibold text-gray-800">{branch} Practical Question</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Question Number */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-700">Question {currentIndex + 1} of {totalQuestions}</h2>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-none border border-gray-200 p-6 mb-6">
              <div className="mb-4">
                <p className="text-lg text-gray-700 leading-relaxed">{current?.question_text}</p>
              </div>

              {/* MCQ Options */}
              {current?.question_type === 'mcq' && current?.options && (
                <div className="space-y-2 mt-6">
                  {current.options.map((opt, idx) => {
                    const letter = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
                    const isSelected = userMcqAnswers[currentIndex] === letter;
                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${isSelected
                          ? 'bg-blue-50 border-blue-400'
                          : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentIndex}`}
                          checked={isSelected}
                          onChange={() => handleMcqSelect(letter)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="font-medium text-gray-700">{letter}.</span>
                        <span className="text-gray-700 flex-1">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Written Answer */}
              {current?.question_type === 'written' && (
                <div className="mt-6">
                  <p className="text-gray-700 font-medium mb-2 text-sm">Your Answer:</p>
                  <textarea
                    placeholder="Type your response here..."
                    value={userWrittenAnswers[currentIndex] || ''}
                    onChange={(e) => handleWrittenChange(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[180px] resize-y"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    {getWordCount(userWrittenAnswers[currentIndex] || '')} words
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            {/* Time Left */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Time Left</span>
              </div>
              <div className="text-lg font-semibold text-gray-800">
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </div>
            </div>

            {/* Question Status Summary */}
            <div className="mb-6 space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">{stats.answered} Answered</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-gray-700">{stats.notAnswered} Not Answered</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bookmark className="w-4 h-4 text-purple-500" />
                <span className="text-gray-700">{stats.marked} Marked</span>
              </div>
            </div>

            {/* Question Palette */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToQuestion(idx)}
                    className={`w-9 h-9 rounded-none text-sm font-medium transition-all ${getQuestionStatusColor(idx)}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-black bg-white px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex gap-3">
            <button
              onClick={handleMarkAndNext}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-none text-sm font-medium transition-colors"
            >
              Mark & Next
            </button>
            <button
              onClick={handleClearResponse}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-none text-sm font-medium transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-none text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleSaveAndNext}
              className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-none text-sm font-medium transition-colors ml-4"
            >
              {currentIndex === totalQuestions - 1 ? 'Submit and Evaluate' : 'Save & Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

