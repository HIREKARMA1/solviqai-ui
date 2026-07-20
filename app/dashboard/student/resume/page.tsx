// app/dashboard/student/resume/page.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { apiClient } from "@/lib/api";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Zap,
  Home,
  User,
  Briefcase,
  Sparkles,
  AlertTriangle,
  Eye,
  ListChecks,
  Target,
  HelpCircle,
  ArrowRight,
  Search,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkle,
  SparkleIcon,
  Trash2,
  WandSparklesIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { AxiosError } from "axios";
import SubscriptionRequiredModal from "@/components/subscription/SubscriptionRequiredModal";

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard/student", icon: Home },
  { name: "Profile", href: "/dashboard/student/profile", icon: User },
  { name: "Resume", href: "/dashboard/student/resume", icon: FileText },
  {
    name: "Job Recommendations",
    href: "/dashboard/student/jobs",
    icon: Briefcase,
  },
  { name: "Auto Job Apply", href: "/dashboard/student/auto-apply", icon: Zap },
  { name: "Analytics", href: "/dashboard/student/analytics", icon: BarChart3 },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc"];

interface ATSScore {
  ats_score: number;
  analyzed_for_role?: string;
  overall_assessment: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keyword_analysis?: {
    found_keywords: string[];
    missing_keywords: string[];
  };
  sections_analysis?: Record<string, string>;
  formatting_score?: number;
  content_score?: number;
  keyword_score?: number;
  intelligence_report?: {
    ats_score: number;
    analyzed_for_role?: string;
    role_category?: string;
    overall_ats_compatibility: {
      score: number;
      status: string;
      description: string;
      suggestions: string[];
      priority: string;
    };
    resume_structure: {
      score: number;
      status: string;
      description: string;
      suggestions: string[];
      priority: string;
      has_contact_info?: boolean;
      has_summary?: boolean;
      has_work_experience?: boolean;
      has_education?: boolean;
      has_skills?: boolean;
      has_projects?: boolean;
    };
    resume_formatting: {
      score: number;
      status: string;
      description: string;
      suggestions: string[];
      priority: string;
    };
    professional_summary: {
      score: number;
      status: string;
      description: string;
      suggestions: string[];
      priority: string;
    };
    work_experience: {
      score: number;
      status: string;
      description: string;
      evaluation?: {
        career_progression?: string;
        job_descriptions?: string;
        achievements?: string;
        responsibilities?: string;
        business_impact?: string;
        quantified_results?: string;
      };
      suggestions: string[];
      priority: string;
    };
    projects: Array<{
      name: string;
      strength: string;
      weakness: string;
      missing_technologies?: string[];
      missing_business_impact?: string;
      improved_description?: string;
      suggestions: string[];
      priority: string;
    }>;
    skills: {
      technical_skills: string[];
      soft_skills: string[];
      domain_skills: string[];
      tools_platforms: string[];
      all_skills: string[];
    };
    education: {
      score: number;
      status: string;
      description: string;
      suggestions: string[];
      priority: string;
    };
    certifications?: {
      score: number;
      status: string;
      description: string;
      suggestions: string[];
      priority: string;
    };
    achievements?: {
      score: number;
      status: string;
      description: string;
      suggestions: string[];
      priority: string;
    };
    leadership?: {
      score: number;
      status: string;
      description: string;
      suggestions: string[];
      priority: string;
    };
    grammar_review: {
      score: number;
      status: string;
      description: string;
      grammar_mistakes?: string[];
      spelling_mistakes?: string[];
      repeated_words?: string[];
      weak_verbs?: string[];
      long_sentences?: string[];
      passive_voice?: string[];
      weak_writing?: string[];
      suggestions: string[];
      priority: string;
    };
    keyword_analysis: {
      score: number;
      strong_keywords: string[];
      missing_keywords: string[];
      overused_keywords?: string[];
      weak_keywords?: string[];
      industry_keywords?: string[];
      density_explanation: string;
      suggestions: string[];
      priority: string;
    };
    bullet_consistency?: {
      status: string;
      description: string;
    };
    action_verbs?: {
      status: string;
      description: string;
    };
    quantified_achievements?: {
      status: string;
      description: string;
    };
    resume_length?: {
      status: string;
      description: string;
    };
    readability?: {
      status: string;
      description: string;
    };
    career_progression?: {
      status: string;
      description: string;
    };
    overall_impression?: {
      status: string;
      description: string;
    };
    missing_information?: Array<{
      name: string;
      type: string;
      priority: string;
      reason: string;
    }>;
    recommendations: Array<{
      priority: string;
      title: string;
      reason: string;
      expected_benefit: string;
      estimated_ats_gain: number;
      difficulty: string;
      estimated_time_required: string;
    }>;
    improvement_roadmap?: Array<{
      phase: string;
      focus: string;
      actions: string[];
      expected_ats_gain: number;
    }>;
    final_feedback: {
      excellent?: string;
      to_be_improved: string;
      biggest_strengths: string[];
      biggest_weaknesses: string[];
      ats_pass_likelihood: string;
      shortlist_likelihood: string;
      confidence_score: number;
    };
  };
}

interface ResumeStatus {
  has_resume: boolean;
  resume_uploaded: boolean;
  resume_filename?: string;
  resume_path?: string;
  uploaded_at?: string;
  can_upload: boolean;
  can_calculate_ats: boolean;
}

/**
 * Normalize AI-returned list fields into a string array.
 * The model sometimes returns a plain string (or comma / newline separated
 * text) instead of an array, which would break `.map()` calls.
 */
