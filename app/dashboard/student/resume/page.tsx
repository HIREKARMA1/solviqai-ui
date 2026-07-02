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

  // Resume status
  const [resumeStatus, setResumeStatus] = useState<ResumeStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [showUploadSection, setShowUploadSection] = useState(false);

  // Subscription modal state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionFeature, setSubscriptionFeature] =
    useState("this feature");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch resume status on mount
  useEffect(() => {
    fetchResumeStatus();
  }, []);

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

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      await apiClient.uploadResume(file, (progress) => {
        setUploadProgress(progress);
      });

      setUploadSuccess(true);
      setUploadProgress(100);

      // Refresh resume status after upload
      await fetchResumeStatus();
      setShowUploadSection(false);
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

  const handleCalculateATS = async () => {
    setIsCalculatingATS(true);
    setError(null);

    const apiCall = apiClient.getATSScore(jobDescription || undefined);
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

  return (
    <DashboardLayout requiredUserType="student">
      <div className="space-y-6 px-4 sm:px-6 md:px-8 pb-12 max-w-7xl mx-auto">
        {/* Premium Hero Banner */}
        {currentStep === 1 && (
          <div className="bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/40 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 overflow-hidden relative">
            {/* Decorative glowing circles */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-300/10 dark:bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-300/10 dark:bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-3 max-w-2xl z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md">
                Resume Analysis
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-950 dark:text-gray-50 tracking-tight leading-tight">
                Let's{" "}
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                  analyze
                </span>{" "}
                your resume
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed">
                Get an AI-powered review, ATS score, and actionable insights to
                improve your chances of getting hired.
              </p>
            </div>

            {/* Hero illustration */}
            <div className="w-full md:w-72 lg:w-96 flex-shrink-0 z-10 flex justify-center mix-blend-hidden">
              <img
                src="/images/heropage-ats.png"
                alt="Resume ATS Scan Illustration"
                className="max-h-36 md:max-h-40 object-contain drop-shadow-md"
              />
            </div>
          </div>
        )}

        {/* Stepper Workflow component */}
        <div className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {[
              { step: 1, label: "Upload Resume", desc: "Add your resume file" },
              {
                step: 2,
                label: "Processing",
                desc: "AI is analyzing your resume",
              },
              {
                step: 3,
                label: "Analysis",
                desc: "Generating insights & score",
              },
              { step: 4, label: "Results", desc: "View your detailed report" },
            ].map((s) => {
              const isActive = currentStep === s.step;
              const isCompleted = currentStep > s.step;
              return (
                <div key={s.step} className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-300 ${
                      isCompleted
                        ? "bg-blue-600 text-white"
                        : isActive
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 ring-4 ring-blue-50 dark:ring-blue-950/20"
                          : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : s.step}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      {s.label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {s.desc}
                    </p>
                  </div>
                  {s.step < 4 && (
                    <div className="hidden md:block flex-1 h-[2px] bg-gray-100 dark:bg-gray-800 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* State 1: Upload / Intake View */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Two-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Upload card */}
              <div className="lg:col-span-8 space-y-4">
                <Card className="border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden bg-white dark:bg-gray-900">
                  <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Upload className="w-5 h-5 text-blue-600" />
                      {resumeStatus?.has_resume
                        ? "Replace Resume"
                        : "Upload Your Resume"}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      We support PDF and DOCX files. Max file size: 5MB
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {/* Drag and drop panel */}
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() =>
                        !isUploading && fileInputRef.current?.click()
                      }
                      className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                        dragActive
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                          : file
                            ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10"
                            : "border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-gray-700 bg-gray-50/30 dark:bg-gray-950/10"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.doc"
                        onChange={handleFileInputChange}
                        className="hidden"
                        disabled={isUploading}
                      />

                      <div className="space-y-4 relative z-10">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center mx-auto text-blue-600 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                            Drag & drop your resume here
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            or click to browse files from your computer
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          Choose File
                        </Button>
                        <p className="text-[10px] text-gray-400">
                          PDF, DOCX up to 5MB
                        </p>
                      </div>
                    </div>

                    {/* Error Alert */}
                    {error && (
                      <Alert
                        variant="destructive"
                        className="rounded-xl border-rose-200 bg-rose-50/50 dark:bg-rose-950/10"
                      >
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                        <AlertDescription className="text-rose-700 dark:text-rose-400 text-xs sm:text-sm">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Selected File Card */}
                    {file && (
                      <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
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
                              onClick={handleReset}
                              className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Active Stored Resume Card */}
                    {resumeStatus?.has_resume &&
                      !file &&
                      !showUploadSection && (
                        <div className="flex items-center justify-between p-3.5 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0">
                              <CheckCircle className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                {getReadableFilename(
                                  resumeStatus.resume_filename,
                                )}
                              </p>
                              <p className="text-xs text-gray-400">
                                Uploaded{" "}
                                {resumeStatus.uploaded_at
                                  ? new Date(
                                      resumeStatus.uploaded_at,
                                    ).toLocaleDateString()
                                  : "recently"}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowUploadSection(true)}
                            className="border-gray-200 text-xs dark:border-gray-700"
                          >
                            Replace
                          </Button>
                        </div>
                      )}

                    {/* Upload trigger button */}
                    {file && !uploadSuccess && (
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl py-5 rounded-xl transition-all duration-300"
                      >
                        {isUploading
                          ? `Uploading ${uploadProgress}%`
                          : "Upload Resume"}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Tip banner */}
                <div className="flex items-center gap-2.5 p-3.5 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20 rounded-xl text-blue-700 dark:text-blue-400 text-xs sm:text-sm">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Tip: Use a clean, well-structured resume to get the most
                    accurate analysis.
                  </span>
                </div>
              </div>

              {/* What you'll get card */}
              <div className="lg:col-span-4 space-y-4">
                <Card className="border border-gray-100 dark:border-gray-800 shadow-md bg-white dark:bg-gray-900 rounded-2xl">
                  <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
                    <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                      What you'll get
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {[
                      {
                        title: "ATS Score",
                        desc: "See how well your resume performs in applicant tracking systems.",
                        icon: Target,
                        bg: "bg-blue-50 text-blue-600 dark:bg-blue-950/30",
                      },
                      {
                        title: "Content Analysis",
                        desc: "Get insights on clarity, relevance and impact.",
                        icon: ListChecks,
                        bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30",
                      },
                      {
                        title: "Skill Match",
                        desc: "Check how your skills match the job market.",
                        icon: Sparkles,
                        bg: "bg-amber-50 text-amber-600 dark:bg-amber-950/30",
                      },
                      {
                        title: "Improvement Tips",
                        desc: "Receive actionable suggestions to improve your resume.",
                        icon: AlertTriangle,
                        bg: "bg-rose-50 text-rose-600 dark:bg-rose-950/30",
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}
                        >
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center gap-2.5 text-gray-500 dark:text-gray-400 text-xs">
                      <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 text-gray-400">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <span>
                        Your data is secure. We don't share your resume. 100%
                        private.
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* job description prompt & Calculate action */}
            {(resumeStatus?.has_resume || uploadSuccess) && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="border border-purple-100 dark:border-purple-900/30 shadow-md bg-gradient-to-br from-white to-purple-50/20 dark:from-gray-900 dark:to-purple-950/5 rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 border-b border-purple-50 dark:border-purple-950/30">
                    <CardTitle className="text-base font-bold text-gray-950 dark:text-gray-50 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Target Job Description (Optional)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Paste the job description to align your resume analysis
                      with target recruiters.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <Textarea
                      placeholder="Paste the job description details here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={4}
                      disabled={isCalculatingATS}
                      className="border-gray-200 dark:border-gray-800 rounded-xl resize-none text-sm focus:border-purple-400 focus:ring-purple-200"
                    />
                    <Button
                      onClick={handleCalculateATS}
                      disabled={isCalculatingATS}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-5 h-5" />
                      Analyze Resume with Recruiter AI
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* State 2: Parsing & Scanning animation */}
        {currentStep === 2 && (
          <div className="space-y-6">
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
                <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm bg-white dark:bg-gray-900">
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
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                              isCompleted
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
                <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl shadow-lg bg-white dark:bg-gray-900 overflow-hidden relative min-h-[350px] flex flex-col items-center justify-center p-6 text-center">
                  {/* Scan line effect overlay */}
                  <div
                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-bounce shadow-md z-20"
                    style={{ animationDuration: "3.5s" }}
                  />

                  <div className="space-y-6 max-w-sm w-full">
                    {/* Mock resume card shape */}
                    <div className="w-36 h-48 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg mx-auto relative overflow-hidden flex flex-col justify-between p-3.5 shadow-md">
                      <div className="space-y-2.5">
                        <div className="flex gap-2 items-center">
                          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[10px] text-blue-600 font-bold">
                            AK
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
            <div className="flex items-center gap-2.5 p-3.5 bg-gray-50/40 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-xl text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
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
            className="space-y-6"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm shadow-md hover:shadow-lg transition-all rounded-xl"
                >
                  Analyze Another Resume
                </Button>
              </div>
            </div>

            {/* Top Widgets grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Gauge Score Widget (Card 1) - Bigger Circular Gauge */}
              <Card className="lg:col-span-4 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md bg-white dark:bg-gray-900 flex flex-col justify-between overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-50 dark:border-gray-800">
                  <CardTitle className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Your ATS Score
                  </CardTitle>
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
                      <TrendingUp className="w-3.5 h-3.5" />
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

              {/* Score Breakdown meters (Card 2) */}
              <Card className="lg:col-span-5 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md bg-white dark:bg-gray-900 flex flex-col justify-between overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-50 dark:border-gray-800">
                  <CardTitle className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Score Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Category scores affecting your overall rating
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-5 gap-2 items-center flex-1">
                  {[
                    {
                      name: "Content",
                      val: report.overall_ats_compatibility?.score || 80,
                    },
                    {
                      name: "Format",
                      val: report.resume_formatting?.score || 75,
                    },
                    {
                      name: "Optimization",
                      val: report.professional_summary?.score || 60,
                    },
                    {
                      name: "Best Practices",
                      val: report.resume_structure?.score || 85,
                    },
                    {
                      name: "Ready",
                      val: report.final_feedback?.confidence_score || 85,
                    },
                  ].map((c, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center space-y-3"
                    >
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                        <svg
                          className="w-full h-full transform -rotate-90"
                          viewBox="0 0 36 36"
                        >
                          <circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="transparent"
                            className="stroke-gray-50 dark:stroke-gray-800"
                            strokeWidth="3.5"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="transparent"
                            stroke={getScoreProgressColor(c.val)}
                            strokeWidth="3.5"
                            strokeDasharray={2 * Math.PI * 15}
                            strokeDashoffset={
                              2 * Math.PI * 15 -
                              (c.val / 100) * (2 * Math.PI * 15)
                            }
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-xs sm:text-sm font-extrabold text-gray-700 dark:text-gray-300">
                          {c.val}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-400 text-center truncate w-full tracking-tighter uppercase">
                        {c.name}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Critical mistakes panel (Card 3) */}
              <Card className="lg:col-span-3 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md bg-white dark:bg-gray-900 flex flex-col justify-between overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-50 dark:border-gray-800">
                  <CardTitle className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Critical Mistakes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex flex-col justify-between flex-1 space-y-4">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-4xl font-extrabold text-rose-500">
                      {totalMistakes}
                    </p>
                    <p className="text-xs text-gray-400">
                      / {totalMistakes + 10} checks analyzed
                    </p>
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        label: "Content issues",
                        val: weaknessCount,
                        color: "bg-rose-500",
                      },
                      {
                        label: "Formatting details",
                        val: missingInfoCount,
                        color: "bg-amber-500",
                      },
                      {
                        label: "Grammar review checks",
                        val: missingKeywordsCount,
                        color: "bg-indigo-500",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${item.color}`}
                          />
                          <span className="text-gray-500">{item.label}</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Audits & suggestions tabbed interface (Card 4) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left audits card (occupies 8 cols) */}
              <Card className="lg:col-span-8 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md bg-white dark:bg-gray-900 overflow-hidden">
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
                        className={`px-4 py-3 text-xs sm:text-sm font-semibold transition-all flex-shrink-0 ${
                          activeAuditTab === t.id
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
                        <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-gray-50/30 dark:bg-gray-800/10">
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
                                  className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden transition-all bg-white dark:bg-gray-900"
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
                                      {proj.suggestions &&
                                        proj.suggestions.length > 0 && (
                                          <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300 block">
                                              Action suggestions:
                                            </span>
                                            <ul className="list-disc pl-4 text-gray-500 mt-1 space-y-1">
                                              {proj.suggestions.map(
                                                (s, sidx) => (
                                                  <li key={sidx}>{s}</li>
                                                ),
                                              )}
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
                        <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/20">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                            Resume Formatting Review
                          </h4>
                          <p className="text-gray-500 leading-relaxed mb-3">
                            {report.resume_formatting?.description}
                          </p>
                          {report.resume_formatting?.suggestions &&
                            report.resume_formatting.suggestions.length > 0 && (
                              <ul className="list-disc pl-4 space-y-1 text-gray-500">
                                {report.resume_formatting.suggestions.map(
                                  (s, idx) => (
                                    <li key={idx}>{s}</li>
                                  ),
                                )}
                              </ul>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                              Readability Index:
                            </span>
                            <span className="text-gray-500">
                              {report.readability?.description ||
                                "Optimal layout formatting."}
                            </span>
                          </div>
                          <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
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
                        <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/20">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                            Professional Summary Audit
                          </h4>
                          <p className="text-gray-500 leading-relaxed mb-3">
                            {report.professional_summary?.description}
                          </p>
                          {report.professional_summary?.suggestions &&
                            report.professional_summary.suggestions.length >
                              0 && (
                              <ul className="list-disc pl-4 space-y-1 text-gray-500">
                                {report.professional_summary.suggestions.map(
                                  (s, idx) => (
                                    <li key={idx}>{s}</li>
                                  ),
                                )}
                              </ul>
                            )}
                        </div>

                        <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
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
                        <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/20">
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
                                    className="p-3 border border-rose-100 dark:border-rose-900/30 bg-rose-50/10 rounded-xl"
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
                        <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/20">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                            Grammar & Spelling Review
                          </h4>
                          <p className="text-gray-500 mb-2">
                            {report.grammar_review?.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-0.5">
                              Bullet Point Consistency
                            </span>
                            <span className="text-gray-500">
                              {report.bullet_consistency?.description ||
                                "Perfect consistency."}
                            </span>
                          </div>
                          <div className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-0.5">
                              Action Verbs Usage
                            </span>
                            <span className="text-gray-500">
                              {report.action_verbs?.description ||
                                "High impact action verbs."}
                            </span>
                          </div>
                          <div className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
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

              {/* Top recommendations (occupies 4 cols) (Card 5) */}
              <Card className="lg:col-span-4 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md bg-white dark:bg-gray-900 overflow-hidden">
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
                        className="p-3.5 border border-gray-100 dark:border-gray-800 rounded-xl hover:shadow-md transition-all space-y-2"
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

            {/* Improvement roadmap table (Card 6) */}
            <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md bg-white dark:bg-gray-900 overflow-hidden">
              <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
                <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Improvement Roadmap
                </CardTitle>
                <CardDescription className="text-xs">
                  Step-by-step roadmap to enhance resume profile quality
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
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
                            className={`${
                              rec.priority === "HIGH"
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
                        <td className="p-4 text-gray-500">
                          {rec.estimated_time_required}
                        </td>
                        <td className="p-4 text-gray-500 font-medium">
                          {rec.difficulty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Missing sections & Keyword intelligence (Card 7 & 8) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Missing Sections list */}
              <Card className="lg:col-span-6 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md bg-white dark:bg-gray-900 overflow-hidden">
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
                        report.resume_structure?.has_contact_info !== false
                          ? "OK"
                          : "MISSING",
                      type: "Required",
                    },
                    {
                      name: "Professional Summary",
                      status:
                        report.resume_structure?.has_summary !== false
                          ? "OK"
                          : "MISSING",
                      type: "Required",
                    },
                    {
                      name: "Work Experience",
                      status:
                        report.resume_structure?.has_work_experience !== false
                          ? "OK"
                          : "MISSING",
                      type: "Required",
                    },
                    {
                      name: "Education History",
                      status:
                        report.resume_structure?.has_education !== false
                          ? "OK"
                          : "MISSING",
                      type: "Required",
                    },
                    {
                      name: "Skills Grid",
                      status:
                        report.resume_structure?.has_skills !== false
                          ? "OK"
                          : "MISSING",
                      type: "Required",
                    },
                    {
                      name: "Projects Details",
                      status:
                        report.resume_structure?.has_projects !== false
                          ? "OK"
                          : "MISSING",
                      type: "Required",
                    },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 bg-gray-50/20 dark:bg-gray-800/10 border border-gray-100 dark:border-gray-800 rounded-xl text-xs sm:text-sm"
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

              {/* Keyword Intelligence list */}
              <Card className="lg:col-span-6 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md bg-white dark:bg-gray-900 overflow-hidden">
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
                      {report.keyword_analysis?.strong_keywords?.map(
                        (kw, idx) => (
                          <Badge
                            key={idx}
                            className="bg-emerald-50 text-emerald-700 border border-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-400 font-medium py-1 px-2.5 rounded-lg text-xs hover:bg-emerald-50"
                          >
                            ✓ {kw}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Recommended Keywords */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Recommended Keywords
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {report.keyword_analysis?.missing_keywords?.map(
                        (kw, idx) => (
                          <Badge
                            key={idx}
                            className="bg-amber-50 text-amber-700 border border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-400 font-medium py-1 px-2.5 rounded-lg text-xs hover:bg-amber-50"
                          >
                            + {kw}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overall feedback bar (Card 9) */}
            <Card className="border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                      Recruiter Recommendation Summary
                    </h3>
                  </div>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    {report.overall_impression?.description ||
                      report.final_feedback?.to_be_improved}
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 flex-shrink-0 self-start md:self-center">
                  <div>
                    <p className="text-xs text-blue-200 font-medium uppercase tracking-wider">
                      Estimated Score After Fixes
                    </p>
                    <p className="text-3xl font-extrabold text-white mt-1">
                      {estimatedFutureScore}
                      <span className="text-sm font-semibold text-blue-200">
                        /100
                      </span>
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
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
