"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getNearbyPlaces, NearbyPlace } from "@/lib/placeService";
import { useAuth } from "@/contexts/AuthContext";

interface NearbyPlacesListProps {
  lat: number;
  lng: number;
  onJoinPlace: (placeId: string) => void;
}

export default function NearbyPlacesList({
  lat,
  lng,
  onJoinPlace,
}: NearbyPlacesListProps) {
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const loadNearbyPlaces = useCallback(async () => {
    if (!lat || !lng) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await getNearbyPlaces(lat, lng, 1); // 1km radius

      if (response.success) {
        setNearbyPlaces(response.places);
      } else {
        setError("Failed to load nearby places");
      }
    } catch (err) {
      console.error("Error loading nearby places:", err);
      setError("Failed to load nearby places");
    } finally {
      setIsLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    loadNearbyPlaces();
  }, [loadNearbyPlaces]);

  const handleJoinPlace = async (placeId: string) => {
    if (!user) {
      router.push("/dashboard");
      return;
    }
    onJoinPlace(placeId);
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Discover Nearby Places
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-16 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Discover Nearby Places
        </h3>
        <div className="text-center py-4">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={loadNearbyPlaces}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (nearbyPlaces.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Discover Nearby Places
        </h3>
        <div className="text-center py-4">
          <p className="text-gray-600 mb-2">No places found within 1km</p>
          <p className="text-sm text-gray-500">
            Try expanding your search or create a new place
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Discover Nearby Places
        </h3>
        <span className="text-sm text-gray-500">
          {nearbyPlaces.length} found
        </span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          💡 You need to be within 100m of a place to join it. Places in green
          are within range.
        </p>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {nearbyPlaces.map((place) => (
          <div
            key={place.id}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleJoinPlace(place.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {place.name}
                </h4>
                <div className="flex items-center space-x-3 mt-2">
                  <span
                    className={`text-xs ${
                      place.distance <= 0.1 ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    📍 {formatDistance(place.distance)} away
                    {place.distance <= 0.1 && " (in range)"}
                  </span>
                  <span className="text-xs text-gray-500">
                    👥 {place.userCount}{" "}
                    {place.userCount === 1 ? "person" : "people"}
                  </span>
                </div>
              </div>
              <div className="ml-2 flex-shrink-0">
                <button
                  className={`text-sm font-medium ${
                    place.distance <= 0.1
                      ? "text-blue-600 hover:text-blue-800"
                      : "text-orange-600 hover:text-orange-800"
                  }`}
                >
                  {place.distance <= 0.1 ? "Join" : "Try Join"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
