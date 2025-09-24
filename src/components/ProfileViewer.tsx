"use client";

import { useState, useEffect } from "react";
import { User, Connection } from "@/types";
import userProfileService, { UserProfile } from "@/lib/userProfileService";
import connectionService from "@/lib/connectionService";
import { useAuth } from "@/contexts/AuthContext";
import ConnectionRequestModal from "./ConnectionRequestModal";

interface ProfileViewerProps {
  user: User;
  onClose: () => void;
}

export default function ProfileViewer({ user, onClose }: ProfileViewerProps) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<Connection | null>(
    null
  );
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  useEffect(() => {
    if (user.id) {
      loadProfile();
    } else {
      setError("Invalid user data");
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (currentUser && user.id !== currentUser.uid) {
      checkConnectionStatus();
    }
  }, [currentUser, user.id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      // Check if user.id exists
      if (!user.id) {
        throw new Error("User ID is required");
      }

      const userProfile = await userProfileService.getUserProfile(user.id);
      if (userProfile) {
        setProfile(userProfile);
      } else {
        // If no profile found, create a basic one from the user data
        const basicProfile: UserProfile = {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          interests: user.interests || [],
          headline: user.headline || "Cirql User",
          bio: user.bio || "",
          age: user.age,
          location: user.location
            ? `${user.location.lat}, ${user.location.lng}`
            : "",
          occupation: user.occupation || "",
          profilePictureUrl: user.profilePictureUrl || "",
          socialLinks: user.socialLinks || {},
          isVisible: user.isVisible !== false,
          distanceRadius: user.distanceRadius || 100,
          createdAt: user.createdAt || new Date(),
          updatedAt: user.updatedAt || new Date(),
        };
        setProfile(basicProfile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    if (!currentUser) return;

    try {
      const connection = await connectionService.getConnectionStatus(
        currentUser.uid,
        user.id
      );
      setConnectionStatus(connection);
    } catch (error) {
      console.error("Error checking connection status:", error);
    }
  };

  const shouldShowConnectButton = () => {
    // Don't show connect button for own profile
    if (!currentUser || user.id === currentUser.uid) {
      return false;
    }

    // Don't show connect button if already connected
    if (connectionStatus?.status === "accepted") {
      return false;
    }

    // Don't show connect button if user is not visible
    if (user.isVisible === false) {
      return false;
    }

    return true;
  };

  const getConnectionButtonText = () => {
    if (!connectionStatus) return "Connect";

    switch (connectionStatus.status) {
      case "pending":
        return connectionStatus.userId === currentUser?.uid
          ? "Pending"
          : "Respond";
      case "accepted":
        return "Connected";
      case "rejected":
        return "Connect";
      default:
        return "Connect";
    }
  };

  const getConnectionButtonStyle = () => {
    if (!connectionStatus) return "bg-blue-600 hover:bg-blue-700";

    switch (connectionStatus.status) {
      case "pending":
        return connectionStatus.userId === currentUser?.uid
          ? "bg-yellow-600 hover:bg-yellow-700"
          : "bg-green-600 hover:bg-green-700";
      case "accepted":
        return "bg-green-600 hover:bg-green-700";
      case "rejected":
        return "bg-blue-600 hover:bg-blue-700";
      default:
        return "bg-blue-600 hover:bg-blue-700";
    }
  };

  const isConnectionDisabled = () => {
    return (
      connectionStatus?.status === "pending" &&
      connectionStatus.userId === currentUser?.uid
    );
  };

  const getConnectionStatusText = () => {
    if (!currentUser || user.id === currentUser.uid) {
      return null; // Don't show status for own profile
    }

    // Show if user is not visible
    if (user.isVisible === false) {
      return "Profile not visible";
    }

    if (!connectionStatus) {
      return null; // No connection status yet
    }

    switch (connectionStatus.status) {
      case "accepted":
        return "Connected";
      case "pending":
        return connectionStatus.userId === currentUser.uid
          ? "Request sent"
          : "Wants to connect";
      case "rejected":
        return "Connection declined";
      default:
        return null;
    }
  };

  const handleConnectionSuccess = () => {
    checkConnectionStatus();
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

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
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

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Profile not found</p>
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
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center mx-auto mb-4">
              {profile.profilePictureUrl ? (
                <img
                  src={profile.profilePictureUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-blue-600 font-semibold text-2xl">${profile.displayName
                        .charAt(0)
                        .toUpperCase()}</span>`;
                    }
                  }}
                />
              ) : (
                <span className="text-blue-600 font-semibold text-2xl">
                  {profile.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {profile.displayName}
            </h3>

            {profile.headline && (
              <p className="text-gray-600 mb-2">{profile.headline}</p>
            )}

            {user.distance !== undefined && (
              <p className="text-sm text-blue-600">
                {Math.round(user.distance)}m away
              </p>
            )}

            {getConnectionStatusText() && (
              <p
                className={`text-sm mt-2 font-medium ${
                  getConnectionStatusText() === "Connected"
                    ? "text-green-600"
                    : getConnectionStatusText() === "Profile not visible"
                    ? "text-gray-500"
                    : getConnectionStatusText() === "Connection declined"
                    ? "text-red-500"
                    : "text-blue-600"
                }`}
              >
                {getConnectionStatusText()}
              </p>
            )}
          </div>

          {/* Profile Details */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.age && profile.showAge && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <p className="text-gray-900">{profile.age} years old</p>
                  </div>
                )}

                {profile.occupation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occupation
                    </label>
                    <p className="text-gray-900">{profile.occupation}</p>
                  </div>
                )}

                {profile.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <p className="text-gray-900">{profile.location}</p>
                  </div>
                )}

                {profile.showEmail && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  About
                </h4>
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Interests
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {profile.socialLinks && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Social Links
                </h4>
                <div className="space-y-3 flex flex-wrap gap-2">
                  {profile.socialLinks.instagram && (
                    <a
                      href={`https://instagram.com/${profile.socialLinks.instagram.replace(
                        "@",
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </div>
                    </a>
                  )}

                  {profile.socialLinks.twitter && (
                    <a
                      href={`https://twitter.com/${profile.socialLinks.twitter.replace(
                        "@",
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                      </div>
                    </a>
                  )}

                  {profile.socialLinks.linkedin && (
                    <a
                      href={
                        profile.socialLinks.linkedin.startsWith("http")
                          ? profile.socialLinks.linkedin
                          : `https://linkedin.com/in/${profile.socialLinks.linkedin}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Connection Status */}
            <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
              <div
                className={`w-3 h-3 rounded-full ${
                  user.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {user.isOnline ? "Online" : "Offline"}
              </span>
              {user.distance !== undefined && (
                <span className="text-sm text-gray-500 ml-4">
                  • {Math.round(user.distance)}m away
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            {shouldShowConnectButton() && (
              <button
                onClick={() => setShowConnectionModal(true)}
                disabled={isConnectionDisabled()}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  isConnectionDisabled()
                    ? "bg-gray-400 cursor-not-allowed"
                    : getConnectionButtonStyle()
                }`}
              >
                {getConnectionButtonText()}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Connection Request Modal */}
      {showConnectionModal && currentUser && (
        <ConnectionRequestModal
          user={user}
          onClose={() => setShowConnectionModal(false)}
          onSuccess={handleConnectionSuccess}
        />
      )}
    </div>
  );
}
