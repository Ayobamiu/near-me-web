import React, { useState, useEffect } from "react";
import { UserConnection } from "@/types";
import connectionService from "@/lib/connectionService";
import { useAuth } from "@/contexts/AuthContext";

interface ConnectionManagerProps {
  onClose: () => void;
  connections: UserConnection[];
  handleAcceptConnection: (connectionId: string) => void;
  handleRejectConnection: (connectionId: string) => void;
  handleRemoveConnection: (connectionId: string) => void;
  isLoading: boolean;
  error: string;
}

export default function ConnectionManager({
  onClose,
  connections,
  handleAcceptConnection,
  handleRejectConnection,
  handleRemoveConnection,
  isLoading,
  error,
}: ConnectionManagerProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pending" | "accepted">("pending");
  const pendingConnections = connections.filter(
    (connection) => connection.connection.status === "pending"
  );
  const acceptedConnections = connections.filter(
    (connection) => connection.connection.status === "accepted"
  );
  const showingConnections =
    activeTab === "pending" ? pendingConnections : acceptedConnections;
  // const [connections, setConnections] = useState<UserConnection[]>(connections);

  // useEffect(() => {
  //   if (user) {
  //     loadConnections();
  //   }
  // }, [user, activeTab]);

  // const loadConnections = async () => {
  //   if (!user) return;

  //   setIsLoading(true);
  //   setError("");

  //   try {
  //     let data: UserConnection[];
  //     if (activeTab === "pending") {
  //       data = await connectionService.getPendingConnections(user.uid);
  //     } else {
  //       data = await connectionService.getAcceptedConnections(user.uid);
  //     }
  //     setConnections(data);
  //   } catch (error) {
  //     console.error("Error loading connections:", error);
  //     setError(
  //       error instanceof Error ? error.message : "Failed to load connections"
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleAcceptConnection = async (connectionId: string) => {
  //   try {
  //     await connectionService.acceptConnection(connectionId);
  //     loadConnections(); // Reload to update the list
  //   } catch (error) {
  //     console.error("Error accepting connection:", error);
  //     setError(
  //       error instanceof Error ? error.message : "Failed to accept connection"
  //     );
  //   }
  // };

  // const handleRejectConnection = async (connectionId: string) => {
  //   try {
  //     await connectionService.rejectConnection(connectionId);
  //     loadConnections(); // Reload to update the list
  //   } catch (error) {
  //     console.error("Error rejecting connection:", error);
  //     setError(
  //       error instanceof Error ? error.message : "Failed to reject connection"
  //     );
  //   }
  // };

  // const handleRemoveConnection = async (connectionId: string) => {
  //   try {
  //     await connectionService.removeConnection(connectionId);
  //     loadConnections(); // Reload to update the list
  //   } catch (error) {
  //     console.error("Error removing connection:", error);
  //     setError(
  //       error instanceof Error ? error.message : "Failed to remove connection"
  //     );
  //   }
  // };

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Connections</h2>
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

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === "pending"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending Requests
          </button>
          <button
            onClick={() => setActiveTab("accepted")}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === "accepted"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Connected
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : showingConnections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {activeTab === "pending"
                  ? "No pending connection requests"
                  : "No connections yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {showingConnections.map((userConnection) => (
                <ConnectionCard
                  key={userConnection.connection.id}
                  userConnection={userConnection}
                  onAccept={handleAcceptConnection}
                  onReject={handleRejectConnection}
                  onRemove={handleRemoveConnection}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ConnectionCardProps {
  userConnection: UserConnection;
  onAccept: (connectionId: string) => void;
  onReject: (connectionId: string) => void;
  onRemove: (connectionId: string) => void;
}

function ConnectionCard({
  userConnection,
  onAccept,
  onReject,
  onRemove,
}: ConnectionCardProps) {
  const { user, connection } = userConnection;

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-3">
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
          {connection.message && (
            <p className="text-sm text-gray-600 mt-1 italic">
              &quot;{connection.message}&quot;
            </p>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        {connection.status === "pending" && userConnection.isIncoming ? (
          <>
            <button
              onClick={() => onAccept(connection.id)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => onReject(connection.id)}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          </>
        ) : connection.status === "accepted" ? (
          <button
            onClick={() => onRemove(connection.id)}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
          >
            Remove
          </button>
        ) : (
          <span className="text-sm text-gray-500">
            {connection.status === "pending" ? "Pending" : "Rejected"}
          </span>
        )}
      </div>
    </div>
  );
}
