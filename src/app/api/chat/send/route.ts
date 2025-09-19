import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { SendMessageRequest, Message } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body: SendMessageRequest = await request.json();
        const { receiverId, content, messageType = 'text', replyToMessageId } = body;

        if (!receiverId || !content) {
            return NextResponse.json(
                { error: 'Receiver ID and content are required' },
                { status: 400 }
            );
        }

        // Get sender ID from request headers (you might want to add auth middleware)
        const senderId = request.headers.get('x-user-id');
        if (!senderId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 401 }
            );
        }

        if (senderId === receiverId) {
            return NextResponse.json(
                { error: 'Cannot send message to yourself' },
                { status: 400 }
            );
        }

        // Check if users are connected
        const connectionsRef = collection(db, 'connections');
        const connectionQuery = query(
            connectionsRef,
            where('userId', 'in', [senderId, receiverId]),
            where('connectedUserId', 'in', [senderId, receiverId]),
            where('status', '==', 'accepted')
        );

        const connectionSnapshot = await getDocs(connectionQuery);
        if (connectionSnapshot.empty) {
            return NextResponse.json(
                { error: 'Users must be connected to send messages' },
                { status: 403 }
            );
        }

        // For now, create a simple conversation ID based on user IDs
        const conversationId = [senderId, receiverId].sort().join('_');

        // Create message
        const messageData = {
            conversationId,
            senderId,
            receiverId,
            content: content.trim(),
            messageType,
            replyToMessageId: replyToMessageId || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            readAt: null,
            isEdited: false,
        };

        const messageRef = await addDoc(collection(db, 'messages'), messageData);
        const messageId = messageRef.id;

        const createdMessage: Message = {
            id: messageId,
            conversationId,
            senderId,
            receiverId,
            content: content.trim(),
            messageType,
            replyToMessageId: replyToMessageId || undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            readAt: undefined,
            isEdited: false,
        };

        return NextResponse.json(createdMessage, { status: 200 });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}

