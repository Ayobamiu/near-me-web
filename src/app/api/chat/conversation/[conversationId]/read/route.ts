import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, serverTimestamp, doc } from 'firebase/firestore';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const { conversationId } = await params;
        const body = await request.json();
        const { userId } = body;

        if (!conversationId || !userId) {
            return NextResponse.json(
                { error: 'Conversation ID and user ID are required' },
                { status: 400 }
            );
        }

        // For our simple conversation approach, verify the user is part of the conversation
        // by checking if their ID is in the conversation ID (format: userId1_userId2)
        const participantIds = conversationId.split('_');
        if (!participantIds.includes(userId)) {
            return NextResponse.json(
                { error: 'Access denied to this conversation' },
                { status: 403 }
            );
        }

        // Find all unread messages for this user in this conversation using subcollection
        const conversationRef = doc(db, 'messages', conversationId);
        const messagesRef = collection(conversationRef, 'messages');
        const unreadQuery = query(
            messagesRef,
            where('receiverId', '==', userId),
            where('readAt', '==', null)
        );

        const unreadSnapshot = await getDocs(unreadQuery);

        // Update all unread messages to mark as read
        const updatePromises = unreadSnapshot.docs.map(messageDoc =>
            updateDoc(messageDoc.ref, {
                readAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            })
        );

        await Promise.all(updatePromises);

        return NextResponse.json({
            success: true,
            markedAsRead: unreadSnapshot.size
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark messages as read' },
            { status: 500 }
        );
    }
}
