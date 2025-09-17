"use client";

import { useState } from "react";
import { User } from "@/types";
import ProfileViewer from "./ProfileViewer";

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
  const [showProfileViewer, setShowProfileViewer] = useState(false);

  const handleConnect = () => {
    onConnect?.(user.id);
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(user);
    } else {
      setShowProfileViewer(true);
    }
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
              {showConnectionButton && (
                <button
                  onClick={handleConnect}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
                >
                  Connect
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
    </>
  );
}
