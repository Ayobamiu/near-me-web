"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import useUserProfile from "@/hooks/useUserProfile";
import { ProfileCompletionService } from "@/lib/profileCompletionService";
import OnboardingFlow from "./OnboardingFlow";

interface ProfileCompletionGateProps {
  children: React.ReactNode;
}

export default function ProfileCompletionGate({
  children,
}: ProfileCompletionGateProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  const [isChecking, setIsChecking] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      // Wait for auth and profile to load
      if (authLoading || profileLoading) return;

      // If no user, let the auth flow handle it
      if (!user) {
        setIsChecking(false);
        return;
      }

      // Check if profile is complete
      const completionStatus =
        ProfileCompletionService.checkProfileCompletion(profile);

      if (!completionStatus.isComplete) {
        setShowOnboarding(true);
      }

      setIsChecking(false);
    };

    checkProfileCompletion();
  }, [user, profile, authLoading, profileLoading]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // The onboarding flow will handle the redirect
  };

  // Show loading while checking
  if (authLoading || profileLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if profile is incomplete
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Show the protected content if profile is complete
  return <>{children}</>;
}
