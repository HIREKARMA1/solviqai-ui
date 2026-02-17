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
  CodeXml,
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
  Goal,
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
    icon: CodeXml,
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
        {/* Header - Updated to Mock Assessment Design */}
        <div className="bg-white dark:bg-gray-900">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mock Assessment
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
            Apply to multiple jobs automatically using AI-extracted skills
          </p>
        </div>

        {/* Assessment Stats */}
        {/* Assessment Stats - Pastel Cards Design */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          {/* Overall Score - Blue */}
          <Card className="bg-[#E3F2FD] dark:bg-blue-900/20 border-none shadow-md rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-200/50 dark:bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Overall Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {assessment.overall_score || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Readiness Index - Pink */}
          <Card className="bg-[#FCE4EC] dark:bg-pink-900/20 border-none shadow-md rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-pink-200/50 dark:bg-pink-500/20 rounded-full flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Readiness Index</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {assessment.readiness_index || 0}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Completed Rounds - Purple */}
          <Card className="bg-[#F3E5F5] dark:bg-purple-900/20 border-none shadow-md rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-200/50 dark:bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Completed Rounds</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {assessment.rounds?.filter(
                    (r: any) => r.status === "COMPLETED",
                  ).length || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Duration - Yellow */}
          <Card className="bg-[#FFFDE7] dark:bg-yellow-900/20 border-none shadow-md rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-yellow-200/50 dark:bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Duration</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {assessment.rounds?.reduce(
                    (total: number, round: any) => {
                      const duration =
                        roundDisplay[round.round_type]?.duration ||
                        "0 min";
                    },
                    0,
                  ) || 0}{" "}
                  Mins
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rounds - Updated Design */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold">Assessment Rounds</h2>
            <p className="text-gray-500 text-sm">
              Complete each round to progress through your assessment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              const isCompleted = status === "completed";
              const score = round.score || 0;

              return (
                <Card key={round.id} className="border border-gray-200 hover:shadow-md transition-shadow duration-200 bg-[#F2F8FF] overflow-hidden">
                  <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-start space-x-4 w-full md:w-auto">
                      <div className={`p-3 rounded-xl flex-shrink-0 text-white bg-blue-600 shadow-sm border border-blue-500`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{roundInfo.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{roundInfo.description}</p>
                        <div className="text-xs text-gray-500 font-medium bg-gray-100 inline-block px-2 py-1 rounded">
                          {roundInfo.duration.replace("min", "Min")} &nbsp; Score : {score}%
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col items-end">
                      <Button
                        onClick={() => handleStartRound(round)}
                        disabled={!isRoundEnabled && !isCompleted}
                        className={`w-auto px-6 whitespace-nowrap min-w-[100px] ${isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-500 hover:bg-blue-600'
                          } text-white`}
                      >
                        {status === "completed" ? "Retake" : "Start"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>


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
