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
    updatedAt?: Date;
    message?: string; // Optional message when sending connection request
    users: string[];
}

export interface ConnectionRequest {
    fromUserId: string;
    toUserId: string;
    message?: string;
}

export interface ConnectionResponse {
    connectionId: string;
    action: 'accept' | 'reject';
}

export interface UserConnection {
    user: User;
    connection: Connection;
    isIncoming: boolean; // true if this is a request TO the current user
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    messageType: 'text' | 'emoji' | 'image' | 'file';
    createdAt: Date;
    updatedAt?: Date;
    readAt?: Date;
    isEdited?: boolean;
    replyToMessageId?: string; // For threaded conversations
}

export interface Conversation {
    id: string;
    participantIds: string[]; // Array of user IDs in the conversation
    lastMessage?: Message;
    lastMessageAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}

export interface ChatMessage {
    message: Message;
    sender: User;
    isFromCurrentUser: boolean;
}

export interface SendMessageRequest {
    senderId: string;
    receiverId: string;
    content: string;
    messageType?: 'text' | 'emoji' | 'image' | 'file';
    replyToMessageId?: string;
}

export interface ConversationSummary {
    conversation: Conversation;
    otherUser: User;
    unreadCount: number;
    lastMessagePreview: string;
}

export interface Group {
    id: string;
    placeId: string;
    name: string;
    description?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    memberIds: string[];
    lastMessageAt?: Date;
}

export interface GroupMessage {
    id: string;
    groupId: string;
    senderId: string;
    content: string;
    messageType: 'text' | 'emoji' | 'image' | 'file';
    createdAt: Date;
    updatedAt?: Date;
    readBy: string[]; // Array of user IDs who have read this message
    replyToMessageId?: string;
}

export interface FeedPost {
    id: string;
    placeId: string;
    authorId: string;
    content: string;
    postType: 'text' | 'image' | 'recommendation' | 'question' | 'checkin' | 'announcement';
    mediaUrls?: string[];
    tags?: string[];
    createdAt: Date;
    updatedAt?: Date;
    likes: string[]; // Array of user IDs who liked
    comments: FeedComment[];
    shares: number;
    isPinned?: boolean;
    isAnnouncement?: boolean; // For venue announcements
}

export interface FeedComment {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    createdAt: Date;
    likes: string[];
    replyToCommentId?: string;
}

export interface PostEngagement {
    postId: string;
    userId: string;
    action: 'like' | 'comment' | 'share' | 'save';
    createdAt: Date;
}