function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v) => v != null).map((v) => String(v));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    const parts = trimmed
      .split(/\r?\n|•|(?<=[.;])\s+(?=[A-Z0-9])/)
      .map((s) => s.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : [trimmed];
  }
  return [];
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // ATS Score states
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null);
  const [isCalculatingATS, setIsCalculatingATS] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [showJobDescriptionInput, setShowJobDescriptionInput] = useState(false);

  // UI step tracking
  // 1 = Upload, 2 = Processing, 3 = Analysis, 4 = Results
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [processingStep, setProcessingStep] = useState<1 | 2 | 3 | 4>(1);
  const [fakeProgress, setFakeProgress] = useState(0);

  // Results Tabs
  const [activeAuditTab, setActiveAuditTab] = useState<
    | "content"
    | "format"
    | "optimization"
    | "best_practices"
    | "application_ready"
  >("content");
  const [expandedAuditIdx, setExpandedAuditIdx] = useState<number | null>(null);

  // Active section for the sticky summary navigation (results page)
  const [activeSection, setActiveSection] = useState<string>("section-audits");

  // Resume status
  const [resumeStatus, setResumeStatus] = useState<ResumeStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [isDeletingResume, setIsDeletingResume] = useState(false);

  // Subscription modal state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionFeature, setSubscriptionFeature] =
    useState("this feature");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch resume status on mount
  useEffect(() => {
    fetchResumeStatus();
  }, []);

  // Track which report section is in view so the sticky summary can highlight it
  useEffect(() => {
    if (currentStep !== 4) return;
    const sectionIds = [
      "section-audits",
      "section-recommendations",
      "section-roadmap",
      "section-analysis",
      "section-keywords",
      "section-summary",
    ];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.2, 0.5, 1] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [currentStep, atsScore]);

  // Smoothly scroll the report to a section (optionally switch an audit tab first)
  const scrollToSection = (
    id: string,
    tab?:
      | "content"
      | "format"
      | "optimization"
      | "best_practices"
      | "application_ready",
  ) => {
    if (tab) {
      setActiveAuditTab(tab);
      setExpandedAuditIdx(null);
    }
    setActiveSection(id);
    requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleDeleteResume = async () => {
    if (isDeletingResume) return;
    const confirmed = window.confirm(
      "Delete this resume? You can upload a different file afterward. Your current ATS analysis will be cleared.",
    );
    if (!confirmed) return;

    setIsDeletingResume(true);
    setError(null);
    try {
      await apiClient.deleteResume();
      setResumeStatus({
        has_resume: false,
        resume_uploaded: false,
        can_upload: true,
        can_calculate_ats: false,
      });
      setAtsScore(null);
      setUploadSuccess(false);
      setFile(null);
      setJobDescription("");
      setShowJobDescriptionInput(false);
      setCurrentStep(1);
      setShowUploadSection(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchResumeStatus();
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      const errorDetail =
        axiosError.response?.data?.detail ||
        axiosError.message ||
        "Failed to delete resume";
      // Delete must never open the subscription modal — surface the error inline.
      setError(errorDetail);
    } finally {
      setIsDeletingResume(false);
    }
  };

  // Fetch existing resume status
  const fetchResumeStatus = async () => {
    try {
      const status = await apiClient.getResumeStatus();
      setResumeStatus(status.data || status);

      // If no resume exists, show upload section
      if (!(status.data?.has_resume || status.has_resume)) {
        setShowUploadSection(true);
        setCurrentStep(1);
      } else {
        setCurrentStep(1); // Keep at step 1 until they hit calculate
      }
    } catch (error) {
      console.error("Error fetching resume status:", error);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 5MB limit. Your file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(`.${extension}`)) {
      return "Only PDF and DOCX files are allowed";
    }

    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
    setAtsScore(null);

    // Automatically start uploading the selected file
    handleUpload(selectedFile);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async (fileToUpload?: File) => {
    const activeFile = fileToUpload || file;
    if (!activeFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      await apiClient.uploadResume(activeFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadSuccess(true);
      setUploadProgress(100);

      // Refresh resume status after upload
      await fetchResumeStatus();
      setShowUploadSection(false);

      // Clear the local file state so that the UI switches directly to the Active Resume controls
      setFile(null);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      const errorDetail =
        axiosError.response?.data?.detail ||
        axiosError.message ||
        "Failed to upload resume";

      if (
        axiosError.response?.status === 403 ||
        errorDetail.includes("Contact HireKarma") ||
        errorDetail.includes("subscription")
      ) {
        setSubscriptionFeature("resume uploads");
        setShowSubscriptionModal(true);
      } else {
        setError(errorDetail);
      }
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Start simulation of processing steps
  const startProcessingSimulation = (apiPromise: Promise<any>) => {
    setCurrentStep(2);
    setProcessingStep(1);
    setFakeProgress(5);

    // Increment intervals
    const interval = setInterval(() => {
      setFakeProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }

        const nextVal = prev + Math.floor(Math.random() * 8) + 2;

        // Shift parsing step based on progress
        if (nextVal > 75) {
          setProcessingStep(4);
        } else if (nextVal > 50) {
          setProcessingStep(3);
        } else if (nextVal > 25) {
          setProcessingStep(2);
        }

        return nextVal > 95 ? 95 : nextVal;
      });
    }, 800);

    apiPromise
      .then((result) => {
        clearInterval(interval);
        setFakeProgress(100);
        setAtsScore(result);
        setTimeout(() => {
          setCurrentStep(4);
        }, 600);
      })
      .catch((err) => {
        clearInterval(interval);
        setCurrentStep(1);
      });
  };

  const handleCalculateATS = async (forceRegenerate = false) => {
    setIsCalculatingATS(true);
    setError(null);

    // Force regenerate when re-analyzing so students get a fresh role-aware report
    // (old contaminated caches are also invalidated by role-aware hash on the server).
    const shouldForce = forceRegenerate || Boolean(atsScore);
    const apiCall = apiClient.getATSScore(jobDescription || undefined, shouldForce);
    startProcessingSimulation(apiCall);

    try {
      await apiCall;
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      const errorDetail =
        axiosError.response?.data?.detail ||
        axiosError.message ||
        "Failed to calculate ATS score";

      if (
        axiosError.response?.status === 403 ||
        errorDetail.includes("Contact HireKarma") ||
        errorDetail.includes("subscription")
      ) {
        setSubscriptionFeature("ATS score calculation");
        setShowSubscriptionModal(true);
      } else {
        setError(errorDetail);
      }
    } finally {
      setIsCalculatingATS(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadSuccess(false);
    setError(null);
    setAtsScore(null);
    setJobDescription("");
    setCurrentStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80)
      return "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400";
    if (score >= 60)
      return "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400";
    return "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400";
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return "#10b981"; // emerald-500
    if (score >= 60) return "#f59e0b"; // amber-500
    return "#f43f5e"; // rose-500
  };

  const getReadableFilename = (filename: string | undefined): string => {
    if (!filename) return "Resume.pdf";
    if (filename.includes("_")) {
      const parts = filename.split("_");
      const firstPart = parts[0];
      if (firstPart.includes("-") && firstPart.length >= 30) {
        const readableName = parts.slice(1).join("_");
        if (readableName) return readableName;
      }
    }
    if (
      filename.includes("-") &&
      filename.length > 30 &&
      !filename.includes(".")
    ) {
      return "Resume.pdf";
    }
    if (!filename.includes(".")) {
      return filename + ".pdf";
    }
    return filename;
  };

  if (loadingStatus) {
    return (
      <DashboardLayout requiredUserType="student">
        <div className="flex justify-center items-center py-24 min-h-[60vh]">
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Dynamic checks calculations from JSON
  const report = atsScore?.intelligence_report;
  const missingInfoCount = report?.missing_information?.length || 0;
  const weaknessCount = report?.final_feedback?.biggest_weaknesses?.length || 0;
  const missingKeywordsCount =
    report?.keyword_analysis?.missing_keywords?.length || 0;
  const totalMistakes = missingInfoCount + weaknessCount + missingKeywordsCount;

  // Calculations for dynamic estimation
  const totalAtsGain =
    report?.recommendations?.reduce(
      (acc, curr) => acc + (curr.estimated_ats_gain || 0),
      0,
    ) || 0;
  const estimatedFutureScore = Math.min(
    (atsScore?.ats_score || 0) + totalAtsGain,
    100,
  );

  // ---- Derived metrics for the sticky summary panel (results page) ----
  const currentAtsScore = atsScore?.ats_score || 0;
  const summaryRecs = report?.recommendations || [];
  const highPriorityCount = summaryRecs.filter(
    (r) => (r.priority || "").toUpperCase() === "HIGH",
  ).length;
  const mediumPriorityCount = summaryRecs.filter(
    (r) => (r.priority || "").toUpperCase() === "MEDIUM",
  ).length;
  const lowPriorityCount = summaryRecs.filter(
    (r) => (r.priority || "").toUpperCase() === "LOW",
  ).length;
  const matchedKeywordCount = toStringList(
    report?.keyword_analysis?.strong_keywords,
  ).length;
  const recommendedKeywordCount = toStringList(
    report?.keyword_analysis?.missing_keywords,
  ).length;
  const keywordScore =
    matchedKeywordCount + recommendedKeywordCount > 0
      ? Math.round(
        (matchedKeywordCount /
          (matchedKeywordCount + recommendedKeywordCount)) *
        100,
      )
      : 0;
  const scoreGain = Math.max(0, estimatedFutureScore - currentAtsScore);
  const structureFlags = [
    report?.resume_structure?.has_contact_info,
    report?.resume_structure?.has_summary,
    report?.resume_structure?.has_work_experience,
    report?.resume_structure?.has_education,
    report?.resume_structure?.has_skills,
    report?.resume_structure?.has_projects,
  ];
  // Only count sections explicitly marked present (true). Undefined ≠ OK.
  const sectionsPresent = structureFlags.filter((v) => v === true).length;

  const breakdownItems: {
    name: string;
    val: number;
    targetId: string;
    tab?:
    | "content"
    | "format"
    | "optimization"
    | "best_practices"
    | "application_ready";
  }[] = [
      {
        name: "Content",
        val: report?.overall_ats_compatibility?.score ?? currentAtsScore,
        targetId: "section-audits",
        tab: "content",
      },
      {
        name: "Format",
        val: report?.resume_formatting?.score ?? 0,
        targetId: "section-audits",
        tab: "format",
      },
      {
        name: "Optimization",
        val: report?.professional_summary?.score ?? 0,
        targetId: "section-audits",
        tab: "optimization",
      },
      {
        name: "Best Practices",
        val: report?.resume_structure?.score ?? 0,
        targetId: "section-audits",
        tab: "best_practices",
      },
      {
        name: "Grammar",
        val: report?.grammar_review?.score ?? 0,
        targetId: "section-audits",
        tab: "application_ready",
      },
      {
        name: "Keywords",
        val: keywordScore,
        targetId: "section-keywords",
      },
    ];

  type HealthStatus = "ok" | "warn" | "bad";
  const healthItems: { label: string; status: HealthStatus }[] = [
    {
      label: "ATS Compatible",
      status:
        currentAtsScore >= 70 ? "ok" : currentAtsScore >= 50 ? "warn" : "bad",
    },
    {
      label: "Proper Resume Structure",
      status: sectionsPresent >= 5 ? "ok" : sectionsPresent >= 3 ? "warn" : "bad",
    },
    {
      label: "Readable Formatting",
      status: (report?.resume_formatting?.score ?? 0) >= 70 ? "ok" : "warn",
    },
    {
      label: "Keyword Strength",
      status:
        recommendedKeywordCount <= matchedKeywordCount
          ? "ok"
          : recommendedKeywordCount <= matchedKeywordCount * 2
            ? "warn"
            : "bad",
    },
    {
      label: "Certifications",
      status: report?.missing_information?.some((m) =>
        /cert/i.test(m.name),
      )
        ? "bad"
        : "ok",
    },
  ];

  const quickStats: { label: string; value: string | number }[] = [
    { label: "Total Suggestions", value: summaryRecs.length },
    { label: "Resume Sections", value: `${sectionsPresent}/6` },
    { label: "Matched Keywords", value: matchedKeywordCount },
    { label: "Missing Keywords", value: recommendedKeywordCount },
    {
      label: "Grammar Issues",
      value:
        (report?.grammar_review?.grammar_mistakes?.length || 0) +
        (report?.grammar_review?.spelling_mistakes?.length || 0),
    },
  ];

  return (
    <DashboardLayout requiredUserType="student">
      <div className="relative flex flex-col overflow-clip min-h-screen bg-brand-hero dark:bg-brand-hero-dark -mx-6 -mb-6 -mt-20 lg:-mt-24 p-6 pt-20 lg:pt-24 pb-8 w-auto">
        {/* Decorative background glow accents using brand palette */}
        <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-[480px] h-[480px] bg-brand-green/25 rounded-full blur-[130px] pointer-events-none z-0" />
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[560px] h-[560px] bg-brand-cyan/30 rounded-full blur-[150px] pointer-events-none z-0" />
        <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-[380px] h-[380px] bg-brand-blue/18 rounded-full blur-[130px] pointer-events-none z-0" />

        {/* Premium Hero Section matching reference design */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start content-center relative z-10 w-full max-w-7xl mx-auto flex-1 py-6 lg:py-8">

            {/* Left side content & controls */}
            <div className="lg:col-span-6 flex flex-col z-10 space-y-9">
              <div>
                <span className="font-[family-name:var(--font-jakarta)] text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-orange-500 dark:text-brand-cyan mb-5 inline-block">
                  Resume Checker
                </span>
                <h1 className="font-[family-name:var(--font-jakarta)] text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-gray-700 dark:text-gray-50 tracking-[-0.02em] leading-[1.15] mb-6">
                  Is your resume good <br /> enough?
                </h1>
                <p className="font-[family-name:var(--font-jakarta)] text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
                  A free and fast AI resume checker doing 27 crucial checks to ensure your
                  resume's content, layout and design is technically compatible with the applicant
                  tracking systems and get you interview callbacks.
                  {/* <span className="block mt-2 text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400">
                    Note: Free plan allows only 1 resume upload. To replace or upload a new one, Premium upgrade is required.
                  </span> */}
                </p>
              </div>

              {/* Upload area or current file details */}
              <div className="w-full max-w-md font-[family-name:var(--font-jakarta)]">
                {/* 1. Dashed Upload Zone - Always displayed if we are not in State 2 (selecting a file to upload) */}
                {(!file || uploadSuccess) && (
                  <div
                    onDragEnter={!(resumeStatus?.has_resume || uploadSuccess) ? handleDrag : undefined}
                    onDragLeave={!(resumeStatus?.has_resume || uploadSuccess) ? handleDrag : undefined}
                    onDragOver={!(resumeStatus?.has_resume || uploadSuccess) ? handleDrag : undefined}
                    onDrop={!(resumeStatus?.has_resume || uploadSuccess) ? handleDrop : undefined}
                    onClick={() => {
                      if (isUploading) return;
                      if (resumeStatus?.has_resume || uploadSuccess) {
                        setSubscriptionFeature("replacing your resume");
                        setShowSubscriptionModal(true);
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`border-2 border-dashed rounded-[20px] px-6 py-6 text-center cursor-pointer transition-all duration-300 relative overflow-hidden backdrop-blur-sm ${resumeStatus?.has_resume || uploadSuccess
                      ? "border-brand-green/40 bg-brand-green/5 dark:bg-brand-green/10 hover:bg-brand-green/10"
                      : dragActive
                        ? "border-brand-green bg-brand-green/10"
                        : "border-brand-green/60 bg-white/70 dark:bg-gray-900/50 hover:bg-brand-green/10 hover:border-brand-green"
                      }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileInputChange}
                      className="hidden"
                      disabled={isUploading || !!(resumeStatus?.has_resume || uploadSuccess)}
                    />

                    <div className="space-y-3 relative z-10">
                      <div className="space-y-0.5">
                        <p className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">
                          {resumeStatus?.has_resume || uploadSuccess ? (
                            <span className="flex items-center justify-center gap-1.5 text-brand-green">
                              <CheckCircle className="w-4 h-4" />
                              Resume uploaded successfully
                            </span>
                          ) : (
                            "Drop your resume here or choose a file."
                          )}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {resumeStatus?.has_resume || uploadSuccess
                            ? "Delete this resume to upload a different file"
                            : "PDF & DOCX only. Max 2MB file size."}
                        </p>
                      </div>

                      {resumeStatus?.has_resume || uploadSuccess ? (
                        <div className="relative flex items-center justify-between gap-3 p-3 bg-white/70 dark:bg-gray-900/50 border border-brand-green/30 dark:border-brand-green/40 rounded-xl shadow-sm text-left">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 bg-brand-green/10 dark:bg-brand-green/20 rounded-lg flex items-center justify-center text-brand-green flex-shrink-0">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                {getReadableFilename(resumeStatus?.resume_filename)}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                Active Stored Resume
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-[10px] font-semibold text-brand-green px-2 py-0.5 bg-brand-green/10 border border-brand-green/20 rounded">
                              Ready
                            </div>
                            <button
                              type="button"
                              title="Delete resume"
                              aria-label="Delete resume"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteResume();
                              }}
                              disabled={isDeletingResume || isCalculatingATS}
                              className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full bg-white dark:bg-gray-900 border border-rose-200 dark:border-rose-800 shadow-md flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors disabled:opacity-50"
                            >
                              {isDeletingResume ? (
                                <Loader size="sm" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          className="font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all duration-300 text-sm bg-brand-green hover:bg-brand-green-dark text-white"
                        >
                          Upload Your Resume
                        </Button>
                      )}

                      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3.5 h-3.5 text-gray-500"
                        >
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Privacy guaranteed
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. If a file is selected but not uploaded yet (for first-time uploads) */}
                {file && !uploadSuccess && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-brand-blue/5 dark:bg-brand-blue/20 rounded-lg flex items-center justify-center text-brand-blue dark:text-brand-cyan flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate font-mono">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isUploading ? (
                          <Loader size="sm" />
                        ) : (
                          <button
                            type="button"
                            onClick={handleReset}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleUpload()}
                      disabled={isUploading}
                      className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3.5 rounded-lg shadow-sm transition-all duration-300 text-sm"
                    >
                      {isUploading
                        ? `Uploading ${uploadProgress}%`
                        : "Upload Resume"}
                    </Button>
                  </div>
                )}

                {/* 3. If a resume is active / stored - display analysis controls below the upload box */}
                {(resumeStatus?.has_resume || uploadSuccess) && !file && (
                  <div className="space-y-4 pt-5 mt-5 border-t border-gray-200/50 dark:border-gray-800/50">
                    {/* Free plan note */}
                    <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 px-1">
                      <Info className="w-3.5 h-3.5 mt-px flex-shrink-0 text-brand-blue dark:text-brand-cyan" />
                      <span>
                        Your plan stores one resume at a time. Use the delete icon on the resume card to remove it, then upload a new file for ATS analysis.
                      </span>
                    </p>

                    {/* Job description checkbox */}
                    <div className="flex items-center gap-2.5 py-1">
                      <input
                        type="checkbox"
                        id="target-job-desc-toggle"
                        checked={showJobDescriptionInput}
                        onChange={(e) => setShowJobDescriptionInput(e.target.checked)}
                        className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue cursor-pointer"
                      />
                      <label
                        htmlFor="target-job-desc-toggle"
                        className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                      >
                        Analyze against a specific job description
                      </label>
                    </div>

                    {/* Job Description input textarea */}
                    {showJobDescriptionInput && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <Textarea
                          placeholder="Paste target job description details here..."
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          rows={4}
                          disabled={isCalculatingATS}
                          className="border-gray-200 dark:border-gray-800 rounded-xl resize-none text-xs sm:text-sm focus:border-brand-blue focus:ring-brand-blue/20"
                        />
                      </div>
                    )}

                    {/* Analyze button */}
                    <Button
                      onClick={handleCalculateATS}
                      disabled={isCalculatingATS}
                      className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3.5 rounded-lg shadow-sm transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                    >
                      {isCalculatingATS ? (
                        <>
                          <Loader size="sm" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <span>{atsScore ? "Re-analyze Resume With AI" : "Analyze Resume With AI"}</span>
                          <WandSparklesIcon className="w-5 h-5 text-white" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Error Alert */}
                {error && (
                  <Alert
                    variant="destructive"
                    className="rounded-xl border-rose-200 bg-rose-50/50 dark:bg-rose-950/10 mt-4"
                  >
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    <AlertDescription className="text-rose-700 dark:text-rose-400 text-xs sm:text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Right side floating image */}
            <div className="lg:col-span-6 flex justify-end items-start z-10 w-full h-full">
              <div className="relative w-full max-w-lg lg:max-w-2xl xl:max-w-3xl lg:-mr-20 xl:-mr-32 lg:-mt-2">
                {/* Glow effect with Light Blue */}
                <div className="absolute inset-0 bg-brand-cyan/6 rounded-3xl blur-3xl" />
                {/* Rounded card with border & shadow to match mockup card design */}
                <div className="rounded-[24px] border border-gray-200/80 dark:border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden bg-white p-1">
                  <img
                    src="/images/rightside-atstemp.png"
                    alt="Resume ATS Score Preview"
                    className="rounded-[18px] relative object-contain w-full h-auto scale-[1.06]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* State 2: Parsing & Scanning animation */}
        {currentStep === 2 && (
          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Parsing & Assessment
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                Parsing your resume
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xl">
                Our AI is carefully analyzing your resume. This may take a few
                moments.
              </p>
            </div>

            {/* Interactive scan loader panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Steps indicators */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900">
                  <CardContent className="p-5 sm:p-6 space-y-5">
                    {[
                      {
                        step: 1,
                        title: "Parsing your resume",
                        desc: "Reading and understanding the layout...",
                      },
                      {
                        step: 2,
                        title: "Analyzing your experience",
                        desc: "Identifying work history and achievements...",
                      },
                      {
                        step: 3,
                        title: "Extracting your skills",
                        desc: "Detecting technical and soft skills...",
                      },
                      {
                        step: 4,
                        title: "Generating recommendations",
                        desc: "Preparing personalized suggestions...",
                      },
                    ].map((s) => {
                      const isActive = processingStep === s.step;
                      const isCompleted = processingStep > s.step;
                      return (
                        <div key={s.step} className="flex gap-4 items-start">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isCompleted
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                              : isActive
                                ? "bg-blue-600 text-white ring-4 ring-blue-50 dark:ring-blue-950/20"
                                : "bg-gray-50 text-gray-300 dark:bg-gray-800/40 dark:text-gray-700"
                              }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              s.step
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4
                              className={`text-sm font-semibold truncate ${isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-600"}`}
                            >
                              {s.title}
                            </h4>
                            <p
                              className={`text-xs mt-0.5 ${isActive ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-600"}`}
                            >
                              {s.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* visual Scanning resume panel */}
              <div className="lg:col-span-7">
                <Card className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative min-h-[350px] flex flex-col items-center justify-center p-6 text-center">
                  {/* Scan line effect overlay */}
                  <div
                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-bounce shadow-none-none z-20"
                    style={{ animationDuration: "3.5s" }}
                  />

                  <div className="space-y-6 max-w-sm w-full">
                    {/* Mock resume card shape */}
                    <div className="w-36 h-48 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg mx-auto relative overflow-hidden flex flex-col justify-between p-3.5 shadow-sm">
                      <div className="space-y-2.5">
                        <div className="flex gap-2 items-center">
                          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[10px] text-blue-600 font-bold">
                            User
                          </div>
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                        <div className="w-full h-[1px] bg-gray-100 dark:bg-gray-800" />
                        <div className="space-y-1.5">
                          <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800/80 rounded" />
                          <div className="w-14 h-1.5 bg-gray-100 dark:bg-gray-800/80 rounded" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="w-10 h-3 bg-blue-50 dark:bg-blue-950/30 rounded" />
                        <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* Status texts */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {file
                          ? file.name
                          : getReadableFilename(resumeStatus?.resume_filename)}
                      </p>

                      {/* Progress meter */}
                      <div className="space-y-1 w-full">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Calculating score...</span>
                          <span className="font-semibold">{fakeProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
                            style={{ width: `${fakeProgress}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 italic">
                        Processing... please don't close this window.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Privacy note */}
            <div className="flex items-center gap-2.5 p-3.5 bg-gray-50/40 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>
                Your data is safe and secure. We use enterprise-grade encryption
                to protect your data. Your resume is never shared.
              </span>
            </div>
          </div>
        )}

        {/* State 3: Recruiter report results page */}
        {currentStep === 4 && report && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 space-y-6"
          >
            {/* Header widgets */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">
                    Resume Analysis Results
                  </h1>
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 hover:bg-emerald-50">
                    Completed
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Here's your detailed analysis and AI-powered recommendations
                  to improve your resume.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-center">
                <Button
                  onClick={handleReset}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm shadow-sm hover:shadow-md transition-all rounded-lg"
                >
                  Analyze Another Resume
                </Button>
              </div>
            </div>

            {/* Two-column enterprise layout: independent full-height scroll panes */}
            <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 lg:h-[calc(100vh-12rem)]">
              {/* LEFT: independent full-height scroll pane */}
              <aside className="space-y-4 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1 scrollbar-none">
                {/* Your ATS Score */}
                <Card className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 flex flex-col justify-between overflow-hidden">
                  <CardHeader className="pb-2 border-b border-gray-150 dark:border-gray-800">
                    <CardTitle className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      Your ATS Score
                    </CardTitle>
                    {(atsScore.analyzed_for_role || report?.analyzed_for_role) && (
                      <CardDescription className="text-[11px] text-brand-blue dark:text-blue-300 mt-1">
                        Analyzed for: {atsScore.analyzed_for_role || report?.analyzed_for_role}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4 flex-1">
                    {/* Large Circular/Radial Gauge SVG */}
                    <div className="relative w-48 h-48 flex items-center justify-center select-none group">
                      <svg
                        className="w-full h-full transform -rotate-90"
                        viewBox="0 0 200 200"
                      >
                        {/* Background Circle */}
                        <circle
                          cx="100"
                          cy="100"
                          r="82"
                          fill="transparent"
                          className="stroke-gray-100 dark:stroke-gray-800"
                          strokeWidth="14"
                        />
                        {/* Color Gradient Ring */}
                        <circle
                          cx="100"
                          cy="100"
                          r="82"
                          fill="transparent"
                          stroke={getScoreProgressColor(atsScore.ats_score)}
                          strokeWidth="14"
                          strokeDasharray={2 * Math.PI * 82}
                          strokeDashoffset={
                            2 * Math.PI * 82 -
                            (atsScore.ats_score / 100) * (2 * Math.PI * 82)
                          }
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <p
                          className={`text-5xl font-extrabold tracking-tighter ${getScoreColor(atsScore.ats_score)}`}
                        >
                          {atsScore.ats_score}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          out of 100
                        </p>
                      </div>
                    </div>

                    <div className="text-center space-y-1 max-w-[240px]">
                      <Badge
                        className={`px-3 py-1 font-semibold text-xs rounded-full ${getScoreBg(atsScore.ats_score)}`}
                      >
                        {report.overall_ats_compatibility?.status || "Good"}
                      </Badge>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
                        {report.overall_ats_compatibility?.description ||
                          "Your resume is highly likely to pass ATS constraints."}
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-1.5 text-blue-600 text-xs font-semibold">
                        You are in
                        <span>
                          {atsScore.ats_score >= 80
                            ? "Top 8% of resumes"
                            : atsScore.ats_score >= 60
                              ? "Top 25% of resumes"
                              : "Below average score"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Score Breakdown — compact vertical list, doubles as section nav */}
                <Card className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                  <CardHeader className="pb-2 border-b border-gray-150 dark:border-gray-800">
                    <CardTitle className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      Score Breakdown
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tap a category to jump to its section
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2">
                    {breakdownItems.map((c, idx) => {
                      const isItemActive =
                        activeSection === c.targetId &&
                        (!c.tab || activeAuditTab === c.tab);
                      const circ = 2 * Math.PI * 15;
                      return (
                        <button
                          key={idx}
                          onClick={() => scrollToSection(c.targetId, c.tab)}
                          className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left transition-colors ${isItemActive
                            ? "bg-blue-50/70 dark:bg-blue-950/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                            }`}
                        >
                          <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
                            <svg
                              className="w-full h-full transform -rotate-90"
                              viewBox="0 0 36 36"
                              aria-label={`${c.name} score`}
                            >
                              <circle
                                cx="18"
                                cy="18"
                                r="15"
                                fill="transparent"
                                className="stroke-gray-100 dark:stroke-gray-800"
                                strokeWidth="4"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="15"
                                fill="transparent"
                                stroke={getScoreProgressColor(c.val)}
                                strokeWidth="4"
                                strokeDasharray={circ}
                                strokeDashoffset={circ - (c.val / 100) * circ}
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <span
                            className={`flex-1 text-xs font-semibold truncate ${isItemActive
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-gray-600 dark:text-gray-300"
                              }`}
                          >
                            {c.name}
                          </span>
                          <span
                            className={`text-xs font-bold ${getScoreColor(c.val)}`}
                          >
                            {c.val}
                          </span>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Resume Health */}
                <Card className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                  <CardHeader className="pb-2 border-b border-gray-150 dark:border-gray-800">
                    <CardTitle className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      Resume Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 pb-3 space-y-2">
                    {healthItems.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {h.status === "ok" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : h.status === "warn" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        )}
                        <span className="font-medium text-gray-600 dark:text-gray-300">
                          {h.label}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Critical Issues */}
                <Card className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                  <CardHeader className="pb-2 border-b border-gray-150 dark:border-gray-800">
                    <CardTitle className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      Critical Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 pb-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium text-gray-600 dark:text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        High Priority
                      </span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {highPriorityCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium text-gray-600 dark:text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Medium Priority
                      </span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {mediumPriorityCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium text-gray-600 dark:text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        Low Priority
                      </span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {lowPriorityCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100 dark:border-gray-800">
                      <span className="font-semibold text-gray-600 dark:text-gray-300">
                        Est. Score Gain
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{scoreGain}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Statistics */}
                <Card className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                  <CardHeader className="pb-2 border-b border-gray-150 dark:border-gray-800">
                    <CardTitle className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      Quick Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 pb-3 space-y-2 text-xs">
                    {quickStats.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                          {s.label}
                        </span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </aside>

              {/* RIGHT: independent full-height scroll pane */}
              <div className="space-y-6 min-w-0 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1">

                {/* Audits & suggestions tabbed interface */}
                <div className="space-y-6">
                  {/* Resume Audits */}
                  <Card id="section-audits" className="scroll-mt-24 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                    <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
                      <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                        Resume Audits
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Select a category to audit specific improvements
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* Tabs filters */}
                      <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-none">
                        {[
                          { id: "content", label: "Content" },
                          { id: "format", label: "Format" },
                          { id: "optimization", label: "Optimization" },
                          { id: "best_practices", label: "Best Practices" },
                          { id: "application_ready", label: "Ready" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setActiveAuditTab(t.id as any);
                              setExpandedAuditIdx(null);
                            }}
                            className={`px-4 py-3 text-xs sm:text-sm font-semibold transition-all flex-shrink-0 ${activeAuditTab === t.id
                              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 bg-blue-50/10"
                              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Filtered audits display */}
                      <div className="p-4 sm:p-6 space-y-4">
                        {activeAuditTab === "content" && (
                          <div className="space-y-4">
                            {/* Work experience feedback block */}
                            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50/30 dark:bg-gray-800/10">
                              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-2">
                                <Briefcase className="w-4 h-4 text-blue-600" />
                                Work Experience Assessment
                              </h4>
                              <p className="text-xs text-gray-500 mb-3">
                                {report.work_experience?.description}
                              </p>

                              {report.work_experience?.evaluation && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  <div className="p-2 bg-white dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-800">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300 block">
                                      Career Progression:
                                    </span>
                                    <span className="text-gray-500">
                                      {
                                        report.work_experience.evaluation
                                          .career_progression
                                      }
                                    </span>
                                  </div>
                                  <div className="p-2 bg-white dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-800">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300 block">
                                      Quantified Results:
                                    </span>
                                    <span className="text-gray-500">
                                      {
                                        report.work_experience.evaluation
                                          .quantified_results
                                      }
                                    </span>
                                  </div>
                                  <div className="p-2 bg-white dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-800">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300 block">
                                      Achievements Detail:
                                    </span>
                                    <span className="text-gray-500">
                                      {
                                        report.work_experience.evaluation
                                          .achievements
                                      }
                                    </span>
                                  </div>
                                  <div className="p-2 bg-white dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-800">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300 block">
                                      Business Impact:
                                    </span>
                                    <span className="text-gray-500">
                                      {
                                        report.work_experience.evaluation
                                          .business_impact
                                      }
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Project rewrites suggestions list */}
                            {report.projects && report.projects.length > 0 && (
                              <div className="space-y-3">
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                  Project Rewrite Audits
                                </h5>
                                {report.projects.map((proj, idx) => {
                                  const isExpanded = expandedAuditIdx === idx;
                                  return (
                                    <div
                                      key={idx}
                                      className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden transition-all bg-white dark:bg-gray-900"
                                    >
                                      <button
                                        onClick={() =>
                                          setExpandedAuditIdx(
                                            isExpanded ? null : idx,
                                          )
                                        }
                                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                      >
                                        <div className="min-w-0">
                                          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                            {proj.name}
                                          </h4>
                                          <p className="text-xs text-rose-500 mt-0.5 truncate">
                                            {proj.weakness}
                                          </p>
                                        </div>
                                        {isExpanded ? (
                                          <ChevronUp className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                        )}
                                      </button>

                                      {isExpanded && (
                                        <div className="p-4 border-t border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-950/20 space-y-3 text-xs leading-relaxed">
                                          <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300 block">
                                              Biggest Strength:
                                            </span>
                                            <p className="text-gray-500">
                                              {proj.strength}
                                            </p>
                                          </div>
                                          {proj.improved_description && (
                                            <div className="p-3 bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/30 rounded-lg">
                                              <span className="font-bold text-blue-700 dark:text-blue-400 block mb-1">
                                                Recruiter Improved Suggestion:
                                              </span>
                                              <p className="text-gray-600 dark:text-gray-300 italic">
                                                "{proj.improved_description}"
                                              </p>
                                            </div>
                                          )}
                                          {toStringList(proj.suggestions).length >
                                            0 && (
                                              <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300 block">
                                                  Action suggestions:
                                                </span>
                                                <ul className="list-disc pl-4 text-gray-500 mt-1 space-y-1">
                                                  {toStringList(
                                                    proj.suggestions,
                                                  ).map((s, sidx) => (
                                                    <li key={sidx}>{s}</li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {activeAuditTab === "format" && (
                          <div className="space-y-4 text-xs">
                            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/20">
                              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                                Resume Formatting Review
                              </h4>
                              <p className="text-gray-500 leading-relaxed mb-3">
                                {report.resume_formatting?.description}
                              </p>
                              {toStringList(report.resume_formatting?.suggestions)
                                .length > 0 && (
                                  <ul className="list-disc pl-4 space-y-1 text-gray-500">
                                    {toStringList(
                                      report.resume_formatting?.suggestions,
                                    ).map((s, idx) => (
                                      <li key={idx}>{s}</li>
                                    ))}
                                  </ul>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
                                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                                  Readability Index:
                                </span>
                                <span className="text-gray-500">
                                  {report.readability?.description ||
                                    "Optimal layout formatting."}
                                </span>
                              </div>
                              <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
                                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                                  Length Check:
                                </span>
                                <span className="text-gray-500">
                                  {report.resume_length?.description ||
                                    "Appropriate page count length."}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeAuditTab === "optimization" && (
                          <div className="space-y-4 text-xs">
                            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/20">
                              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                                Professional Summary Audit
                              </h4>
                              <p className="text-gray-500 leading-relaxed mb-3">
                                {report.professional_summary?.description}
                              </p>
                              {toStringList(report.professional_summary?.suggestions)
                                .length > 0 && (
                                  <ul className="list-disc pl-4 space-y-1 text-gray-500">
                                    {toStringList(
                                      report.professional_summary?.suggestions,
                                    ).map((s, idx) => (
                                      <li key={idx}>{s}</li>
                                    ))}
                                  </ul>
                                )}
                            </div>

                            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
                              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Keyword Density Analysis
                              </h4>
                              <p className="text-gray-500 leading-relaxed">
                                {report.keyword_analysis?.density_explanation}
                              </p>
                            </div>
                          </div>
                        )}

                        {activeAuditTab === "best_practices" && (
                          <div className="space-y-4 text-xs">
                            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/20">
                              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                                Structure Audit
                              </h4>
                              <p className="text-gray-500 leading-relaxed">
                                {report.resume_structure?.description}
                              </p>
                            </div>

                            {/* Missing elements alert */}
                            {report.missing_information &&
                              report.missing_information.length > 0 && (
                                <div className="space-y-3">
                                  <h5 className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4" />
                                    Missing Information Detected
                                  </h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {report.missing_information.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="p-3 border border-rose-200 dark:border-rose-900/30 bg-rose-50/10 rounded-lg"
                                      >
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                                            {item.name}
                                          </span>
                                          <Badge className="bg-rose-50 text-rose-600 text-[10px] border border-rose-100 hover:bg-rose-50">
                                            Priority: {item.priority}
                                          </Badge>
                                        </div>
                                        <p className="text-gray-500 text-xs leading-relaxed">
                                          {item.reason}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {activeAuditTab === "application_ready" && (
                          <div className="space-y-4 text-xs leading-relaxed">
                            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/20">
                              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                                Grammar & Spelling Review
                              </h4>
                              <p className="text-gray-500 mb-2">
                                {report.grammar_review?.description}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
                                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-0.5">
                                  Bullet Point Consistency
                                </span>
                                <span className="text-gray-500">
                                  {report.bullet_consistency?.description ||
                                    "Perfect consistency."}
                                </span>
                              </div>
                              <div className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
                                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-0.5">
                                  Action Verbs Usage
                                </span>
                                <span className="text-gray-500">
                                  {report.action_verbs?.description ||
                                    "High impact action verbs."}
                                </span>
                              </div>
                              <div className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
                                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-0.5">
                                  Quantified Results
                                </span>
                                <span className="text-gray-500">
                                  {report.quantified_achievements?.description ||
                                    "Good use of metrics."}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Recommendations */}
                  <Card id="section-recommendations" className="scroll-mt-24 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                    <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
                      <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                        Top Recommendations
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Follow these key recommendations for fast ATS score gains
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {report.recommendations &&
                        report.recommendations.length > 0 ? (
                        report.recommendations.map((rec, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all space-y-2"
                          >
                            <div className="flex justify-between items-start">
                              <Badge className="bg-red-50 text-red-600 border border-red-100 text-[10px] uppercase font-bold hover:bg-red-50">
                                {rec.priority} Priority
                              </Badge>
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100">
                                +{rec.estimated_ats_gain} ATS Gain
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                              {rec.title}
                            </h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              {rec.reason}
                            </p>
                            <div className="pt-1.5 flex justify-between items-center text-[10px] text-gray-400 font-medium">
                              <span>Time: {rec.estimated_time_required}</span>
                              <span>Diff: {rec.difficulty}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          No pending recommendations. Excellent job!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Improvement Roadmap — phased plan (distinct from Top Recommendations) */}
                <Card id="section-roadmap" className="scroll-mt-24 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                  <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
                    <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                      Improvement Roadmap
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Week-by-week plan tailored to{" "}
                      {atsScore.analyzed_for_role || report?.analyzed_for_role || "your target role"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    {(report.improvement_roadmap && report.improvement_roadmap.length > 0) ? (
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-gray-50/50 dark:bg-gray-800/40 text-gray-400 uppercase text-[10px] font-bold border-b border-gray-100 dark:border-gray-800">
                            <th className="p-4">Phase</th>
                            <th className="p-4">Focus</th>
                            <th className="p-4">Actions</th>
                            <th className="p-4 text-center">Est. ATS Gain</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {report.improvement_roadmap.map((phase, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors"
                            >
                              <td className="p-4 font-semibold text-brand-blue whitespace-nowrap">
                                {phase.phase}
                              </td>
                              <td className="p-4 font-medium text-gray-800 dark:text-gray-200 max-w-xs">
                                {phase.focus}
                              </td>
                              <td className="p-4 text-gray-600 dark:text-gray-300">
                                <ul className="list-disc pl-4 space-y-1">
                                  {(phase.actions || []).map((action, aIdx) => (
                                    <li key={aIdx}>{action}</li>
                                  ))}
                                </ul>
                              </td>
                              <td className="p-4 text-center text-emerald-600 font-bold">
                                +{phase.expected_ats_gain}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-gray-50/50 dark:bg-gray-800/40 text-gray-400 uppercase text-[10px] font-bold border-b border-gray-100 dark:border-gray-800">
                            <th className="p-4">Priority</th>
                            <th className="p-4">Improvement Task</th>
                            <th className="p-4 text-center">Est. ATS Gain</th>
                            <th className="p-4">Time Required</th>
                            <th className="p-4">Difficulty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {report.recommendations?.map((rec, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors"
                            >
                              <td className="p-4 font-semibold">
                                <Badge
                                  className={`${rec.priority === "HIGH"
                                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                                    : rec.priority === "MEDIUM"
                                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                                      : "bg-gray-50 text-gray-600 border border-gray-100"
                                    } text-[10px] uppercase font-bold`}
                                >
                                  {rec.priority}
                                </Badge>
                              </td>
                              <td className="p-4 font-medium text-gray-800 dark:text-gray-200 max-w-sm">
                                <p className="font-semibold">{rec.title}</p>
                                <p className="text-xs text-gray-400 font-normal mt-0.5 leading-relaxed">
                                  {rec.reason}
                                </p>
                              </td>
                              <td className="p-4 text-center text-emerald-600 font-bold">
                                +{rec.estimated_ats_gain}
                              </td>
                              <td className="p-4 text-gray-500">{rec.estimated_time_required}</td>
                              <td className="p-4 text-gray-500">{rec.difficulty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>

                {/* Section analysis & Keyword intelligence */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Section Analysis */}
                  <Card id="section-analysis" className="scroll-mt-24 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                    <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
                      <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                        Section Analysis
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Required and recommended resume elements
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {[
                        {
                          name: "Contact Information",
                          status:
                            report.resume_structure?.has_contact_info === true
                              ? "OK"
                              : "MISSING",
                          type: "Required",
                        },
                        {
                          name: "Professional Summary",
                          status:
                            report.resume_structure?.has_summary === true
                              ? "OK"
                              : "MISSING",
                          type: "Required",
                        },
                        {
                          name: "Work Experience",
                          status:
                            report.resume_structure?.has_work_experience === true
                              ? "OK"
                              : "MISSING",
                          type: "Required",
                        },
                        {
                          name: "Education History",
                          status:
                            report.resume_structure?.has_education === true
                              ? "OK"
                              : "MISSING",
                          type: "Required",
                        },
                        {
                          name: "Skills Grid",
                          status:
                            report.resume_structure?.has_skills === true
                              ? "OK"
                              : "MISSING",
                          type: "Required",
                        },
                        {
                          name: "Projects Details",
                          status:
                            report.resume_structure?.has_projects === true
                              ? "OK"
                              : "MISSING",
                          type: "Recommended",
                        },
                      ].map((s, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3.5 bg-gray-50/20 dark:bg-gray-800/10 border border-gray-200 dark:border-gray-800 rounded-lg text-xs sm:text-sm"
                        >
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {s.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-50 text-[10px]">
                              {s.type}
                            </Badge>
                            <Badge
                              className={
                                s.status === "OK"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-50 text-[10px]"
                                  : "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-50 text-[10px]"
                              }
                            >
                              {s.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Keyword Intelligence */}
                  <Card id="section-keywords" className="scroll-mt-24 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                    <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
                      <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                        Keyword Intelligence
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Industry terms parsed compared against target roles
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Found Keywords */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Matched Keywords
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {toStringList(
                            report.keyword_analysis?.strong_keywords,
                          ).length > 0 ? (
                            toStringList(
                              report.keyword_analysis?.strong_keywords,
                            ).map((kw, idx) => (
                              <Badge
                                key={idx}
                                className="bg-emerald-50 text-emerald-700 border border-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-400 font-medium py-1 px-2.5 rounded-md text-xs hover:bg-emerald-50"
                              >
                                ✓ {kw}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 italic">No matched keywords detected yet.</p>
                          )}
                        </div>
                      </div>

                      {/* Recommended Keywords */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Recommended Keywords
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {toStringList(
                            report.keyword_analysis?.missing_keywords,
                          ).length > 0 ? (
                            toStringList(
                              report.keyword_analysis?.missing_keywords,
                            ).map((kw, idx) => (
                              <Badge
                                key={idx}
                                className="bg-amber-50 text-amber-700 border border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-400 font-medium py-1 px-2.5 rounded-md text-xs hover:bg-amber-50"
                              >
                                + {kw}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 italic">
                              No gap keywords for this role — set your job role of interest in profile for richer suggestions.
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recruiter Recommendation Summary */}
                {/* <Card id="section-summary" className="scroll-mt-24 border border-brand-blue dark:border-brand-blue/60 bg-brand-card dark:bg-brand-card-dark text-white rounded-xl shadow-md overflow-hidden">
                  <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2">
                     
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                          Recruiter Recommendation Summary
                        </h3>
                      </div>
                      <p className="text-sm text-blue-50/90 leading-relaxed">
                        {report.overall_impression?.description ||
                          report.final_feedback?.to_be_improved}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-lg border border-white/10 flex-shrink-0 self-start md:self-center">
                      <div>
                        <p className="text-xs text-blue-100/80 font-medium uppercase tracking-wider">
                          Estimated Score After Fixes
                        </p>
                        <p className="text-3xl font-extrabold text-white mt-1">
                          {estimatedFutureScore}
                          <span className="text-sm font-semibold text-blue-100/80">
                            /100
                          </span>
                        </p>
                      </div>
                    
                    </div>
                  </CardContent>
                </Card> */}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        feature={subscriptionFeature}
      />
    </DashboardLayout>
  );
}
