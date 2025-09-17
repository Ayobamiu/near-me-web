import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Helper function to create a geohash for proximity queries
// For now, we'll use a simple grid-based approach
export const createGeoHash = (lat: number, lng: number, precision: number = 4): string => {
    const latRange = [-90, 90];
    const lngRange = [-180, 180];

    let latMin = latRange[0];
    let latMax = latRange[1];
    let lngMin = lngRange[0];
    let lngMax = lngRange[1];

    let hash = '';

    for (let i = 0; i < precision; i++) {
        const latMid = (latMin + latMax) / 2;
        const lngMid = (lngMin + lngMax) / 2;

        if (lat >= latMid) {
            hash += '1';
            latMin = latMid;
        } else {
            hash += '0';
            latMax = latMid;
        }

        if (lng >= lngMid) {
            hash += '1';
            lngMin = lngMid;
        } else {
            hash += '0';
            lngMax = lngMid;
        }
    }

    return hash;
};

// Get nearby geohashes for proximity search
export const getNearbyGeoHashes = (lat: number, lng: number, precision: number = 4): string[] => {
    const baseHash = createGeoHash(lat, lng, precision);
    const hashes = [baseHash];

    // Add adjacent geohashes for better coverage
    // This is a simplified approach - in production you'd want more sophisticated geohashing
    return hashes;
};

// Create or update place with origin location
export const createPlaceWithOrigin = async (
    placeId: string,
    name: string,
    qrCode: string,
    originLat: number,
    originLng: number,
    createdBy: string
) => {
    const placeRef = doc(db, 'places', placeId);
    const geoHash = createGeoHash(originLat, originLng);

    await setDoc(placeRef, {
        id: placeId,
        name,
        qrCode,
        originLocation: {
            lat: originLat,
            lng: originLng,
            geoHash
        },
        createdAt: serverTimestamp(),
        createdBy,
        isActive: true,
        userCount: 0
    });

    return placeRef;
};

// Add user to place with location (stores only user ID and location)
export const addUserToPlace = async (
    placeId: string,
    userId: string,
    lat: number,
    lng: number
) => {
    const userRef = doc(db, 'places', placeId, 'users', userId);
    const geoHash = createGeoHash(lat, lng);

    await setDoc(userRef, {
        userId,
        location: { lat, lng, geoHash },
        joinedAt: serverTimestamp(),
        isOnline: true,
        lastSeen: serverTimestamp()
    });

    // Update place user count
    const placeRef = doc(db, 'places', placeId);
    await updateDoc(placeRef, {
        userCount: await getPlaceUserCount(placeId)
    });
};

// Get users in a place within proximity
export const getPlaceUsersInProximity = async (
    placeId: string,
    centerLat: number,
    centerLng: number,
    radiusMeters: number = 100
) => {
    const placeRef = doc(db, 'places', placeId);
    const usersRef = collection(placeRef, 'users');

    // Get all users in the place
    const usersSnapshot = await getDocs(usersRef);
    const users = [];

    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        if (userData.location) {
            const distance = calculateDistance(
                centerLat,
                centerLng,
                userData.location.lat,
                userData.location.lng
            );

            if (distance <= radiusMeters) {
                users.push({
                    id: userDoc.id,
                    ...userData,
                    distance
                });
            }
        }
    }

    return users;
};

// Note: Real-time listener functionality moved to API routes
// This function is no longer used as we fetch users via API

// Get place user count
export const getPlaceUserCount = async (placeId: string): Promise<number> => {
    const placeRef = doc(db, 'places', placeId);
    const usersRef = collection(placeRef, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.size;
};

// Calculate distance between two points (in meters)
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

// Function to update user's online status
export const updateUserOnlineStatus = async (
    placeId: string,
    userId: string,
    isOnline: boolean
) => {
    const userRef = doc(db, "places", placeId, "users", userId);
    await updateDoc(userRef, {
        isOnline,
        lastSeen: serverTimestamp(),
    });
};

// Function to check if user is still within range
export const checkUserProximity = (
    userLat: number,
    userLng: number,
    originLat: number,
    originLng: number,
    maxDistance: number = 100
): boolean => {
    const distance = calculateDistance(userLat, userLng, originLat, originLng);
    return distance <= maxDistance;
};

// Function to mark user as out of range
export const markUserOutOfRange = async (placeId: string, userId: string) => {
    const userRef = doc(db, "places", placeId, "users", userId);
    await updateDoc(userRef, {
        isOnline: false,
        outOfRange: true,
        leftAt: serverTimestamp(),
    });
};

// Function to remove a user from a place (mark as offline)
export const removeUserFromPlace = async (placeId: string, userId: string) => {
    const userRef = doc(db, "places", placeId, "users", userId);
    await updateDoc(userRef, {
        isOnline: false,
        leftAt: serverTimestamp(),
    });
};

// Note: fetchUsersWithProfiles function moved to API routes
// This function is no longer used as we fetch users via API
