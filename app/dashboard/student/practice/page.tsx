"use client";

import React, { useState } from "react";
import PracticeQuestions from "@/components/PracticeQuestions";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function PracticePage() {
    const [inPractice, setInPractice] = useState(false);

    return (
        <DashboardLayout requiredUserType="student" hideNavigation={inPractice}>
            <PracticeQuestions onPracticeModeChange={setInPractice} />
        </DashboardLayout>
    );
}
