'use client';

import { useState, useEffect } from 'react';
import { GroupDiscussionRound } from '@/components/assessment/GroupDiscussionRound';
import SubscriptionRequiredModal from '../subscription/SubscriptionRequiredModal';
import { config } from '@/lib/config';

interface PracticeGroupDiscussionProps {
  isFreeUser?: boolean;
}

export default function PracticeGroupDiscussion({ isFreeUser = false }: PracticeGroupDiscussionProps) {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);

  // Check Subscription Status
  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch(`${config.api.fullUrl}/api/v1/students/subscription-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const statusData = await response.json();
          const isExpired = statusData.days_remaining !== null && statusData.days_remaining < 0;

          if (isExpired) {
            setIsLimitReached(true);
            setShowSubscriptionModal(true);
          }
        }
      } catch (err) {
        console.error("Failed to check subscription", err);
      }
    };
    checkUser();
  }, []);

  return (
    <>
      <div className={isLimitReached ? "opacity-50 pointer-events-none" : ""}>
        <GroupDiscussionRound
          mode="practice"
          practiceJoinPayload={{ mode: 'practice' }}
        />
      </div>

      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        feature="AI Group Discussion Practice"
      />

      {isLimitReached && (
        <div className="fixed inset-0 z-10 flex items-center justify-center p-4 bg-white/20 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-red-100 max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-4V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2v-4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Required</h2>
            <p className="text-gray-600 mb-6">Your access to AI Group Discussion has expired or reached its limit. Please upgrade your plan to continue practicing.</p>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
