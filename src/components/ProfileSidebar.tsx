"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/types";
import useUserProfile from "@/hooks/useUserProfile";

interface ProfileSidebarProps {
  onViewProfile: (user: User) => void;
  pendingConnectionsCount: number;
  activeConnectionsCount: number;
  onEditProfile: () => void;
  onManageConnections: () => void;
  onMessages: () => void;
  onSignOut: () => void;
}

export default function ProfileSidebar({
  onViewProfile,
  pendingConnectionsCount,
  activeConnectionsCount,
  onEditProfile,
  onManageConnections,
  onMessages,
  onSignOut,
}: ProfileSidebarProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  if (!user) return null;

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const displayName =
      profile?.displayName || user.displayName || user.email || "User";
    return displayName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-64 bg-white rounded-lg shadow-sm border p-4 h-fit">
      {/* Profile Header */}
      <div className="text-center mb-4">
        <div className="relative inline-block">
          {profile?.profilePictureUrl || user.photoURL ? (
            <img
              src={
                profile?.profilePictureUrl ||
                user.photoURL ||
                "/default-avatar.svg"
              }
              alt={profile?.displayName || user.displayName || "User"}
              className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-semibold text-lg">
                {getUserInitials()}
              </span>
            </div>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">
          {profile?.headline ||
            profile?.displayName ||
            user.displayName ||
            "User"}
        </h3>
        <p className="text-xs text-gray-500">@{user.email?.split("@")[0]}</p>
      </div>

      {/* Quick Stats */}
      <div className="border-t border-gray-100 pt-3 mb-4">
        {/* TODO: Connect to actual user's feed posts count */}
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Posts</span>
          <span className="font-medium text-gray-400">-</span>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Active Connections</span>
          <span className="font-medium text-green-600">
            {activeConnectionsCount}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Pending Requests</span>
          <span className="font-medium text-orange-600">
            {pendingConnectionsCount}
          </span>
        </div>
        {/* TODO: Connect to actual places user has visited */}
        <div className="flex justify-between text-xs text-gray-600">
          <span>Places Visited</span>
          <span className="font-medium text-gray-400">-</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-1">
        <button
          onClick={() =>
            onViewProfile({
              id: user.uid,
              displayName: user.displayName || "User",
              email: user.email || "",
              profilePictureUrl: user.photoURL || undefined,
              interests: [],
              headline: "NearMe User",
              bio: "",
              age: undefined,
              location: undefined,
              occupation: "",
              socialLinks: {},
              isVisible: true,
              distanceRadius: 100,
              joinedAt: new Date(),
              isOnline: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }
          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors border-b border-transparent hover:border-blue-200"
        >
          👤 View Profile
        </button>
        <button
          onClick={onMessages}
          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors border-b border-transparent hover:border-blue-200"
        >
          💬 Messages
        </button>
        <button
          onClick={onManageConnections}
          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors border-b border-transparent hover:border-blue-200"
        >
          🤝 Manage Connections
        </button>
        <button
          onClick={onEditProfile}
          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors border-b border-transparent hover:border-blue-200"
        >
          ✏️ Edit Profile
        </button>
        <button
          onClick={onSignOut}
          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors border-b border-transparent hover:border-red-200"
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}
