"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Place } from "@/types";
import { getCurrentPosition } from "@/lib/geolocation";
import {
  calculateDistance,
  updateUserOnlineStatus,
  checkUserProximity,
  markUserOutOfRange,
} from "@/lib/geospatial";
import {
  getPlaceUsers,
  joinPlace,
  leavePlace,
  createPlace,
} from "@/lib/placeService";
// import userProfileService from "@/lib/userProfileService"; // Not used directly in this component
import UserCard from "@/components/UserCard";
import ProfileManager from "@/components/ProfileManager";
import ProfileViewer from "@/components/ProfileViewer";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function PlacePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const placeId = params.id as string;

  const [place, setPlace] = useState<Place | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [canJoin, setCanJoin] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [proximityCheckInterval, setProximityCheckInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [isAlreadyJoined, setIsAlreadyJoined] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const loadPlaceData = async () => {
    if (!user) return; // Early return if no user

    try {
      setIsLoading(true);
      setGeolocationError(null);

      // Get user's current location first
      const position = await getCurrentPosition();
      setUserLocation({ lat: position.lat, lng: position.lng });

      // Check if place exists
      const placeRef = doc(db, "places", placeId);
      const placeSnapshot = await getDoc(placeRef);

      if (!placeSnapshot.exists()) {
        // Place doesn't exist - first user creates it
        setIsFirstUser(true);
        setCanJoin(true);
        setPlace({
          id: placeId,
          name: `Room ${placeId}`,
          qrCode: placeId,
          createdAt: new Date(),
          createdBy: "current-user", // TODO: Get from auth
          isActive: true,
        });
      } else {
        // Place exists - check if user is already joined
        const placeData = placeSnapshot.data() as Place;
        // console.log("🏠 Place data:", placeData);
        setPlace(placeData);

        // Check if user is already in this place
        const userInPlaceRef = doc(db, "places", placeId, "users", user.uid);
        const userInPlaceSnapshot = await getDoc(userInPlaceRef);

        if (userInPlaceSnapshot.exists()) {
          const userData = userInPlaceSnapshot.data();
          // console.log("🔍 User in place data:", userData);
          if (userData.isOnline && !userData.outOfRange) {
            // User is already joined and online
            console.log("✅ Setting isAlreadyJoined to true");
            setIsAlreadyJoined(true);
            setCanJoin(true);
            setUserLocation({ lat: position.lat, lng: position.lng });
            console.log("✅ User already joined this place");

            // Set up real-time listener for already joined users
            onSnapshot(
              collection(db, "places", placeId, "users"),
              async (snapshot) => {
                console.log(
                  "📡 Already joined - Real-time update received:",
                  snapshot.size,
                  "users"
                );

                if (placeData.originLocation) {
                  try {
                    // Fetch users with their profiles via API
                    const response = await getPlaceUsers(
                      placeId,
                      placeData.originLocation.lat,
                      placeData.originLocation.lng
                    );
                    setUsers(response.users);
                  } catch (error) {
                    console.error("Error fetching users:", error);
                  }
                }
              }
            );

            // Start proximity monitoring for already joined users
            startProximityMonitoring();
            return; // Exit early since user is already joined
          }
        }

        if (placeData.originLocation) {
          const distance = calculateDistance(
            position.lat,
            position.lng,
            placeData.originLocation.lat,
            placeData.originLocation.lng
          );

          const withinRadius = distance <= 100; // 100 meters
          setCanJoin(withinRadius);
          console.log("🔍 Within radius:", withinRadius);
          if (withinRadius) {
            // Set up real-time listener for users in this place
            onSnapshot(
              collection(db, "places", placeId, "users"),
              async (snapshot) => {
                console.log(
                  "📡 Real-time update received:",
                  snapshot.size,
                  "users"
                );

                if (placeData.originLocation) {
                  try {
                    // Fetch users with their profiles via API
                    const response = await getPlaceUsers(
                      placeId,
                      placeData.originLocation.lat,
                      placeData.originLocation.lng
                    );
                    console.log(
                      "✅ Final users list:",
                      response.users.length,
                      "users"
                    );
                    setUsers(response.users);
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
  };

  useEffect(() => {
    if (user && !authLoading) {
      loadPlaceData();
    }
  }, [placeId, user, authLoading]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopProximityMonitoring();
      // Mark user as offline when leaving
      if (user && placeId) {
        leavePlace(placeId, { userId: user.uid }).catch(console.error);
      }
    };
  }, [user, placeId]);

  const retryGeolocation = () => {
    setGeolocationError(null);
    loadPlaceData();
  };

  const handleConnect = (userId: string) => {
    // TODO: Implement connection request
    console.log("Connect to user:", userId);
    // For now, just show an alert
    alert("Connection feature coming soon!");
  };

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
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

  // Function to start monitoring user proximity
  const startProximityMonitoring = () => {
    if (!user || !place?.originLocation) return;

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
          setUserLocation({ lat: position.lat, lng: position.lng });
        }
      } catch (error) {
        console.error("Proximity check failed:", error);
      }
    }, 30000); // Check every 30 seconds

    setProximityCheckInterval(interval);
  };

  // Function to stop proximity monitoring
  const stopProximityMonitoring = () => {
    if (proximityCheckInterval) {
      clearInterval(proximityCheckInterval);
      setProximityCheckInterval(null);
    }
  };

  const handleJoinPlace = async () => {
    if (!user || !userLocation || !place) return;

    setIsJoining(true);

    try {
      if (isFirstUser) {
        // First user - create the place with their location as origin
        await createPlace({
          placeId,
          name: `Room ${placeId}`,
          qrCode: placeId,
          lat: userLocation.lat,
          lng: userLocation.lng,
          createdBy: user.uid,
        });

        // Get user profile from Firestore, create if doesn't exist
        const userProfileDoc = await getDoc(doc(db, "userProfiles", user.uid));
        let userProfile;

        if (userProfileDoc.exists()) {
          userProfile = userProfileDoc.data();
        } else {
          // Create profile for anonymous users
          userProfile = {
            id: user.uid,
            displayName: user.displayName || "Anonymous User",
            email: user.email || "anonymous@example.com",
            profilePictureUrl: user.photoURL || "",
            interests: [],
            bio: "First person here!",
            createdAt: new Date(),
            isOnline: true,
          };
          await setDoc(doc(db, "userProfiles", user.uid), userProfile);
          console.log("✅ Anonymous user profile created in Firestore");
        }

        // Add user to the place via API
        await joinPlace(placeId, {
          userId: user.uid,
          lat: userLocation.lat,
          lng: userLocation.lng,
        });

        setIsFirstUser(false);
        setPlace((prev) =>
          prev
            ? {
                ...prev,
                originLocation: userLocation,
              }
            : null
        );

        // Set up real-time listener for users in this place
        onSnapshot(
          collection(db, "places", placeId, "users"),
          async (snapshot) => {
            console.log(
              "📡 First user - Real-time update received:",
              snapshot.size,
              "users"
            );

            if (userLocation) {
              try {
                // Fetch users with their profiles via API
                const response = await getPlaceUsers(
                  placeId,
                  userLocation.lat,
                  userLocation.lng
                );
                console.log(
                  "✅ First user - Final users list:",
                  response.users.length,
                  "users"
                );
                setUsers(response.users);
              } catch (error) {
                console.error("Error fetching users:", error);
              }
            }
          }
        );

        // Start proximity monitoring for first user
        startProximityMonitoring();
      } else {
        // Get user profile from Firestore, create if doesn't exist
        const userProfileDoc = await getDoc(doc(db, "userProfiles", user.uid));
        let userProfile;

        if (userProfileDoc.exists()) {
          userProfile = userProfileDoc.data();
        } else {
          // Create profile for anonymous users
          userProfile = {
            id: user.uid,
            displayName: user.displayName || "Anonymous User",
            email: user.email || "anonymous@example.com",
            profilePictureUrl: user.photoURL || "",
            interests: [],
            bio: "Just joined!",
            createdAt: new Date(),
            isOnline: true,
          };
          await setDoc(doc(db, "userProfiles", user.uid), userProfile);
          console.log("✅ Anonymous user profile created in Firestore");
        }

        // Subsequent user - add to existing place via API
        await joinPlace(placeId, {
          userId: user.uid,
          lat: userLocation.lat,
          lng: userLocation.lng,
        });

        // Start proximity monitoring for subsequent users
        startProximityMonitoring();
      }
    } catch (error) {
      console.error("Error joining place:", error);
      setError("Failed to join place. Please try again.");
    } finally {
      setIsJoining(false);
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
              onClick={() => router.push("/")}
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

  // Debug logging
  console.log("🔍 UI State:", {
    canJoin,
    isAlreadyJoined,
    isFirstUser,
    isJoining,
  });

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              {isEditingRoomName ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-700 px-2 py-1"
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
                  <div className="flex space-x-2">
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
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {place.name}
                  </h1>
                  {place.createdBy === user?.uid && (
                    <button
                      onClick={handleEditRoomName}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit room name"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              <p className="text-gray-600">QR Code: {place.qrCode}</p>
              {isFirstUser && (
                <p className="text-sm text-blue-600 mt-1">
                  🎉 You&apos;re the first person here! Your location will
                  become the meeting point.
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Nearby People</p>
              <p className="text-2xl font-bold text-blue-600">{users.length}</p>
              <button
                onClick={signOut}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - User Status */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Your Status
              </h2>

              {/* User Profile Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="gap-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                      {user?.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initial if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-blue-600 font-semibold text-sm">${
                                user?.displayName?.charAt(0) ||
                                user?.email?.charAt(0) ||
                                "A"
                              }</span>`;
                            }
                          }}
                        />
                      ) : (
                        <span className="text-blue-600 font-semibold text-sm">
                          {user?.displayName?.charAt(0) ||
                            user?.email?.charAt(0) ||
                            "A"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.displayName || "Anonymous User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email || "Anonymous"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={handleEditProfile}
                      className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      title="Edit Profile"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={signOut}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                      title="Sign Out"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>

              {!canJoin ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-red-600"
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
                  <p className="text-sm text-gray-600 mb-4">
                    You&apos;re not within 100m of this place
                  </p>
                  <p className="text-xs text-gray-500">
                    Move closer to the origin location to join
                  </p>
                </div>
              ) : isAlreadyJoined ? (
                <div className="text-center py-8">
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
                  <p className="text-sm text-gray-600 mb-4">
                    You&apos;re already in this place!
                  </p>
                  <p className="text-xs text-gray-500">
                    You can see other nearby people below
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {isFirstUser
                      ? "Ready to create place!"
                      : "You&apos;re within range!"}
                  </p>
                  <button
                    onClick={handleJoinPlace}
                    disabled={isJoining}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isJoining
                      ? "Joining..."
                      : isFirstUser
                      ? "Create Place"
                      : "Join Place"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Group Members */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Nearby People
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {users.length} people within 100m of this location
                </p>
              </div>

              <div className="p-6">
                {users.length === 0 ? (
                  <div className="text-center py-12">
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500">
                      {isFirstUser
                        ? "Be the first to create this place!"
                        : "No one else is here yet"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {isFirstUser
                        ? "Your location will become the meeting point"
                        : "Be the first to join this place!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((userItem) => (
                      <UserCard
                        key={userItem.id}
                        user={userItem}
                        showConnectionButton={userItem.id !== user?.uid}
                        onConnect={handleConnect}
                        onViewProfile={handleViewProfile}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Manager Modal */}
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
    </div>
  );
}
