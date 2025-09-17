"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import userProfileService, { UserProfile } from "@/lib/userProfileService";
import { INTEREST_CATEGORIES } from "@/lib/interestsService";

interface ProfileManagerProps {
  onClose: () => void;
  onSave?: () => void;
}

export default function ProfileManager({
  onClose,
  onSave,
}: ProfileManagerProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showInterestSelector, setShowInterestSelector] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userProfile = await userProfileService.getUserProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
        setSelectedInterests(userProfile.interests || []);
      } else {
        // Create default profile
        const defaultProfile: UserProfile = {
          id: user.uid,
          displayName: user.displayName || "Anonymous User",
          email: user.email || "",
          interests: [],
          headline: "NearMe User",
          bio: "",
          isVisible: true,
          distanceRadius: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setProfile(defaultProfile);
        setSelectedInterests([]);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    console.log({ profile, user });
    // return;
    try {
      setSaving(true);
      setError("");

      await userProfileService.updateUserProfile(user.uid, {
        ...profile,
        interests: selectedInterests,
      });

      onSave?.();
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleInputChange = (
    field: keyof UserProfile,
    value: string | number | boolean | object
  ) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load profile</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profile.displayName}
                    onChange={(e) =>
                      handleInputChange("displayName", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your display name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={profile.age || ""}
                    onChange={(e) =>
                      handleInputChange("age", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your age"
                    min="13"
                    max="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={profile.headline || ""}
                    onChange={(e) =>
                      handleInputChange("headline", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="A short description about yourself"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={profile.occupation || ""}
                    onChange={(e) =>
                      handleInputChange("occupation", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your job or profession"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                value={profile.bio || ""}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Interests */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Interests
                </h3>
                <button
                  onClick={() => setShowInterestSelector(!showInterestSelector)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  {showInterestSelector ? "Hide" : "Select"} Interests
                </button>
              </div>

              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedInterests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {interest}
                      <button
                        onClick={() => handleInterestToggle(interest)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {showInterestSelector && (
                <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-4">
                    {Object.entries(INTEREST_CATEGORIES).map(
                      ([categoryKey, category], index) => (
                        <div key={categoryKey + index}>
                          <h4 className="font-medium text-gray-900 mb-2">
                            {category.icon} {category.name}
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {category.options.map((interest, categoryIndex) => (
                              <label
                                key={interest + categoryIndex}
                                className="flex items-center space-x-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedInterests.includes(interest)}
                                  onChange={() =>
                                    handleInterestToggle(interest)
                                  }
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">
                                  {interest}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Social Links
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={profile.socialLinks?.instagram || ""}
                    onChange={(e) =>
                      handleInputChange("socialLinks", {
                        ...profile.socialLinks,
                        instagram: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter
                  </label>
                  <input
                    type="text"
                    value={profile.socialLinks?.twitter || ""}
                    onChange={(e) =>
                      handleInputChange("socialLinks", {
                        ...profile.socialLinks,
                        twitter: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    value={profile.socialLinks?.linkedin || ""}
                    onChange={(e) =>
                      handleInputChange("socialLinks", {
                        ...profile.socialLinks,
                        linkedin: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Privacy Settings
              </h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={profile.isVisible !== false}
                    onChange={(e) =>
                      handleInputChange("isVisible", e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Make my profile visible to other users
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
