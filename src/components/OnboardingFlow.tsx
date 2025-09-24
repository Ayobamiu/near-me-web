"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import useUserProfile from "@/hooks/useUserProfile";
import userProfileService from "@/lib/userProfileService";
import {
  ProfileCompletionService,
  OnboardingData,
} from "@/lib/profileCompletionService";
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Heart,
  Link,
  Shield,
} from "lucide-react";
import { INTEREST_CATEGORIES } from "@/lib/interestsService";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  const [currentStep, setCurrentStep] = useState<
    "basic" | "interests" | "social" | "privacy"
  >("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    displayName: "",
    headline: "",
    occupation: "",
    bio: "",
    profilePictureUrl: "",
    interests: [],
    socialLinks: {},
    isVisible: true,
    distanceRadius: 100,
    showAge: false,
    showEmail: false,
  });

  // Initialize data from existing profile
  useEffect(() => {
    if (profile && !profileLoading) {
      setOnboardingData({
        displayName: profile.displayName || "",
        headline: profile.headline || "",
        occupation: profile.occupation || "",
        bio: profile.bio || "",
        profilePictureUrl: profile.profilePictureUrl || "",
        interests: profile.interests || [],
        socialLinks: profile.socialLinks || {},
        isVisible: profile.isVisible !== false,
        distanceRadius: profile.distanceRadius || 100,
        showAge: profile.showAge || false,
        showEmail: profile.showEmail || false,
      });
    }
  }, [profile, profileLoading]);

  const steps = [
    { key: "basic", title: "Basic Info", icon: User },
    { key: "interests", title: "Interests", icon: Heart },
    { key: "social", title: "Social Links", icon: Link },
    { key: "privacy", title: "Privacy", icon: Shield },
  ];

  const currentStepIndex = steps.findIndex((step) => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = async () => {
    // Validate current step
    const validation = ProfileCompletionService.validateStep(
      currentStep,
      onboardingData
    );
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);

    // If this is the last step, save and complete
    if (currentStepIndex === steps.length - 1) {
      await handleComplete();
    } else {
      setCurrentStep(
        steps[currentStepIndex + 1].key as
          | "basic"
          | "interests"
          | "social"
          | "privacy"
      );
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(
        steps[currentStepIndex - 1].key as
          | "basic"
          | "interests"
          | "social"
          | "privacy"
      );
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update user profile with onboarding data
      await userProfileService.updateUserProfile(user.uid, {
        ...onboardingData,
        updatedAt: new Date(),
      });

      // Get intended destination from URL params
      const returnTo = searchParams.get("returnTo");
      const placeId = searchParams.get("placeId");

      if (returnTo && placeId) {
        // Redirect to specific place
        router.push(`/place/${placeId}`);
      } else if (returnTo === "places") {
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        // Default redirect to dashboard
        router.push("/dashboard");
      }

      onComplete();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setErrors(["Failed to save profile. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (
    field: keyof OnboardingData,
    value: string | number | boolean | string[] | object
  ) => {
    setOnboardingData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors([]);
  };

  const toggleInterest = (interest: string) => {
    setOnboardingData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const updateSocialLink = (
    platform: "instagram" | "twitter" | "linkedin",
    value: string
  ) => {
    setOnboardingData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "basic":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={onboardingData.displayName}
                onChange={(e) => updateField("displayName", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your display name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Headline *
              </label>
              <input
                type="text"
                value={onboardingData.headline}
                onChange={(e) => updateField("headline", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Software Engineer at Tech Corp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occupation *
              </label>
              <input
                type="text"
                value={onboardingData.occupation}
                onChange={(e) => updateField("occupation", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio (Optional)
              </label>
              <textarea
                value={onboardingData.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us a bit about yourself..."
              />
            </div>
          </div>
        );

      case "interests":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">
                Select at least 4 interests that describe your professional
                focus
              </p>
              <p className="text-sm text-gray-500">
                Selected: {onboardingData.interests.length} / 4 minimum
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-4">
                {Object.entries(INTEREST_CATEGORIES).map(
                  ([categoryKey, category], index) => (
                    <div key={categoryKey + index}>
                      <h4 className="font-medium text-gray-900 mb-2">
                        {category.icon} {category.name}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                        {category.options.map((interest, categoryIndex) => (
                          <button
                            key={interest + categoryIndex}
                            onClick={() => toggleInterest(interest)}
                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                              onboardingData.interests.includes(interest)
                                ? "bg-blue-100 border-blue-500 text-blue-700"
                                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            {interest}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );

      case "social":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">
                Add at least one social link to build trust and connections
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={onboardingData.socialLinks.linkedin || ""}
                  onChange={(e) => updateSocialLink("linkedin", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter
                </label>
                <input
                  type="url"
                  value={onboardingData.socialLinks.twitter || ""}
                  onChange={(e) => updateSocialLink("twitter", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  value={onboardingData.socialLinks.instagram || ""}
                  onChange={(e) =>
                    updateSocialLink("instagram", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Visibility Preference
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    checked={onboardingData.isVisible}
                    onChange={() => updateField("isVisible", true)}
                    className="mr-3"
                  />
                  <span>Visible to others in places (Recommended)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    checked={!onboardingData.isVisible}
                    onChange={() => updateField("isVisible", false)}
                    className="mr-3"
                  />
                  <span>Hidden from others</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discovery Radius: {onboardingData.distanceRadius}m
              </label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={onboardingData.distanceRadius}
                onChange={(e) =>
                  updateField("distanceRadius", parseInt(e.target.value))
                }
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>10m</span>
                <span>500m</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Public Information Consent
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Choose what personal information you want to share with other
                users in places:
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Show Age</h4>
                    <p className="text-sm text-gray-600">
                      Allow others to see your age on your profile
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onboardingData.showAge}
                      onChange={(e) => updateField("showAge", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Show Email</h4>
                    <p className="text-sm text-gray-600">
                      Allow others to see your email address on your profile
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onboardingData.showEmail}
                      onChange={(e) =>
                        updateField("showEmail", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can change these settings anytime
                  in your profile settings. Your privacy and security are
                  important to us.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const stepInfo = ProfileCompletionService.getStepInfo(currentStep);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">{stepInfo.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.key} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-2 ${
                    isActive ? "text-blue-600 font-medium" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {stepInfo.title}
          </h2>

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <ul className="text-sm text-red-600">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={isLoading}
            className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : currentStepIndex === steps.length - 1 ? (
              <>
                Complete Profile
                <CheckCircle className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
