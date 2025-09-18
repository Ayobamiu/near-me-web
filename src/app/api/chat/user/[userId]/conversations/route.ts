import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ConversationSummary, Conversation, User } from '@/types';
import userProfileService from '@/lib/userProfileService';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Get conversations where user is a participant
        const conversationsRef = collection(db, 'conversations');
        const conversationsQuery = query(
            conversationsRef,
            where('participantIds', 'array-contains', userId),
            where('isActive', '==', true),
            orderBy('lastMessageAt', 'desc')
        );

        const conversationsSnapshot = await getDocs(conversationsQuery);
        const conversationSummaries: ConversationSummary[] = [];

        for (const doc of conversationsSnapshot.docs) {
            const conversationData = doc.data();
            const conversation: Conversation = {
                id: doc.id,
                participantIds: conversationData.participantIds,
                lastMessage: conversationData.lastMessage,
                lastMessageAt: conversationData.lastMessageAt?.toDate(),
                createdAt: conversationData.createdAt?.toDate() || new Date(),
                updatedAt: conversationData.updatedAt?.toDate() || new Date(),
                isActive: conversationData.isActive,
            };

            // Find the other participant
            const otherUserId = conversation.participantIds.find(id => id !== userId);
            if (!otherUserId) continue;

            // Get other user's profile
            let otherUser: User;
            try {
                const userProfile = await userProfileService.getUserProfile(otherUserId);
                if (userProfile) {
                    otherUser = userProfileService.convertToUser(
                        userProfile,
                        { lat: 0, lng: 0 },
                        0
                    );
                } else {
                    // Create a basic user object if profile not found
                    otherUser = {
                        id: otherUserId,
                        displayName: 'Unknown User',
                        email: 'unknown@example.com',
                        interests: [],
                        joinedAt: new Date(),
                        isOnline: false,
                    };
                }
            } catch (error) {
                console.error(`Error loading profile for user ${otherUserId}:`, error);
                otherUser = {
                    id: otherUserId,
                    displayName: 'Unknown User',
                    email: 'unknown@example.com',
                    interests: [],
                    joinedAt: new Date(),
                    isOnline: false,
                };
            }

            // Calculate unread count (simplified - in a real app you'd track this more efficiently)
            const unreadCount = await calculateUnreadCount(conversation.id, userId);

            // Create last message preview
            let lastMessagePreview = 'No messages yet';
            if (conversation.lastMessage) {
                const content = conversation.lastMessage.content;
                lastMessagePreview = content.length > 50
                    ? content.substring(0, 50) + '...'
                    : content;
            }

            conversationSummaries.push({
                conversation,
                otherUser,
                unreadCount,
                lastMessagePreview,
            });
        }

        return NextResponse.json(conversationSummaries);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch conversations' },
            { status: 500 }
        );
    }
}

async function calculateUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
        // This is a simplified implementation
        // In a real app, you'd have a more efficient way to track unread messages
        const messagesRef = collection(db, 'messages');
        const unreadQuery = query(
            messagesRef,
            where('conversationId', '==', conversationId),
            where('receiverId', '==', userId),
            where('readAt', '==', null)
        );

        const unreadSnapshot = await getDocs(unreadQuery);
        return unreadSnapshot.size;
    } catch (error) {
        console.error('Error calculating unread count:', error);
        return 0;
    }
}
