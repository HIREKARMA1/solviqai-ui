"use client";

import { Suspense } from "react";
import { AllAgentsView } from "@/components/assessment-agent/AllAgentsView";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Loader } from "@/components/ui/loader";

export default function AgentsPage() {
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
      <AllAgentsView />
    </Suspense>
  );
}
