"use client";

import React from "react";
import { ChatMessage } from "@/types";

interface MessageBubbleProps {
  chatMessage: ChatMessage;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

export default function MessageBubble({
  chatMessage,
  showAvatar = true,
  showTimestamp = true,
}: MessageBubbleProps) {
  const { message, sender, isFromCurrentUser } = chatMessage;

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours =
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatTime(messageDate);
    } else if (diffInHours < 48) {
      return `Yesterday ${formatTime(messageDate)}`;
    } else {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(messageDate);
    }
  };

  return (
    <div
      className={`flex items-end space-x-2 mb-4 ${
        isFromCurrentUser ? "flex-row-reverse space-x-reverse" : ""
      }`}
    >
      {/* Avatar */}
      {showAvatar && !isFromCurrentUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
          {sender.profilePictureUrl ? (
            <img
              src={sender.profilePictureUrl}
              alt={sender.displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<span class="text-gray-600 font-semibold text-sm">${sender.displayName
                    .charAt(0)
                    .toUpperCase()}</span>`;
                }
              }}
            />
          ) : (
            <span className="text-gray-600 font-semibold text-sm">
              {sender.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* Message Content */}
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isFromCurrentUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-gray-100 text-gray-900 rounded-bl-sm"
        }`}
      >
        {/* Sender Name (only for received messages) */}
        {!isFromCurrentUser && (
          <div className="text-xs font-medium text-gray-600 mb-1">
            {sender.displayName}
          </div>
        )}

        {/* Message Text */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Message Status and Time */}
        <div
          className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
            isFromCurrentUser ? "text-blue-100" : "text-gray-500"
          }`}
        >
          {isFromCurrentUser && (
            <div className="flex items-center space-x-1">
              {message.readAt ? (
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          )}

          {showTimestamp && <span>{formatDate(message.createdAt)}</span>}
        </div>
      </div>

      {/* Spacer for current user messages */}
      {isFromCurrentUser && showAvatar && (
        <div className="w-8 h-8 flex-shrink-0" />
      )}
    </div>
  );
}
