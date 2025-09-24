"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import QRScanner from "@/components/QRScanner";
import QRBadge from "@/components/QRBadge";
import { getCurrentPosition } from "@/lib/geolocation";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createPlace, joinPlace } from "@/lib/placeService";
import { Place } from "@/types";
import { useLocation } from "@/hooks/useLocation";
import NearbyPlacesList from "@/components/NearbyPlacesList";
import UserHeader from "@/components/UserHeader";
import ProfileManager from "@/components/ProfileManager";
import ProfileCompletionGate from "@/components/ProfileCompletionGate";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const {
    lat,
    lng,
    error: locationError,
    isLoading: locationLoading,
    requestLocation,
  } = useLocation();
  const [qrCode, setQrCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [showQRBadge, setShowQRBadge] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [showConnectionIntent, setShowConnectionIntent] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [connectionIntent, setConnectionIntent] = useState<{
    targetUserId: string;
    targetUserName: string;
    timestamp: number;
  } | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPlaceIntent, setShowPlaceIntent] = useState(false);
  const [placeIntent, setPlaceIntent] = useState<{
    placeId: string;
    placeName: string;
    timestamp: number;
  } | null>(null);
  const [recentPlaces, setRecentPlaces] = useState<Place[]>([]);
  const [isLoadingRecentPlaces, setIsLoadingRecentPlaces] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const router = useRouter();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Load recent places for the user
  const loadRecentPlaces = useCallback(async () => {
    if (!user) return;

    setIsLoadingRecentPlaces(true);
    try {
      // Get places where the user has been a member
      const placesRef = collection(db, "places");
      const placesSnapshot = await getDocs(placesRef);

      const userPlaces: Place[] = [];

      for (const placeDoc of placesSnapshot.docs) {
        const placeData = placeDoc.data();
        const userRef = doc(db, "places", placeDoc.id, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Only include places where user has joined before
          if (userData.joinedAt && placeData.name) {
            userPlaces.push({
              id: placeDoc.id,
              name: placeData.name,
              description: placeData.description || "",
              createdBy: placeData.createdBy || "",
              createdAt: placeData.createdAt?.toDate() || new Date(),
              updatedAt: placeData.updatedAt?.toDate() || new Date(),
              originLocation: placeData.originLocation,
              radius: placeData.radius || 100,
              isActive: placeData.isActive !== false,
              qrCode: placeDoc.id, // Use place ID as QR code
              lastJoinedAt: userData.joinedAt?.toDate() || new Date(),
            } as Place & { lastJoinedAt: Date });
          }
        }
      }

      // Sort by last joined date (most recent first) and limit to 5
      userPlaces.sort(
        (a, b) =>
          (b as Place & { lastJoinedAt: Date }).lastJoinedAt.getTime() -
          (a as Place & { lastJoinedAt: Date }).lastJoinedAt.getTime()
      );
      setRecentPlaces(userPlaces.slice(0, 5));
    } catch (error) {
      console.error("Error loading recent places:", error);
    } finally {
      setIsLoadingRecentPlaces(false);
    }
  }, [user]);

  // Check for connection intent after login
  useEffect(() => {
    if (user && !loading) {
      const intent = localStorage.getItem("nearme_connection_intent");
      if (intent) {
        try {
          const parsedIntent = JSON.parse(intent);
          // Check if intent is recent (within 10 minutes)
          if (Date.now() - parsedIntent.timestamp < 10 * 60 * 1000) {
            setConnectionIntent(parsedIntent);
            setShowConnectionIntent(true);
          }
          // Clear the intent regardless
          localStorage.removeItem("nearme_connection_intent");
        } catch (error) {
          console.error("Error parsing connection intent:", error);
          localStorage.removeItem("nearme_connection_intent");
        }
      }

      // Check for place join intent - only show if user came from a place link
      const placeIntent = localStorage.getItem("nearme_place_intent");
      if (placeIntent) {
        try {
          const parsedPlaceIntent = JSON.parse(placeIntent);
          // Check if intent is recent (within 10 minutes) AND user came from a place link
          const cameFromPlaceLink =
            document.referrer.includes("/place/") ||
            window.location.search.includes("fromPlace=") ||
            sessionStorage.getItem("cameFromPlaceLink") === "true";

          if (
            Date.now() - parsedPlaceIntent.timestamp < 10 * 60 * 1000 &&
            cameFromPlaceLink
          ) {
            setPlaceIntent(parsedPlaceIntent);
            setShowPlaceIntent(true);
          }
          // Clear the intent regardless
          localStorage.removeItem("nearme_place_intent");
          sessionStorage.removeItem("cameFromPlaceLink");
        } catch (error) {
          console.error("Error parsing place intent:", error);
          localStorage.removeItem("nearme_place_intent");
          sessionStorage.removeItem("cameFromPlaceLink");
        }
      }

      // Load recent places
      loadRecentPlaces();
    }
  }, [user, loading, loadRecentPlaces]);

  // Check for success message in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("connectionSent") === "true") {
      setShowSuccessMessage(true);
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard");
      // Auto-hide after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, []);

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
    return null;
  }

  return <ProfileCompletionGate>{renderMainContent()}</ProfileCompletionGate>;

  function renderMainContent() {
    const handleQRScan = async (result: string) => {
      setQrCode(result);
      await handleJoinPlace(result);
    };

    const handleManualEntry = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!qrCode.trim()) return;
      await handleJoinPlace(qrCode.trim());
    };

    const handleEditProfile = () => {
      setShowProfileManager(true);
    };

    const handleJoinPlace = async (placeId: string) => {
      if (!user) {
        setError("Please sign in first");
        return;
      }

      setIsLoading(true);
      setError("");
      setGeolocationError(null);

      try {
        // Get user's current location
        const position = await getCurrentPosition();
        const userLocation = { lat: position.lat, lng: position.lng };

        // Check if place exists
        const placeRef = doc(db, "places", placeId);
        const placeSnapshot = await getDoc(placeRef);

        // Ensure user profile exists
        const userProfileDoc = await getDoc(doc(db, "userProfiles", user.uid));
        if (!userProfileDoc.exists()) {
          const userProfile = {
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
        }

        if (!placeSnapshot.exists()) {
          // Place doesn't exist - show error instead of auto-creating
          setError(
            `Place "${placeId}" does not exist. Click "Create Place" to create it.`
          );
          setIsLoading(false);
          return;
        }

        // Join the place (API will handle proximity check)
        await joinPlace(placeId, {
          userId: user.uid,
          lat: userLocation.lat,
          lng: userLocation.lng,
        });

        // Set flag to indicate user came from dashboard auto-join
        sessionStorage.setItem("cameFromDashboard", "true");

        // Navigate to place page - user is already joined
        router.push(`/place/${placeId}`);

        // Refresh recent places after joining
        loadRecentPlaces();
      } catch (error) {
        console.error("Error joining place:", error);

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
        } else if (
          (error as Error)?.message?.includes("You are too far from this place")
        ) {
          // Handle distance error specifically with actual distance
          const distance = (error as Error & { distance?: number })?.distance;
          if (distance) {
            const errorMsg = `You are ${distance}m away, but need to be within 100m to join this place. Move ${
              distance - 100
            }m closer and try again.`;
            setError(errorMsg);
          } else {
            setError(
              "You are too far from this place. Please move closer and try again."
            );
          }
        } else {
          setError("Unable to join place. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    const handleRejoinPlace = async (placeId: string) => {
      await handleJoinPlace(placeId);
    };

    const handleCreatePlace = async (placeId: string) => {
      if (!user) {
        setError("Please sign in first");
        return;
      }

      setIsLoading(true);
      setError("");
      setGeolocationError(null);

      try {
        // Get user's current location
        const position = await getCurrentPosition();
        const userLocation = { lat: position.lat, lng: position.lng };

        // Ensure user profile exists
        const userProfileDoc = await getDoc(doc(db, "userProfiles", user.uid));
        if (!userProfileDoc.exists()) {
          const userProfile = {
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
        }

        // Create the place
        await createPlace({
          placeId,
          name: `Room ${placeId}`,
          qrCode: placeId,
          lat: userLocation.lat,
          lng: userLocation.lng,
          createdBy: user.uid,
        });

        // Join the place after creating it
        const joinResult = await joinPlace(placeId, {
          userId: user.uid,
          lat: userLocation.lat,
          lng: userLocation.lng,
        });

        // Set flag to indicate user came from dashboard auto-join
        sessionStorage.setItem("cameFromDashboard", "true");

        // Navigate to place page - user is already joined
        router.push(`/place/${placeId}`);

        // Refresh recent places after joining
        loadRecentPlaces();
      } catch (error) {
        console.error("Error creating place:", error);

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
          setError("Unable to create place. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Show intent experiences as full-screen overlays
    // Give priority to connection success message over place intent
    if (showSuccessMessage) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-md mx-auto px-4 py-8">
            {/* Success Message */}
            {showSuccessMessage && (
              <div className="fixed top-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">✅</div>
                    <div>
                      <h3 className="font-semibold">
                        Connection Request Sent!
                      </h3>
                      <p className="text-sm opacity-90">
                        They&apos;ll be notified and can respond to your
                        request.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSuccessMessage(false)}
                    className="text-white hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (showPlaceIntent && placeIntent) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Ready to join?
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                You wanted to join{" "}
                <span className="font-semibold text-green-600">
                  {placeIntent.placeName}
                </span>
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    handleJoinPlace(placeIntent.placeId);
                    setShowPlaceIntent(false);
                  }}
                  className="w-full py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-lg transition-colors shadow-lg"
                >
                  Join Place Now
                </button>

                <button
                  onClick={() => setShowPlaceIntent(false)}
                  className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (showConnectionIntent && connectionIntent) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Ready to connect?
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                You wanted to connect with{" "}
                <span className="font-semibold text-blue-600">
                  {connectionIntent.targetUserName}
                </span>
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    router.push(`/profile/${connectionIntent.targetUserId}`);
                    setShowConnectionIntent(false);
                  }}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-lg transition-colors shadow-lg"
                >
                  Continue Request
                </button>

                <button
                  onClick={() => setShowConnectionIntent(false)}
                  className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <UserHeader
          onDiscoverClick={() => setShowDiscover(true)}
          showDiscoverButton={true}
          onMessagesClick={() => router.push("/chat")}
          showMessagesButton={true}
          onEditProfileClick={handleEditProfile}
          onQRBadgeClick={() => setShowQRBadge(true)}
          showQRBadgeButton={true}
        />

        <div className="max-w-md mx-auto px-4 py-8">
          {/* Error Display - Always visible at top */}
          {error && (
            <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cirql</h1>
            <p className="text-gray-600">
              Scan a QR code or enter a place code to join
            </p>
          </div>

          {/* Discover Section */}
          {showDiscover && (
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Nearby Places
                </h2>
                <button
                  onClick={() => setShowDiscover(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div>
                {locationError ? (
                  <div className="text-center py-4">
                    <p className="text-red-600 mb-2">{locationError}</p>
                    <button
                      onClick={requestLocation}
                      disabled={locationLoading}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                    >
                      {locationLoading ? "Requesting..." : "Enable Location"}
                    </button>
                  </div>
                ) : lat && lng ? (
                  <NearbyPlacesList
                    lat={lat}
                    lng={lng}
                    onJoinPlace={handleJoinPlace}
                  />
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-2">Location access needed</p>
                    <button
                      onClick={requestLocation}
                      disabled={locationLoading}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                    >
                      {locationLoading ? "Requesting..." : "Find Nearby Places"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Places Section */}
          {recentPlaces.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Recent Places
              </h2>
              <div className="space-y-2">
                {isLoadingRecentPlaces ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">
                      Loading recent places...
                    </p>
                  </div>
                ) : (
                  recentPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {place.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Last joined:{" "}
                          {new Date(
                            (
                              place as Place & { lastJoinedAt: Date }
                            ).lastJoinedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRejoinPlace(place.id)}
                        disabled={isLoading}
                        className="ml-3 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? "Joining..." : "Rejoin"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border p-6">
            {!isScanning ? (
              <div className="space-y-4">
                <button
                  onClick={() => setIsScanning(true)}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Scan QR Code
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <form onSubmit={handleManualEntry} className="space-y-4">
                  <div>
                    <label
                      htmlFor="placeCode"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Enter Place Code
                    </label>
                    <input
                      type="text"
                      id="placeCode"
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      placeholder="e.g., ROOM-ABC123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={!qrCode.trim() || isLoading}
                      className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? "Joining..." : "Join Place"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreatePlace(qrCode.trim())}
                      disabled={!qrCode.trim() || isLoading}
                      className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? "Creating..." : "Create Place"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <QRScanner
                  onScan={handleQRScan}
                  onError={(error) => {
                    console.error("QR Scan error:", error);
                    setError("Failed to scan QR code. Please try again.");
                    setIsScanning(false);
                  }}
                />
                <button
                  onClick={() => setIsScanning(false)}
                  className="w-full py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel Scan
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {geolocationError && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Location Access Required
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      {geolocationError}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Make sure location access is enabled in your browser</p>
          </div>

          {showQRBadge && <QRBadge onClose={() => setShowQRBadge(false)} />}
        </div>

        {/* Profile Manager Modal */}
        {showProfileManager && (
          <ProfileManager
            onClose={() => setShowProfileManager(false)}
            onSave={() => {
              setShowProfileManager(false);
              // Optionally refresh recent places or other data
            }}
          />
        )}
      </div>
    );
  }
}
