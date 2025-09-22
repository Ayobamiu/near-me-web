"use client";

import React, { useState, useEffect, useRef } from "react";
import { FeedPost, User } from "@/types";
import PostCard from "./PostCard";
import userProfileService from "@/lib/userProfileService";

interface FeedListProps {
  posts: FeedPost[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMorePosts: boolean;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onShare: (postId: string) => void;
  onViewProfile: (user: User) => void;
}

export default function FeedList({
  posts,
  isLoading,
  onLoadMore,
  hasMorePosts,
  onLike,
  onComment,
  onShare,
  onViewProfile,
}: FeedListProps) {
  const [authors, setAuthors] = useState<Record<string, User>>({});
  const [loadingAuthors, setLoadingAuthors] = useState<Set<string>>(new Set());
  const isLoadingRef = useRef(false);

  // Load author profiles for posts
  useEffect(() => {
    const loadAuthors = async () => {
      // Prevent multiple simultaneous calls
      if (isLoadingRef.current) return;

      const uniqueAuthorIds = [...new Set(posts.map((post) => post.authorId))];
      const missingAuthors = uniqueAuthorIds.filter(
        (id) => !authors[id] && !loadingAuthors.has(id)
      );

      if (missingAuthors.length === 0) return;

      isLoadingRef.current = true;
      setLoadingAuthors((prev) => new Set([...prev, ...missingAuthors]));

      try {
        const authorPromises = missingAuthors.map(async (authorId) => {
          try {
            const profile = await userProfileService.getUserProfile(authorId);
            if (profile) {
              const user = userProfileService.convertToUser(profile);
              return { authorId, user };
            }
          } catch (error) {
            console.error(`Error loading profile for ${authorId}:`, error);
          }
          return null;
        });

        const authorResults = await Promise.all(authorPromises);
        const newAuthors: Record<string, User> = {};

        authorResults.forEach((result) => {
          if (result) {
            newAuthors[result.authorId] = result.user;
          }
        });

        setAuthors((prev) => ({ ...prev, ...newAuthors }));
      } catch (error) {
        console.error("Error loading authors:", error);
      } finally {
        setLoadingAuthors((prev) => {
          const newSet = new Set(prev);
          missingAuthors.forEach((id) => newSet.delete(id));
          return newSet;
        });
        isLoadingRef.current = false;
      }
    };

    // Only run if we have posts and haven't loaded all authors yet
    if (posts.length > 0) {
      loadAuthors();
    }
  }, [posts]); // Only depend on posts, not on authors or loadingAuthors

  // Group posts by date
  const groupedPosts = posts.reduce((groups, post) => {
    const date = new Date(post.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(post);
    return groups;
  }, {} as Record<string, FeedPost[]>);

  // Sort posts within each group by creation time (newest first)
  Object.keys(groupedPosts).forEach((date) => {
    groupedPosts[date].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  // Sort groups by date (newest first)
  const sortedDates = Object.keys(groupedPosts).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border p-4 animate-pulse"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No posts yet
        </h3>
        <p className="text-gray-500">
          Be the first to share something about this place!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          {/* Date Header */}
          <div className="sticky top-0 bg-gray-50 py-2 px-4 rounded-lg mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              {new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>
          </div>

          {/* Posts for this date */}
          <div className="space-y-4">
            {groupedPosts[date].map((post) => {
              const author = authors[post.authorId];

              if (!author) {
                return (
                  <div
                    key={post.id}
                    className="bg-white rounded-lg shadow-sm border p-4 animate-pulse"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-24"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-full"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                );
              }

              return (
                <PostCard
                  key={post.id}
                  post={post}
                  author={author}
                  onLike={onLike}
                  onComment={onComment}
                  onShare={onShare}
                  onViewProfile={() => onViewProfile(author)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Load More Button */}
      {hasMorePosts && (
        <div className="text-center py-4">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Loading..." : "Load More Posts"}
          </button>
        </div>
      )}
    </div>
  );
}
