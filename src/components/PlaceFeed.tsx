"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FeedPost, User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import feedService from "@/lib/feedService";
import PostInput from "./PostInput";
import FeedList from "./FeedList";

interface PlaceFeedProps {
  placeId: string;
  onViewProfile: (user: User) => void;
}

export default function PlaceFeed({ placeId, onViewProfile }: PlaceFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [lastPostId, setLastPostId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Load initial posts
  const loadPosts = useCallback(
    async (reset = false) => {
      if (!placeId) return;

      try {
        if (reset) {
          setIsLoading(true);
          setPosts([]);
          setLastPostId(null);
          setHasMorePosts(true);
        } else {
          setIsLoadingMore(true);
        }

        const response = await feedService.getPlaceFeed(
          placeId,
          20,
          reset ? undefined : lastPostId || undefined
        );

        if (reset) {
          setPosts(response.posts);
        } else {
          setPosts((prev) => [...prev, ...response.posts]);
        }

        setHasMorePosts(response.hasMore);
        setLastPostId(response.lastPostId);
        setError("");
      } catch (error) {
        console.error("Error loading posts:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load posts"
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [placeId, lastPostId]
  );

  // Load posts on mount and when placeId changes
  useEffect(() => {
    loadPosts(true);
  }, [placeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle creating a new post
  const handleCreatePost = async (postData: {
    content: string;
    postType: "text" | "image" | "recommendation" | "question" | "checkin";
    tags?: string[];
  }) => {
    if (!user) return;

    try {
      const result = await feedService.createPost(placeId, {
        authorId: user.uid,
        ...postData,
      });

      console.log("Post created successfully:", result.postId);

      // Reload posts to show the new one
      await loadPosts(true);
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  };

  // Handle liking a post
  const handleLikePost = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const isLiked = post.likes.includes(user.uid);

      if (isLiked) {
        await feedService.unlikePost(placeId, postId, user.uid);
      } else {
        await feedService.likePost(placeId, postId, user.uid);
      }

      // Update local state
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes: isLiked
                  ? p.likes.filter((id) => id !== user.uid)
                  : [...p.likes, user.uid],
              }
            : p
        )
      );
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  // Handle commenting on a post
  const handleCommentPost = async (postId: string, content: string) => {
    if (!user) return;

    try {
      const result = await feedService.addComment(
        placeId,
        postId,
        user.uid,
        content
      );

      console.log("Comment added successfully:", result.commentId);

      // Update local state
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: [
                  ...p.comments,
                  {
                    id: result.commentId,
                    postId,
                    authorId: user.uid,
                    content,
                    createdAt: new Date(),
                    likes: [],
                  },
                ],
              }
            : p
        )
      );
    } catch (error) {
      console.error("Error commenting on post:", error);
      throw error;
    }
  };

  // Handle sharing a post
  const handleSharePost = async (postId: string) => {
    if (!user) return;

    try {
      await feedService.sharePost(placeId, postId, user.uid);

      // Update local state
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, shares: p.shares + 1 } : p))
      );

      console.log("Post shared successfully");
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  // Handle loading more posts
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMorePosts) {
      loadPosts(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Feed
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadPosts(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Post Input */}
      <div className="mb-4">
        <PostInput
          onSubmit={handleCreatePost}
          placeholder="Share something about this place..."
        />
      </div>

      {/* Feed List */}
      <div className="space-y-3">
        <FeedList
          posts={posts}
          isLoading={isLoading}
          onLoadMore={handleLoadMore}
          hasMorePosts={hasMorePosts}
          onLike={handleLikePost}
          onComment={handleCommentPost}
          onShare={handleSharePost}
          onViewProfile={onViewProfile}
        />
      </div>
    </div>
  );
}
