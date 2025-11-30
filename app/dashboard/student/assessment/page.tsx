"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { apiClient } from "@/lib/api";
import {
  Home,
  User,
  FileText,
  Briefcase,
  Brain,
  Mic,
  CheckCircle,
  Clock,
  Target,
  MessageCircle,
  AlertCircle,
  TrendingUp,
  Play,
  ArrowRight,
  BarChart3,
  Award,
  Calendar,
  Zap,
  Ruler,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const sidebarItems = [
    { name: 'Dashboard', href: '/dashboard/student', icon: Home },
    { name: 'Profile', href: '/dashboard/student/profile', icon: User },
    { name: 'Resume', href: '/dashboard/student/resume', icon: FileText },
    { name: 'Job Recommendations', href: '/dashboard/student/jobs', icon: Briefcase },
    { name: 'Analytics', href: '/dashboard/student/analytics', icon: BarChart3 },
]

// Round display information
const roundDisplay: Record<
  string,
  {
    name: string;
    description: string;
    duration: string;
    icon: any;
    color: string;
  }
> = {
  aptitude: {
    name: "Aptitude Test",
    description: "Quantitative, Reasoning, English",
    duration: "30 min",
    icon: Brain,
    color: "bg-blue-500",
  },
  soft_skills: {
    name: "Soft Skills",
    description: "Communication, Leadership, Teamwork",
    duration: "20 min",
    icon: User,
    color: "bg-green-500",
  },
  group_discussion: {
    name: "Group Discussion",
    description: "Interactive discussion with AI moderator",
    duration: "25 min",
    icon: MessageCircle,
    color: "bg-violet-500",
  },
  technical_mcq: {
    name: "Technical MCQ",
    description: "Domain-specific questions",
    duration: "30 min",
    icon: Target,
    color: "bg-purple-500",
  },
  coding: {
    name: "Coding Challenge",
    description: "Solve programming tasks with tests",
    duration: "60 min",
    icon: Target,
    color: "bg-emerald-600",
  },
  technical_interview: {
    name: "Technical Interview",
    description: "Voice-based technical discussion",
    duration: "20 min",
    icon: Mic,
    color: "bg-orange-500",
  },
  electrical_circuit: {
    name: "Electrical Circuit Design",
    description: "Design and evaluate a circuit using the interactive workspace",
    duration: "45 min",
    icon: Zap,
    color: "bg-amber-500",
  },
  civil_quantity: {
    name: "Civil Quantity Estimation",
    description: "Estimate quantities for construction projects",
    duration: "45 min",
    icon: Ruler,
    color: "bg-teal-500",
  },
  hr_interview: {
    name: "HR Interview",
    description: "Behavioral and cultural fit",
    duration: "15 min",
    icon: Target,
    color: "bg-pink-500",
  },
};

export default function AssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams?.get("id");

  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      // If no assessment ID, redirect to Job Recommendations
      router.replace("/dashboard/student/jobs");
      return;
    }

    fetchAssessment();
  }, [assessmentId]);

  // Refresh data when page becomes visible (e.g., when navigating back from round)
  useEffect(() => {
    const handleFocus = () => {
      if (assessmentId) {
        fetchAssessment();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [assessmentId]);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAssessmentStatus(assessmentId!);
      console.log("📊 Assessment data received:", data);
      console.log("📊 Rounds data:", data.rounds);
      setAssessment(data);

      // ✅ Auto-complete assessment if all rounds are done (triggers playlist generation)
      if (data.rounds && data.rounds.length > 0) {
        const allRoundsCompleted = data.rounds.every(
          (round: any) => String(round.status).toLowerCase() === "completed",
        );
        const assessmentNotCompleted =
          String(data.status).toLowerCase() !== "completed";

        if (allRoundsCompleted && assessmentNotCompleted) {
          console.log(
            "🎉 All rounds completed! Finalizing assessment and generating playlist...",
          );
          try {
            await apiClient.completeAssessment(assessmentId!);
            toast.success(
              "Assessment completed! Your personalized playlist is being generated.",
            );
            // Refresh to get updated status
            const updatedData = await apiClient.getAssessmentStatus(
              assessmentId!,
            );
            setAssessment(updatedData);
          } catch (completeErr: any) {
            console.error("Error completing assessment:", completeErr);
            // Don't show error to user - the assessment is functionally complete
          }
        }
      }
    } catch (err: any) {
      console.error("Error fetching assessment:", err);
      setError(err.message || "Failed to load assessment");
      toast.error("Failed to load assessment");
    } finally {
      setLoading(false);
    }
  };

  const requestFullscreen = async () => {
    try {
      const elem: any = document.documentElement;
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen)
          await elem.webkitRequestFullscreen();
      }
    } catch (e) {
      // Ignore; some browsers block without gesture, but this is in the click handler
    }
  };

