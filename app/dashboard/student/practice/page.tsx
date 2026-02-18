"use client";

import React, { useState, useEffect } from "react";
import PracticeQuestions from "@/components/PracticeQuestions";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Loader } from "@/components/ui/loader";
import { apiClient } from "@/lib/api";
import SubscriptionRequiredModal from "@/components/subscription/SubscriptionRequiredModal";

export default function PracticePage() {
    const [loading, setLoading] = useState(true);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [isFreeUser, setIsFreeUser] = useState(false);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        try {
            const user = await apiClient.getCurrentUser();
            const subscriptionType = user?.subscription_type || 'free';

            // Free users should be blocked
            if (subscriptionType === 'free') {
                setIsFreeUser(true);
                setShowSubscriptionModal(true);
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
        } finally {
            setLoading(false);
        }
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

    return (
        <DashboardLayout requiredUserType="student">
            {!isFreeUser ? (
                <PracticeQuestions />
            ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="text-center max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Practice Section Unavailable</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            The practice section is available for premium users only.
                        </p>
                    </div>
                </div>
            )}

            <SubscriptionRequiredModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                feature="practice section"
            />
        </DashboardLayout>
    );
}
