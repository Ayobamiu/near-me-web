import { User, Place } from '@/types';

const API_BASE = '/api';

export interface JoinPlaceRequest {
    userId: string;
    lat: number;
    lng: number;
}

export interface CreatePlaceRequest {
    placeId: string;
    name: string;
    qrCode: string;
    lat: number;
    lng: number;
    createdBy: string;
}

export interface LeavePlaceRequest {
    userId: string;
}

export interface NearbyPlace extends Place {
    distance: number;
    userCount: number;
}

export interface NearbyPlacesResponse {
    success: boolean;
    places: NearbyPlace[];
    count: number;
}

export interface UsersResponse {
    users: User[];
}

export interface CategorizedUsersResponse {
    usersInRange: User[];
    usersOutOfRange: User[];
    totalUsers: number;
}

// Create a new place
export const createPlace = async (data: CreatePlaceRequest) => {
    const response = await fetch(`${API_BASE}/places/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create place');
    }

    return response.json();
};

// Join a place
export const joinPlace = async (placeId: string, data: JoinPlaceRequest) => {
    const response = await fetch(`${API_BASE}/places/${placeId}/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join place');
    }

    return response.json();
};

// Leave a place
export const leavePlace = async (placeId: string, data: LeavePlaceRequest) => {
    const response = await fetch(`${API_BASE}/places/${placeId}/leave`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to leave place');
    }

    return response.json();
};

// Get nearby places
export const getNearbyPlaces = async (
    lat: number,
    lng: number,
    radius: number = 1
): Promise<NearbyPlacesResponse> => {
    try {
        const url = new URL(`${API_BASE}/places/nearby`, window.location.origin);
        url.searchParams.set('lat', lat.toString());
        url.searchParams.set('lng', lng.toString());
        url.searchParams.set('radius', radius.toString());

        const response = await fetch(url.toString());

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch nearby places');
        }

        return response.json();
    } catch (error) {
        console.error('Error fetching nearby places:', error);
        return {
            success: false,
            places: [],
            count: 0
        };
    }
};

// Get users in a place
export const getPlaceUsers = async (
    placeId: string,
    originLat: number,
    originLng: number
): Promise<UsersResponse> => {
    const response = await fetch(
        `${API_BASE}/places/${placeId}/users?originLat=${originLat}&originLng=${originLng}`
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
    }

    return response.json();
};

// Get categorized users in a place (in range and out of range)
export const getPlaceUsersCategorized = async (
    placeId: string,
    originLat: number,
    originLng: number
): Promise<CategorizedUsersResponse> => {
    const response = await fetch(
        `${API_BASE}/places/${placeId}/users?originLat=${originLat}&originLng=${originLng}`
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
    }

    return response.json();
};
