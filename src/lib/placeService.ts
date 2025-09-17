import { User } from '@/types';

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

export interface UsersResponse {
    users: User[];
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
