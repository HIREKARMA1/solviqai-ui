"use client";

import { Suspense } from "react";
import { RoundResultScreen } from "@/components/assessment-agent/RoundResultScreen";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Loader } from "@/components/ui/loader";

export default function AssessmentAgentRoundResultPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout requiredUserType="student">
          <div className="flex justify-center py-20">
            <Loader size="lg" />
          </div>
        </DashboardLayout>
      }
    >
      <RoundResultScreen />
    </Suspense>
  );
}
