import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
            return NextResponse.json({ connected: false });
        }

        // Check if there's an accepted connection between the users
        const connectionsRef = collection(db, 'connections');

        // Check both directions: userId1 -> userId2 and userId2 -> userId1
        const query1 = query(
            connectionsRef,
            where('userId', '==', userId1),
            where('connectedUserId', '==', userId2),
            where('status', '==', 'accepted')
        );

        const query2 = query(
            connectionsRef,
            where('userId', '==', userId2),
            where('connectedUserId', '==', userId1),
            where('status', '==', 'accepted')
        );

        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(query1),
            getDocs(query2)
        ]);

        // Check if any connection exists between these two users
        const connected = !snapshot1.empty || !snapshot2.empty;

        return NextResponse.json({ connected });
    } catch (error) {
        console.error('Error checking connection status:', error);
        return NextResponse.json(
            { error: 'Failed to check connection status' },
            { status: 500 }
        );
    }
}
