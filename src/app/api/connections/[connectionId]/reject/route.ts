import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Connection } from '@/types';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ connectionId: string }> }
) {
    try {
        const { connectionId } = await params;

        if (!connectionId) {
            return NextResponse.json(
                { error: 'Connection ID is required' },
                { status: 400 }
            );
        }

        // Get the connection document
        const connectionRef = doc(db, 'connections', connectionId);
        const connectionSnapshot = await getDoc(connectionRef);

        if (!connectionSnapshot.exists()) {
            return NextResponse.json(
                { error: 'Connection not found' },
                { status: 404 }
            );
        }

        const connectionData = connectionSnapshot.data();

        // Check if connection is already processed
        if (connectionData.status !== 'pending') {
            return NextResponse.json(
                { error: 'Connection request has already been processed' },
                { status: 400 }
            );
        }

        // Update connection status to rejected
        await updateDoc(connectionRef, {
            status: 'rejected',
            updatedAt: serverTimestamp()
        });

        const updatedConnection: Connection = {
            id: connectionId,
            userId: connectionData.userId,
            connectedUserId: connectionData.connectedUserId,
            status: 'rejected',
            message: connectionData.message || '',
            users: connectionData.users || [connectionData.userId, connectionData.connectedUserId],
            createdAt: connectionData.createdAt?.toDate() || new Date(),
            updatedAt: new Date()
        };

        return NextResponse.json(updatedConnection);
    } catch (error) {
        console.error('Error rejecting connection:', error);
        return NextResponse.json(
            { error: 'Failed to reject connection' },
            { status: 500 }
        );
    }
}
