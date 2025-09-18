import React, { useState } from "react";
import { User } from "@/types";
import connectionService from "@/lib/connectionService";
import { useAuth } from "@/contexts/AuthContext";

interface ConnectionRequestModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConnectionRequestModal({
  user,
  onClose,
  onSuccess,
}: ConnectionRequestModalProps) {
  const { user: currentUser } = useAuth();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  console.log("ConnectionRequestModal rendering", { user, currentUser });

  const handleSendRequest = async () => {
    if (!user.id) return;

    if (!currentUser) {
      // Store the intent to return after login
      localStorage.setItem(
        "nearme_connection_intent",
        JSON.stringify({
          targetUserId: user.id,
          targetUserName: user.displayName,
          timestamp: Date.now(),
        })
      );
      // Redirect to login page
      window.location.href = "/";
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await connectionService.sendConnectionRequest({
        fromUserId: currentUser.uid,
        toUserId: user.id,
        message: message.trim(),
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error sending connection request:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send connection request"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentUser ? "Send Connection Request" : "Sign In Required"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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

        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-3">
            {user.profilePictureUrl ? (
              <img
                src={user.profilePictureUrl}
                alt={user.displayName}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><span class="text-blue-600 font-semibold text-sm">${user.displayName
                      .charAt(0)
                      .toUpperCase()}</span></div>`;
                  }
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h4 className="font-medium text-gray-900">{user.displayName}</h4>
              <p className="text-sm text-gray-500">
                {user.headline || "NearMe User"}
              </p>
            </div>
          </div>
        </div>

        {currentUser ? (
          <div className="mb-4">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Message (Optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/200 characters
            </p>
          </div>
        ) : (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              You need to sign in to send connection requests.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSendRequest}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading
              ? "Sending..."
              : currentUser
              ? "Send Request"
              : "Go to Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
