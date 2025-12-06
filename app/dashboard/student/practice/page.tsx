"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BookOpen, Code, Wrench, Calculator } from "lucide-react";

export default function PracticePage() {
    const router = useRouter();

    return (
        <DashboardLayout requiredUserType="student">
            <div className="space-y-6 p-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Practice</h1>
                    <p className="text-muted-foreground">
                        Enhance your skills with practice exercises
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/dashboard/student/practice/coding")}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <CardTitle>Coding Challenges</CardTitle>
                            </div>
                            <CardDescription>
                                Practice coding problems and improve your programming skills
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/dashboard/student/practice/technical")}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <Wrench className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <CardTitle>Technical Skills</CardTitle>
                            </div>
                            <CardDescription>
                                Test your technical knowledge and problem-solving abilities
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/dashboard/student/practice/practical")}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                    <Calculator className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <CardTitle>Practical Skills</CardTitle>
                            </div>
                            <CardDescription>
                                Practice real-world engineering and practical scenarios
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
