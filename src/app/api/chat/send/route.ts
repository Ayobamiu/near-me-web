import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc } from 'firebase/firestore';
import { SendMessageRequest, Message } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body: SendMessageRequest = await request.json();
        const { receiverId, content, messageType = 'text', replyToMessageId, senderId } = body;

        if (!receiverId || !content) {
            return NextResponse.json(
                { error: 'Receiver ID and content are required' },
                { status: 400 }
            );
        }

        if (!senderId) {
            return NextResponse.json(
                { error: 'Sender ID is required' },
                { status: 400 }
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

        // Create conversation ID based on user IDs (sorted for consistency)
        const conversationId = [senderId, receiverId].sort().join('_');

        // Create message in subcollection: /messages/{conversationId}/messages/{messageId}
        const conversationRef = doc(db, 'messages', conversationId);
        const messagesRef = collection(conversationRef, 'messages');

        console.log(`🔍 Creating message in subcollection: messages/${conversationId}/messages/`);

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

        console.log(`📝 Message data:`, messageData);

        let messageId: string;
        try {
            const messageRef = await addDoc(messagesRef, messageData);
            messageId = messageRef.id;
            console.log(`✅ Message saved successfully with ID: ${messageId}`);
        } catch (error) {
            console.error(`❌ Error saving message:`, error);
            throw error;
        }

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

