'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { ChevronsLeft, ChevronsRight, User } from 'lucide-react';
import { Loader } from '@/components/ui/loader';

export type McqExamQuestion = {
  id: string;
  question_text: string;
  options: string[];
};

type Props = {
  title: string;
  subtitle?: string;
  questions: McqExamQuestion[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, optionText: string) => void;
  timeLeftSeconds: number | null;
  submitting: boolean;
  onSubmit: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  submitLabel?: string;
};

function splitTime(seconds: number | null) {
  if (seconds === null) {
    return { hours: '--', minutes: '--', seconds: '--' };
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: secs.toString().padStart(2, '0'),
  };
}

export function McqExamView({
  title,
  subtitle,
  questions,
  answers,
  onAnswerChange,
  timeLeftSeconds,
  submitting,
  onSubmit,
  isFullscreen,
  onToggleFullscreen,
  submitLabel = 'Submit Test',
}: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const currentQ = questions[currentQuestion];

  const counts = useMemo(() => {
    let answered = 0;
    let marked = 0;
    let notAnswered = 0;
    let notVisited = 0;
    questions.forEach((q, index) => {
      const hasAnswer = Boolean(answers[q.id]);
      const isMarked = markedQuestions.has(index);
      const isVisited = visitedQuestions.has(index);
      if (hasAnswer && !isMarked) answered += 1;
      else if (isMarked) marked += 1;
      else if (isVisited) notAnswered += 1;
      else notVisited += 1;
    });
    return { answered, marked, notAnswered, notVisited };
  }, [answers, markedQuestions, questions, visitedQuestions]);

  function getQuestionStatus(index: number) {
    const q = questions[index];
    if (!q) return 'notVisited';
    const isAnswered = Boolean(answers[q.id]);
    const isMarked = markedQuestions.has(index);
    const isVisited = visitedQuestions.has(index);
    if (isAnswered && !isMarked) return 'answered';
    if (isMarked) return 'marked';
    if (isVisited) return 'notAnswered';
    return 'notVisited';
  }

  const navigateToQuestion = (index: number) => {
    setCurrentQuestion(index);
    setVisitedQuestions((prev) => new Set([...Array.from(prev), index]));
  };

  const handleNextQuestion = () => {
    setMarkedQuestions((prev) => {
      if (!prev.has(currentQuestion)) return prev;
      const next = new Set(prev);
      next.delete(currentQuestion);
      return next;
    });
    if (currentQuestion < questions.length - 1) {
      const next = currentQuestion + 1;
      setCurrentQuestion(next);
      setVisitedQuestions((prev) => new Set([...Array.from(prev), next]));
    }
  };

  const handleMarkForReview = () => {
    setMarkedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion)) next.delete(currentQuestion);
      else next.add(currentQuestion);
      return next;
    });
    handleNextQuestion();
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    onAnswerChange(currentQ.id, '');
  };

  const handleSubmitWithConfirmation = () => {
    const unanswered = counts.notVisited + counts.notAnswered + counts.marked;
    if (unanswered > 0) {
      const ok = window.confirm(
        `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}.\n\nUnanswered questions will be scored as 0.\n\nSubmit anyway?`,
      );
      if (!ok) return;
    }
    onSubmit();
  };

  if (!currentQ) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-100 font-sans select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="relative z-20 flex h-16 shrink-0 items-center justify-between bg-[#2563EB] px-6 text-white shadow-md">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">{title}</h1>
          {subtitle && <p className="truncate text-sm text-blue-100">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="shrink-0 rounded-md bg-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/30"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="relative z-40 flex min-h-0 flex-1 flex-col bg-white transition-all duration-300">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`absolute top-1/2 z-50 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white shadow-md transition-transform duration-300 hover:bg-gray-50 ${isSidebarOpen ? 'right-0 translate-x-1/2' : '-translate-x-2'}`}
            title={isSidebarOpen ? 'Collapse palette' : 'Expand palette'}
          >
            {isSidebarOpen ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
            <div className="mb-4 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">
                Question {currentQuestion + 1} of {questions.length}
              </h2>
              <div className="mt-2 h-px w-full bg-gray-200" />
            </div>

            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-gray-300 bg-white shadow-sm">
              <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                <div className="flex-1 overflow-y-auto border-b border-gray-300 bg-white p-6 md:border-b-0 md:border-r">
                  <p className="select-none text-lg font-medium leading-relaxed text-gray-800">
                    {currentQ.question_text}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
                  <div className="space-y-4">
                    {(currentQ.options || []).map((optionText, index) => {
                      const optionLetter = String.fromCharCode(65 + index);
                      const isSelected = answers[currentQ.id] === optionText;
                      return (
                        <label
                          key={`${currentQ.id}-${index}`}
                          className={`flex cursor-pointer items-start space-x-3 rounded-lg border p-4 transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <div className="relative mt-0.5 flex shrink-0 items-center justify-center">
                            <input
                              type="radio"
                              name={`question-${currentQ.id}`}
                              checked={isSelected}
                              onChange={() => onAnswerChange(currentQ.id, optionText)}
                              className="peer h-5 w-5 appearance-none rounded-full border-2 border-gray-400 bg-white transition-all checked:border-[6px] checked:border-blue-600"
                            />
                          </div>
                          <div className="flex-1">
                            <span className="mr-2 font-bold text-gray-700">{optionLetter})</span>
                            <span className="text-base text-gray-800">{optionText}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="z-20 flex h-16 shrink-0 items-center justify-between border-t border-gray-300 bg-white px-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleMarkForReview}
                    className="rounded bg-[#DC2626] px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                  >
                    Mark for review & Next
                  </button>
                  <button
                    type="button"
                    onClick={handleClearResponse}
                    className="rounded border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    Clear Response
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="rounded bg-[#16A34A] px-8 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
                >
                  Save & Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`${isSidebarOpen ? 'w-80 border-l' : 'w-0 border-l-0'} flex h-full shrink-0 flex-col overflow-hidden border-gray-200 bg-[#E6F3FF] font-sans transition-all duration-300`}
        >
          <div className="relative m-2 rounded-lg border border-dashed border-blue-300 p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-end justify-center overflow-hidden rounded-xl bg-black shadow-sm">
                <User className="mb-[-4px] h-16 w-16 fill-current text-gray-400" />
              </div>
              <div className="flex-1 text-center">
                <div className="mb-1 text-lg font-bold text-gray-900">Time Left</div>
                <div className="flex items-start justify-center gap-2">
                  {(() => {
                    const t = splitTime(timeLeftSeconds);
                    return (
                      <>
                        <div className="flex flex-col items-center">
                          <div className="text-2xl font-bold leading-none text-black">{t.hours}</div>
                          <div className="mt-1 text-xs font-medium text-black">Hr</div>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="text-2xl font-bold leading-none text-black">{t.minutes}</div>
                          <div className="mt-1 text-xs font-medium text-black">Min</div>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="text-2xl font-bold leading-none text-black">{t.seconds}</div>
                          <div className="mt-1 text-xs font-medium text-black">Sec</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="mx-4 mb-4 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-md bg-[#16A34A]" />
              <span>Answered ({counts.answered})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-[#9333EA]" />
              <span>Marked ({counts.marked})</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 bg-[#DC2626]"
                style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)' }}
              />
              <span>Not Answered ({counts.notAnswered})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-md bg-gray-200" />
              <span>Not Visited ({counts.notVisited})</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            <h3 className="mb-4 text-base font-bold text-black">Question Palette:</h3>
            <div className="grid grid-cols-5 gap-3 pb-4">
              {questions.map((_, index) => {
                const status = getQuestionStatus(index);
                const isCurrent = index === currentQuestion;
                let baseClasses =
                  'flex h-9 w-9 items-center justify-center text-sm font-bold shadow-sm transition-all';
                let style: CSSProperties = {};
                let content = (
                  <span className={status === 'notAnswered' ? '-mt-1' : ''}>{index + 1}</span>
                );

                if (status === 'answered') baseClasses += ' rounded-md bg-[#16A34A] text-white';
                else if (status === 'notAnswered') {
                  baseClasses += ' bg-[#DC2626] text-white';
                  style = { clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)' };
                } else if (status === 'marked') baseClasses += ' rounded-full bg-[#9333EA] text-white';
                else baseClasses += ' rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300';

                if (isCurrent) baseClasses += ' z-10 scale-105 ring-2 ring-blue-600 ring-offset-1';

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => navigateToQuestion(index)}
                    className={baseClasses}
                    style={style}
                    title={`Q${index + 1}`}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#E6F3FF] p-6">
            <button
              type="button"
              onClick={handleSubmitWithConfirmation}
              disabled={submitting}
              className="w-full rounded bg-[#2563EB] py-3 text-base font-bold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader size="sm" color="white" />
                  Submitting…
                </span>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
