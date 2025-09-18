import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { ChatMessage, Message, User } from '@/types';
import userProfileService from '@/lib/userProfileService';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const { conversationId } = await params;
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get('limit');

        if (!conversationId) {
            return NextResponse.json(
                { error: 'Conversation ID is required' },
                { status: 400 }
            );
        }

        // Get sender ID from request headers
        const senderId = request.headers.get('x-user-id');
        if (!senderId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 401 }
            );
        }

        // For our simple conversation approach, verify the user is part of the conversation
        // by checking if their ID is in the conversation ID (format: userId1_userId2)
        const participantIds = conversationId.split('_');
        if (!participantIds.includes(senderId)) {
            return NextResponse.json(
                { error: 'Access denied to this conversation' },
                { status: 403 }
            );
        }

        // Build query for messages - simplified to avoid index requirements
        const messagesRef = collection(db, 'messages');
        let messagesQuery = query(
            messagesRef,
            where('conversationId', '==', conversationId)
        );

        // Apply pagination
        const messageLimit = limitParam ? parseInt(limitParam) : 50;
        messagesQuery = query(messagesQuery, limit(messageLimit));

        const messagesSnapshot = await getDocs(messagesQuery);
        const chatMessages: ChatMessage[] = [];

        // Get unique user IDs from messages
        const userIds = new Set<string>();
        const messages: Message[] = [];

        for (const doc of messagesSnapshot.docs) {
            const messageData = doc.data();
            const message: Message = {
                id: doc.id,
                conversationId: messageData.conversationId,
                senderId: messageData.senderId,
                receiverId: messageData.receiverId,
                content: messageData.content,
                messageType: messageData.messageType,
                replyToMessageId: messageData.replyToMessageId,
                createdAt: messageData.createdAt?.toDate() || new Date(),
                updatedAt: messageData.updatedAt?.toDate() || new Date(),
                readAt: messageData.readAt?.toDate(),
                isEdited: messageData.isEdited || false,
            };
            messages.push(message);
            userIds.add(message.senderId);
        }

        // Get user profiles for all senders
        const userProfiles = new Map<string, User>();
        for (const userId of userIds) {
            try {
                const userProfile = await userProfileService.getUserProfile(userId);
                if (userProfile) {
                    const user: User = userProfileService.convertToUser(
                        userProfile,
                        { lat: 0, lng: 0 },
                        0
                    );
                    userProfiles.set(userId, user);
                }
            } catch (error) {
                console.error(`Error loading profile for user ${userId}:`, error);
            }
        }

        // Create ChatMessage objects
        for (const message of messages) {
            const sender = userProfiles.get(message.senderId);
            if (sender) {
                chatMessages.push({
                    message,
                    sender,
                    isFromCurrentUser: message.senderId === senderId,
                });
            }
        }

        // Sort by creation date (oldest first for display)
        chatMessages.sort((a, b) =>
            a.message.createdAt.getTime() - b.message.createdAt.getTime()
        );

        return NextResponse.json(chatMessages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}
