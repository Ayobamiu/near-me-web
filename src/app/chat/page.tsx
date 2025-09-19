"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  addDoc,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Message } from "@/types";

interface ChatConversation {
  id: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isOnline: boolean;
}

function ChatListPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Conversation view state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Refs for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mobileMessagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    mobileMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user's connections and create chat conversations
  useEffect(() => {
    if (!user || loading) return;

    const loadChatConversations = async () => {
      try {
        setIsLoading(true);
        console.log("🔍 Loading chat conversations for user:", user.uid);

        // Get user's connections - we need to query both directions
        const connectionsRef = collection(db, "connections");

        // Query 1: Where user is the initiator
        const q1 = query(
          connectionsRef,
          where("userId", "==", user.uid),
          where("status", "==", "accepted")
        );

        // Query 2: Where user is the recipient
        const q2 = query(
          connectionsRef,
          where("connectedUserId", "==", user.uid),
          where("status", "==", "accepted")
        );

        // Helper function to process connections
        const processConnections = async (connections: any[]) => {
          console.log(
            "🔄 Processing connections:",
            connections.length,
            "total"
          );
          const conversationPromises = connections.map(async (connection) => {
            // Get the other user's ID
            const otherUserId =
              connection.userId === user.uid
                ? connection.connectedUserId
                : connection.userId;
            if (!otherUserId) return null;

            // Get the other user's profile
            const userProfileRef = doc(db, "userProfiles", otherUserId);
            const userProfileSnapshot = await getDoc(userProfileRef);

            if (!userProfileSnapshot.exists()) return null;

            const userProfile = userProfileSnapshot.data();

            // Get the last message from the conversation
            const messagesRef = collection(db, "messages");
            const lastMessageQuery = query(
              messagesRef,
              where("conversationId", "==", `${user.uid}_${otherUserId}`),
              orderBy("createdAt", "desc"),
              limit(1)
            );
            const lastMessageSnapshot = await getDocs(lastMessageQuery);

            let lastMessage = "";
            let lastMessageTime = new Date();
            let unreadCount = 0;

            if (!lastMessageSnapshot.empty) {
              const lastMsg = lastMessageSnapshot.docs[0].data();
              lastMessage = lastMsg.content || "";
              lastMessageTime = lastMsg.createdAt?.toDate() || new Date();

              // Count unread messages (messages after user's last read time)
              // For now, we'll set this to 0 - you can implement proper unread tracking later
              unreadCount = 0;
            }

            return {
              id: `${user.uid}_${otherUserId}`,
              userId: otherUserId,
              userName: userProfile.displayName || "Anonymous User",
              userPhotoUrl: userProfile.profilePictureUrl,
              lastMessage,
              lastMessageTime,
              unreadCount,
              isOnline: userProfile.isOnline || false,
            };
          });

          const conversationResults = await Promise.all(conversationPromises);
          const validConversations = conversationResults.filter(
            Boolean
          ) as ChatConversation[];

          // Sort by last message time
          validConversations.sort(
            (a, b) =>
              (b.lastMessageTime?.getTime() || 0) -
              (a.lastMessageTime?.getTime() || 0)
          );

          console.log(
            "✅ Final conversations:",
            validConversations.length,
            "conversations"
          );
          setConversations(validConversations);
          setIsLoading(false);
        };

        // Listen to both queries
        let connections1: any[] = [];
        let connections2: any[] = [];
        let hasProcessed = false;

        const unsubscribe1 = onSnapshot(q1, async (snapshot1) => {
          connections1 = snapshot1.docs.map((doc) => doc.data());
          console.log(
            "📡 Query 1 (userId) results:",
            connections1.length,
            "connections"
          );
          if (hasProcessed) {
            // Combine both connection lists and remove duplicates
            const allConnections = [...connections1, ...connections2];
            const uniqueConnections = allConnections.filter(
              (connection, index, self) =>
                index ===
                self.findIndex(
                  (c) =>
                    (c.userId === connection.userId &&
                      c.connectedUserId === connection.connectedUserId) ||
                    (c.userId === connection.connectedUserId &&
                      c.connectedUserId === connection.userId)
                )
            );
            await processConnections(uniqueConnections);
          }
        });

        const unsubscribe2 = onSnapshot(q2, async (snapshot2) => {
          connections2 = snapshot2.docs.map((doc) => doc.data());
          console.log(
            "📡 Query 2 (connectedUserId) results:",
            connections2.length,
            "connections"
          );
          hasProcessed = true;
          // Combine both connection lists and remove duplicates
          const allConnections = [...connections1, ...connections2];
          const uniqueConnections = allConnections.filter(
            (connection, index, self) =>
              index ===
              self.findIndex(
                (c) =>
                  (c.userId === connection.userId &&
                    c.connectedUserId === connection.connectedUserId) ||
                  (c.userId === connection.connectedUserId &&
                    c.connectedUserId === connection.userId)
              )
          );
          await processConnections(uniqueConnections);
        });

        return () => {
          unsubscribe1();
          unsubscribe2();
        };
      } catch (error) {
        console.error("Error loading chat conversations:", error);
        setError("Failed to load conversations");
        setIsLoading(false);
      }
    };

    loadChatConversations();
  }, [user, loading]);

  // Load selected user and messages
  useEffect(() => {
    if (!selectedUserId || !user || loading) return;

    const loadSelectedUser = async () => {
      try {
        setIsLoadingMessages(true);
        const userProfileRef = doc(db, "userProfiles", selectedUserId);
        const userProfileSnapshot = await getDoc(userProfileRef);

        if (userProfileSnapshot.exists()) {
          setSelectedUser(userProfileSnapshot.data());
        } else {
          console.error("Selected user profile not found");
          setSelectedUser(null);
        }
      } catch (error) {
        console.error("Error loading selected user:", error);
        setSelectedUser(null);
      }
    };

    loadSelectedUser();
  }, [selectedUserId, user, loading]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!user || !selectedUserId || loading) return;

    const conversationId = [user.uid, selectedUserId].sort().join("_");
    const messagesRef = collection(db, "messages");
    const messagesQuery = query(
      messagesRef,
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Message[];

      setMessages(messagesData);
      setIsLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [user, selectedUserId, loading]);

  // Handle URL params for mobile navigation
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId) {
      setSelectedUserId(userId);
    }
  }, [searchParams]);

  const handleChatClick = (conversation: ChatConversation) => {
    // On mobile, navigate to separate page
    if (window.innerWidth < 1024) {
      router.push(`/chat/${conversation.userId}`);
    } else {
      // On desktop, show conversation in sidebar
      setSelectedUserId(conversation.userId);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedUserId || isSending) return;

    setIsSending(true);
    try {
      const conversationId = [user.uid, selectedUserId].sort().join("_");

      const messageData = {
        conversationId,
        senderId: user.uid,
        receiverId: selectedUserId,
        content: newMessage.trim(),
        messageType: "text",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        readAt: null,
        isEdited: false,
      };

      await addDoc(collection(db, "messages"), messageData);
      setNewMessage("");
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

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sign In Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to view your messages.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Chat List Sidebar */}
      <div
        className={`${
          selectedUserId ? "hidden lg:block lg:w-1/3" : "w-full lg:w-1/3"
        } bg-white border-r border-gray-200 flex flex-col`}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/")}
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

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
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
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Messages
                  </h1>
                  <p className="text-sm text-gray-500">
                    {conversations.length} conversations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">{error}</div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
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
                No conversations yet
              </h3>
              <p className="text-gray-500 text-sm">
                Start connecting with people to begin chatting!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations
                .filter((conversation) =>
                  conversation.userName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
                )
                .map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleChatClick(conversation)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedUserId === conversation.userId
                        ? "bg-blue-50 border-r-2 border-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                          {conversation.userPhotoUrl ? (
                            <img
                              src={conversation.userPhotoUrl}
                              alt={conversation.userName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-semibold text-lg">
                              {conversation.userName.charAt(0)}
                            </span>
                          )}
                        </div>
                        {conversation.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.userName}
                          </h3>
                          {conversation.lastMessageTime && (
                            <span className="text-xs text-gray-500">
                              {formatLastMessageTime(
                                conversation.lastMessageTime
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversation View - Desktop Only */}
      {selectedUserId && (
        <div className="hidden lg:flex lg:flex-1 lg:flex-col min-h-0">
          {selectedUser ? (
            <>
              {/* Conversation Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                      {selectedUser.profilePictureUrl ? (
                        <img
                          src={selectedUser.profilePictureUrl}
                          alt={selectedUser.displayName || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-600 font-semibold text-lg">
                          {selectedUser.displayName?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>

                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">
                        {selectedUser.displayName || "Anonymous User"}
                      </h1>
                      <div className="flex items-center space-x-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            selectedUser.isOnline
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        ></div>
                        <span className="text-xs text-gray-500">
                          {selectedUser.isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === user.uid
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === user.uid
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-900 border border-gray-200"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderId === user.uid
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            {message.createdAt.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isSending ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading conversation...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile: Show conversation in full screen */}
      {selectedUserId && (
        <div className="lg:hidden w-full flex flex-col min-h-0">
          {/* Mobile Conversation Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedUserId(null)}
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

                {selectedUser && (
                  <>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                      {selectedUser.profilePictureUrl ? (
                        <img
                          src={selectedUser.profilePictureUrl}
                          alt={selectedUser.displayName || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-600 font-semibold text-lg">
                          {selectedUser.displayName?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>

                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">
                        {selectedUser.displayName || "Anonymous User"}
                      </h1>
                      <div className="flex items-center space-x-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            selectedUser.isOnline
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        ></div>
                        <span className="text-xs text-gray-500">
                          {selectedUser.isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === user.uid
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.senderId === user.uid
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-900 border border-gray-200"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.senderId === user.uid
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {message.createdAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={mobileMessagesEndRef} />
              </>
            )}
          </div>

          {/* Mobile Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat...</p>
          </div>
        </div>
      }
    >
      <ChatListPageContent />
    </Suspense>
  );
}
