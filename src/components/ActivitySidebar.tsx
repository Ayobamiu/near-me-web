"use client";

import React from "react";
import { usePresence } from "@/contexts/PresenceContext";
import { User } from "@/types";

interface ActivitySidebarProps {
  usersInRange: User[];
  usersOutOfRange: User[];
  onViewProfile: (user: User) => void;
}

export default function ActivitySidebar({
  usersInRange,
  usersOutOfRange,
  onViewProfile,
}: ActivitySidebarProps) {
  const { onlineUsers } = usePresence();
  console.log("onlineUsers", onlineUsers);

  const totalUsers = usersInRange.length + usersOutOfRange.length;

  return (
    <div className="w-64 space-y-4">
      {/* Currently Online */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Online Now
        </h3>
        <div className="space-y-2">
          {onlineUsers.slice(0, 5).map((user) => {
            // Convert UserPresence to User format
            const userForProfile = {
              id: user.id,
              displayName: user.displayName,
              email: user.email,
              profilePictureUrl: user.profilePictureUrl,
              interests: [], // UserPresence doesn't have interests
              headline: user.headline || "NearMe User", // Default headline
              bio: "",
              age: undefined,
              location: user.location,
              occupation: "",
              socialLinks: {},
              isVisible: true,
              distanceRadius: 100,
              joinedAt: new Date(),
              isOnline: user.isOnline,
              distance: undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            return (
              <div
                key={user.id}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={() => onViewProfile(userForProfile)}
              >
                <div className="relative">
                  <img
                    src={user.profilePictureUrl || "/default-avatar.svg"}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.headline || "NearMe User"}
                  </p>
                </div>
              </div>
            );
          })}
          {onlineUsers.length === 0 && (
            <p className="text-xs text-gray-500">No one online</p>
          )}
        </div>
      </div>

      {/* Place Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">
          Place Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">People Nearby</span>
            <span className="font-medium text-blue-600">{totalUsers}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Currently Here</span>
            <span className="font-medium text-green-600">
              {usersInRange.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Were Here</span>
            <span className="font-medium text-gray-600">
              {usersOutOfRange.length}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">
          Recent Activity
        </h3>
        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            <p className="font-medium">New posts in this place</p>
            <p className="text-gray-400">Check out the latest updates</p>
          </div>
          <div className="text-xs text-gray-500">
            <p className="font-medium">People joined</p>
            <p className="text-gray-400">New visitors this week</p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h3 className="font-semibold text-blue-900 text-sm mb-2">
          💡 Quick Tips
        </h3>
        <div className="space-y-1 text-xs text-blue-800">
          <p>• Share your experience at this place</p>
          <p>• Ask questions to get recommendations</p>
          <p>• Connect with people you meet here</p>
        </div>
      </div>
    </div>
  );
}
