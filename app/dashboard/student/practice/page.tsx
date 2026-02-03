"use client";

import React, { useState, useEffect } from "react";
import PracticeQuestions from "@/components/PracticeQuestions";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Loader } from "@/components/ui/loader";
import { apiClient } from "@/lib/api";
import SubscriptionRequiredModal from "@/components/subscription/SubscriptionRequiredModal";

export default function PracticePage() {
    const [inPractice, setInPractice] = useState(false);
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

            // Check Subscription Status
            if (subscriptionType === 'free') {
                setIsFreeUser(true);
                // Don't show modal immediately, let components handle limits
            }
            // Check Premium Expiry
            if (subscriptionType === 'premium' && user?.subscription_expiry) {
                if (new Date(user.subscription_expiry) < new Date()) {
                    setShowSubscriptionModal(true);
                }
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
        <DashboardLayout requiredUserType="student" hideNavigation={inPractice}>
            <PracticeQuestions
                onPracticeModeChange={setInPractice}
                isFreeUser={isFreeUser}
            />

            <SubscriptionRequiredModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                feature="practice section"
            />
        </DashboardLayout>
    );
}
