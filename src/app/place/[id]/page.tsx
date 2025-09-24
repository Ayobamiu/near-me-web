"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Place, UserConnection } from "@/types";
import { getCurrentPosition } from "@/lib/geolocation";
import {
  calculateDistance,
  updateUserOnlineStatus,
  checkUserProximity,
  markUserOutOfRange,
} from "@/lib/geospatial";
import {
  getPlaceUsersCategorized,
  joinPlace,
  leavePlace,
} from "@/lib/placeService";
import connectionService from "@/lib/connectionService";
// import userProfileService from "@/lib/userProfileService"; // Not used directly in this component
import ProfileManager from "@/components/ProfileManager";
import ProfileCompletionGate from "@/components/ProfileCompletionGate";
import ProfileViewer from "@/components/ProfileViewer";
import ConnectionManager from "@/components/ConnectionManager";
import PlaceShareModal from "@/components/PlaceShareModal";
import PlaceFeed from "@/components/PlaceFeed";
import PeopleGrid from "@/components/PeopleGrid";
import ProfileSidebar from "@/components/ProfileSidebar";
import ActivitySidebar from "@/components/ActivitySidebar";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { usePresence } from "@/contexts/PresenceContext";
import useUserProfile from "@/hooks/useUserProfile";

export default function PlacePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const { updateCurrentPlace, updateLocation } = usePresence();
  const params = useParams();
  const router = useRouter();
  const placeId = params.id as string;

  const [place, setPlace] = useState<Place | null>(null);
  const [usersInRange, setUsersInRange] = useState<User[]>([]);
  const [usersOutOfRange, setUsersOutOfRange] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [canJoin, setCanJoin] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [proximityCheckInterval, setProximityCheckInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [isAlreadyJoined, setIsAlreadyJoined] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [showConnectionManager, setShowConnectionManager] = useState(false);
  const [pendingConnectionsCount, setPendingConnectionsCount] = useState(0);
  const [activeConnectionsCount, setActiveConnectionsCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "people">("people");

  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [errorConnections, setErrorConnections] = useState("");

  const loadConnectionCounts = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingConnections(true);
      const [pendingConnections, acceptedConnections] = await Promise.all([
        connectionService.getPendingConnections(user.uid),
        connectionService.getAcceptedConnections(user.uid),
      ]);

      setPendingConnectionsCount(pendingConnections.length);
      setActiveConnectionsCount(acceptedConnections.length);
      setConnections([...pendingConnections, ...acceptedConnections]);
    } catch (error) {
      console.error("Error loading connection counts:", error);
      setErrorConnections(
        error instanceof Error ? error.message : "Failed to load connections"
      );
    } finally {
      setIsLoadingConnections(false);
    }
  }, [user]);

  const handleConnectionManagerClose = () => {
    setShowConnectionManager(false);
    // Refresh connection counts when manager closes
    loadConnectionCounts();
  };
  const startProximityMonitoring = useCallback(() => {
    if (!user || !place?.originLocation) return;

    // Prevent multiple instances
    if (proximityCheckInterval) {
      return;
    }


    const interval = setInterval(async () => {
      try {
        const position = await getCurrentPosition();
        const isWithinRange = checkUserProximity(
          position.lat,
          position.lng,
          place.originLocation!.lat,
          place.originLocation!.lng,
          100
        );


        if (!isWithinRange) {
          // User moved out of range
          await markUserOutOfRange(placeId, user.uid);
          setCanJoin(false);
          setError(
            "You've moved too far from the place. Please get closer to rejoin."
          );
          clearInterval(interval);
          setProximityCheckInterval(null);
        } else {
          // Update user's location and online status
          await updateUserOnlineStatus(placeId, user.uid, true);
          // setUserLocation({ lat: position.lat, lng: position.lng });
        }
      } catch (error) {
        console.error("Proximity check failed:", error);
      }
    }, 30000); // Check every 30 seconds

    setProximityCheckInterval(interval);
  }, [user, place, proximityCheckInterval, placeId]);

  const loadPlaceData = useCallback(async () => {
    try {
      setIsLoading(true);
      setGeolocationError(null);

      // Get user's current location first (only if user is authenticated)
      let position = null;
      if (user) {
        position = await getCurrentPosition();
        // setUserLocation({ lat: position.lat, lng: position.lng });
      }

      // Check if place exists
      const placeRef = doc(db, "places", placeId);
      const placeSnapshot = await getDoc(placeRef);

      if (!placeSnapshot.exists()) {
        // Place doesn't exist - show error instead of auto-creating
        setError(
          `Place "${placeId}" does not exist. Please create it first from the dashboard.`
        );
        setIsLoading(false);
        return;
      } else {
        // Place exists - check if user is already joined
        const placeData = placeSnapshot.data() as Place;
        // console.log("🏠 Place data:", placeData);
        setPlace(placeData);

        // Check if user is already in this place (only if user is authenticated)
        if (user) {
          const userInPlaceRef = doc(db, "places", placeId, "users", user.uid);
          const userInPlaceSnapshot = await getDoc(userInPlaceRef);

          if (userInPlaceSnapshot.exists()) {
            const userData = userInPlaceSnapshot.data();
            if (userData.isOnline && !userData.outOfRange) {
              // User is already joined and online
              setIsAlreadyJoined(true);
              setCanJoin(true);
              if (position) {
                // setUserLocation({ lat: position.lat, lng: position.lng });
              }

              // Clear the dashboard flag if it exists
              if (sessionStorage.getItem("cameFromDashboard") === "true") {
                sessionStorage.removeItem("cameFromDashboard");

                // Ensure user is marked as online after joining from dashboard
                try {
                  await updateUserOnlineStatus(placeId, user.uid, true);
                } catch (error) {
                  console.error("Error updating user online status:", error);
                }
              }

              // Set up real-time listener for already joined users
              onSnapshot(
                collection(db, "places", placeId, "users"),
                async (snapshot) => {
                  console.log(
                    "📡 Already joined - Real-time update received:",
                    snapshot.size,
                    "users"
                  );

                  // Debug: Log all user documents
                  snapshot.docs.forEach((doc) => {
                    const data = doc.data();
                  });

                  if (placeData.originLocation) {
                    try {
                      // Fetch users with their profiles via API
                      const response = await getPlaceUsersCategorized(
                        placeId,
                        placeData.originLocation.lat,
                        placeData.originLocation.lng
                      );
                      setUsersInRange(response.usersInRange);
                      setUsersOutOfRange(response.usersOutOfRange);
                    } catch (error) {
                      console.error("Error fetching users:", error);
                    }
                  }
                }
              );

              // Start proximity monitoring for already joined users (with delay)
              setTimeout(() => {
                startProximityMonitoring();
              }, 2000); // 2 second delay to ensure user is properly set up
              return; // Exit early since user is already joined
            }
          } else {
            // User is not in the place yet, check if they came from dashboard auto-join
            const cameFromDashboard =
              sessionStorage.getItem("cameFromDashboard") === "true";

            if (cameFromDashboard && position) {
              // User came from dashboard auto-join, actually join them to the place

              try {
                await joinPlace(placeId, {
                  userId: user.uid,
                  lat: position.lat,
                  lng: position.lng,
                });

                // Update global presence
                await updateCurrentPlace(placeId);
                await updateLocation(position.lat, position.lng);

                // Clear the flag
                sessionStorage.removeItem("cameFromDashboard");

                // Ensure user is marked as online
                try {
                  await updateUserOnlineStatus(placeId, user.uid, true);
                } catch (error) {
                  console.error("Error updating user online status:", error);
                }

                // Set as already joined
                setIsAlreadyJoined(true);
                setCanJoin(true);

                // Set up real-time listener for the place
                onSnapshot(
                  collection(db, "places", placeId, "users"),
                  async (snapshot) => {

                    if (placeData.originLocation) {
                      try {
                        const response = await getPlaceUsersCategorized(
                          placeId,
                          placeData.originLocation.lat,
                          placeData.originLocation.lng
                        );
                        setUsersInRange(response.usersInRange);
                        setUsersOutOfRange(response.usersOutOfRange);
                      } catch (error) {
                        console.error("Error fetching users:", error);
                      }
                    }
                  }
                );

                // Start proximity monitoring (with delay)
                console.log(
                  "⏰ Scheduling proximity monitoring to start in 2 seconds (auto-join)"
                );
                setTimeout(() => {
                  console.log(
                    "⏰ Starting proximity monitoring after delay (auto-join)"
                  );
                  startProximityMonitoring();
                }, 2000); // 2 second delay to ensure user is properly set up
                return; // Exit early since user is now joined
              } catch (error) {
                console.error("Error auto-joining user to place:", error);
                // Fall through to normal flow
              }
            }

            // Normal flow for users not coming from dashboard
          }
        } else {
          // For non-authenticated users, just set the place and allow viewing
          setCanJoin(false); // They can't join without being authenticated
        }

        if (placeData.originLocation && position) {
          const distance = calculateDistance(
            position.lat,
            position.lng,
            placeData.originLocation.lat,
            placeData.originLocation.lng
          );

          const withinRadius = distance <= 100; // 100 meters
          setCanJoin(withinRadius);
          if (withinRadius) {
            // Set up real-time listener for users in this place
            onSnapshot(
              collection(db, "places", placeId, "users"),
              async (snapshot) => {

                if (placeData.originLocation) {
                  try {
                    // Fetch users with their profiles via API
                    const response = await getPlaceUsersCategorized(
                      placeId,
                      placeData.originLocation.lat,
                      placeData.originLocation.lng
                    );
                    setUsersInRange(response.usersInRange);
                    setUsersOutOfRange(response.usersOutOfRange);
                  } catch (error) {
                    console.error("Error fetching users:", error);
                  }
                }
              }
            );
          }
        }
      }
    } catch (error) {
      console.error("Error loading place data:", error);

      // Check if it's a geolocation error
      const errorWithCode = error as Error & { code?: number };
      if (
        error instanceof GeolocationPositionError ||
        errorWithCode?.code === 1 ||
        errorWithCode?.message?.includes("geolocation") ||
        errorWithCode?.message?.includes("location") ||
        errorWithCode?.message?.includes("Location access")
      ) {
        setGeolocationError((error as Error).message);
      } else {
        setError("Failed to load place data. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [placeId, user]);

  useEffect(() => {
    if (!authLoading) {
      loadPlaceData();
      if (user) {
        loadConnectionCounts();
      }
    }
  }, [placeId, user, authLoading, loadPlaceData, loadConnectionCounts]);

  // Store place join intent for non-authenticated users
  useEffect(() => {
    if (!user && place) {
      const intent = {
        placeId: place.id,
        placeName: place.name,
        timestamp: Date.now(),
      };
      localStorage.setItem("nearme_place_intent", JSON.stringify(intent));
      // Set flag to indicate user came from a place link
      sessionStorage.setItem("cameFromPlaceLink", "true");
    }
  }, [user, place]);
  const stopProximityMonitoring = useCallback(() => {
    if (proximityCheckInterval) {
      clearInterval(proximityCheckInterval);
      setProximityCheckInterval(null);
    }
  }, [proximityCheckInterval]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopProximityMonitoring();
      // Only mark user as offline when actually leaving the place page
      // Don't mark as offline when navigating from dashboard to place page
      if (user && placeId && !sessionStorage.getItem("cameFromDashboard")) {
        leavePlace(placeId, { userId: user.uid }).catch(console.error);
      } else {
      }
    };
  }, [user, placeId, stopProximityMonitoring]);

  const retryGeolocation = () => {
    setGeolocationError(null);
    loadPlaceData();
  };

  // Connection handling is now done internally by UserCard component

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
  };

  const handleConnect = async (userId: string) => {
    if (!user) return;

    try {
      await connectionService.sendConnectionRequest({
        fromUserId: user.uid,
        toUserId: userId,
        message: `Hi! I saw you're also at ${
          place?.name || "this place"
        }. Would love to connect!`,
      });

      // Reload connection counts
      loadConnectionCounts();
    } catch (error) {
      console.error("Error sending connection request:", error);
    }
  };

  const handleEditProfile = () => {
    setShowProfileManager(true);
  };

  const handleEditRoomName = () => {
    setNewRoomName(place?.name || "");
    setIsEditingRoomName(true);
  };

  const handleSaveRoomName = async () => {
    if (!place || !user || !newRoomName.trim()) return;

    try {
      // Check if user is the creator
      if (place.createdBy !== user.uid) {
        alert("Only the room creator can edit the room name");
        return;
      }

      // Update room name in Firestore
      const placeRef = doc(db, "places", placeId);
      await updateDoc(placeRef, {
        name: newRoomName.trim(),
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setPlace((prev) => (prev ? { ...prev, name: newRoomName.trim() } : null));
      setIsEditingRoomName(false);
    } catch (error) {
      console.error("Error updating room name:", error);
      alert("Failed to update room name. Please try again.");
    }
  };

  const handleCancelEditRoomName = () => {
    setIsEditingRoomName(false);
    setNewRoomName("");
  };

  const handleLeavePlace = async () => {
    if (!user || !placeId) return;

    try {

      // Call the leave API
      await leavePlace(placeId, { userId: user.uid });

      // Update global presence
      await updateCurrentPlace(null);

      // Stop proximity monitoring
      stopProximityMonitoring();

      // Navigate back to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error leaving place:", error);
      setError("Failed to leave place. Please try again.");
    }
  };

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      await connectionService.acceptConnection(connectionId);
      loadConnectionCounts(); // Reload to update the list
    } catch (error) {
      console.error("Error accepting connection:", error);
      setError(
        error instanceof Error ? error.message : "Failed to accept connection"
      );
    }
  };

  const handleRejectConnection = async (connectionId: string) => {
    try {
      await connectionService.rejectConnection(connectionId);
      loadConnectionCounts(); // Reload to update the list
    } catch (error) {
      console.error("Error rejecting connection:", error);
      setError(
        error instanceof Error ? error.message : "Failed to reject connection"
      );
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      await connectionService.removeConnection(connectionId);
      loadConnectionCounts(); // Reload to update the list
    } catch (error) {
      console.error("Error removing connection:", error);
      setError(
        error instanceof Error ? error.message : "Failed to remove connection"
      );
    }
  };

  // Early returns after all hooks
  if (authLoading) {
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
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Sign In Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign in to join places and connect with people nearby
            </p>
            <button
              onClick={() => router.push("/auth")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading place...</p>
        </div>
      </div>
    );
  }

  if (geolocationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Location Access Required
            </h2>
            <p className="text-gray-600 mb-6">{geolocationError}</p>
            <div className="space-y-3">
              <button
                onClick={retryGeolocation}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Go Back
              </button>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                How to enable location access:
              </h3>
              <ul className="text-xs text-blue-800 space-y-1 text-left">
                <li>
                  • Click the location icon in your browser&apos;s address bar
                </li>
                <li>• Select &quot;Allow&quot; for location access</li>
                <li>• Refresh this page</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadPlaceData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Place not found</p>
        </div>
      </div>
    );
  }

  return (
    <ProfileCompletionGate>
      <div className="min-h-screen bg-gray-50">
        {/* Discord-style Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
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

              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {place.name.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  {isEditingRoomName ? (
                    <input
                      type="text"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="text-lg font-semibold text-gray-900 bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-700 px-1 py-0.5 w-full"
                      placeholder="Enter room name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveRoomName();
                        } else if (e.key === "Escape") {
                          handleCancelEditRoomName();
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 min-w-0">
                      <h1 className="text-lg font-semibold text-gray-900 truncate">
                        {place.name}
                      </h1>
                      {place.createdBy === user?.uid && (
                        <button
                          onClick={handleEditRoomName}
                          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                          title="Edit room name"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 truncate">
                    QR: {place.qrCode}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 flex-shrink-0">
              <button
                onClick={() => setShowShareModal(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Share place"
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </button>
              <button
                onClick={handleLeavePlace}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Leave place"
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
                    d="M17 16l4-4m0 0l-4-4m4 4H3m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>

          {isEditingRoomName && (
            <div className="flex justify-center space-x-2 mt-3">
              <button
                onClick={handleSaveRoomName}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancelEditRoomName}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Mobile Status Section - Only visible on mobile */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                {profile?.profilePictureUrl ? (
                  <img
                    src={profile.profilePictureUrl}
                    alt={profile.displayName || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-semibold text-sm">
                    {profile?.displayName?.charAt(0) ||
                      user?.displayName?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "A"}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.displayName || "Anonymous User"}
                </p>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  router.push(`/chat?returnTo=place&placeId=${placeId}`)
                }
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Messages"
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setShowConnectionManager(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
                title="Connections"
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {pendingConnectionsCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-500 text-white animate-pulse min-w-[18px] h-[18px]">
                    {pendingConnectionsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - LinkedIn Style Layout */}
        <div className="flex h-[calc(100vh-73px)]">
          {/* Content Area - LinkedIn Style Layout */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex gap-6">
                {/* Left Sidebar - Profile */}
                <div className="hidden lg:block">
                  <ProfileSidebar
                    onViewProfile={handleViewProfile}
                    pendingConnectionsCount={pendingConnectionsCount}
                    activeConnectionsCount={activeConnectionsCount}
                    onEditProfile={handleEditProfile}
                    onManageConnections={() => setShowConnectionManager(true)}
                    onMessages={() =>
                      router.push(`/chat?returnTo=place&placeId=${placeId}`)
                    }
                    onSignOut={signOut}
                  />
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  {/* Tab Navigation */}
                  <div className="mb-6">
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-8">
                        {[
                          { id: "people", label: "People", icon: "👥" },
                          { id: "feed", label: "Feed", icon: "📝" },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() =>
                              setActiveTab(tab.id as "feed" | "people")
                            }
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === tab.id
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </div>

                  {/* Tab Content */}
                  {activeTab === "feed" && (
                    <PlaceFeed
                      placeId={placeId}
                      onViewProfile={handleViewProfile}
                    />
                  )}

                  {activeTab === "people" && (
                    <PeopleGrid
                      usersInRange={usersInRange}
                      usersOutOfRange={usersOutOfRange}
                      onViewProfile={handleViewProfile}
                      onConnect={handleConnect}
                    />
                  )}
                </div>

                {/* Right Sidebar - Activity */}
                <div className="hidden xl:block">
                  <ActivitySidebar
                    usersInRange={usersInRange}
                    usersOutOfRange={usersOutOfRange}
                    onViewProfile={handleViewProfile}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {showProfileManager && (
          <ProfileManager
            onClose={() => setShowProfileManager(false)}
            onSave={() => {
              // Reload place data to get updated profiles
              loadPlaceData();
            }}
          />
        )}

        {/* Profile Viewer Modal */}
        {selectedUser && (
          <ProfileViewer
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}

        {/* Connection Manager Modal */}
        {showConnectionManager && (
          <ConnectionManager
            onClose={handleConnectionManagerClose}
            connections={connections}
            handleAcceptConnection={handleAcceptConnection}
            handleRejectConnection={handleRejectConnection}
            handleRemoveConnection={handleRemoveConnection}
            isLoading={isLoadingConnections}
            error={errorConnections}
          />
        )}

        {/* Place Share Modal */}
        {showShareModal && place && (
          <PlaceShareModal
            place={place}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </div>
    </ProfileCompletionGate>
  );
}
