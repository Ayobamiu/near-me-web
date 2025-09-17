export interface User {
    id: string;
    displayName: string;
    email: string;
    profilePictureUrl?: string;
    interests: string[];
    headline?: string;
    bio?: string;
    age?: number;
    location?: {
        lat: number;
        lng: number;
    };
    occupation?: string;
    socialLinks?: {
        instagram?: string;
        twitter?: string;
        linkedin?: string;
    };
    isVisible?: boolean;
    distanceRadius?: number;
    joinedAt: Date;
    isOnline: boolean;
    distance?: number; // Distance from place origin in meters
    createdAt?: Date;
    updatedAt?: Date;
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
