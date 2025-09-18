import { NextRequest, NextResponse } from 'next/server';
import { Conversation } from '@/types';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId1: string; userId2: string }> }
) {
    try {
        const { userId1, userId2 } = await params;

        if (!userId1 || !userId2) {
            return NextResponse.json(
                { error: 'Both user IDs are required' },
                { status: 400 }
            );
        }

        if (userId1 === userId2) {
            return NextResponse.json(
                { error: 'Cannot get conversation with yourself' },
                { status: 400 }
            );
        }

        // For now, create a simple conversation ID based on user IDs
        const conversationId = [userId1, userId2].sort().join('_');

        // Create a simple conversation object
        const conversation: Conversation = {
            id: conversationId,
            participantIds: [userId1, userId2].sort(),
            lastMessage: undefined,
            lastMessageAt: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
        };

        return NextResponse.json({ conversation });
    } catch (error) {
        console.error('Error getting conversation:', error);
        return NextResponse.json(
            { error: 'Failed to get conversation' },
            { status: 500 }
        );
    }
}
