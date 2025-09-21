"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, ChatMessage, SendMessageRequest } from "@/types";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import chatService from "@/lib/chatService";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  doc,
} from "firebase/firestore";
import userProfileService from "@/lib/userProfileService";
import { usePresence } from "@/contexts/PresenceContext";

interface ChatWindowProps {
  otherUser: User;
  onClose: () => void;
}

export default function ChatWindow({ otherUser, onClose }: ChatWindowProps) {
  const { user: currentUser } = useAuth();
  const { onlineUsers } = usePresence();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState<string>("");
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const otherUserIsGloballyOnline = onlineUsers.some(
    (onlineUser) => onlineUser.id === otherUser.id
  );

  // Load messages when component mounts or conversation changes
  useEffect(() => {
    if (conversationId) {
      setupRealtimeListener();
    } else if (currentUser && otherUser) {
      // Generate conversation ID
      const id = chatService.getConversationId(currentUser.uid, otherUser.id);
      setConversationId(id);
    }
  }, [conversationId, currentUser, otherUser]);

  // Cleanup listener on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const setupRealtimeListener = () => {
    if (!conversationId || !currentUser) return;

    // Clean up existing listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    setIsLoading(true);
    setError("");

    try {
      // Create Firestore query for messages using subcollection
      const conversationRef = doc(db, "messages", conversationId);
      const messagesRef = collection(conversationRef, "messages");
      const messagesQuery = query(
        messagesRef,
        orderBy("createdAt", "asc"), // Get messages in chronological order
        limit(50) // Limit to last 50 messages
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        messagesQuery,
        async (snapshot) => {
          try {
            const chatMessages: ChatMessage[] = [];
            const userIdsToFetch = new Set<string>();

            // Collect all sender IDs
            snapshot.docs.forEach((doc) => {
              const messageData = doc.data();
              userIdsToFetch.add(messageData.senderId);
            });

            // Fetch user profiles
            const userProfiles = await userProfileService.getManyUserProfiles(
              Array.from(userIdsToFetch)
            );
            const userMap = new Map<string, User>();
            userProfiles.forEach((profile) => {
              userMap.set(
                profile.id,
                userProfileService.convertToUser(profile, { lat: 0, lng: 0 }, 0)
              );
            });

            // Build chat messages
            snapshot.docs.forEach((doc) => {
              const messageData = doc.data();
              const message = {
                id: doc.id,
                conversationId: messageData.conversationId,
                senderId: messageData.senderId,
                receiverId: messageData.receiverId,
                content: messageData.content,
                messageType: messageData.messageType,
                createdAt: messageData.createdAt?.toDate() || new Date(),
                updatedAt: messageData.updatedAt?.toDate() || new Date(),
                readAt: messageData.readAt?.toDate() || undefined,
                isEdited: messageData.isEdited || false,
                replyToMessageId: messageData.replyToMessageId || undefined,
              };

              const sender = userMap.get(message.senderId);
              if (sender) {
                chatMessages.push({
                  message,
                  sender,
                  isFromCurrentUser: message.senderId === currentUser.uid,
                });
              }
            });

            setMessages(chatMessages);
            setHasMoreMessages(snapshot.docs.length === 50);
          } catch (error) {
            console.error("Error processing real-time messages:", error);
            setError("Failed to load messages");
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          console.error("Real-time listener error:", error);
          setError("Failed to load messages");
          setIsLoading(false);
        }
      );

      // Store unsubscribe function
      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error("Error setting up real-time listener:", error);
      setError("Failed to load messages");
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    // For now, we'll use the real-time listener for all message loading
    // This function is kept for compatibility but redirects to real-time listener
    setupRealtimeListener();
  };

  const handleSendMessage = async (
    messageRequest: Omit<SendMessageRequest, "receiverId" | "senderId">
  ) => {
    if (!currentUser) return;

    try {
      setIsSending(true);
      setError("");

      await chatService.sendMessage({
        ...messageRequest,
        senderId: currentUser.uid,
        receiverId: otherUser.id,
      });

      if (conversationId) {
        await chatService.markMessagesAsRead(conversationId, currentUser.uid);
      } else {
        return;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleLoadMore = () => {
    if (messages.length > 0 && !isLoading) {
      loadMessages();
    }
  };

  const handleMarkAsRead = async () => {
    if (conversationId && currentUser) {
      try {
        await chatService.markMessagesAsRead(conversationId, currentUser.uid);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }
  };

  // Mark messages as read when window is focused
  useEffect(() => {
    const handleFocus = () => {
      handleMarkAsRead();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [conversationId, currentUser]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {otherUser.profilePictureUrl ? (
                <img
                  src={otherUser.profilePictureUrl}
                  alt={otherUser.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-gray-600 font-semibold text-sm">${otherUser.displayName
                        .charAt(0)
                        .toUpperCase()}</span>`;
                    }
                  }}
                />
              ) : (
                <span className="text-gray-600 font-semibold text-sm">
                  {otherUser.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {otherUser.displayName}
              </h3>
              <p className="text-sm text-gray-500">
                {otherUserIsGloballyOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Messages */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onLoadMore={handleLoadMore}
          hasMoreMessages={hasMoreMessages}
        />

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isSending}
          placeholder={`Message ${otherUser.displayName}...`}
        />
      </div>
    </div>
  );
}
