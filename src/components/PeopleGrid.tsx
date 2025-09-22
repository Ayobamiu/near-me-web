"use client";

import React, { useState } from "react";
import { User } from "@/types";
import { usePresence } from "@/contexts/PresenceContext";

interface PeopleGridProps {
  usersInRange: User[];
  usersOutOfRange: User[];
  onViewProfile: (user: User) => void;
  onConnect: (userId: string) => void;
}

type FilterType = "all" | "online" | "nearby" | "recent";
type SortType = "distance" | "name" | "recent";

export default function PeopleGrid({
  usersInRange,
  usersOutOfRange,
  onViewProfile,
  onConnect,
}: PeopleGridProps) {
  const { onlineUsers } = usePresence();
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("distance");
  const [searchQuery, setSearchQuery] = useState("");

  // Combine all users
  const allUsers = [...usersInRange, ...usersOutOfRange];

  // Debug logging
  console.log("PeopleGrid Debug:", {
    usersInRange: usersInRange.length,
    usersOutOfRange: usersOutOfRange.length,
    allUsers: allUsers.length,
    searchQuery,
    filter,
    onlineUsers: onlineUsers.length,
  });

  // Filter users based on selected filter
  const getFilteredUsers = () => {
    let filtered = allUsers;
    console.log("getFilteredUsers - Initial filtered count:", filtered.length);

    // Apply search filter
    if (searchQuery.trim()) {
      console.log("Applying search filter for:", searchQuery);
      const beforeSearch = filtered.length;
      filtered = filtered.filter(
        (user) =>
          user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log("Search results:", {
        beforeSearch,
        afterSearch: filtered.length,
      });
    }

    // Apply category filter
    const beforeCategoryFilter = filtered.length;
    switch (filter) {
      case "online":
        filtered = filtered.filter((user) =>
          onlineUsers.some((onlineUser) => onlineUser.id === user.id)
        );
        break;
      case "nearby":
        filtered = filtered.filter((user) => usersInRange.includes(user));
        break;
      case "recent":
        // For now, show all users. In future, we can add last seen timestamps
        // Keep the current filtered results
        break;
      default:
        // Keep the current filtered results (don't reset to allUsers)
        break;
    }
    console.log("Category filter results:", {
      filter,
      beforeCategoryFilter,
      afterCategoryFilter: filtered.length,
    });

    return filtered;
  };

  // Sort users based on selected sort option
  const getSortedUsers = (users: User[]) => {
    const sorted = [...users];

    switch (sortBy) {
      case "distance":
        // Users in range first, then out of range
        return sorted.sort((a, b) => {
          const aInRange = usersInRange.includes(a);
          const bInRange = usersInRange.includes(b);
          if (aInRange && !bInRange) return -1;
          if (!aInRange && bInRange) return 1;
          return 0;
        });
      case "name":
        return sorted.sort((a, b) =>
          a.displayName.localeCompare(b.displayName)
        );
      case "recent":
        // For now, just return as is. In future, sort by last seen
        return sorted;
      default:
        return sorted;
    }
  };

  const filteredAndSortedUsers = getSortedUsers(getFilteredUsers());
  console.log(
    "Final filtered and sorted users:",
    filteredAndSortedUsers.length
  );

  const getFilterCount = (filterType: FilterType) => {
    switch (filterType) {
      case "online":
        return allUsers.filter((user) =>
          onlineUsers.some((onlineUser) => onlineUser.id === user.id)
        ).length;
      case "nearby":
        return usersInRange.length;
      case "recent":
        return allUsers.length; // For now, same as all
      default:
        return allUsers.length;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">People</h2>
          <p className="text-gray-600 mt-1">
            Discover and connect with people in this place
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {searchQuery.trim()
            ? `Found ${filteredAndSortedUsers.length} of ${allUsers.length} people`
            : `${filteredAndSortedUsers.length} of ${allUsers.length} people`}
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex gap-4 mb-4">
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search people by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortType)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="distance">Sort by Distance</option>
          <option value="name">Sort by Name</option>
          <option value="recent">Sort by Recent</option>
        </select>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "all", label: "All", count: getFilterCount("all") },
          { key: "online", label: "Online", count: getFilterCount("online") },
          { key: "nearby", label: "Nearby", count: getFilterCount("nearby") },
          { key: "recent", label: "Recent", count: getFilterCount("recent") },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as FilterType)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* People Grid */}
      {filteredAndSortedUsers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No people found
          </h3>
          <p className="text-gray-500">
            {searchQuery.trim()
              ? `No people match "${searchQuery}"`
              : "No people in this place yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4">
          {filteredAndSortedUsers.map((user) => (
            <div key={user.id} className="group relative">
              {/* Clickable Card for Profile View */}
              <div
                onClick={() => onViewProfile(user)}
                className="cursor-pointer"
              >
                {/* Enhanced User Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group-hover:border-blue-300">
                  {/* Profile Image Section */}
                  <div className="relative h-32 bg-gradient-to-br from-blue-50 to-indigo-100">
                    {user.profilePictureUrl ? (
                      <img
                        src={user.profilePictureUrl}
                        alt={user.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-semibold text-xl">
                            {user.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-4">
                    {/* Status Badges - Above Name */}
                    <div className="flex gap-1 mb-2">
                      {usersInRange.includes(user) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          📍 Nearby
                        </span>
                      )}
                      {onlineUsers.some(
                        (onlineUser) => onlineUser.id === user.id
                      ) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          🟢 Online
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                      {user.displayName}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2 truncate">
                      {user.email}
                    </p>

                    {/* Headline */}
                    {user.headline && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {user.headline}
                      </p>
                    )}

                    {/* Connect Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        onConnect(user.id);
                      }}
                      className="w-full text-xs text-white bg-blue-600 hover:bg-blue-700 font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {allUsers.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button className="text-sm text-blue-700 hover:text-blue-900 underline">
              Connect with all nearby people
            </button>
            <span className="text-blue-300">•</span>
            <button className="text-sm text-blue-700 hover:text-blue-900 underline">
              Find people with similar interests
            </button>
            <span className="text-blue-300">•</span>
            <button className="text-sm text-blue-700 hover:text-blue-900 underline">
              View mutual connections
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
