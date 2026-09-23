"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase,
  ChevronRight,
  FileText,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StudentBrandPageShell } from "@/components/dashboard/StudentBrandPageShell";

const AGENTS = [
  {
    href: "/dashboard/student/resume",
    title: "Resume Agent",
    description: "Build ATS-optimized resumes tailored to any job.",
    icon: FileText,
    iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
    featured: false,
  },
  {
    href: "/dashboard/student/agents/assessment",
    title: "Assessment Agent",
    description: "Find the right jobs and practice AI-powered assessments.",
    icon: Briefcase,
    iconClass: "bg-white text-violet-600 shadow-sm dark:bg-violet-950/50 dark:text-violet-300",
    featured: true,
  },
  {
    href: "/dashboard/student/career-guidance",
    title: "Career Agent",
    description: "Plan your career with AI guidance.",
    icon: Sparkles,
    iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
    featured: false,
  },
];

export function AllAgentsView() {
  return (
    <DashboardLayout requiredUserType="student">
      <StudentBrandPageShell className="bg-[#FAFAFC] dark:bg-slate-950">
        <div className="mx-auto max-w-2xl px-1 pt-2">
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-white">
            All Agents
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose an AI agent to help you achieve your goals
          </p>

          <div className="mt-8 space-y-3">
            {AGENTS.map((agent, index) => {
              const Icon = agent.icon;
              return (
                <motion.div
                  key={agent.href}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={agent.href} className="block">
                    <div
                      className={`group flex items-center gap-4 rounded-[16px] border bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${
                        agent.featured
                          ? "border-violet-200 hover:border-violet-300 dark:border-violet-800"
                          : "border-slate-200/80 hover:border-slate-300 dark:border-slate-800"
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${agent.iconClass}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-slate-900 dark:text-white">
                          {agent.title}
                        </p>
                        <p className="mt-0.5 text-sm leading-snug text-slate-500">
                          {agent.description}
                        </p>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 ${
                          agent.featured ? "text-violet-400" : "text-slate-300"
                        }`}
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </StudentBrandPageShell>
    </DashboardLayout>
  );
}
