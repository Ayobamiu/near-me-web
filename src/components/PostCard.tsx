"use client";

import React, { useState } from "react";
import { FeedPost, User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { usePresence } from "@/contexts/PresenceContext";
import moment from "moment";

interface PostCardProps {
  post: FeedPost;
  author: User;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onShare: (postId: string) => void;
  onViewProfile: (user: User) => void;
}

export default function PostCard({
  post,
  author,
  onLike,
  onComment,
  onShare,
  onViewProfile,
}: PostCardProps) {
  const { user } = useAuth();
  const { onlineUsers } = usePresence();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLiking, setIsLiking] = useState(false);

  const isLiked = user ? post.likes.includes(user.uid) : false;
  const isAuthorOnline = onlineUsers.some(
    (onlineUser) => onlineUser.id === author.id
  );
  const isCurrentlyHere = isAuthorOnline;

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    try {
      await onLike(post.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    try {
      await onComment(post.id, commentText.trim());
      setCommentText("");
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handleShare = async () => {
    if (!user) return;
    try {
      await onShare(post.id);
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  const getPostTypeIcon = () => {
    switch (post.postType) {
      case "recommendation":
        return "⭐";
      case "question":
        return "❓";
      case "checkin":
        return "📍";
      case "announcement":
        return "📢";
      case "image":
        return "📷";
      default:
        return "💬";
    }
  };

  const getPostTypeColor = () => {
    switch (post.postType) {
      case "recommendation":
        return "bg-yellow-100 text-yellow-800";
      case "question":
        return "bg-blue-100 text-blue-800";
      case "checkin":
        return "bg-green-100 text-green-800";
      case "announcement":
        return "bg-purple-100 text-purple-800";
      case "image":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border ${
        post.isPinned ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {/* Post Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <button onClick={() => onViewProfile(author)} className="relative">
              <img
                src={author.profilePictureUrl || "/default-avatar.svg"}
                alt={author.displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
              {isCurrentlyHere && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-white rounded-full"></div>
              )}
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onViewProfile(author)}
                  className="font-medium text-sm text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {author.displayName}
                </button>
                <span
                  className={`px-1.5 py-0.5 text-xs rounded-full ${getPostTypeColor()}`}
                >
                  {getPostTypeIcon()}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{moment(post.createdAt).fromNow()}</span>
                {isCurrentlyHere ? (
                  <span className="text-green-600 font-medium text-xs">
                    Here
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">Was here</span>
                )}
                {post.isPinned && (
                  <span className="text-blue-600 font-medium text-xs">📌</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-3">
        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>

        {/* Media */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {post.mediaUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Post media ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Engagement Stats */}
      <div className="px-3 py-1.5 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            {post.likes.length > 0 && (
              <span>
                {post.likes.length} like{post.likes.length !== 1 ? "s" : ""}
              </span>
            )}
            {post.comments.length > 0 && (
              <span>
                {post.comments.length} comment
                {post.comments.length !== 1 ? "s" : ""}
              </span>
            )}
            {post.shares > 0 && (
              <span>
                {post.shares} share{post.shares !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-3 py-1.5 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={handleLike}
            disabled={!user || isLiking}
            className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-lg transition-colors ${
              isLiked
                ? "text-red-600 bg-red-50"
                : "text-gray-600 hover:bg-gray-50"
            } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="text-sm">{isLiked ? "❤️" : "🤍"}</span>
            <span className="text-xs font-medium">Like</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1.5 px-2 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm">💬</span>
            <span className="text-xs font-medium">Comment</span>
          </button>

          <button
            onClick={handleShare}
            disabled={!user}
            className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-lg transition-colors ${
              !user
                ? "opacity-50 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="text-sm">📤</span>
            <span className="text-xs font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100">
          {/* Comment Input */}
          {user && (
            <form
              onSubmit={handleComment}
              className="p-4 border-b border-gray-100"
            >
              <div className="flex space-x-3">
                <img
                  src={user.photoURL || "/default-avatar.svg"}
                  alt="Your avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="p-4 space-y-3">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-sm text-gray-900">{comment.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {moment(comment.createdAt).fromNow()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
