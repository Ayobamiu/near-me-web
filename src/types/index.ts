export interface User {
    id: string;
    name: string;
    email: string;
    profilePictureUrl?: string;
    interests: string[];
    bio?: string;
    location?: {
        lat: number;
        lng: number;
    };
    joinedAt: Date;
    isOnline: boolean;
    distance?: number; // Distance from place origin in meters
}

export interface Place {
    id: string;
    name: string;
    qrCode: string;
    originLocation?: {
        lat: number;
        lng: number;
    };
    createdAt: Date;
    createdBy: string;
    isActive: boolean;
}

export interface PlaceGroup {
    placeId: string;
    users: User[];
    lastUpdated: Date;
}

export interface GeolocationPosition {
    lat: number;
    lng: number;
    accuracy?: number;
}

export interface Connection {
    id: string;
    userId: string;
    connectedUserId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
}
