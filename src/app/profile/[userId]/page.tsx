"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import userProfileService from "@/lib/userProfileService";
import { User } from "@/types";
import ConnectionRequestModal from "@/components/ConnectionRequestModal";
import ChatWindow from "@/components/ChatWindow";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);

  const userId = params?.userId as string;

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError("");

      const profile = await userProfileService.getUserProfile(userId);
      if (profile) {
        const user = userProfileService.convertToUser(
          profile,
          { lat: 0, lng: 0 },
          0
        );
        setProfileUser(user);
      } else {
        setError("User profile not found");
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setError("Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionSuccess = () => {
    setShowConnectionModal(false);
    // Redirect to dashboard with success message
    router.push("/dashboard?connectionSent=true");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <p className="text-gray-600">{error || "User not found"}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Don't show own profile
  if (currentUser && profileUser.id === currentUser.uid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-600 mb-4">👤</div>
          <p className="text-gray-600">This is your own profile</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => window.history.back()}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold">Profile</h1>
          <div className="w-6"></div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 mx-auto mb-4">
              {profileUser.profilePictureUrl ? (
                <img
                  src={profileUser.profilePictureUrl}
                  alt={profileUser.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
                  👤
                </div>
              )}
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {profileUser.displayName}
            </h2>

            <p className="text-gray-600 mb-4">
              {profileUser.headline || "Cirql User"}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowConnectionModal(true);
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Send Connection Request
              </button>

              <button
                onClick={() => setShowChatWindow(true)}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">About</h3>

          {profileUser.bio && (
            <div className="mb-4">
              <p className="text-gray-700">{profileUser.bio}</p>
            </div>
          )}

          {profileUser.interests && profileUser.interests.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {profileUser.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profileUser.occupation && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-1">Occupation</h4>
              <p className="text-gray-700">{profileUser.occupation}</p>
            </div>
          )}

          {profileUser.socialLinks &&
            Object.keys(profileUser.socialLinks).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Social Links</h4>
                <div className="space-y-1">
                  {Object.entries(profileUser.socialLinks).map(
                    ([platform, handle]) => (
                      <p key={platform} className="text-sm text-gray-700">
                        <span className="capitalize font-medium">
                          {platform}:
                        </span>{" "}
                        {handle}
                      </p>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Modals */}
      {showConnectionModal && (
        <ConnectionRequestModal
          user={profileUser}
          onClose={() => {
            setShowConnectionModal(false);
          }}
          onSuccess={handleConnectionSuccess}
        />
      )}

      {showChatWindow && currentUser && (
        <ChatWindow
          otherUser={profileUser}
          onClose={() => setShowChatWindow(false)}
        />
      )}
    </div>
  );
}
