"use client";

import { useState, useEffect } from "react";
import { User, Connection } from "@/types";
import ProfileViewer from "./ProfileViewer";
import ConnectionRequestModal from "./ConnectionRequestModal";
import connectionService from "@/lib/connectionService";
import { useAuth } from "@/contexts/AuthContext";

interface UserCardProps {
  user: User;
  showConnectionButton?: boolean;
  onConnect?: (userId: string) => void;
  onViewProfile?: (user: User) => void;
}

export default function UserCard({
  user,
  showConnectionButton = true,
  onConnect,
  onViewProfile,
}: UserCardProps) {
  const { user: currentUser } = useAuth();
  const [showProfileViewer, setShowProfileViewer] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<Connection | null>(
    null
  );

  useEffect(() => {
    if (currentUser && user.id !== currentUser.uid) {
      checkConnectionStatus();
    }
  }, [currentUser, user.id]);

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

  const handleConnect = () => {
    if (onConnect) {
      onConnect(user.id);
    } else {
      setShowConnectionModal(true);
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(user);
    } else {
      setShowProfileViewer(true);
    }
  };

  const handleConnectionSuccess = () => {
    checkConnectionStatus();
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

  const isConnectionDisabled = () => {
    return (
      connectionStatus?.status === "pending" &&
      connectionStatus.userId === currentUser?.uid
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-3">
          {/* Profile Picture */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
            {user.profilePictureUrl ? (
              <img
                src={user.profilePictureUrl}
                alt={user.displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-blue-600 font-semibold text-sm">${user.displayName
                      .charAt(0)
                      .toUpperCase()}</span>`;
                  }
                }}
              />
            ) : (
              <span className="text-blue-600 font-semibold text-sm">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {user.displayName}
                </h3>
                {user.headline && (
                  <p className="text-xs text-gray-600 truncate mt-1">
                    {user.headline}
                  </p>
                )}
                {user.occupation && (
                  <p className="text-xs text-gray-500 truncate">
                    {user.occupation}
                  </p>
                )}
                {user.distance !== undefined && (
                  <p className="text-xs text-blue-600 mt-1">
                    {Math.round(user.distance)}m away
                  </p>
                )}
                {getConnectionStatusText() && (
                  <p
                    className={`text-xs mt-1 font-medium ${
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

              {/* Online Status */}
              <div className="flex items-center space-x-1 ml-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    user.isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-xs text-gray-500">
                  {user.isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            {/* Interests */}
            {user.interests && user.interests.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {user.interests.slice(0, 3).map((interest, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                  {user.interests.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{user.interests.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Bio Preview */}
            {user.bio && (
              <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                {user.bio}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleViewProfile}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View Profile
              </button>
              {showConnectionButton && shouldShowConnectButton() && (
                <button
                  onClick={handleConnect}
                  disabled={isConnectionDisabled()}
                  className={`text-xs text-white px-3 py-1 rounded-full transition-colors ${
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
      </div>

      {/* Profile Viewer Modal */}
      {showProfileViewer && (
        <ProfileViewer
          user={user}
          onClose={() => setShowProfileViewer(false)}
        />
      )}

      {/* Connection Request Modal */}
      {showConnectionModal && currentUser && (
        <ConnectionRequestModal
          user={user}
          onClose={() => setShowConnectionModal(false)}
          onSuccess={handleConnectionSuccess}
        />
      )}
    </>
  );
}
