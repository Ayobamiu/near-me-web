"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRScanner from "@/components/QRScanner";
import { getCurrentPosition } from "@/lib/geolocation";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/LoginForm";
// import { calculateDistance } from "@/lib/geospatial"; // Not used in this file
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createPlace, joinPlace } from "@/lib/placeService";

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const [qrCode, setQrCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const router = useRouter();

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
    return <LoginForm />;
  }

  const handleQRScan = async (result: string) => {
    setQrCode(result);
    await handleJoinPlace(result);
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) return;
    await handleJoinPlace(qrCode.trim());
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
        // Place doesn't exist - first user creates it
        await createPlace({
          placeId,
          name: `Room ${placeId}`,
          qrCode: placeId,
          lat: userLocation.lat,
          lng: userLocation.lng,
          createdBy: user.uid,
        });
      }

      // Join the place (API will handle proximity check)
      await joinPlace(placeId, {
        userId: user.uid,
        lat: userLocation.lat,
        lng: userLocation.lng,
      });

      // Navigate to place page - user is already joined
      router.push(`/place/${placeId}`);
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
      } else {
        setError("Unable to join place. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* User Profile Section */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
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
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.displayName || "Anonymous User"}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email || "Anonymous"}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NearMe</h1>
          <p className="text-gray-600">
            Scan a QR code or enter a place code to join
          </p>
        </div>

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
                <button
                  type="submit"
                  disabled={!qrCode.trim() || isLoading}
                  className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Joining..." : "Join Place"}
                </button>
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
      </div>
    </div>
  );
}
