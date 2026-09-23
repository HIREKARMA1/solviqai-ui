"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AgentWorkspace } from "@/components/assessment-agent/AgentVisual";
import type { PreferenceQuestion } from "@/types/assessmentAgent";

const DRAFT_MAX_HEIGHT = 128;

interface PreferenceQuestionsStepProps {
  questions: PreferenceQuestion[];
  initialAnswers: Record<string, string>;
  submitting: boolean;
  studentName?: string;
  onBack: () => void;
  onComplete: (answers: Record<string, string | number | string[]>) => void;
}

function selectedList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function firstName(name?: string): string {
  if (!name?.trim()) return "";
  return name.trim().split(/\s+/)[0];
}

function resizeDraft(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, DRAFT_MAX_HEIGHT)}px`;
}

export function PreferenceQuestionsStep({
  questions,
  initialAnswers,
  submitting,
  studentName,
  onBack,
  onComplete,
}: PreferenceQuestionsStepProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [draft, setDraft] = useState("");
  const [otherOpen, setOtherOpen] = useState(false);
  const [pinToBottom, setPinToBottom] = useState(true);
  const messagesRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);

  const question = questions[index];
  const total = questions.length;
  const value = question ? answers[question.question_id] ?? "" : "";
  const greeting = firstName(studentName);
  const visible = questions.slice(0, index + 1);

  const canContinue = useMemo(() => {
    if (!question) return false;
    if (question.required === false) return true;
    return value.trim().length > 0 && value.trim().toLowerCase() !== "other";
  }, [question, value]);

  useEffect(() => {
    const node = messagesRef.current;
    if (!node || !pinToBottom) return;
    node.scrollTop = node.scrollHeight;
  }, [visible.length, index, answers, submitting, pinToBottom]);

  useEffect(() => {
    resizeDraft(draftRef.current);
  }, [draft]);

  if (!question) return null;

  const setValue = (next: string) => {
    setAnswers((prev) => ({ ...prev, [question.question_id]: next }));
  };

  const buildPayload = () => {
    const payload: Record<string, string | number | string[]> = {};
    for (const item of questions) {
      const raw = (answers[item.question_id] ?? "").trim();
      if (!raw) continue;
      if (item.question_id === "experience_years") {
        const numeric = Number(raw);
        payload[item.question_id] = Number.isFinite(numeric) ? numeric : raw;
      } else if (
        item.type === "multi_choice" ||
        item.question_id === "target_roles" ||
        item.question_id === "preferred_locations"
      ) {
        payload[item.question_id] = selectedList(raw);
      } else {
        payload[item.question_id] = raw;
      }
    }
    return payload;
  };

  const handleNext = () => {
    if (!canContinue || submitting) return;
    setPinToBottom(true);
    if (index < total - 1) {
      setIndex((current) => current + 1);
      setDraft("");
      setOtherOpen(false);
      return;
    }
    onComplete(buildPayload());
  };

  const submitDraft = () => {
    const text = draft.trim();
    if (!text || submitting) return;
    setPinToBottom(true);
    if (question.options && question.type !== "multi_choice") {
      const match = question.options.find(
        (option) => option.label.toLowerCase() === text.toLowerCase() || option.value.toLowerCase() === text.toLowerCase(),
      );
      setValue(match ? match.value : text);
    } else if (question.type === "multi_choice") {
      const current = selectedList(value);
      if (!current.includes(text)) setValue([...current, text].join(", "));
    } else {
      setValue(text);
    }
    setDraft("");
    setOtherOpen(false);
    window.setTimeout(() => {
      if (index < total - 1) {
        setIndex((current) => current + 1);
      } else {
        const nextAnswers = {
          ...answers,
          [question.question_id]:
            question.options && question.type !== "multi_choice"
              ? question.options.find(
                  (option) =>
                    option.label.toLowerCase() === text.toLowerCase() ||
                    option.value.toLowerCase() === text.toLowerCase(),
                )?.value ?? text
              : text,
        };
        const payload: Record<string, string | number | string[]> = {};
        for (const item of questions) {
          const raw = (nextAnswers[item.question_id] ?? "").trim();
          if (!raw) continue;
          if (item.type === "multi_choice" || item.question_id === "target_roles" || item.question_id === "preferred_locations") {
            payload[item.question_id] = selectedList(raw);
          } else if (item.question_id === "experience_years") {
            const numeric = Number(raw);
            payload[item.question_id] = Number.isFinite(numeric) ? numeric : raw;
          } else {
            payload[item.question_id] = raw;
          }
        }
        onComplete(payload);
      }
    }, 0);
  };

  return (
    <AgentWorkspace
      width="default"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden pb-0 pt-0"
    >
      <div
        ref={messagesRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
        onScroll={() => {
          const node = messagesRef.current;
          if (!node) return;
          const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
          setPinToBottom(distance < 72);
        }}
      >
        <div className="space-y-6 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              SOLVIQ AI
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
              Hi{greeting ? ` ${greeting}` : ""}! I’ve analyzed your resume.
              Now I’ll ask you a few questions to find the best jobs and create a
              personalized assessment plan.
            </p>
            <p className="mt-3 text-[15px] font-medium text-slate-800 dark:text-white">
              Let’s get started!
            </p>
          </div>

          {visible.map((item, itemIndex) => {
            const current = itemIndex === index;
            const answer = answers[item.question_id] ?? "";
            return (
              <div key={item.question_id} className="space-y-3">
                <p className="text-[15px] font-medium text-slate-800 dark:text-white">
                  {item.prompt}
                </p>
                {item.helper_text && current && (
                  <p className="-mt-1 text-xs text-slate-400">{item.helper_text}</p>
                )}

                {item.options && (
                  <div className="flex flex-wrap gap-2">
                    {item.options.map((option) => {
                      const multi = item.type === "multi_choice";
                      const selected = multi
                        ? selectedList(answer).includes(option.value)
                        : answer === option.value || (option.value === "Other" && otherOpen && current);
                      const disabled = !current || submitting;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={disabled && !selected}
                          onClick={() => {
                            if (!current) return;
                            if (!multi) {
                              if (option.value === "Other") {
                                setOtherOpen(true);
                                setValue("");
                                return;
                              }
                              setValue(option.value);
                              setOtherOpen(false);
                              if (itemIndex === index && index < total - 1) {
                                window.setTimeout(() => {
                                  setPinToBottom(true);
                                  setIndex((current) => current + 1);
                                  setDraft("");
                                }, 180);
                              }
                              return;
                            }
                            const currentValues = selectedList(answer);
                            const next = selected
                              ? currentValues.filter((entry) => entry !== option.value)
                              : [...currentValues, option.value];
                            setValue(next.join(", "));
                          }}
                          className={cn(
                            "inline-flex max-w-full items-center gap-1.5 rounded-xl border px-3.5 py-2 text-left text-sm transition",
                            selected
                              ? "border-violet-500 bg-violet-50 font-medium text-violet-800 dark:bg-violet-950/40 dark:text-violet-100"
                              : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                            disabled && !selected && "opacity-70",
                          )}
                        >
                          {option.label}
                          {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {current &&
                  (item.type === "text" ||
                    item.type === "select" ||
                    item.type === "number" ||
                    otherOpen) &&
                  (!item.options || otherOpen) && (
                    <Input
                      type={item.type === "number" ? "number" : "text"}
                      value={answer === "Other" ? "" : answer}
                      placeholder={item.placeholder || "Type your answer"}
                      className="max-w-full rounded-xl sm:max-w-md"
                      onChange={(event) => setValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleNext();
                        }
                      }}
                    />
                  )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200/70 bg-[#FAFAFC] pt-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex min-w-0 items-end gap-2">
          <button
            type="button"
            className="mb-2 hidden shrink-0 text-xs text-slate-400 sm:inline"
            onClick={() => {
              if (index > 0) {
                setIndex((current) => current - 1);
                return;
              }
              onBack();
            }}
          >
            Back
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-end">
            <textarea
              ref={draftRef}
              rows={1}
              value={draft}
              placeholder="Message SOLVIQ AI..."
              className="max-h-32 min-h-10 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
              onChange={(event) => {
                setDraft(event.target.value);
                resizeDraft(event.target);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (draft.trim()) submitDraft();
                  else handleNext();
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              className="ml-auto h-9 w-9 shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700 sm:ml-0"
              disabled={submitting || (!draft.trim() && !canContinue)}
              loading={submitting}
              onClick={() => {
                if (draft.trim()) submitDraft();
                else handleNext();
              }}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AgentWorkspace>
  );
}
