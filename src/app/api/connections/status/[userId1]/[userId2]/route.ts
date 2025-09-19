import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Connection } from '@/types';

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
            return NextResponse.json({ connection: null });
        }

        // Check for any connection between the users
        const connectionsRef = collection(db, 'connections');

        // Check both directions: userId1 -> userId2 and userId2 -> userId1
        const query1 = query(
            connectionsRef,
            where('userId', '==', userId1),
            where('connectedUserId', '==', userId2)
        );

        const query2 = query(
            connectionsRef,
            where('userId', '==', userId2),
            where('connectedUserId', '==', userId1)
        );

        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(query1),
            getDocs(query2)
        ]);

        // Find connection between these two users
        const allDocs = [...snapshot1.docs, ...snapshot2.docs];

        for (const doc of allDocs) {
            const connectionData = doc.data();
            const connection: Connection = {
                id: doc.id,
                userId: connectionData.userId,
                connectedUserId: connectionData.connectedUserId,
                status: connectionData.status,
                message: connectionData.message || '',
                users: connectionData.users || [connectionData.userId, connectionData.connectedUserId],
                createdAt: connectionData.createdAt?.toDate() || new Date(),
                updatedAt: connectionData.updatedAt?.toDate() || new Date()
            };

            return NextResponse.json({ connection });
        }

        return NextResponse.json({ connection: null });
    } catch (error) {
        console.error('Error getting connection status:', error);
        return NextResponse.json(
            { error: 'Failed to get connection status' },
            { status: 500 }
        );
    }
}
