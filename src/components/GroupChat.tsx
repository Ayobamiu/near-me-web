"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Group, GroupMessage, User } from "@/types";
import userProfileService from "@/lib/userProfileService";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
} from "firebase/firestore";
import moment from "moment";

interface GroupChatProps {
  group: Group;
  onClose?: () => void;
}

export default function GroupChat({ group, onClose }: GroupChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [userProfiles, setUserProfiles] = useState<Record<string, User>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserProfiles();

    // Set up real-time message listener
    const unsubscribe = setupRealtimeMessages();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [group.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const setupRealtimeMessages = () => {
    if (!group?.id) return;

    setIsLoadingMessages(true);

    // Use subcollection: groups/{groupId}/messages
    const groupRef = doc(db, "groups", group.id);
    const messagesRef = collection(groupRef, "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => {
          const data = doc.data();

          let createdAt: Date;
          if (data.createdAt && data.createdAt.toDate) {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            createdAt = data.createdAt;
          } else {
            createdAt = new Date();
          }

          return {
            id: doc.id,
            ...data,
            createdAt,
          } as GroupMessage;
        });

        setMessages(newMessages);
        setIsLoadingMessages(false);
      },
      (error) => {
        console.error("Real-time listener error:", error);
        setIsLoadingMessages(false);
      }
    );

    return unsubscribe;
  };

  const loadUserProfiles = async () => {
    try {
      const profiles = await userProfileService.getManyUserProfiles(
        group.memberIds
      );
      const profilesMap: Record<string, User> = {};
      profiles.forEach((profile) => {
        // Convert UserProfile to User by adding missing properties
        profilesMap[profile.id] = {
          joinedAt: new Date(), // Default value
          isOnline: false, // Default value
          ...profile,
        } as User;
      });
      setUserProfiles(profilesMap);
    } catch (error) {
      console.error("Error loading user profiles:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || isSending) return;

    try {
      setIsSending(true);
      const response = await fetch(`/api/groups/${group.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: user.uid,
          content: newMessage.trim(),
          messageType: "text",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewMessage("");

        // Add message optimistically for immediate feedback
        const optimisticMessage: GroupMessage = {
          id: `temp-${Date.now()}`, // Temporary ID to avoid conflicts
          groupId: group.id,
          senderId: user.uid,
          content: newMessage.trim(),
          messageType: "text",
          createdAt: new Date(),
          readBy: [user.uid],
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        // Remove optimistic message after a short delay to let real-time listener take over
        setTimeout(() => {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== optimisticMessage.id)
          );
        }, 1000);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSenderName = (senderId: string) => {
    const profile = userProfiles[senderId];
    return profile?.displayName || "Unknown User";
  };

  const getSenderAvatar = (senderId: string) => {
    const profile = userProfiles[senderId];
    return profile?.profilePictureUrl;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {group.name}
              </h2>
              <p className="text-sm text-gray-500">
                {group.memberIds.length} members
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3">
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start the conversation
            </h3>
            <p className="text-gray-500 text-sm">
              Be the first to send a message in this group!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isFromCurrentUser = message.senderId === user?.uid;
            const senderName = getSenderName(message.senderId);
            const senderAvatar = getSenderAvatar(message.senderId);

            return (
              <div
                key={message.id}
                className={`flex ${
                  isFromCurrentUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex space-x-2 max-w-xs lg:max-w-md ${
                    isFromCurrentUser ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  {!isFromCurrentUser && (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                      {senderAvatar ? (
                        <img
                          src={senderAvatar}
                          alt={senderName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold text-sm">
                          {senderName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      isFromCurrentUser
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-900"
                    }`}
                  >
                    {!isFromCurrentUser && (
                      <p className="text-xs font-medium mb-1 opacity-75">
                        {senderName}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isFromCurrentUser ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {moment(message.createdAt).format("HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