const handleStartRound = async (round: any) => {
    await requestFullscreen();
    const roundType = String(round.round_type || "").toLowerCase();
    if (roundType === "electrical_circuit") {
      const params = new URLSearchParams();
      if (assessmentId) params.set("assessment_id", assessmentId);
      if (round.round_id) params.set("round_id", round.round_id);
      params.set("round_number", String(round.round_number));
      router.push(`/dashboard/student/electrical?${params.toString()}`);
      return;
    }
    if (roundType === "civil_quantity") {
      const params = new URLSearchParams();
      if (assessmentId) params.set("assessment_id", assessmentId);
      if (round.round_id) params.set("round_id", round.round_id);
      params.set("round_number", String(round.round_number));
      router.push(`/dashboard/student/civil?${params.toString()}`);
      return;
    }
    router.push(
      `/dashboard/student/assessment/round?assessment_id=${assessmentId}&round=${round.round_number}`,
    );
  };

  const getRoundStatus = (
    round: any,
  ): "completed" | "in_progress" | "not_started" => {
    console.log(
      "🔍 Checking round status:",
      round.round_type,
      "status:",
      round.status,
    );
    const status = String(round.status).toLowerCase();
    if (status === "completed") return "completed";
    if (status === "in_progress") return "in_progress";
    return "not_started";
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

// Light hover/tint background per round type to match landing theme
  const roundHoverBg: Record<string, string> = {
    aptitude:
      "from-blue-50 to-blue-100/60 dark:from-blue-900/20 dark:to-blue-900/10",
    soft_skills:
      "from-green-50 to-green-100/60 dark:from-green-900/20 dark:to-green-900/10",
    group_discussion:
      "from-violet-50 to-violet-100/60 dark:from-violet-900/20 dark:to-violet-900/10",
    technical_mcq:
      "from-purple-50 to-purple-100/60 dark:from-purple-900/20 dark:to-purple-900/10",
    coding:
      "from-emerald-50 to-emerald-100/60 dark:from-emerald-900/20 dark:to-emerald-900/10",
    electrical_circuit:
      "from-amber-50 to-amber-100/60 dark:from-amber-900/20 dark:to-amber-900/10",
    civil_quantity:
      "from-teal-50 to-teal-100/60 dark:from-teal-900/20 dark:to-teal-900/10",
    technical_interview:
      "from-orange-50 to-orange-100/60 dark:from-orange-900/20 dark:to-orange-900/10",
    hr_interview:
      "from-pink-50 to-pink-100/60 dark:from-pink-900/20 dark:to-pink-900/10",
  };


  if (loading) {
    return (
      <DashboardLayout requiredUserType="student">
        <div className="flex justify-center py-12">
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assessment) {
    return (
      <DashboardLayout requiredUserType="student">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Assessment Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "The requested assessment could not be found."}
          </p>
          <Button onClick={() => router.push("/dashboard/student/jobs")}>
            Back to Job Recommendations
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredUserType="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 border">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Assessment Overview
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {assessment.job_role?.title || "Assessment"} -{" "}
                {assessment.job_role?.category || "General"}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                {assessment.status?.toUpperCase() || "ACTIVE"}
              </Badge>
              <p className="text-sm text-gray-500">
                Started: {new Date(assessment.started_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rotate-45 bg-gradient-to-br from-primary-100/40 to-secondary-100/30 dark:from-primary-900/30 dark:to-secondary-900/20" />
        </div>

        {/* Assessment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="relative overflow-hidden card-hover min-h-[120px]">
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Overall Score</p>
                      <p className="text-3xl font-bold">
                        {assessment.overall_score || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-blue-200/50 to-blue-100/20 dark:from-blue-900/30 dark:to-blue-800/10" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-50 to-blue-100/70 dark:from-blue-900/20 dark:to-blue-900/10" />
            </Card>
          </motion.div>
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="relative overflow-hidden card-hover min-h-[120px]">
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Award className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Readiness Index</p>
                      <p className="text-3xl font-bold">
                        {assessment.readiness_index || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-green-200/50 to-green-100/20 dark:from-green-900/30 dark:to-green-800/10" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-green-50 to-green-100/70 dark:from-green-900/20 dark:to-green-900/10" />
            </Card>
          </motion.div>
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="relative overflow-hidden card-hover min-h-[120px]">
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Completed Rounds</p>
                      <p className="text-3xl font-bold">
                        {assessment.rounds?.filter(
                          (r: any) => r.status === "COMPLETED",
                        ).length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-purple-200/50 to-purple-100/20 dark:from-purple-900/30 dark:to-purple-800/10" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-purple-50 to-purple-100/70 dark:from-purple-900/20 dark:to-purple-900/10" />
            </Card>
          </motion.div>
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="relative overflow-hidden card-hover min-h-[120px]">
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Total Duration</p>
                      <p className="text-3xl font-bold">
                        {assessment.rounds?.reduce(
                          (total: number, round: any) => {
                            const duration =
                              roundDisplay[round.round_type]?.duration ||
                              "0 min";
                            return total + parseInt(duration);
                          },
                          0,
                        ) || 0}{" "}
                        min
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-orange-200/50 to-orange-100/20 dark:from-orange-900/30 dark:to-orange-800/10" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-orange-50 to-orange-100/70 dark:from-orange-900/20 dark:to-orange-900/10" />
            </Card>
          </motion.div>
        </div>

        {/* Rounds */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Rounds</CardTitle>
            <CardDescription>
              Complete each round to progress through your assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {assessment.rounds?.map((round: any, index: number) => {
                const roundInfo = roundDisplay[round.round_type] || {
                  name: `Round ${round.round_number}`,
                  description: "Assessment round",
                  duration: "30 min",
                  icon: Target,
                  color: "bg-gray-500",
                };
                const status: "completed" | "in_progress" | "not_started" =
                  getRoundStatus(round);
                const IconComponent = roundInfo.icon;

                // Check if previous round is completed (for step-by-step progression)
                const previousRound =
                  index > 0 ? assessment.rounds[index - 1] : null;
                const previousRoundStatus:
                  | "completed"
                  | "in_progress"
                  | "not_started" = previousRound
                  ? getRoundStatus(previousRound)
                  : "completed";
                const previousRoundCompleted =
                  previousRoundStatus === "completed";
                const isRoundEnabled =
                  status === "completed" ||
                  previousRoundCompleted ||
                  index === 0;

// Type guard to check if status is 'completed'
                const isCompleted = status === "completed";
                const isDisabled = !isRoundEnabled && !isCompleted;

                return (
                  <motion.div
                    key={round.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: index * 0.05 }}
                    whileHover={{ y: -2 }}
                    className={`group relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 sm:p-5 border rounded-xl sm:rounded-2xl card-hover`}
                    style={{ opacity: isDisabled ? 0.5 : 1 }}
                  >
                    <div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${roundHoverBg[round.round_type] || "from-primary-50 to-secondary-50"}`}
                    />
                    <div
                      className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${roundHoverBg[round.round_type] || "from-primary-100/40 to-secondary-100/20"}`}
                    />
                    <div className="flex items-center space-x-3 sm:space-x-4 relative z-10 flex-1 min-w-0">
                      <div
                        className={`p-2 sm:p-3 rounded-xl text-white shadow-sm flex-shrink-0 ${roundInfo.color}`}
                      >
                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{roundInfo.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 sm:line-clamp-none">
                          {roundInfo.description}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                          {roundInfo.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 relative z-10 flex-shrink-0">
                      <Badge
                        className={`${getStatusColor(status)} ${status === "in_progress" ? "animate-pulse" : ""} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1`}
                      >
                        {getStatusIcon(status)}
                        <span className="ml-1 capitalize whitespace-nowrap">
                          {status.replace("_", " ")}
                        </span>
                      </Badge>
                      {status === "completed" && round.score && (
                        <div className="text-right">
                          <p className="text-xs sm:text-sm font-medium">
                            {round.score} points
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500">
                            {round.percentage}%
                          </p>
                        </div>
                      )}
                      {status !== "completed" && (
                        <Button
                          onClick={() => handleStartRound(round)}
                          disabled={!isRoundEnabled}
                          size="sm"
                          className="text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10 whitespace-nowrap"
                        >
                          {status === "in_progress" ? "Continue" : "Start"}
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>


        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/student/jobs")}
          >
            Back to Job Recommendations
          </Button>
          {assessment.status === "completed" && (
            <Button
              onClick={() =>
                router.push(
                  `/dashboard/student/assessment/report?id=${assessmentId}`,
                )
              }
            >
              View Report
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
