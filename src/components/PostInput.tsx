"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface PostInputProps {
  onSubmit: (post: {
    content: string;
    postType: "text" | "image" | "recommendation" | "question" | "checkin";
    tags?: string[];
  }) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function PostInput({
  onSubmit,
  disabled = false,
  placeholder = "What's happening at this place?",
}: PostInputProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<
    "text" | "image" | "recommendation" | "question" | "checkin"
  >("text");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await onSubmit({
        content: content.trim(),
        postType,
        tags: tagArray.length > 0 ? tagArray : undefined,
      });

      setContent("");
      setTags("");
      setPostType("text");
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  const postTypes = [
    { value: "text", label: "💬 General", icon: "💬" },
    { value: "recommendation", label: "⭐ Recommendation", icon: "⭐" },
    { value: "question", label: "❓ Question", icon: "❓" },
    { value: "checkin", label: "📍 Check-in", icon: "📍" },
    { value: "image", label: "📷 Photo", icon: "📷" },
  ];

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <p className="text-gray-500 text-center">
          Please sign in to create posts
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <form onSubmit={handleSubmit} className="p-3">
        {/* User Info */}
        <div className="flex items-center space-x-2 mb-3">
          <img
            src={user.photoURL || "/default-avatar.svg"}
            alt={user.displayName || "User"}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-sm text-gray-900">
              {user.displayName || "User"}
            </p>
            <p className="text-xs text-gray-500">Posting to this place</p>
          </div>
        </div>

        {/* Post Type Selector */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {postTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() =>
                  setPostType(
                    type.value as
                      | "text"
                      | "image"
                      | "recommendation"
                      | "question"
                      | "checkin"
                  )
                }
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  postType === type.value
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
                }`}
              >
                <span className="mr-1">{type.icon}</span>
                {type.label.split(" ")[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Content Input */}
        <div className="mb-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSubmitting}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            rows={3}
          />
        </div>

        {/* Tags Input */}
        <div className="mb-3">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add tags (comma separated) #food #atmosphere #service"
            disabled={disabled || isSubmitting}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">Press Cmd+Enter to post</div>
          <button
            type="submit"
            disabled={!content.trim() || disabled || isSubmitting}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
