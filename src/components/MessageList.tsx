"use client";

import React, { useEffect, useRef } from "react";
import { ChatMessage } from "@/types";
import MessageBubble from "./MessageBubble";
import moment from "moment";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMoreMessages?: boolean;
}

export default function MessageList({
  messages,
  isLoading = false,
  onLoadMore,
  hasMoreMessages = false,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle scroll to load more messages
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMoreMessages && onLoadMore) {
      onLoadMore();
    }
  };

  // Group messages by date for better organization
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.message.createdAt);
      const dateKey = date.toDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-gray-500">No messages yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Start the conversation by sending a message
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      onScroll={handleScroll}
    >
      {/* Load more button */}
      {hasMoreMessages && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Load more messages"}
          </button>
        </div>
      )}

      {/* Messages grouped by date */}
      {Object.entries(messageGroups).map(([dateString, dateMessages]) => (
        <div key={dateString}>
          {/* Date header */}
          <div className="text-center mb-4">
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {moment(dateString).format("MMMM D, YYYY")}
            </span>
          </div>

          {/* Messages for this date */}
          <div className="space-y-1">
            {dateMessages.map((chatMessage, index) => {
              const prevMessage = index > 0 ? dateMessages[index - 1] : null;
              const showAvatar =
                !prevMessage ||
                prevMessage.message.senderId !== chatMessage.message.senderId ||
                new Date(chatMessage.message.createdAt).getTime() -
                  new Date(prevMessage.message.createdAt).getTime() >
                  5 * 60 * 1000; // 5 minutes

              return (
                <MessageBubble
                  key={chatMessage.message.id}
                  chatMessage={chatMessage}
                  showAvatar={showAvatar}
                  showTimestamp={true}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
