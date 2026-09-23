"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AgentErrorState } from "@/components/assessment-agent/AgentStates";
import { AiAnalysisScreen } from "@/components/assessment-agent/AiAnalysisScreen";
import { AgentWorkspace } from "@/components/assessment-agent/AgentVisual";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

interface ResumeUploadStepProps {
  hasExistingResume: boolean;
  uploading: boolean;
  progress: number;
  analyzing: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onContinueExisting: () => void;
  onRetry: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResumeUploadStep({
  hasExistingResume,
  uploading,
  progress,
  analyzing,
  error,
  onUpload,
  onContinueExisting,
  onRetry,
}: ResumeUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const next = files?.[0];
      if (!next) return;
      const okType =
        ACCEPTED_TYPES.includes(next.type) ||
        /\.(pdf|doc|docx)$/i.test(next.name);
      if (!okType) return;
      setFile(next);
      onUpload(next);
    },
    [onUpload],
  );

  if (analyzing) {
    return <AiAnalysisScreen />;
  }

  const busy = uploading;

  return (
    <AgentWorkspace
      width="narrow"
      className="flex h-full min-h-0 w-full min-w-0 flex-col justify-center overflow-hidden px-2 py-2 sm:px-2 sm:py-4 lg:py-6"
    >
      <div className="shrink-0 text-center">
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-500 sm:h-10 sm:w-10">
          <Sparkles className="h-4 w-4" />
        </div>
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:mt-4 sm:text-[22px]">
          Let’s find the right jobs for you
        </h2>
        <p className="mx-auto mt-2 max-w-md px-1 text-sm leading-relaxed text-slate-500">
          Upload your resume and I’ll analyze it to find the best matching jobs
          and create a personalized assessment plan.
        </p>
      </div>

      <div
        className={cn(
          "mt-4 shrink-0 rounded-[18px] border border-slate-200/90 bg-white px-4 py-6 text-center shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition dark:border-slate-800 dark:bg-slate-900 sm:mt-6 sm:px-6 sm:py-8 lg:mt-8 lg:py-10",
          dragActive && "border-violet-300 bg-violet-50/40",
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (!busy) handleFiles(event.dataTransfer.files);
        }}
      >
        <Upload className="mx-auto h-7 w-7 text-slate-400" />
        <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-100">
          Drag & drop your resume here
        </p>
        <p className="mt-2 text-xs text-slate-400">or</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf"
          className="hidden"
          disabled={busy}
          onChange={(event) => handleFiles(event.target.files)}
        />
        <Button
          type="button"
          className="mt-4 w-full rounded-xl bg-violet-600 px-5 hover:bg-violet-700 sm:w-auto"
          disabled={busy}
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          Upload Resume
        </Button>
        <p className="mt-4 text-xs text-slate-400">
          Supports PDF, DOC, DOCX (Max 10MB)
        </p>
      </div>

      {file && (
        <div className="mt-3 flex min-w-0 shrink-0 items-start gap-3 rounded-[14px] border border-slate-100 bg-white px-3 py-3 text-left dark:border-slate-800 dark:bg-slate-900 sm:mt-4 sm:px-4">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
              {file.name}
            </p>
            <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
            {busy && (
              <div className="mt-2">
                <Progress value={progress} className="h-1.5" />
                <p className="mt-1 text-xs text-slate-500">Uploading {progress}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="mt-4 shrink-0 px-1 text-center text-sm leading-relaxed text-slate-400 sm:mt-5">
        I’ll ask you a few questions to understand your background better.
        <br className="hidden sm:block" />
        {" "}It takes less than 2 minutes.
      </p>

      {error && (
        <div className="mt-3 shrink-0 sm:mt-4">
          <AgentErrorState
            title="Unable to upload your resume"
            message={error}
            onRetry={onRetry}
          />
        </div>
      )}

      {hasExistingResume && !busy && (
        <div className="mt-4 shrink-0 text-center sm:mt-5">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl sm:w-auto"
            onClick={onContinueExisting}
          >
            Continue with current resume
          </Button>
        </div>
      )}
    </AgentWorkspace>
  );
}
