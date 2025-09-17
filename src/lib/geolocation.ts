import { GeolocationPosition } from '@/types';

export const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                // Provide more specific error messages
                let errorMessage = 'Unable to get your location.';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied. Please enable location access in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable. Please check your device settings.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out. Please try again.';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred while retrieving location.';
                        break;
                }

                const enhancedError = new Error(errorMessage);
                (enhancedError as any).code = error.code;
                (enhancedError as any).originalError = error;
                reject(enhancedError);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000, // Increased timeout
                maximumAge: 300000, // 5 minutes
            }
        );
    });
};

export const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

export const isWithinRadius = (
    userLat: number,
    userLng: number,
    placeLat: number,
    placeLng: number,
    radiusMeters: number = 100
): boolean => {
    const distance = calculateDistance(userLat, userLng, placeLat, placeLng);
    return distance <= radiusMeters;
};
