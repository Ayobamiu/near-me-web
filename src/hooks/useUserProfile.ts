"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import userProfileService, { UserProfile } from "@/lib/userProfileService";

export default function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");
      const userProfile = await userProfileService.getUserProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
      } else {
        // Create default profile
        const defaultProfile: UserProfile = {
          id: user.uid,
          displayName: user.displayName || "Anonymous User",
          email: user.email || "",
          interests: [],
          headline: "Cirql User",
          bio: "",
          isVisible: true,
          distanceRadius: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = () => {
    loadProfile();
  };

  return {
    profile,
    loading,
    error,
    refreshProfile,
  };
}
