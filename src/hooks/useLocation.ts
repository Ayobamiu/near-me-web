"use client";

import { useState, useEffect } from "react";

interface LocationState {
    lat: number | null;
    lng: number | null;
    error: string | null;
    isLoading: boolean;
    permissionGranted: boolean;
}

export function useLocation() {
    const [location, setLocation] = useState<LocationState>({
        lat: null,
        lng: null,
        error: null,
        isLoading: false,
        permissionGranted: false,
    });

    const requestLocation = async () => {
        if (!navigator.geolocation) {
            setLocation(prev => ({
                ...prev,
                error: "Geolocation is not supported by this browser",
                isLoading: false,
            }));
            return;
        }

        setLocation(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000, // 5 minutes
                });
            });

            setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                error: null,
                isLoading: false,
                permissionGranted: true,
            });
        } catch (error) {
            let errorMessage = "Failed to get location";

            if (error instanceof GeolocationPositionError) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied. Please enable location permissions.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out.";
                        break;
                }
            }

            setLocation(prev => ({
                ...prev,
                error: errorMessage,
                isLoading: false,
                permissionGranted: false,
            }));
        }
    };

    const clearLocation = () => {
        setLocation({
            lat: null,
            lng: null,
            error: null,
            isLoading: false,
            permissionGranted: false,
        });
    };

    // Auto-request location on mount (with user permission)
    useEffect(() => {
        // Check if we have permission to access location
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                if (result.state === 'granted') {
                    requestLocation();
                }
            });
        } else {
            // Fallback for browsers that don't support permissions API
            requestLocation();
        }
    }, []);

    return {
        ...location,
        requestLocation,
        clearLocation,
    };
}
